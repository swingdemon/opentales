import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const useSupabase = isSupabaseConfigured();

    useEffect(() => {
        if (!useSupabase || !user) {
            setLoading(false);
            return;
        }

        loadCampaigns();
    }, [useSupabase, user]);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('campaigns')
                .select('*, characters(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Añadir conteo de jugadores reales
            const enriched = (data || []).map(c => ({
                ...c,
                player_count: c.characters?.[0]?.count ?? 0
            }));

            setCampaigns(enriched);
        } catch (err) {
            console.error('Error loading campaigns:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createCampaign = async (campaign) => {
        if (!useSupabase) return;

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .insert([{ ...campaign, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            setCampaigns([data, ...campaigns]);
            return data;
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError(err.message);
            throw err;
        }
    };

    const getCampaign = async (id) => {
        if (!useSupabase) return null;
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error getting campaign:', err);
            return null;
        }
    };

    return {
        campaigns,
        loading,
        error,
        createCampaign,
        getCampaign,
        refresh: loadCampaigns
    };
}
