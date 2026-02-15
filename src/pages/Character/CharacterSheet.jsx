import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCharacters } from '../../hooks/useCharacters';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    User, Heart, Shield, Award, Edit2, Sword, Target, Brain, Smile, Activity,
    Minus, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ATTRIBUTES = [
    { key: 'str', label: 'Fuerza', icon: Sword },
    { key: 'dex', label: 'Destreza', icon: Target },
    { key: 'con', label: 'Constitución', icon: Heart },
    { key: 'int', label: 'Inteligencia', icon: Brain },
    { key: 'wis', label: 'Sabiduría', icon: Activity },
    { key: 'cha', label: 'Carisma', icon: Smile },
];

export default function CharacterSheet() {
    const { id } = useParams();
    const { characters, loading, updateCharacter: syncCharacterToDB } = useCharacters();
    const [isInCampaign, setIsInCampaign] = useState(false);

    // Local state for snappy UI
    const [localChar, setLocalChar] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved
    const debounceTimer = useRef(null);

    // Initial load from global characters list
    useEffect(() => {
        const char = characters.find(c => c.id === id);
        if (char && !localChar) {
            setLocalChar(char);
        }
    }, [characters, id, localChar]);

    useEffect(() => {
        async function checkCampaign() {
            if (!id) return;
            const { data } = await supabase
                .from('campaign_members')
                .select('id')
                .eq('character_id', id)
                .maybeSingle();
            setIsInCampaign(!!data);
        }
        checkCampaign();
    }, [id]);

    // Handle local change and debounce DB sync
    const handleLocalChange = (updates) => {
        if (!localChar) return;

        // Update local state immediately for snappy UI
        const updated = { ...localChar, ...updates };
        setLocalChar(updated);
        setSaveStatus('saving');

        // Cancel previous timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // Set new timer to sync with DB
        debounceTimer.current = setTimeout(async () => {
            try {
                await syncCharacterToDB(id, updates);
                setSaveStatus('saved');
                // Back to idle after showing "saved" for a moment
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Error syncing character:', error);
                setSaveStatus('idle');
            }
        }, 800); // 800ms delay for better feedback feel
    };

    const adjustStat = (stat, delta) => {
        const newVal = Math.max(1, (localChar[stat] || 0) + delta);
        handleLocalChange({ [stat]: newVal });
    };

    if (loading && !localChar) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Cargando personaje...</div>
            </div>
        );
    }

    if (!localChar) return <div className="p-8">Personaje no encontrado.</div>;

    const getModifier = (stat) => Math.floor(((stat || 10) - 10) / 2);

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>

            {/* Header Info */}
            <div className="glass-panel" style={{
                padding: '1.5rem', marginBottom: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                position: 'relative'
            }}>
                {/* Status Cloud Sync */}
                <div style={{
                    position: 'absolute', top: '1rem', right: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.75rem', color: 'var(--text-secondary)',
                    opacity: saveStatus === 'idle' ? 0.4 : 1, transition: 'all 0.3s'
                }}>
                    {saveStatus === 'saving' && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>☁️ Guardando...</motion.div>}
                    {saveStatus === 'saved' && <span style={{ color: '#22c55e' }}>✅ Guardado</span>}
                    {saveStatus === 'idle' && <span>☁️ Sincronizado</span>}
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--glass-bg)', overflow: 'hidden', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {localChar.image ? <img src={localChar.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} />}
                    </div>

                    {/* Name & Basic Info */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <input
                            value={localChar.name}
                            onChange={(e) => handleLocalChange({ name: e.target.value })}
                            className="glass-input"
                            placeholder="Nombre del Personaje"
                            style={{
                                fontSize: '1.5rem', fontWeight: 800, color: 'white', width: '100%',
                                fontFamily: 'var(--font-heading)', background: 'transparent', border: 'none', padding: 0,
                                textOverflow: 'ellipsis', outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <input
                                value={localChar.race}
                                onChange={(e) => handleLocalChange({ race: e.target.value })}
                                placeholder="Raza"
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '100px', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <input
                                value={localChar.class}
                                onChange={(e) => handleLocalChange({ class: e.target.value })}
                                placeholder="Clase"
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '100px', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nvl</span>
                                <input
                                    type="number"
                                    value={localChar.level}
                                    onChange={(e) => handleLocalChange({ level: parseInt(e.target.value) || 1 })}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, width: '30px', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Quick Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Heart size={20} color="#ef4444" />
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vida Actual</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                        type="number" value={localChar.hp}
                                        onChange={(e) => handleLocalChange({ hp: parseInt(e.target.value) || 0 })}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '1.1rem', width: '40px', outline: 'none' }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)' }}>/</span>
                                    <input
                                        type="number" value={localChar.max_hp}
                                        onChange={(e) => handleLocalChange({ max_hp: parseInt(e.target.value) || 0 })}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', width: '40px', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={20} color="#3b82f6" />
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Clase Armadura</div>
                                <input
                                    type="number" value={localChar.ac}
                                    onChange={(e) => handleLocalChange({ ac: parseInt(e.target.value) || 0 })}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 800, fontSize: '1.1rem', width: '40px', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Attributes */}
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={18} color="var(--primary)" /> Atributos
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        {ATTRIBUTES.map(attr => (
                            <div key={attr.key} style={{
                                background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px',
                                border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{attr.label}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <button onClick={() => adjustStat(attr.key, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Minus size={14} /></button>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800, width: '25px', textAlign: 'center' }}>{localChar[attr.key]}</span>
                                    <button onClick={() => adjustStat(attr.key, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Plus size={14} /></button>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>
                                    {getModifier(localChar[attr.key]) >= 0 ? '+' : ''}{getModifier(localChar[attr.key])}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inventory & Notes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sword size={18} color="var(--primary)" /> Inventario & Equipo
                        </h3>
                        <textarea
                            placeholder="Armadura de cuero, espada corta, pociones..."
                            value={localChar.inventory || ''}
                            onChange={(e) => handleLocalChange({ inventory: e.target.value })}
                            style={{
                                width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)', borderRadius: '8px',
                                color: 'var(--text-primary)', resize: 'none', outline: 'none',
                                fontSize: '0.95rem', lineHeight: '1.5', padding: '0.75rem',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    {isInCampaign && (
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Edit2 size={18} color="var(--secondary)" /> Notas de Sesión
                            </h3>
                            <textarea
                                placeholder="El posadero nos miró raro..."
                                value={localChar.notes || ''}
                                onChange={(e) => handleLocalChange({ notes: e.target.value })}
                                style={{
                                    width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--glass-border)', borderRadius: '8px',
                                    color: 'var(--text-primary)', resize: 'none', outline: 'none',
                                    fontSize: '0.95rem', lineHeight: '1.5', padding: '0.75rem',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
