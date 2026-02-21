import React, { useState, useRef, useEffect } from 'react';
import { Plus, Users, Calendar, ChevronRight, LayoutGrid, List, Upload, Loader2, X, Image as ImageIcon, Map as MapIcon, Shield, Key } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FadeIn } from '../components/ui/FadeIn';
import { useCampaigns } from '../hooks/useCampaigns';
import { uploadImage, supabase } from '../lib/supabase';

export default function Dashboard() {
    const { campaigns, loading, createCampaign } = useCampaigns();
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaign, setNewCampaign] = useState({ title: '', description: '', image_url: '', map_image_url: '' });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadContext, setUploadContext] = useState(null); // 'cover' or 'map'
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 640;

    const handleCreate = async () => {
        if (!newCampaign.title.trim()) return;

        // Generate a random 6-character code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        try {
            await createCampaign({
                ...newCampaign,
                gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                players: '0 Jugadores',
                system: 'D&D 5e',
                status: 'Activa',
                invite_code: code
            });
            setNewCampaign({ title: '', description: '', image_url: '', map_image_url: '' });
            setIsCreating(false);
        } catch (err) {
            alert('Error al crear campaña');
        }
    };

    const navigate = useNavigate();

    const handleJoin = async () => {
        if (!joinCode.trim()) return;

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('id')
                .ilike('invite_code', joinCode.trim())
                .single();

            if (error || !data) {
                alert('Código de invitación no encontrado o no válido.');
                return;
            }

            // Redirigir a la campaña. El CampaignDetail se encarga del resto.
            navigate(`/dashboard/campaign/${data.id}`);
        } catch (err) {
            console.error(err);
            alert('Error al buscar la mesa.');
        } finally {
            setIsJoinOpen(false);
            setJoinCode('');
        }
    };

    const handleFileUpload = async (file, type) => {
        try {
            setIsUploading(true);
            setUploadContext(type);
            const url = await uploadImage(file);
            setNewCampaign(prev => ({ ...prev, [type === 'cover' ? 'image_url' : 'map_image_url']: url }));
        } catch (err) {
            alert('Error al subir imagen');
        } finally {
            setIsUploading(false);
            setUploadContext(null);
        }
    };

    if (loading) return <div className="p-8 color-secondary">Cargando campañas...</div>;

    return (
        <div className="container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '3rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
                        Mis <span className="text-gradient">Campañas</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        Bienvenido de nuevo, Maestre. Tus mundos te esperan.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    <button
                        onClick={() => setIsJoinOpen(true)}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: isMobile ? '0.85rem' : '0.85rem 1.75rem', borderRadius: '14px', fontWeight: 800, background: 'rgba(255,255,255,0.05)', color: 'white', minWidth: isMobile ? '48px' : 'auto' }}
                        title="Unirse a una Mesa"
                    >
                        <Shield size={20} />
                        {!isMobile && ' Unirse a una Mesa'}
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: isMobile ? '0.85rem' : '0.85rem 1.75rem', boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)', borderRadius: '14px', fontWeight: 800, minWidth: isMobile ? '48px' : 'auto' }}
                        title="Nueva Campaña"
                    >
                        <Plus size={20} />
                        {!isMobile && ' Nueva Campaña'}
                    </button>
                </div>
            </div>

            {/* JOIN CAMPAIGN MODAL */}
            {isJoinOpen && (
                <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                                <Key size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Código de Invitación</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pídele al Dungeon Master su código secreto</p>
                            </div>
                        </div>
                        <button onClick={() => setIsJoinOpen(false)} className="btn-icon"><X size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Ej: TALES-8F92A..."
                            className="glass-input"
                            style={{ flex: 1, padding: '1.25rem', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase' }}
                        />
                        <button onClick={handleJoin} className="btn-primary" style={{ padding: '0 3rem' }}>
                            Unirse
                        </button>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dando vida a un nuevo mundo</h2>
                        <button onClick={() => setIsCreating(false)} className="btn-icon"><X size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <input
                            value={newCampaign.title}
                            onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                            placeholder="Título de la campaña..."
                            className="glass-input"
                            style={{ padding: '1.25rem', fontSize: '1.1rem' }}
                        />

                        <textarea
                            value={newCampaign.description}
                            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                            placeholder="Descripción de la campaña (Historia, premisa, ambientación...)"
                            className="glass-input"
                            style={{ padding: '1.25rem', minHeight: '120px', resize: 'vertical' }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <ImageUploadField
                                label="Portada de la Campaña"
                                icon={<ImageIcon size={24} />}
                                url={newCampaign.image_url}
                                isUploading={isUploading && uploadContext === 'cover'}
                                onFileSelect={(f) => handleFileUpload(f, 'cover')}
                            />
                            <ImageUploadField
                                label="Mapa del Mundo (Opcional)"
                                icon={<MapIcon size={24} />}
                                url={newCampaign.map_image_url}
                                isUploading={isUploading && uploadContext === 'map'}
                                onFileSelect={(f) => handleFileUpload(f, 'map')}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button onClick={() => setIsCreating(false)} className="btn-secondary" style={{ padding: '0.75rem 2rem' }}>Cancelar</button>
                            <button onClick={handleCreate} className="btn-primary" style={{ padding: '0.75rem 3rem' }}>Crear Campaña</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
                {campaigns.map((campaign, index) => (
                    <FadeIn key={campaign.id} delay={index * 0.1}>
                        <Link to={`/dashboard/campaign/${campaign.id}`} style={{ textDecoration: 'none' }}>
                            <div className="campaign-card glass-panel" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {/* Visual Header */}
                                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                                    {campaign.image_url ? (
                                        <img src={campaign.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: campaign.gradient || 'var(--gradient-primary)' }} />
                                    )}
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))' }} />
                                    <h2 style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', fontSize: '1.75rem', fontWeight: 900, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                        {campaign.title}
                                    </h2>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <Users size={16} color="var(--primary)" />
                                            <span>
                                                {campaign.player_count === 0
                                                    ? 'Sin jugadores aún'
                                                    : `${campaign.player_count} jugador${campaign.player_count !== 1 ? 'es' : ''}`
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                        <Calendar size={16} />
                                        {campaign.last_session_date
                                            ? `Última sesión: ${formatRelativeDate(campaign.last_session_date)}`
                                            : 'Sin sesiones registradas'
                                        }
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} /> {campaign.status}
                                        </span>
                                        <div className="btn-icon" style={{ padding: '0.6rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </FadeIn>
                ))}
            </div>
        </div>
    );
}

function ImageUploadField({ label, icon, url, isUploading, onFileSelect }) {
    const fileRef = useRef();
    return (
        <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>{label}</label>
            <div onClick={() => fileRef.current.click()} style={{
                height: '140px', background: 'rgba(255,255,255,0.01)', border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                overflow: 'hidden', transition: 'all 0.3s ease'
            }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
                <input type="file" ref={fileRef} onChange={(e) => onFileSelect(e.target.files[0])} hidden accept="image/*" />
                {isUploading ? <Loader2 size={32} className="animate-spin" color="var(--primary)" /> : url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                    <div style={{ textAlign: 'center', opacity: 0.3 }}>
                        {icon}
                        <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Subir Imagen</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatRelativeDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
