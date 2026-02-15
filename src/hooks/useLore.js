import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useLore(campaignId) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!campaignId || !isSupabaseConfigured()) return;
        loadEntries();
    }, [campaignId]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('lore_entries')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setEntries(data || []);
        } catch (err) {
            console.error('Error loading lore entries:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addEntry = async (entry, parentId = null) => {
        try {
            const { data, error } = await supabase
                .from('lore_entries')
                .insert([{
                    ...entry,
                    campaign_id: campaignId,
                    parent_id: parentId
                }])
                .select()
                .single();

            if (error) throw error;
            setEntries(prev => [...prev, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const updateEntry = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('lore_entries')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            setEntries(prev => prev.map(e => e.id === id ? data : e));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deleteEntry = async (id) => {
        try {
            const { error } = await supabase.from('lore_entries').delete().eq('id', id);
            if (error) throw error;
            setEntries(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { entries, loading, error, addEntry, updateEntry, deleteEntry, refresh: loadEntries };
}
