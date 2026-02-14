import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Layout, Map, Users, BookOpen, Settings, Menu, X, Globe, User } from 'lucide-react';
import { FadeIn } from '../ui/FadeIn';

export default function DashboardLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Responsive Check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar (Desktop) or Drawer (Mobile) */}
            <aside
                className="glass-panel"
                style={{
                    width: '260px',
                    margin: 0,
                    borderRadius: 0,
                    borderRight: '1px solid var(--glass-border)',
                    borderTop: 0,
                    borderBottom: 0,
                    borderLeft: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    position: isMobile ? 'fixed' : 'sticky',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    zIndex: 50,
                    transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'rgba(15, 23, 42, 0.98)' // Opaque on mobile
                }}
            >
                {/* Logo Area */}
                <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/dashboard" onClick={closeMenu} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Globe size={28} className="text-gradient" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            OpenTales
                        </span>
                    </Link>
                    {isMobile && <button onClick={toggleMenu}><X color="var(--text-secondary)" /></button>}
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavItem to="/dashboard/campaigns" icon={<Map />} label="Campañas" onClick={closeMenu} />
                    <NavItem to="/dashboard/characters" icon={<Users />} label="Personajes" onClick={closeMenu} />
                    <NavItem to="/dashboard/wiki" icon={<BookOpen />} label="Compendio" onClick={closeMenu} />
                </nav>

                {/* User Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Aventurero</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nivel 1</div>
                        </div>
                        <Settings size={18} color="var(--text-secondary)" style={{ cursor: 'pointer' }} />
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div
                    onClick={closeMenu}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, backdropFilter: 'blur(4px)' }}
                />
            )}

            {/* Mobile Header (Only visible on mobile) */}
            {isMobile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
                    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', padding: '0 1rem', zIndex: 30, justifyContent: 'space-between'
                }}>
                    <button onClick={toggleMenu} style={{ padding: '8px' }}><Menu color="white" /></button>
                    <span style={{ fontWeight: 700 }}>OpenTales</span>
                    <div style={{ width: '40px' }} /> {/* Spacer */}
                </div>
            )}

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                padding: isMobile ? '5rem 1rem 2rem 1rem' : '3rem', // Add top padding for mobile header
                paddingTop: isMobile ? '80px' : '3rem',
                width: '100%',
                overflowX: 'hidden' // Prevent horizontal scroll
            }}>
                <FadeIn>
                    <Outlet />
                    {children}
                </FadeIn>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
            }
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
            })}
        >
            {React.cloneElement(icon, { size: 20 })}
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{label}</span>
        </NavLink>
    );
}
