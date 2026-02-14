import { ArrowRight, User, Lock, Chrome, Shield } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FadeIn } from '../components/ui/FadeIn';

const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Requerido'),
    password: Yup.string().min(6, 'Demasiado corta').required('Requerido'),
});

export default function LoginPage() {
    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema: LoginSchema,
        onSubmit: (values) => {
            alert(JSON.stringify(values, null, 2));
        },
    });

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Orbs */}
            <div style={{
                position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                filter: 'blur(40px)', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', bottom: '20%', right: '20%', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
                filter: 'blur(60px)', zIndex: 0
            }} />

            <FadeIn className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '3.5rem',
                margin: '1rem',
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bienvenido</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Inicia sesión para continuar tu aventura</p>
                </div>

                <form onSubmit={formik.handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ position: 'relative' }}>
                        <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            name="email"
                            type="email"
                            placeholder="tu@email.com"
                            onChange={formik.handleChange}
                            value={formik.values.email}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                        {formik.errors.email && formik.touched.email ? (
                            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>{formik.errors.email}</div>
                        ) : null}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            onChange={formik.handleChange}
                            value={formik.values.password}
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        {formik.errors.password && formik.touched.password ? (
                            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>{formik.errors.password}</div>
                        ) : null}
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                        Entrar <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    ¿No tienes cuenta? <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Regístrate</a>
                </div>

            </FadeIn>
        </div>
    );
}
