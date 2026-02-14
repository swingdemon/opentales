import React, { useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useParams } from 'react-router-dom';
import {
    User, Heart, Shield, Award, Edit2, Sword, Target, Brain, Smile, Activity,
    Minus, Plus
} from 'lucide-react';

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
    const [characters, setCharacters] = useLocalStorage('opentales_characters', []);
    const character = characters.find(c => c.id === id) || characters[0];

    if (!character) return <div className="p-8">Personaje no encontrado.</div>;

    const updateCharacter = (updates) => {
        const updated = { ...character, ...updates };
        setCharacters(characters.map(c => c.id === id ? updated : c));
    };

    const getModifier = (stat) => Math.floor((stat - 10) / 2);

    return (
        <div className="container" style={{ paddingBottom: '6rem' }}>

            {/* Header Info */}
            <div className="glass-panel" style={{
                padding: '1.5rem', marginBottom: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--glass-bg)', overflow: 'hidden', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {character.image ? <img src={character.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} />}
                    </div>

                    {/* Name & Basic Info */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <input
                            value={character.name}
                            onChange={(e) => updateCharacter({ name: e.target.value })}
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
                                value={character.race}
                                onChange={(e) => updateCharacter({ race: e.target.value })}
                                placeholder="Raza"
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '100px', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <input
                                value={character.class}
                                onChange={(e) => updateCharacter({ class: e.target.value })}
                                placeholder="Clase"
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '100px', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nvl</span>
                                <input
                                    type="number"
                                    value={character.level}
                                    onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                                    style={{ fontSize: '0.9rem', fontWeight: 700, background: 'transparent', border: 'none', color: 'white', width: '30px', textAlign: 'center', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vital Stats Row (Mobile Friendly) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <VitalControl
                        icon={Heart}
                        label="HP"
                        value={character.hp}
                        max={character.maxHp}
                        color="#ef4444"
                        onChange={(val) => updateCharacter({ hp: val })}
                    />
                    <ArmorControl
                        icon={Shield}
                        label="CA"
                        value={character.ac}
                        color="#3b82f6"
                        onChange={(val) => updateCharacter({ ac: val })}
                    />
                </div>
            </div>

            {/* Attributes Grid */}
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atributos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                {ATTRIBUTES.map(attr => (
                    <StatControl
                        key={attr.key}
                        icon={attr.icon}
                        label={attr.key.toUpperCase()}
                        value={character[attr.key] || 10}
                        modifier={getModifier(character[attr.key] || 10)}
                        onChange={(val) => updateCharacter({ [attr.key]: val })}
                    />
                ))}
            </div>

            {/* Tabs / Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sword size={18} color="var(--primary)" /> Inventario & Equipo
                    </h3>
                    <textarea
                        placeholder="Armadura de cuero, espada corta, pociones..."
                        value={character.inventory || ''}
                        onChange={(e) => updateCharacter({ inventory: e.target.value })}
                        style={{
                            width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)', borderRadius: '8px',
                            color: 'var(--text-primary)', resize: 'none', outline: 'none',
                            fontSize: '0.95rem', lineHeight: '1.5', padding: '0.75rem',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Edit2 size={18} color="var(--secondary)" /> Notas de Sesión
                    </h3>
                    <textarea
                        placeholder="El posadero nos miró raro..."
                        value={character.notes || ''}
                        onChange={(e) => updateCharacter({ notes: e.target.value })}
                        style={{
                            width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)', borderRadius: '8px',
                            color: 'var(--text-primary)', resize: 'none', outline: 'none',
                            fontSize: '0.95rem', lineHeight: '1.5', padding: '0.75rem',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

        </div>
    );
}

// ---- IMPROVED SUBCOMPONENTS ----

function VitalControl({ icon: Icon, label, value, max, color, onChange }) {
    return (
        <div className="glass-panel" style={{
            padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: `linear-gradient(135deg, ${color}15, transparent)`,
            border: `1px solid ${color}33`, gap: '0.5rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: color }}>
                <Icon size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                <StepperButton icon={Minus} onClick={() => onChange(value - 1)} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {max}</div>
                </div>
                <StepperButton icon={Plus} onClick={() => onChange(value + 1)} />
            </div>
        </div>
    );
}

function ArmorControl({ icon: Icon, label, value, color, onChange }) {
    return (
        <div className="glass-panel" style={{
            padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: `linear-gradient(135deg, ${color}15, transparent)`,
            border: `1px solid ${color}33`, gap: '0.5rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: color }}>
                <Icon size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                <StepperButton icon={Minus} onClick={() => onChange(value - 1)} />
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
                <StepperButton icon={Plus} onClick={() => onChange(value + 1)} />
            </div>
        </div>
    );
}

function StatControl({ icon: Icon, label, value, modifier, onChange }) {
    const modString = modifier >= 0 ? `+${modifier}` : `${modifier}`;

    return (
        <div className="glass-panel" style={{
            padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.4)'
        }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{label}</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>{modString}</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
                <SmallStepperButton icon={Minus} onClick={() => onChange(value - 1)} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{value}</span>
                <SmallStepperButton icon={Plus} onClick={() => onChange(value + 1)} />
            </div>
        </div>
    );
}

// Button Components
function StepperButton({ icon: Icon, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-primary)', transition: 'background 0.2s',
                flexShrink: 0
            }}
            // Simple hover effect inline
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
            <Icon size={20} />
        </button>
    );
}

function SmallStepperButton({ icon: Icon, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.2s',
                flexShrink: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
            <Icon size={14} />
        </button>
    );
}
