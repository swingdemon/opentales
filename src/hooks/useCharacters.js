import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook para gestionar personajes con Supabase
 * Fallback a localStorage si Supabase no está configurado
 */
export function useCharacters() {
    const [characters, setCharactersLocal] = useLocalStorage('opentales_characters', []);
    const [supabaseCharacters, setSupabaseCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const useSupabase = isSupabaseConfigured();

    // Cargar personajes desde Supabase
    useEffect(() => {
        if (!useSupabase) {
            setLoading(false);
            return;
        }

        loadCharacters();
    }, [useSupabase]);

    const loadCharacters = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('characters')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSupabaseCharacters(data || []);
        } catch (err) {
            console.error('Error loading characters:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addCharacter = async (character) => {
        if (!useSupabase) {
            const newChar = { ...character, id: `char_${Date.now()}` };
            setCharactersLocal([...characters, newChar]);
            return newChar;
        }

        try {
            // Obtener el usuario actual
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('characters')
                .insert([{ ...character, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setSupabaseCharacters([data, ...supabaseCharacters]);
            return data;
        } catch (err) {
            console.error('Error adding character:', err);
            setError(err.message);
            throw err;
        }
    };

    const updateCharacter = async (id, updates) => {
        if (!useSupabase) {
            setCharactersLocal(characters.map(c => c.id === id ? { ...c, ...updates } : c));
            return;
        }

        try {
            const { data, error } = await supabase
                .from('characters')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setSupabaseCharacters(supabaseCharacters.map(c => c.id === id ? data : c));
        } catch (err) {
            console.error('Error updating character:', err);
            setError(err.message);
            throw err;
        }
    };

    const deleteCharacter = async (id) => {
        if (!useSupabase) {
            setCharactersLocal(characters.filter(c => c.id !== id));
            return;
        }

        try {
            const { error } = await supabase
                .from('characters')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSupabaseCharacters(supabaseCharacters.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting character:', err);
            setError(err.message);
            throw err;
        }
    };

    return {
        characters: useSupabase ? supabaseCharacters : characters,
        loading,
        error,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        refresh: loadCharacters
    };
}
