import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', cancelText = 'Cancelar', type = 'danger' }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(2, 6, 23, 0.85)',
                backdropFilter: 'blur(8px)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="glass-panel"
                    style={{
                        maxWidth: '450px',
                        width: '100%',
                        padding: '2.5rem',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(24px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: type === 'danger' ? '#ef4444' : 'var(--primary)'
                        }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{title}</h3>
                        </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ padding: '0.75rem 1.5rem', flex: 1 }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="btn-primary"
                            style={{
                                padding: '0.75rem 1.5rem',
                                flex: 1,
                                background: type === 'danger' ? '#ef4444' : 'var(--primary)',
                                boxShadow: type === 'danger' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(139, 92, 246, 0.2)'
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
