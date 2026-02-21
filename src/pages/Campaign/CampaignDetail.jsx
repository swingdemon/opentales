import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Plus, Search, Filter, Map as MapIcon, Book, Users,
    Settings, ChevronRight, Eye, EyeOff, Save, X, Edit3, MessageSquare, Trash2, LogOut,
    MapPin, Castle, Home, Trees, Mountain, Beer, Skull, Image as ImageIcon, Check, ChevronLeft,
    Upload, Loader2, FolderOpen, Info, ChevronDown, Layout, Globe, Menu,
    Sword, Shield, Scroll, Key, Store, Ghost, Waves, Anchor, Flame, Sparkles, Droplets, Landmark, Compass, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useLore } from '../../hooks/useLore';
import { useSessions } from '../../hooks/useSessions';
import { useMapPins } from '../../hooks/useMapPins';
import { supabase, uploadImage } from '../../lib/supabase';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PIN_ICONS = [
    { id: 'book', icon: Book, label: 'Libro / Diario' },
    { id: 'map-pin', icon: MapPin, label: 'Marcador' },
    { id: 'castle', icon: Castle, label: 'Fortaleza' },
    { id: 'home', icon: Home, label: 'Ciudad' },
    { id: 'trees', icon: Trees, label: 'Bosque' },
    { id: 'mountain', icon: Mountain, label: 'Montaña' },
    { id: 'beer', icon: Beer, label: 'Taberna' },
    { id: 'skull', icon: Skull, label: 'Peligro' },
    { id: 'users', icon: Users, label: 'PNJs' },
    { id: 'sword', icon: Sword, label: 'Combate' },
    { id: 'shield', icon: Shield, label: 'Defensa' },
    { id: 'scroll', icon: Scroll, label: 'Misión' },
    { id: 'key', icon: Key, label: 'Secreto' },
    { id: 'store', icon: Store, label: 'Tienda' },
    { id: 'ghost', icon: Ghost, label: 'Mazmorra' },
    { id: 'waves', icon: Waves, label: 'Agua/Mar' },
    { id: 'anchor', icon: Anchor, label: 'Puerto' },
    { id: 'flame', icon: Flame, label: 'Fuego' },
    { id: 'sparkles', icon: Sparkles, label: 'Magia' },
    { id: 'droplets', icon: Droplets, label: 'Pozo' },
    { id: 'landmark', icon: Landmark, label: 'Templo' },
    { id: 'compass', icon: Compass, label: 'Exploración' },
];

export default function CampaignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const mapContainerRef = useRef(null);
    const [campaign, setCampaign] = useState(null);
    const [activeTab, setActiveTab] = useState('wiki');
    const [isDM, setIsDM] = useState(false);

    // Navigation State
    const [currentScope, setCurrentScope] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // MENTION SYSTEM STATE
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [mentionActive, setMentionActive] = useState(false);
    const [mentionType, setMentionType] = useState(null); // 'new' or 'edit'

    // Data Hooks
    const { entries, loading: loreLoading, addEntry, updateEntry, deleteEntry } = useLore(id);
    const { sessions, createSession, addNote } = useSessions(id);

    // Journal States
    const [newSessionTitle, setNewSessionTitle] = useState('');
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [sessionNoteInputs, setSessionNoteInputs] = useState({});

    // Map Navigation Logic (Nearest Map Ancestor)
    const mapContext = useMemo(() => {
        if (!currentScope || !entries || entries.length === 0) return null;

        // El contexto de mapa debe ser accesible (público o ser el DM)
        const isAccessible = (e) => e && (isDM || e.is_public);

        // 1. Si la entrada actual tiene mapa y es accesible, ese es el contexto
        if (currentScope.map_image_url && isAccessible(currentScope)) return currentScope;

        // 2. Si no, buscar hacia arriba en la jerarquía
        let parentId = currentScope.parent_id;
        while (parentId) {
            const parent = entries.find(e => e.id === parentId);
            if (!parent) break;
            if (parent.map_image_url && isAccessible(parent)) return parent;
            parentId = parent.parent_id;
        }

        return null;
    }, [currentScope, entries, isDM]);

    const { pins, addPin } = useMapPins(id, mapContext?.id || null);
    const [allPins, setAllPins] = useState([]);

    const hasAvailableMap = useMemo(() => {
        // Estricto: Solo mostrar si el elemento actual (campaña o entrada) tiene mapa propio.
        if (!currentScope) return !!campaign?.map_image_url;
        return !!currentScope.map_image_url && (isDM || currentScope.is_public);
    }, [currentScope, campaign?.map_image_url, isDM]);

    useEffect(() => {
        if (!hasAvailableMap && activeTab === 'map') {
            setActiveTab('wiki');
        }
    }, [hasAvailableMap, activeTab]);

    // Form States
    const [isAddingLore, setIsAddingLore] = useState(false);
    const [newLore, setNewLore] = useState({ title: '', content: '', is_public: false, image_url: '', map_image_url: '', place_pin: false, icon_type: 'book' });
    const [isUploading, setIsUploading] = useState(false);
    const [editingLoreId, setEditingLoreId] = useState(null);
    const [editFormData, setEditFormData] = useState({ title: '', content: '', is_public: false, image_url: '', map_image_url: '', icon_type: 'book' });

    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [tempPinPos, setTempPinPos] = useState({ x: 0, y: 0 });
    const [selectedPinIcon, setSelectedPinIcon] = useState('map-pin');
    const [pinFormData, setPinFormData] = useState({ title: '', content: '', is_public: true, image_url: '', map_image_url: '' });

    // Modals
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCascadeModalOpen, setIsCascadeModalOpen] = useState(false);
    const [isDeleteCampaignModalOpen, setIsDeleteCampaignModalOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [accessStatus, setAccessStatus] = useState('loading'); // 'loading' | 'granted' | 'denied'
    const [joinStep, setJoinStep] = useState('code'); // 'code' | 'select_character'
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [myCharacters, setMyCharacters] = useState([]);
    const [myActiveCharacter, setMyActiveCharacter] = useState(null);

    useEffect(() => {
        async function initCampaign() {
            if (!user) return;
            const { data: campaignData } = await supabase.from('campaigns').select('*').eq('id', id).single();
            if (campaignData) {
                setCampaign(campaignData);
                const isUserDM = campaignData.user_id === user.id;
                setIsDM(isUserDM);

                if (!isUserDM) {
                    const { data: chars } = await supabase.from('characters').select('*').eq('user_id', user.id).eq('campaign_id', id);
                    if (chars && chars.length > 0) {
                        setMyActiveCharacter(chars[0]);
                        setAccessStatus('granted');
                    } else {
                        setAccessStatus('denied');
                    }
                } else {
                    setAccessStatus('granted');
                }
            }
            loadAllPins();
        }
        initCampaign();
    }, [id, user]);

    const verifyCode = async () => {
        if (!campaign || !campaign.invite_code) {
            alert("Esta campaña no tiene código de invitación.");
            return;
        }
        if (joinCodeInput.toUpperCase() === campaign.invite_code.toUpperCase()) {
            const { data } = await supabase.from('characters').select('*').eq('user_id', user.id);
            setMyCharacters(data || []);
            setJoinStep('select_character');
        } else {
            alert('Código incorrecto');
        }
    };

    const linkCharacter = async (charId) => {
        try {
            await supabase.from('characters').update({ campaign_id: id }).eq('id', charId);
            const { data } = await supabase.from('characters').select('*').eq('id', charId).single();
            if (data) setMyActiveCharacter(data);
            setAccessStatus('granted');
        } catch (error) {
            alert("Error al vincular el personaje");
        }
    };

    const loadAllPins = async () => {
        const { data } = await supabase.from('map_pins').select('lore_id, icon_type').eq('campaign_id', id);
        setAllPins(data || []);
    };

    const treeData = useMemo(() => {
        const buildTree = (parentId = null) => {
            const children = entries.filter(e => e.parent_id === parentId);

            const filtered = children.filter(e => {
                const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());

                // Función recursiva para buscar en descendientes
                const hasMatchingDescendant = (nodeId) => {
                    const nodeChildren = entries.filter(child => child.parent_id === nodeId);
                    return nodeChildren.some(child =>
                        child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        hasMatchingDescendant(child.id)
                    );
                };

                // El nodo es visible si: (Es DM o Público) Y (Él coincide O un hijo coincide)
                return (isDM || e.is_public) && (matchesSearch || hasMatchingDescendant(e.id));
            });

            return filtered.map(e => ({ ...e, children: buildTree(e.id) }));
        };
        return buildTree();
    }, [entries, searchQuery, isDM]);

    const toggleNode = (nodeId) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) newExpanded.delete(nodeId);
        else newExpanded.add(nodeId);
        setExpandedNodes(newExpanded);
    };

    const handleScopeChange = (scope) => {
        setCurrentScope(scope);
        if (windowWidth <= 768) setIsSidebarOpen(false);
    };

    const handleTextareaChange = (e, type) => {
        const val = e.target.value;
        const pos = e.target.selectionStart;
        const lastChar = val[pos - 1];

        if (type === 'new') setNewLore({ ...newLore, content: val });
        else setEditFormData({ ...editFormData, content: val });

        if (lastChar === '@') {
            setMentionActive(true);
            setMentionIndex(pos);
            setMentionSearch('');
            setMentionType(type);
        } else if (mentionActive) {
            if (lastChar === ' ' || pos < mentionIndex) {
                setMentionActive(false);
            } else {
                setMentionSearch(val.substring(mentionIndex, pos));
            }
        }
    };

    const selectMention = (entry) => {
        const target = mentionType === 'new' ? newLore : editFormData;
        const setter = mentionType === 'new' ? setNewLore : setEditFormData;

        const before = target.content.substring(0, mentionIndex - 1);
        const after = target.content.substring(eRef.current?.selectionStart || mentionIndex + mentionSearch.length);

        setter({
            ...target,
            content: `${before}@${entry.title} ${after}`
        });

        setMentionActive(false);
        setMentionSearch('');
    };

    const eRef = useRef(null); // Ref to capture active textarea

    const handleFileUpload = async (file, context, field) => {
        try {
            setIsUploading(true);
            const url = await uploadImage(file);
            if (context === 'edit') setEditFormData(prev => ({ ...prev, [field]: url }));
            else if (context === 'new') setNewLore(prev => ({ ...prev, [field]: url }));
            else if (context === 'pin') setPinFormData(prev => ({ ...prev, [field]: url }));
        } catch (err) { alert(err.message); } finally { setIsUploading(false); }
    };

    const handleCreateLore = async () => {
        if (!newLore.title) return;
        const { place_pin, ...loreData } = newLore;
        const entry = await addEntry(loreData, currentScope?.id || null);

        if (place_pin) {
            setPinFormData({ ...newLore, title: entry.title });
            setSelectedPinIcon(newLore.icon_type || 'map-pin');
            setTempPinPos({ x: 50, y: 50 });
            setIsPinModalOpen(true);
        }

        setNewLore({ title: '', content: '', is_public: false, image_url: '', map_image_url: '', place_pin: false, icon_type: 'book' });
        setIsAddingLore(false);
        loadAllPins();
    };

    const handleDeleteCampaign = async () => {
        try {
            const { error } = await supabase.from('campaigns').delete().eq('id', id);
            if (error) throw error;
            navigate('/dashboard');
        } catch (err) {
            alert("Error al eliminar la campaña: " + err.message);
        }
    };

    const handleUpdateLore = async (forceCascade = false) => {
        const { title, content, is_public, image_url, map_image_url, icon_type } = editFormData;

        // TRIGGER CASCADA: Si pasamos de público a privado y tiene hijos
        if (forceCascade !== true && currentScope.is_public && !is_public) {
            const hasChildren = entries.some(e => e.parent_id === editingLoreId);
            if (hasChildren) {
                setIsCascadeModalOpen(true);
                return;
            }
        }

        const updates = { title, content, is_public, image_url, map_image_url, icon_type };
        await updateEntry(editingLoreId, updates);

        // Sincronizar el icono con el pin del mapa si existe
        await supabase.from('map_pins').update({ icon_type }).eq('lore_id', editingLoreId);
        loadAllPins();


        if (forceCascade) {
            const descendants = [];
            const getDescendants = (pid) => {
                const children = entries.filter(e => e.parent_id === pid);
                children.forEach(c => {
                    descendants.push(c.id);
                    getDescendants(c.id);
                });
            };
            getDescendants(editingLoreId);
            if (descendants.length > 0) {
                await supabase.from('lore_entries').update({ is_public: false }).in('id', descendants);
            }
        }

        if (currentScope?.id === editingLoreId) setCurrentScope({ ...currentScope, ...editFormData });
        setEditingLoreId(null);
        setIsCascadeModalOpen(false);
    };

    const confirmPinPlacement = async () => {
        if (!pinFormData.title) return;
        let entryId = editingLoreId || entries.find(e => e.title === pinFormData.title)?.id;
        if (!entryId) {
            const entry = await addEntry({ ...pinFormData, icon_type: selectedPinIcon }, currentScope?.id || null);
            entryId = entry.id;
        }

        await addPin({
            x_pos: tempPinPos.x,
            y_pos: tempPinPos.y,
            lore_id: entryId,
            icon_type: selectedPinIcon,
            parent_lore_id: currentScope?.id || null
        });
        setIsPinModalOpen(false);
        loadAllPins();
    };

    const getPinIcon = (type, size = 20) => {
        const iconObj = PIN_ICONS.find(i => i.id === type) || PIN_ICONS[0];
        const IconComp = iconObj.icon;
        return <IconComp size={size} />;
    };

    const renderLoreContent = (content) => {
        if (!content) return 'Sin descripción redactada.';

        // Creamos una lista de títulos ordenada por longitud descendente para evitar parciales
        const sortedEntries = [...entries]
            .filter(e => (isDM || e.is_public) && e.title) // Asegurarse de que la entrada tiene título y es accesible
            .sort((a, b) => b.title.length - a.title.length);

        if (sortedEntries.length === 0) return content;

        // Escapar caracteres especiales para el regex
        const titlePattern = sortedEntries
            .map(e => e.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('|');

        // Regex para detectar "@Título" de forma case-insensitive
        const regex = new RegExp(`(@(${titlePattern}))`, 'gi');

        const parts = content.split(regex);
        const result = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // Si el texto coincide con el patrón "@Título" (parts[i] es "@Título", parts[i+1] es "Título")
            if (part && part.startsWith('@') && parts[i + 1]) {
                const titleToLink = parts[i + 1]; // El título capturado por el segundo grupo del regex
                const targetEntry = sortedEntries.find(e => e.title.toLowerCase() === titleToLink.toLowerCase());

                if (targetEntry) {
                    result.push(
                        <span
                            key={`link-${i}`}
                            onClick={() => handleScopeChange(targetEntry)}
                            style={{
                                color: '#a78bfa',
                                cursor: 'pointer',
                                fontWeight: 700,
                                borderBottom: '1px dashed rgba(167, 139, 250, 0.4)',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                margin: '0 2px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                e.currentTarget.style.color = '#c084fc';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                                e.currentTarget.style.color = '#a78bfa';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <span style={{ fontSize: '0.85em', opacity: 0.5, fontWeight: 400 }}>@</span>{targetEntry.title}
                        </span>
                    );
                    i++; // Saltamos el grupo de captura del título
                    continue;
                }
            }
            // Si no es un match o es texto normal, lo añadimos directamente
            result.push(part);
        }
        return result;
    };

    if (!campaign || accessStatus === 'loading') return <div className="p-8">Cargando Atlas...</div>;

    if (accessStatus === 'denied') {
        return (
            <div style={{ display: 'flex', height: '100vh', background: '#020617', color: 'white', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel fade-in" style={{ padding: '3rem', maxWidth: '500px', width: '100%', textAlign: 'center', margin: '2rem' }}>
                    {joinStep === 'code' ? (
                        <>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#ef4444' }}>
                                <Shield size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em' }}>Acceso Denegado</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                                No tienes un personaje en esta campaña. Ingresa el código secreto de la aventura para poder unirte a ella.
                            </p>
                            <input
                                value={joinCodeInput}
                                onChange={e => setJoinCodeInput(e.target.value)}
                                placeholder="EJ: TALES-XYZ"
                                className="glass-input"
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem', textAlign: 'center', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 800 }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Link to="/dashboard" className="btn-secondary" style={{ flex: 1, padding: '0.8rem', display: 'flex', justifyContent: 'center' }}>Retirarse</Link>
                                <button onClick={verifyCode} className="btn-primary" style={{ flex: 1, padding: '0.8rem' }}>Acceder</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981' }}>
                                <Users size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em' }}>Elige tu Héroe</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                ¿Con qué personaje quieres adentrarte en {campaign.title}?
                            </p>

                            {myCharacters.length === 0 ? (
                                <div>
                                    <p style={{ color: '#f59e0b', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>No tienes ningún héroe creado. Ve a tu Dashboard y recluta a un aventurero primero.</p>
                                    <Link to="/dashboard" className="btn-primary" style={{ display: 'block', padding: '1rem' }}>Ir al Dashboard</Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {myCharacters.map(char => (
                                        <div
                                            key={char.id}
                                            onClick={() => linkCharacter(char.id)}
                                            style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                        >
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {char.image ? <img src={char.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={24} style={{ opacity: 0.5 }} />}
                                            </div>
                                            <div style={{ textAlign: 'left', flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{char.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nvl {char.level} | {char.race} {char.class}</div>
                                            </div>
                                            <ChevronRight size={20} style={{ opacity: 0.5 }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {myCharacters.length > 0 && (
                                <Link to="/dashboard" className="btn-secondary" style={{ display: 'block', padding: '1rem' }}>Cancelar y Volver</Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', height: '100vh', background: '#020617', color: 'white', overflow: 'hidden' }}>

            {/* SIDEBAR EXPLORER */}
            <AnimatePresence>
                {(isSidebarOpen || window.innerWidth > 768) && (
                    <motion.aside
                        initial={{ x: -320 }}
                        animate={{ x: 0 }}
                        exit={{ x: -320 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            width: '320px',
                            background: '#0f172a',
                            borderRight: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            position: windowWidth <= 768 ? 'fixed' : 'relative',
                            top: 0, left: 0, bottom: 0,
                            zIndex: 1000,
                            boxShadow: windowWidth <= 768 ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
                        }}
                    >
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(139, 92, 246, 0.3)'
                                }}>
                                    <Globe size={20} color="#8b5cf6" />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '2px', color: '#8b5cf6' }}>OPENTALES</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    placeholder="Buscar en el atlas..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 38px',
                                        fontSize: '0.85rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        outline: 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.05)';
                                        e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                                        e.target.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.background = 'rgba(255,255,255,0.03)';
                                        e.target.style.borderColor = 'rgba(255,255,255,0.05)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
                            <div
                                onClick={() => { handleScopeChange(null); setIsAddingLore(false); }}
                                style={{
                                    padding: '10px 1.5rem', cursor: 'pointer',
                                    background: currentScope === null && !isAddingLore ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    display: 'flex', alignItems: 'center', gap: '10px', color: currentScope === null ? 'white' : 'rgba(255,255,255,0.4)',
                                    borderLeft: currentScope === null && !isAddingLore ? '3px solid #8b5cf6' : '3px solid transparent'
                                }}
                            >
                                <Layout size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: currentScope === null ? 700 : 500 }}>{campaign.title}</span>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                {treeData.map(node => (
                                    <TreeItem
                                        key={node.id}
                                        node={node}
                                        depth={0}
                                        expandedNodes={expandedNodes}
                                        toggleNode={toggleNode}
                                        currentScope={currentScope}
                                        setCurrentScope={handleScopeChange}
                                        allPins={allPins}
                                        getPinIcon={getPinIcon}
                                        onAddClick={() => setIsAddingLore(true)}
                                        isDM={isDM}
                                    />
                                ))}
                            </div>
                        </div>
                        {isDM && (
                            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setIsAddingLore(true); setActiveTab('wiki'); handleScopeChange(null); }}>
                                    <Plus size={18} /> Nueva Entrada
                                </button>
                            </div>
                        )}
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* OVERLAY FOR MOBILE SIDEBAR */}
            <AnimatePresence>
                {isSidebarOpen && windowWidth <= 768 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 999 }}
                    />
                )}
            </AnimatePresence>

            {/* MAIN VIEWPORT */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#020617' }}>

                {/* TOP BAR */}
                <header style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="btn-icon mobile-only"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                display: windowWidth <= 768 ? 'flex' : 'none',
                                background: 'rgba(139, 92, 246, 0.15)',
                                color: '#a78bfa',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                padding: '8px',
                                borderRadius: '10px'
                            }}
                        >
                            <Menu size={20} />
                        </button>
                        <HeaderTab active={activeTab === 'wiki'} onClick={() => setActiveTab('wiki')} icon={<Book size={16} />} label="Atlas" />
                        {hasAvailableMap && (
                            <HeaderTab active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon size={16} />} label="Mapa" />
                        )}
                        <HeaderTab active={activeTab === 'journal'} onClick={() => setActiveTab('journal')} icon={<MessageSquare size={16} />} label="Diario" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isDM && campaign?.invite_code && (
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '6px 14px', borderRadius: '12px', color: '#10b981', fontWeight: 800, fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    navigator.clipboard.writeText(campaign.invite_code);
                                    alert('Código copiado al portapapeles: ' + campaign.invite_code);
                                }}
                                title="Click para copiar código de invitación"
                            >
                                <Key size={14} /> CÓDIGO: {campaign.invite_code}
                            </div>
                        )}
                        {!isDM && myActiveCharacter && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px 4px 4px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {myActiveCharacter.image ? <img src={myActiveCharacter.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={14} color="var(--text-secondary)" />}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>Jugando como <strong style={{ color: 'white' }}>{myActiveCharacter.name}</strong></span>
                            </div>
                        )}
                        {isDM && (
                            <button
                                onClick={() => setIsDeleteCampaignModalOpen(true)}
                                className="btn-icon"
                                style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                title="Eliminar campaña"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <Link to="/dashboard" className="btn-icon" title="Volver al Dashboard"><LogOut size={18} /></Link>
                    </div>
                </header >

                {/* CONTENT AREA */}
                < div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* WIKI TAB */}
                    {
                        activeTab === 'wiki' && (
                            <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>

                                {isAddingLore ? (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '3rem', border: '1px solid #8b5cf6' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Nueva entrada {currentScope ? `en ${currentScope.title}` : 'Global'}</h2>
                                            <button onClick={() => setIsAddingLore(false)} className="btn-icon"><X size={24} /></button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <IconSelector
                                                value={newLore.icon_type}
                                                onChange={(id) => setNewLore({ ...newLore, icon_type: id })}
                                            />
                                            <input
                                                placeholder="Título de la entrada (Lugar, PNJ, Objeto...)"
                                                value={newLore.title}
                                                onChange={e => setNewLore({ ...newLore, title: e.target.value })}
                                                className="glass-input"
                                                style={{
                                                    flex: 1,
                                                    fontSize: '1.2rem',
                                                    padding: '12px 20px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: 'white',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '14px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                            <ImageUploadBox label="Imagen de Arte / PNJ" url={newLore.image_url} isUploading={isUploading} onFileSelect={(f) => handleFileUpload(f, 'new', 'image_url')} />
                                            <ImageUploadBox label="Mapa de Localización (opcional)" url={newLore.map_image_url} isUploading={isUploading} onFileSelect={(f) => handleFileUpload(f, 'new', 'map_image_url')} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <textarea
                                                ref={mentionType === 'new' ? eRef : null}
                                                placeholder="Describe la historia... (Usa @ para enlazar otras entradas)"
                                                value={newLore.content}
                                                onChange={e => {
                                                    eRef.current = e.target;
                                                    handleTextareaChange(e, 'new');
                                                }}
                                                className="glass-input"
                                                style={{
                                                    width: '100%', height: '250px', marginBottom: '2rem', padding: '1.25rem',
                                                    lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', color: 'white'
                                                }}
                                            />
                                            {mentionActive && mentionType === 'new' && (
                                                <MentionDropdown
                                                    search={mentionSearch}
                                                    entries={entries}
                                                    onSelect={selectMention}
                                                    isDM={isDM}
                                                    getPinIcon={getPinIcon}
                                                    campaignTitle={campaign.title}
                                                />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibilidad Inicial</label>
                                                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewLore({ ...newLore, is_public: false })}
                                                            style={{
                                                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                                                                background: !newLore.is_public ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                                                color: !newLore.is_public ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                                                                border: !newLore.is_public ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <EyeOff size={14} /> PRIVADO (MASTER)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewLore({ ...newLore, is_public: true })}
                                                            style={{
                                                                padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                                                                background: newLore.is_public ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                                                color: newLore.is_public ? '#10b981' : 'rgba(255,255,255,0.3)',
                                                                border: newLore.is_public ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Eye size={14} /> PÚBLICO (JUGADORES)
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button className="btn-secondary" onClick={() => setIsAddingLore(false)}>Descartar</button>
                                                <button className="btn-primary" onClick={handleCreateLore} style={{ padding: '0.8rem 2rem' }}>Crear Atlas</button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : currentScope ? (
                                    <div>
                                        {editingLoreId === currentScope.id ? (
                                            <div className="glass-panel" style={{ padding: '3rem', border: '1px solid #8b5cf6' }}>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <IconSelector
                                                        value={editFormData.icon_type}
                                                        onChange={(id) => setEditFormData({ ...editFormData, icon_type: id })}
                                                    />
                                                    <input
                                                        value={editFormData.title}
                                                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                                        className="glass-input"
                                                        style={{
                                                            flex: 1,
                                                            fontSize: '1.5rem',
                                                            padding: '12px 20px',
                                                            background: 'rgba(255,255,255,0.03)',
                                                            color: 'white',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '14px'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                                    <ImageUploadBox label="Imagen Ilustrativa" url={editFormData.image_url} isUploading={isUploading} onFileSelect={(f) => handleFileUpload(f, 'edit', 'image_url')} />
                                                    <ImageUploadBox label="Mapa Interno" url={editFormData.map_image_url} isUploading={isUploading} onFileSelect={(f) => handleFileUpload(f, 'edit', 'map_image_url')} />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <textarea
                                                        ref={mentionType === 'edit' ? eRef : null}
                                                        value={editFormData.content}
                                                        onChange={e => {
                                                            eRef.current = e.target;
                                                            handleTextareaChange(e, 'edit');
                                                        }}
                                                        className="glass-input"
                                                        style={{
                                                            width: '100%', height: '300px', marginBottom: '2rem', padding: '1.25rem',
                                                            lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', color: 'white'
                                                        }}
                                                    />
                                                    {mentionActive && mentionType === 'edit' && (
                                                        <MentionDropdown
                                                            search={mentionSearch}
                                                            entries={entries}
                                                            onSelect={selectMention}
                                                            isDM={isDM}
                                                            getPinIcon={getPinIcon}
                                                            campaignTitle={campaign.title}
                                                            style={{ bottom: '100%', top: 'auto', marginBottom: '10px' }}
                                                        />
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '2rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado de Publicación</label>
                                                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditFormData({ ...editFormData, is_public: false })}
                                                                style={{
                                                                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                                                                    background: !editFormData.is_public ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                                                    color: !editFormData.is_public ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                                                                    border: !editFormData.is_public ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <EyeOff size={14} /> PRIVADO
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditFormData({ ...editFormData, is_public: true })}
                                                                style={{
                                                                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                                                                    background: editFormData.is_public ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                                                                    color: editFormData.is_public ? '#10b981' : 'rgba(255,255,255,0.3)',
                                                                    border: editFormData.is_public ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Eye size={14} /> PÚBLICO
                                                            </button>
                                                        </div>
                                                    </div>


                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                                        <button className="btn-secondary" onClick={() => setEditingLoreId(null)}>Cancelar</button>
                                                        <button className="btn-primary" onClick={handleUpdateLore}>Guardar Cambios</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                {currentScope.image_url && (
                                                    <img src={currentScope.image_url} style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '32px', marginBottom: '3.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }} />
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                        <div style={{
                                                            width: '64px', height: '64px',
                                                            background: 'rgba(139, 92, 246, 0.1)',
                                                            borderRadius: '20px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                                        }}>
                                                            {getPinIcon(currentScope.icon_type || 'book', 32)}
                                                        </div>
                                                        <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{currentScope.title}</h1>
                                                        {isDM && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: currentScope.is_public ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', border: `1px solid ${currentScope.is_public ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}` }}>
                                                                {currentScope.is_public ? <Eye size={14} color="#10b981" /> : <EyeOff size={14} color="#f59e0b" />}
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: currentScope.is_public ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>
                                                                    {currentScope.is_public ? 'Público' : 'Secreto'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isDM && (
                                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                                            <button
                                                                onClick={() => {
                                                                    setEditFormData(currentScope);
                                                                    setEditingLoreId(currentScope.id);
                                                                }}
                                                                className="btn-icon"
                                                                style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                                                            >
                                                                <Edit3 size={24} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setEntryToDelete(currentScope); setIsConfirmOpen(true); }}
                                                                className="btn-icon"
                                                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                            >
                                                                <Trash2 size={24} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '1.25rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                                                    {renderLoreContent(currentScope.content)}
                                                </div>

                                                {/* SUB-ENTRIES SECTION */}
                                                {entries.some(e => e.parent_id === currentScope.id && (isDM || e.is_public)) && (
                                                    <div style={{ marginTop: '5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '3rem' }}>
                                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <FolderOpen size={18} /> Explorar este lugar
                                                        </h3>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                                            {entries
                                                                .filter(e => e.parent_id === currentScope.id && (isDM || e.is_public))
                                                                .map(child => (
                                                                    <motion.div
                                                                        key={child.id}
                                                                        whileHover={{ y: -5, background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.4)' }}
                                                                        onClick={() => handleScopeChange(child)}
                                                                        style={{
                                                                            padding: '1.5rem',
                                                                            background: 'rgba(255,255,255,0.02)',
                                                                            borderRadius: '24px',
                                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                                            cursor: 'pointer',
                                                                            transition: 'all 0.3s ease',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '1.25rem'
                                                                        }}
                                                                    >
                                                                        <div style={{
                                                                            width: '48px', height: '48px',
                                                                            background: 'rgba(139, 92, 246, 0.1)',
                                                                            borderRadius: '14px',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                                                            color: '#a78bfa'
                                                                        }}>
                                                                            {getPinIcon(child.icon_type || 'book', 24)}
                                                                        </div>
                                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{child.title}</h4>
                                                                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {child.content || 'Sin descripción redactada...'}
                                                                            </p>
                                                                        </div>
                                                                        <ChevronRight size={18} style={{ opacity: 0.2 }} />
                                                                    </motion.div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', marginTop: '8rem' }}>
                                        <div style={{ width: '120px', height: '120px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                                            <Book size={64} style={{ opacity: 0.15, color: '#8b5cf6' }} />
                                        </div>
                                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Atlas de {campaign.title}</h2>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '550px', margin: '0 auto', fontSize: '1.2rem', lineHeight: 1.6 }}>El conocimiento es poder. Navega por el menú de la izquierda para desplegar la historia de este mundo.</p>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* MAP TAB */}
                    {activeTab === 'map' && (
                        <div
                            ref={mapContainerRef}
                            className="fade-in"
                            style={{ height: 'calc(100vh - 64px)', position: 'relative', overflow: 'hidden' }}
                        >
                            <motion.div
                                drag
                                dragMomentum={true}
                                dragConstraints={mapContainerRef}
                                initial={{ x: 0, y: 0 }}
                                onDoubleClick={(e) => {
                                    if (!isDM) return;
                                    // Solo crear pin si el clic es en la superficie del mapa
                                    if (e.target !== e.currentTarget) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setTempPinPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
                                    setPinFormData({ title: '', content: '', is_public: true, image_url: '', map_image_url: '' });
                                    setEditingLoreId(null);
                                    setIsPinModalOpen(true);
                                }}
                                style={{
                                    width: '200%', height: '200%',
                                    position: 'absolute',
                                    top: '-50%', left: '-50%',
                                    background: `url(${mapContext?.map_image_url || campaign.map_image_url || 'https://images.unsplash.com/photo-1580136608260-42d1c49e6a75?auto=format&fit=crop&q=80&w=2000'}) center/cover`,
                                    cursor: isDM ? 'crosshair' : 'grab',
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat'
                                }}
                                whileTap={{ cursor: 'grabbing' }}
                            >
                                {pins
                                    .filter(p => isDM || p.lore?.is_public) // FILTRO DE SEGURIDAD PARA PINES
                                    .map(pin => {
                                        const isTarget = currentScope?.id === pin.lore_id;
                                        return (
                                            <div
                                                key={pin.id}
                                                style={{ position: 'absolute', left: `${pin.x_pos}%`, top: `${pin.y_pos}%`, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: isTarget ? 20 : 10 }}
                                                onClick={(e) => { e.stopPropagation(); setCurrentScope(pin.lore); setActiveTab('wiki'); }}
                                            >
                                                <motion.div
                                                    animate={isTarget ? { scale: [1, 1.2, 1], boxShadow: ['0 0 0px #8b5cf6', '0 0 20px #8b5cf6', '0 0 0px #8b5cf6'] } : {}}
                                                    transition={isTarget ? { repeat: Infinity, duration: 2 } : {}}
                                                    whileHover={{ scale: 1.15 }}
                                                    style={{
                                                        padding: '12px',
                                                        background: isTarget ? 'rgba(139, 92, 246, 0.6)' : 'rgba(15, 23, 42, 0.35)',
                                                        backdropFilter: 'blur(8px)',
                                                        border: `2px solid ${isTarget ? 'white' : 'rgba(139, 92, 246, 0.5)'}`,
                                                        borderRadius: '50%',
                                                        color: 'white',
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {getPinIcon(pin.icon_type, isTarget ? 24 : 20)}
                                                </motion.div>
                                                <div style={{
                                                    position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
                                                    whiteSpace: 'nowrap', fontSize: isTarget ? '0.85rem' : '0.75rem', padding: '4px 12px',
                                                    background: isTarget ? 'rgba(139, 92, 246, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                                                    backdropFilter: 'blur(4px)',
                                                    borderRadius: '20px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white', zIndex: 30,
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    {pin.lore?.title}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </motion.div>

                            {/* MAP CONTROLS HELP */}
                            <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(15, 23, 42, 0.8)', padding: '8px 16px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none' }}>
                                Arrastra para explorar • {isDM ? 'Doble clic para marcar' : 'Explora los puntos'}
                            </div>
                        </div>
                    )
                    }

                    {/* JOURNAL TAB */}
                    {activeTab === 'journal' && (
                        <div className="fade-in" style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                        Diario de <span className="text-gradient">Sesión</span>
                                    </h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>Crónicas de la aventura contadas por sus protagonistas.</p>
                                </div>
                                {isDM && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => setIsCreatingSession(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Plus size={18} /> Nueva Sesión
                                    </button>
                                )}
                            </div>

                            {/* Form to create new session */}
                            {isCreatingSession && isDM && (
                                <div className="glass-panel fade-in" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>✨ Iniciar un nuevo capítulo</h3>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            value={newSessionTitle}
                                            onChange={e => setNewSessionTitle(e.target.value)}
                                            placeholder="Título de la sesión (ej: Sesión 1 — El Despertar en la Posada)"
                                            className="glass-input"
                                            style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}
                                            autoFocus
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && newSessionTitle.trim()) {
                                                    createSession(newSessionTitle).then(() => { setNewSessionTitle(''); setIsCreatingSession(false); });
                                                }
                                            }}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={async () => {
                                                if (!newSessionTitle.trim()) return;
                                                await createSession(newSessionTitle);
                                                setNewSessionTitle('');
                                                setIsCreatingSession(false);
                                            }}
                                        >
                                            Empezar
                                        </button>
                                        <button className="btn-secondary" onClick={() => setIsCreatingSession(false)}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {(!sessions || sessions.length === 0) && !isCreatingSession && (
                                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Scroll size={56} style={{ opacity: 0.2, margin: '0 auto 1.5rem', display: 'block' }} />
                                    <p style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>El diario está en blanco</p>
                                    <p>Las leyendas de esta campaña aún esperan ser escritas.</p>
                                    {isDM && (
                                        <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setIsCreatingSession(true)}>
                                            <Plus size={18} /> Abrir la primera sesión
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Sessions list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                {sessions?.map((session, si) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: si * 0.05 }}
                                        className="glass-panel"
                                        style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.06)' }}
                                    >
                                        {/* Session header */}
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            paddingBottom: '1.25rem', marginBottom: '1.5rem',
                                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139,92,246,0.3)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Scroll size={18} color="#a78bfa" />
                                                </div>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{session.title}</h3>
                                            </div>
                                            <span style={{
                                                fontSize: '0.8rem', color: 'var(--text-secondary)',
                                                background: 'rgba(255,255,255,0.04)', padding: '4px 12px',
                                                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)'
                                            }}>
                                                {new Date(session.session_date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Notes thread */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {session.notes?.length === 0 ? (
                                                <div style={{
                                                    color: 'var(--text-secondary)', fontStyle: 'italic',
                                                    textAlign: 'center', padding: '1.5rem',
                                                    background: 'rgba(255,255,255,0.02)', borderRadius: '12px'
                                                }}>
                                                    Aún no hay crónicas sobre esta sesión. ¡Sé el primero en escribir!
                                                </div>
                                            ) : (
                                                session.notes?.map(note => {
                                                    // isCharacter: tiene personaje vinculado (el join puede fallar por RLS, por eso usamos character_id como fallback)
                                                    const isCharacter = !!note.character || !!note.character_id;
                                                    const authorName = note.character?.name ?? (note.character_id ? 'Héroe Desconocido' : 'Dungeon Master');
                                                    const avatarUrl = note.character?.image ?? null;
                                                    // Generate a stable color based on character name
                                                    const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c'];
                                                    const colorIdx = isCharacter
                                                        ? authorName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
                                                        : -1;
                                                    const authorColor = isCharacter ? colors[colorIdx] : '#f87171';

                                                    return (
                                                        <div key={note.id} style={{
                                                            display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                                            background: 'rgba(0,0,0,0.15)', padding: '1.2rem',
                                                            borderRadius: '14px', borderLeft: `3px solid ${authorColor}`
                                                        }}>
                                                            {/* Avatar */}
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '50%',
                                                                background: `${authorColor}22`, border: `2px solid ${authorColor}55`,
                                                                overflow: 'hidden', display: 'flex', alignItems: 'center',
                                                                justifyContent: 'center', flexShrink: 0
                                                            }}>
                                                                {avatarUrl
                                                                    ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    : <User size={20} color={authorColor} />
                                                                }
                                                            </div>
                                                            {/* Content */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1rem' }}>
                                                                    <strong style={{ color: authorColor, fontSize: '0.95rem' }}>{authorName}</strong>
                                                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                                                                        {new Date(note.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.88)', lineHeight: 1.7, wordBreak: 'break-word' }}>
                                                                    {note.content}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Add note input */}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            {/* Author avatar */}
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                                background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: `2px solid ${isDM ? 'rgba(248,113,113,0.4)' : 'rgba(96,165,250,0.4)'}`
                                            }}>
                                                {myActiveCharacter?.image
                                                    ? <img src={myActiveCharacter.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <User size={18} color={isDM ? '#f87171' : '#60a5fa'} />
                                                }
                                            </div>
                                            {/* Textarea + send */}
                                            <div style={{ flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                                                <textarea
                                                    value={sessionNoteInputs[session.id] || ''}
                                                    onChange={e => setSessionNoteInputs({ ...sessionNoteInputs, [session.id]: e.target.value })}
                                                    placeholder={isDM
                                                        ? 'Añadir crónica como Dungeon Master...'
                                                        : `Añadir crónica como ${myActiveCharacter?.name || 'tu héroe'}...`
                                                    }
                                                    className="glass-input"
                                                    style={{ flex: 1, minHeight: '70px', padding: '0.9rem 1rem', resize: 'none', fontSize: '0.95rem' }}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            const text = sessionNoteInputs[session.id];
                                                            if (!text?.trim()) return;
                                                            await addNote(session.id, text, myActiveCharacter?.id || null);
                                                            setSessionNoteInputs({ ...sessionNoteInputs, [session.id]: '' });
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '0.85rem 1.5rem', alignSelf: 'flex-end', flexShrink: 0 }}
                                                    onClick={async () => {
                                                        const text = sessionNoteInputs[session.id];
                                                        if (!text?.trim()) return;
                                                        await addNote(session.id, text, myActiveCharacter?.id || null);
                                                        setSessionNoteInputs({ ...sessionNoteInputs, [session.id]: '' });
                                                    }}
                                                >
                                                    Registrar
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.5rem', textAlign: 'right' }}>
                                            Enter para enviar · Shift+Enter para nueva línea
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </div >
            </main >

            <AnimatePresence>
                {isPinModalOpen && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(2, 6, 23, 0.85)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ maxWidth: '650px', width: '90%', padding: '3.5rem', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2.5rem' }}>Marcador en el Mapa</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {!editingLoreId && !newLore.place_pin && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Nombre del marcador</label>
                                        <input
                                            placeholder="Ej: La Guarida del Dragón..."
                                            value={pinFormData.title}
                                            onChange={e => setPinFormData({ ...pinFormData, title: e.target.value })}
                                            className="glass-input"
                                            style={{ width: '100%', padding: '1.25rem', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                                        />
                                    </div>
                                )}

                                <IconSelector
                                    label="Selecciona el Icono Visual"
                                    value={selectedPinIcon}
                                    onChange={(id) => setSelectedPinIcon(id)}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', marginTop: '1.5rem' }}>
                                    <button className="btn-secondary" onClick={() => setIsPinModalOpen(false)}>Cancelar</button>
                                    <button className="btn-primary" onClick={confirmPinPlacement} style={{ padding: '1rem 3rem', fontSize: '1rem' }}>Fijar Marcador</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => { if (entryToDelete) { deleteEntry(entryToDelete.id); if (currentScope?.id === entryToDelete.id) setCurrentScope(null); } }}
                title="Borrar del Atlas"
                message="Esta acción eliminará la entrada y todos sus elementos anidados y pines del mapa. ¿Deseas continuar?"
            />

            <ConfirmModal
                isOpen={isCascadeModalOpen}
                onClose={() => handleUpdateLore(false)}
                onConfirm={() => handleUpdateLore(true)}
                title="¿Ocultar contenido anidado?"
                message={`Estás poniendo "${currentScope?.title}" en privado. ¿Quieres que también se vuelvan privados todos sus lugares, NPCs y notas internas?`}
                confirmText="Sí, ocultar todo"
                cancelText="Sólo esta entrada"
                type="info"
            />
            <ConfirmModal
                isOpen={isDeleteCampaignModalOpen}
                onClose={() => setIsDeleteCampaignModalOpen(false)}
                onConfirm={handleDeleteCampaign}
                title="¿Eliminar Campaña Definitivamente?"
                message={`Estás a punto de borrar "${campaign?.title}" y TODA su información (Atlas, Mapas, Personajes...). Esta acción es irreversible.`}
                confirmText="Sí, borrar todo"
                cancelText="Mantener campaña"
                type="danger"
            />
        </div >
    );
}

function TreeItem({ node, depth, expandedNodes, toggleNode, currentScope, setCurrentScope, allPins, getPinIcon, onAddClick, isDM }) {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = currentScope?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const iconType = node.icon_type || 'book';

    return (
        <div>
            <div
                onClick={() => setCurrentScope(node)}
                style={{
                    padding: `12px 1.5rem 12px ${1.5 + depth * 1.5}rem`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.45)',
                    borderLeft: isSelected ? '4px solid #8b5cf6' : '4px solid transparent',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
            >
                <div onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hasChildren ? 1 : 0.3, background: isExpanded ? 'rgba(139, 92, 246, 0.1)' : 'transparent', borderRadius: '4px' }}>
                    {isExpanded ? <ChevronDown size={14} style={{ color: '#8b5cf6' }} /> : <ChevronRight size={14} />}
                </div>

                <div style={{ color: isSelected ? '#8b5cf6' : 'inherit', opacity: isSelected ? 1 : 0.7 }}>
                    {iconType ? getPinIcon(iconType, 16) : <Book size={16} />}
                </div>

                <span style={{ fontSize: '0.9rem', fontWeight: isSelected ? 800 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                    {node.title}
                </span>

                {isSelected && isDM && (
                    <button onClick={(e) => { e.stopPropagation(); onAddClick(); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {isExpanded && hasChildren && (
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: `${1.9 + depth * 1.5}rem` }}>
                    {node.children.map(child => (
                        <TreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                            currentScope={currentScope}
                            setCurrentScope={setCurrentScope}
                            allPins={allPins}
                            getPinIcon={getPinIcon}
                            onAddClick={onAddClick}
                            isDM={isDM}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function MentionDropdown({ search, entries, onSelect, isDM, getPinIcon, campaignTitle, style = {} }) {
    const filtered = entries
        .filter(e => (isDM || e.is_public) && e.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.title.length - a.title.length) // Priorizar títulos más largos para mejor coincidencia
        .slice(0, 6);

    if (filtered.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                position: 'absolute',
                top: '40px', left: '20px',
                width: '320px',
                background: 'rgba(15, 23, 42, 0.98)',
                backdropFilter: 'blur(40px)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '16px',
                zIndex: 2000,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                padding: '8px',
                overflow: 'hidden',
                ...style
            }}
        >
            <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.3)',
                padding: '8px 12px 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <Search size={10} /> Vincular a la historia
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filtered.map(entry => {
                    const parent = entries.find(p => p.id === entry.parent_id);
                    const contextName = parent ? parent.title : campaignTitle;

                    return (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(entry); }}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                                e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.transform = 'none';
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#a78bfa',
                                border: '1px solid rgba(139, 92, 246, 0.1)'
                            }}>
                                {getPinIcon(entry.icon_type || 'book', 16)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>En {contextName}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}

function HeaderTab({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'none', border: 'none', padding: '1.25rem 1rem', position: 'relative',
                display: 'flex', alignItems: 'center', gap: '10px', color: active ? 'white' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? 900 : 500, transition: 'all 0.3s'
            }}
        >
            {React.cloneElement(icon, { size: 18, color: active ? '#8b5cf6' : 'currentColor' })}
            {label}
            {active && <motion.div layoutId="tab-underline" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: '#8b5cf6', borderRadius: '4px 4px 0 0' }} />}
        </button>
    );
}

function ImageUploadBox({ label, url, isUploading, onFileSelect }) {
    const fileInputRef = useRef();
    return (
        <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.8rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</label>
            <div onClick={() => fileInputRef.current.click()} style={{ height: '110px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.3s ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6', e.currentTarget.style.background = 'rgba(139, 92, 246, 0.02)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)', e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}
            >
                <input type="file" ref={fileInputRef} onChange={(e) => onFileSelect(e.target.files[0])} hidden accept="image/*" />
                {isUploading ? <Loader2 size={32} className="animate-spin" color="#8b5cf6" /> : url ? <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={32} opacity={0.15} />}
            </div>
        </div>
    );
}

function IconSelector({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef();
    const currentIcon = PIN_ICONS.find(i => i.id === value) || PIN_ICONS[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {label && <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: isOpen ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen ? '0 0 20px rgba(139, 92, 246, 0.2)' : 'none'
                }}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <currentIcon.icon size={18} color="#a78bfa" />
                </div>
                <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            left: 0,
                            width: '260px',
                            background: 'rgba(15, 23, 42, 0.98)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '20px',
                            padding: '12px',
                            zIndex: 1000,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '8px',
                            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.8)'
                        }}
                    >
                        {PIN_ICONS.map(i => (
                            <button
                                key={i.id}
                                type="button"
                                onClick={() => { onChange(i.id); setIsOpen(false); }}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: value === i.id ? 'rgba(139, 92, 246, 0.4)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = value === i.id ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = value === i.id ? 'rgba(139, 92, 246, 0.4)' : 'transparent'}
                                title={i.label}
                            >
                                <i.icon size={20} color={value === i.id ? 'white' : 'rgba(255,255,255,0.6)'} />
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
