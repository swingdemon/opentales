import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSessions(campaignId) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const useSupabase = isSupabaseConfigured();

    useEffect(() => {
        if (!useSupabase || !user || !campaignId) {
            setLoading(false);
            return;
        }
        loadSessions();
    }, [useSupabase, user, campaignId]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            // Cargar sesiones
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('sessions')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('session_date', { ascending: false });

            if (sessionsError) throw sessionsError;

            if (!sessionsData || sessionsData.length === 0) {
                setSessions([]);
                return;
            }

            const sessionIds = sessionsData.map(s => s.id);

            // Cargar notas con información del personaje
            const { data: notesData, error: notesError } = await supabase
                .from('session_notes')
                .select(`
                    id, session_id, user_id, character_id, content, created_at,
                    character:characters ( name, image, class )
                `)
                .in('session_id', sessionIds)
                .order('created_at', { ascending: true });

            if (notesError) throw notesError;

            // Agrupar
            const sessionsWithNotes = sessionsData.map(session => ({
                ...session,
                notes: notesData.filter(note => note.session_id === session.id)
            }));

            setSessions(sessionsWithNotes);
        } catch (err) {
            console.error('Error loading sessions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createSession = async (title) => {
        if (!useSupabase) return;
        try {
            const { data, error } = await supabase
                .from('sessions')
                .insert([{ campaign_id: campaignId, title }])
                .select()
                .single();

            if (error) throw error;
            setSessions([{ ...data, notes: [] }, ...sessions]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const addNote = async (sessionId, content, characterId = null) => {
        if (!useSupabase) return;
        try {
            const { data, error } = await supabase
                .from('session_notes')
                .insert([{
                    session_id: sessionId,
                    user_id: user.id,
                    character_id: characterId,
                    content
                }])
                .select(`
                    id, session_id, user_id, character_id, content, created_at,
                    character:characters ( name, image, class )
                `)
                .single();

            if (error) throw error;

            // Actualizar el estado local
            setSessions(sessions.map(s => {
                if (s.id === sessionId) {
                    return { ...s, notes: [...s.notes, data] };
                }
                return s;
            }));

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return {
        sessions,
        loading,
        error,
        createSession,
        addNote,
        refresh: loadSessions
    };
}
