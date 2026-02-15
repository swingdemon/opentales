import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useMapPins(campaignId, parentLoreId = null) {
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!campaignId || !isSupabaseConfigured()) return;
        loadPins();
    }, [campaignId, parentLoreId]);

    const loadPins = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('map_pins')
                .select(`
          *,
          lore:lore_id (
            id,
            title,
            content,
            is_public,
            image_url,
            map_image_url,
            icon_type
          )
        `)
                .eq('campaign_id', campaignId);

            if (parentLoreId) {
                query = query.eq('parent_lore_id', parentLoreId);
            } else {
                query = query.is('parent_lore_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;
            setPins(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addPin = async (pin) => {
        try {
            const { data, error } = await supabase
                .from('map_pins')
                .insert([{
                    ...pin,
                    campaign_id: campaignId,
                    parent_lore_id: parentLoreId
                }])
                .select(`
          *,
          lore:lore_id (
            id,
            title,
            content,
            is_public,
            image_url,
            map_image_url,
            icon_type
          )
        `)
                .single();

            if (error) throw error;
            setPins([...pins, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const deletePin = async (id) => {
        try {
            const { error } = await supabase.from('map_pins').delete().eq('id', id);
            if (error) throw error;
            setPins(pins.filter(p => p.id !== id));
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    return { pins, loading, error, addPin, deletePin, refresh: loadPins };
}
