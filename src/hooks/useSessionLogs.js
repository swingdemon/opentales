import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSessionLogs(campaignId) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!campaignId || !isSupabaseConfigured()) return;
        loadLogs();
    }, [campaignId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('session_logs')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (err) {
            console.error('Error loading logs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addLog = async (log) => {
        try {
            const { data, error } = await supabase
                .from('session_logs')
                .insert([{ ...log, campaign_id: campaignId, author_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setLogs([data, ...logs]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { logs, loading, error, addLog, refresh: loadLogs };
}
