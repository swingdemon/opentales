import React from 'react';
import { Plus, Users, Globe, MapPin, MoreVertical } from 'lucide-react';
import { FadeIn } from '../components/ui/FadeIn';
import { Link } from 'react-router-dom';

const dummyCampaigns = [
    {
        id: 1,
        title: 'Ecos de Avaloria',
        gradient: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
        players: '4/6',
        system: 'D&D 5e',
        status: 'Activa'
    },
    {
        id: 2,
        title: 'La Sombra de Drakenhof',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
        players: '5/5',
        system: 'Pathfinder 2e',
        status: 'Pausada'
    }
];

export default function Dashboard() {
    return (
        <div className="container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mis Campañas</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Continúa donde lo dejaste, héroe.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                    <Plus size={20} /> Nueva Campaña
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '2rem'
            }}>
                {dummyCampaigns.map((campaign, index) => (
                    <FadeIn
                        key={campaign.id}
                        delay={index * 0.1}
                        whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
                        style={{ height: '100%' }}
                    >
                        <Link to={`/dashboard/campaign/${campaign.id}`} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
                            <div className="glass-panel" style={{
                                overflow: 'hidden',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Gradient Banner */}
                                <div style={{ height: '180px', width: '100%', position: 'relative', background: campaign.gradient }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'white'
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: campaign.status === 'Activa' ? '#4ade80' : '#f59e0b',
                                            boxShadow: campaign.status === 'Activa' ? '0 0 8px #4ade80' : 'none'
                                        }} />
                                        {campaign.status}
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{campaign.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Sistema: {campaign.system}</p>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={16} /> <span>{campaign.players}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={16} /> <span>3 Mapas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </FadeIn>
                ))}

                {/* Create Card */}
                <FadeIn delay={dummyCampaigns.length * 0.1} whileHover={{ scale: 1.02 }} style={{ height: '100%' }}>
                    <div className="glass-panel" style={{
                        height: '100%',
                        minHeight: '340px',
                        borderStyle: 'dashed',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Plus size={32} />
                        </div>
                        <span style={{ fontWeight: 500 }}>Crear nueva campaña</span>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
