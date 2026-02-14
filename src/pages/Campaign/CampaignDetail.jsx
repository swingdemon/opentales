import React, { useState, useRef } from 'react';
import {
    Map as MapIcon,
    Search,
    Settings,
    Plus,
    ChevronRight,
    ChevronDown,
    Book,
    FileText,
    Pin,
    Minus,
    X,
    MoreHorizontal
} from 'lucide-react';
import { FadeIn } from '../../components/ui/FadeIn';
import { AnimatePresence, motion } from 'framer-motion';

// Dummy Data
const initialStructure = [
    {
        id: 'world', type: 'folder', name: 'Atlas de Avaloria', isOpen: true,
        children: [
            {
                id: 'kingdoms', type: 'folder', name: 'Reinos', isOpen: true, children: [
                    { id: 'elondria', type: 'document', name: 'Elondria Capital de la Luz' },
                    { id: 'ironhold', type: 'document', name: 'Fortaleza de Hierro' }
                ]
            },
            { id: 'geography', type: 'folder', name: 'Geografía', isOpen: false, children: [] }
        ]
    },
    {
        id: 'lore', type: 'folder', name: 'Lore & Historia', isOpen: true, children: [
            { id: 'gods', type: 'document', name: 'Panteón de los Dioses' },
            { id: 'magic', type: 'document', name: 'Las 3 Escuelas de Magia' }
        ]
    }
];

const mapPins = [
    { id: 'elondria', x: 35, y: 40, label: 'Capital Elondria', type: 'city', summary: 'La joya brillante del imperio, hogar de la Gran Biblioteca y el Trono Solar.' },
    { id: 'danger_zone', x: 75, y: 65, label: 'Ruinas Olvidadas', type: 'danger', summary: 'Antiguas catacumbas infestadas de no-muertos. Nivel recomendado: 5+' }
];

const TreeItem = ({ item, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(item.isOpen || false);
    const toggleOpen = (e) => { e.stopPropagation(); setIsOpen(!isOpen); };

    return (
        <div style={{ marginLeft: level > 0 ? '12px' : 0 }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px',
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
                {item.type === 'folder' && (
                    <div onClick={toggleOpen} style={{ display: 'flex', alignItems: 'center' }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                )}
                {item.type === 'folder' ? <Book size={14} color="#a78bfa" /> : <FileText size={14} />}
                <span>{item.name}</span>
            </div>
            {item.type === 'folder' && isOpen && item.children && (
                <div style={{ borderLeft: '1px solid var(--glass-border)', marginLeft: '7px' }}>
                    {item.children.map(child => <TreeItem key={child.id} item={child} level={level + 1} />)}
                </div>
            )}
        </div>
    );
};

export default function CampaignDetail() {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPin, setSelectedPin] = useState(null);
    const containerRef = useRef(null);

    const handleWheel = (e) => {
        const delta = -e.deltaY * 0.001;
        setScale(s => Math.min(4, Math.max(0.5, s + delta)));
    };

    const handleMouseDown = (e) => {
        if (e.target.closest('.map-pin')) return;
        if (e.button === 0) { setIsDragging(true); e.currentTarget.style.cursor = 'grabbing'; }
    };

    const handleMouseMove = (e) => {
        if (isDragging) setPosition(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    };

    const handleMouseUp = (e) => { setIsDragging(false); e.currentTarget.style.cursor = 'grab'; };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

            {/* Sidebar */}
            <aside className="glass-panel" style={{
                width: '300px', borderRadius: 0, borderRight: '1px solid var(--glass-border)', borderTop: 0, borderBottom: 0, borderLeft: 0,
                display: 'flex', flexDirection: 'column', zIndex: 20, background: 'rgba(15, 23, 42, 0.95)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ecos de Avaloria</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', flex: 1 }}>
                            <Search size={14} color="var(--text-secondary)" />
                            <input type="text" placeholder="Buscar..." style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', width: '100%', outline: 'none' }} />
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {initialStructure.map(item => <TreeItem key={item.id} item={item} />)}
                </div>
            </aside>

            {/* Main Map Area */}
            <div
                ref={containerRef}
                style={{ flex: 1, position: 'relative', background: '#0b0f19', overflow: 'hidden', cursor: 'grab' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Map Toolbar */}
                <div className="glass-panel" style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '0.5rem', padding: '0.5rem', zIndex: 10 }}>
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ padding: '8px', color: 'white', cursor: 'pointer' }}><Minus size={20} /></button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '8px', minWidth: '3rem', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(4, s + 0.2))} style={{ padding: '8px', color: 'white', cursor: 'pointer' }}><Plus size={20} /></button>
                </div>

                {/* Map Canvas */}
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.1, 0.7, 1.0, 0.1)',
                        transformOrigin: 'center', position: 'relative', pointerEvents: 'auto'
                    }}>
                        <img
                            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2674"
                            alt="World Map"
                            style={{ maxWidth: 'none', height: 'auto', width: '2000px', borderRadius: '4px', boxShadow: '0 0 50px rgba(0,0,0,0.5)', display: 'block' }}
                            draggable={false}
                        />

                        {/* Pins */}
                        {mapPins.map(pin => (
                            <MapPinItem
                                key={pin.id}
                                pin={pin}
                                scale={scale}
                                isSelected={selectedPin?.id === pin.id}
                                onClick={() => setSelectedPin(pin)}
                            />
                        ))}
                    </div>
                </div>

                {/* Quick View Drawer (Right) */}
                <AnimatePresence>
                    {selectedPin && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="glass-panel"
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem', bottom: '1rem',
                                width: '320px', padding: '1.5rem', zIndex: 30, display: 'flex', flexDirection: 'column',
                                background: 'rgba(15, 23, 42, 0.98)', borderLeft: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{selectedPin.label}</h2>
                                <button onClick={() => setSelectedPin(null)} style={{ padding: '4px', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ height: '150px', background: 'var(--glass-bg)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {/* Placeholder Image */}
                                <MapIcon size={40} color="var(--primary)" opacity={0.5} />
                            </div>

                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                                {selectedPin.summary}
                            </p>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                                <button className="btn-primary" style={{ flex: 1, fontSize: '0.9rem', justifyContent: 'center', display: 'flex' }}>Ver Nota Completa</button>
                                <button className="btn-secondary" style={{ padding: '0.75rem' }}><MoreHorizontal size={20} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

// Componente Pin Individual
function MapPinItem({ pin, scale, onClick, isSelected }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="map-pin"
            style={{
                position: 'absolute', top: `${pin.y}%`, left: `${pin.x}%`,
                transform: `translate(-50%, -100%)`, // Anclar abajo-centro visualmente
                cursor: 'pointer', zIndex: isSelected ? 50 : 10
            }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                transform: `scale(${1 / scale})`, // Contra-escalado mágico: 1/scale mantiene el tamaño visual
                transformOrigin: 'bottom center',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transition: 'transform 0.1s'
            }}>
                {/* Tooltip */}
                <AnimatePresence>
                    {(isHovered || isSelected) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute', bottom: '100%', marginBottom: '12px',
                                background: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--glass-border)',
                                padding: '8px 12px', borderRadius: '8px',
                                whiteSpace: 'nowrap', pointerEvents: 'none',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                display: 'flex', flexDirection: 'column', gap: '4px'
                            }}
                        >
                            <span style={{ fontWeight: 600 }}>{pin.label}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pin Shape */}
                <motion.div
                    whileHover={{ scale: 1.2 }}
                    style={{
                        width: '40px', height: '40px',
                        background: pin.type === 'danger' ? '#ef4444' : 'var(--primary)',
                        borderRadius: '50%',
                        boxShadow: isSelected
                            ? `0 0 0 4px white, 0 0 30px ${pin.type === 'danger' ? '#ef4444' : 'var(--primary)'}`
                            : `0 0 0 2px rgba(255,255,255,0.2), 0 0 20px ${pin.type === 'danger' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(139, 92, 246, 0.5)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white'
                    }}
                >
                    {pin.type === 'danger' ? <div style={{ width: 10, height: 10, background: 'white', borderRadius: '50%' }} /> : <Pin size={20} fill="white" />}
                </motion.div>

                {/* Sombra de suelo */}
                <div style={{
                    width: '20px', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%',
                    filter: 'blur(2px)', marginTop: '4px'
                }} />
            </div>
        </div>
    );
}
