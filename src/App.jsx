import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Map, BookOpen, Users, Smartphone, ChevronRight, Sparkles, Scroll } from 'lucide-react';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/layout/DashboardLayout';
import CampaignDetail from './pages/Campaign/CampaignDetail';
import CharacterList from './pages/Character/CharacterList';
import CharacterSheet from './pages/Character/CharacterSheet';

function NavBar() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) return null; // El Dashboard tiene su propio layout

  if (isLoginPage) {
    return (
      <nav className="navbar container" style={{ position: 'absolute', top: 0, width: '100%', zIndex: 50 }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Link to="/" className="logo">
            <Scroll size={24} className="text-secondary" />
            <span>OpenTales</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar container">
      <div className="nav-content glass-panel" style={{ padding: '0.75rem 1.5rem' }}>
        <Link to="/" className="logo">
          <Scroll size={24} className="text-secondary" />
          <span>OpenTales</span>
        </Link>
        <div className="nav-links">
          <a href="/#features" className="nav-link">Características</a>
          <a href="/#about" className="nav-link">Comunidad</a>
          <Link to="/login" className="nav-link">Entrar</Link>
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <NavBar />
      {children}
    </div>
  )
}

function LandingPage() {
  return (
    <main className="container">
      {/* Hero Section */}
      <section className="hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '999px', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <Sparkles size={16} color="#a78bfa" />
          <span style={{ color: '#a78bfa', fontSize: '0.875rem', fontWeight: 600 }}>Nueva Versión Alpha</span>
        </div>
        <h1>
          Crea tu <span className="text-gradient">Legado</span>,<br />
          Cuenta tu Historia.
        </h1>
        <p>
          La plataforma definitiva para Game Masters y aventureros.
          Gestiona campañas, mapas interactivos y wikis enlazadas en una experiencia inmersiva.
        </p>
        <div className="hero-buttons">
          <Link to="/dashboard" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            Comenzar Aventura <ChevronRight size={20} />
          </Link>
          <button className="btn-secondary">
            Ver Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-grid">
        <FeatureCard
          icon={<Map />}
          title="Mapas Interactivos"
          desc="Sube tus mundos y añade pines con información detallada. Todo conectado en un solo lugar."
        />
        <FeatureCard
          icon={<BookOpen />}
          title="Wiki Enlazada"
          desc="Crea artículos interconectados sobre lore, personajes y lugares. Nunca pierdas el hilo de la historia."
        />
        <FeatureCard
          icon={<Users />}
          title="Gestión de Personajes"
          desc="Fichas de personaje completas y personalizables. Sigue su progreso y equipo en tiempo real."
        />
        <FeatureCard
          icon={<Smartphone />}
          title="Mobile First"
          desc="Tus jugadores pueden consultar el diario y sus stats desde el móvil sin instalar nada."
        />
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card glass-panel">
      <div className="icon-wrapper">
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Campaign Detail Route - Standalone layout for immersion */}
          <Route path="/dashboard/campaign/:id" element={<CampaignDetail />} />

          {/* Dashboard Routes with Sidebar */}
          <Route path="/dashboard/*" element={
            <DashboardLayout>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="campaigns" element={<Dashboard />} />
                <Route path="characters" element={<CharacterList />} />
                <Route path="character/:id" element={<CharacterSheet />} />
                {/* Futuras rutas: wiki, settings, etc. */}
              </Routes>
            </DashboardLayout>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
