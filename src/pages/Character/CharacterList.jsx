import React, { useState } from 'react';
import { Plus, User, Shield, Sword, Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn } from '../../components/ui/FadeIn'; // Ruta relativa
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Datos por defecto si no hay localStorage
const defaultCharacters = [
    { id: 'char_1', name: 'Valenor Stormblade', race: 'Humano', class: 'Paladín', level: 5, hp: 42, maxHp: 42, ac: 18, image: 'https://images.unsplash.com/photo-1599709736413-a4f6d4948a3c?w=400&auto=format&fit=crop&q=60' },
];

export default function CharacterList() {
    const [characters, setCharacters] = useLocalStorage('opentales_characters', defaultCharacters);

    const createCharacter = () => {
        const newId = `char_${Date.now()}`;
        const newChar = {
            id: newId,
            name: 'Nuevo Aventurero',
            race: 'Raza Desconocida',
            class: 'Clase Novata',
            level: 1,
            hp: 10,
            maxHp: 10,
            ac: 10,
            image: null // Placeholder
        };
        setCharacters([...characters, newChar]);
    };

    const deleteCharacter = (e, id) => {
        e.preventDefault(); // Evitar navegación
        if (window.confirm('¿Seguro que quieres borrar este héroe?')) {
            setCharacters(characters.filter(c => c.id !== id));
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mis Héroes</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Prepara tu hoja de personaje para la sesión de hoy.</p>
                </div>
                <button onClick={createCharacter} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                    <Plus size={20} /> Crear Personaje
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {characters.map((char, index) => (
                    <FadeIn key={char.id} delay={index * 0.1}>
                        <Link to={`/dashboard/character/${char.id}`} style={{ textDecoration: 'none' }}>
                            <div className="glass-panel" style={{
                                padding: '1.5rem',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center',
                                transition: 'transform 0.2s, border-color 0.2s',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '50%', background: 'var(--glass-bg)',
                                    overflow: 'hidden', border: '2px solid var(--glass-border)', flexShrink: 0
                                }}>
                                    {char.image ? <img src={char.image} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} style={{ margin: '16px' }} />}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{char.name}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nvl {char.level} {char.race} {char.class}</p>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} color="#ef4444" /> {char.hp}/{char.maxHp}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={14} color="#3b82f6" /> {char.ac} CA</span>
                                    </div>
                                </div>

                                {/* Delete Action */}
                                <button
                                    onClick={(e) => deleteCharacter(e, char.id)}
                                    style={{
                                        position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.5rem',
                                        color: 'var(--text-secondary)', opacity: 0.5, transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = '#ef4444'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </Link>
                    </FadeIn>
                ))}
            </div>
        </div>
    );
}
