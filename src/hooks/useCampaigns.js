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

            // Traer la fecha de la ultima sesion de cada campaña
            const campaignIds = (data || []).map(c => c.id);
            let latestSessionMap = {};

            if (campaignIds.length > 0) {
                const { data: sessions } = await supabase
                    .from('sessions')
                    .select('campaign_id, session_date')
                    .in('campaign_id', campaignIds)
                    .order('session_date', { ascending: false });

                // Quedarse con la mas reciente por campaña
                (sessions || []).forEach(s => {
                    if (!latestSessionMap[s.campaign_id]) {
                        latestSessionMap[s.campaign_id] = s.session_date;
                    }
                });
            }

            const enriched = (data || []).map(c => ({
                ...c,
                player_count: c.characters?.[0]?.count ?? 0,
                last_session_date: latestSessionMap[c.id] ?? null
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
            setCampaigns([{ ...data, player_count: 0, last_session_date: null }, ...campaigns]);
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

    const updateCampaign = async (id, updates) => {
        if (!useSupabase) return;
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            setCampaigns(campaigns.map(c => c.id === id ? { ...c, ...data } : c));
            return data;
        } catch (err) {
            console.error('Error updating campaign:', err);
            setError(err.message);
            throw err;
        }
    };

    return {
        campaigns,
        loading,
        error,
        createCampaign,
        getCampaign,
        updateCampaign,
        refresh: loadCampaigns
    };
}
