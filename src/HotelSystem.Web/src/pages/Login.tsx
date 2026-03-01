import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login({ email, password });
            navigate('/');
        } catch (err: any) {
            setError(t('login.invalidCredentials') || 'Credenciales inválidas. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .login-root {
                    min-height: 100vh;
                    display: flex;
                    font-family: 'DM Sans', sans-serif;
                    background: #080808;
                }

                /* ── LEFT PANEL ── */
                .login-left {
                    flex: 1.1;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 48px 56px;
                }

                .login-left-bg {
                    position: absolute;
                    inset: 0;
                    background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80');
                    background-size: cover;
                    background-position: center;
                    filter: brightness(0.35);
                    transform: scale(1.03);
                    transition: transform 20s ease;
                }

                .login-left:hover .login-left-bg {
                    transform: scale(1.08);
                }

                .login-left-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(0,0,0,0.7) 0%,
                        rgba(5,150,105,0.15) 50%,
                        rgba(0,0,0,0.8) 100%
                    );
                }

                .login-left-content {
                    position: relative;
                    z-index: 2;
                }

                .login-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .login-logo-icon {
                    width: 44px;
                    height: 44px;
                    background: linear-gradient(135deg, #059669, #047857);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 16px rgba(5,150,105,0.4);
                }

                .login-logo-icon svg {
                    width: 22px;
                    height: 22px;
                    fill: white;
                }

                .login-logo-text {
                    font-family: 'Playfair Display', serif;
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                    letter-spacing: 0.5px;
                }

                .login-logo-badge {
                    font-size: 10px;
                    font-weight: 600;
                    color: #059669;
                    background: rgba(5,150,105,0.15);
                    border: 1px solid rgba(5,150,105,0.3);
                    padding: 2px 8px;
                    border-radius: 20px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .login-left-middle {
                    position: relative;
                    z-index: 2;
                }

                .login-headline {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(36px, 4vw, 52px);
                    font-weight: 700;
                    color: white;
                    line-height: 1.15;
                    margin-bottom: 20px;
                }

                .login-headline span {
                    color: #34d399;
                }

                .login-subtitle {
                    font-size: 16px;
                    color: rgba(255,255,255,0.55);
                    font-weight: 300;
                    line-height: 1.6;
                    max-width: 380px;
                }

                .login-stats {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    gap: 32px;
                }

                .login-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .login-stat-value {
                    font-family: 'Playfair Display', serif;
                    font-size: 28px;
                    font-weight: 700;
                    color: white;
                }

                .login-stat-label {
                    font-size: 12px;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    font-weight: 500;
                }

                .login-stat-divider {
                    width: 1px;
                    background: rgba(255,255,255,0.1);
                    align-self: stretch;
                }

                /* ── RIGHT PANEL ── */
                .login-right {
                    flex: 0.9;
                    background: #0e0e0e;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 56px 64px;
                    position: relative;
                    overflow: hidden;
                }

                .login-right::before {
                    content: '';
                    position: absolute;
                    top: -120px;
                    right: -120px;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%);
                    pointer-events: none;
                }

                .login-right::after {
                    content: '';
                    position: absolute;
                    bottom: -80px;
                    left: -80px;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%);
                    pointer-events: none;
                }

                .login-form-header {
                    margin-bottom: 40px;
                }

                .login-form-eyebrow {
                    font-size: 11px;
                    font-weight: 600;
                    color: #059669;
                    text-transform: uppercase;
                    letter-spacing: 2.5px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .login-form-eyebrow::before {
                    content: '';
                    width: 24px;
                    height: 2px;
                    background: #059669;
                    border-radius: 2px;
                }

                .login-form-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 36px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 10px;
                    line-height: 1.2;
                }

                .login-form-desc {
                    font-size: 14px;
                    color: rgba(255,255,255,0.35);
                    font-weight: 300;
                    line-height: 1.6;
                }

                .login-error {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.25);
                    border-left: 3px solid #ef4444;
                    color: rgba(255,255,255,0.7);
                    font-size: 13px;
                    padding: 14px 16px;
                    border-radius: 10px;
                    margin-bottom: 28px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .login-field {
                    margin-bottom: 24px;
                }

                .login-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    margin-bottom: 10px;
                }

                .login-input-wrap {
                    position: relative;
                }

                .login-input-icon {
                    position: absolute;
                    left: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.2);
                    font-size: 14px;
                    transition: color 0.2s;
                    pointer-events: none;
                }

                .login-input {
                    width: 100%;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    padding: 16px 18px 16px 48px;
                    color: white;
                    font-size: 15px;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 400;
                    outline: none;
                    transition: all 0.25s;
                    caret-color: #059669;
                }

                .login-input::placeholder {
                    color: rgba(255,255,255,0.18);
                }

                .login-input:focus {
                    border-color: rgba(5,150,105,0.5);
                    background: rgba(5,150,105,0.05);
                    box-shadow: 0 0 0 4px rgba(5,150,105,0.08);
                }

                .login-input:focus + .login-input-icon,
                .login-input-wrap:focus-within .login-input-icon {
                    color: #059669;
                }

                .login-input-icon { pointer-events: none; }

                .login-eye {
                    position: absolute;
                    right: 18px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.25);
                    cursor: pointer;
                    padding: 4px;
                    font-size: 14px;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                }

                .login-eye:hover { color: rgba(255,255,255,0.6); }

                .login-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    margin-top: -8px;
                }

                .login-remember {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .login-remember input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    accent-color: #059669;
                    cursor: pointer;
                }

                .login-remember span {
                    font-size: 13px;
                    color: rgba(255,255,255,0.35);
                    font-weight: 400;
                }

                .login-forgot {
                    font-size: 13px;
                    color: rgba(5,150,105,0.8);
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .login-forgot:hover { color: #34d399; }

                .login-btn {
                    width: 100%;
                    padding: 17px;
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    border: none;
                    border-radius: 14px;
                    color: white;
                    font-size: 15px;
                    font-weight: 700;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.25s;
                    box-shadow: 0 8px 24px rgba(5,150,105,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    position: relative;
                    overflow: hidden;
                }

                .login-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
                    opacity: 0;
                    transition: opacity 0.25s;
                }

                .login-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(5,150,105,0.4);
                }

                .login-btn:hover:not(:disabled)::before { opacity: 1; }

                .login-btn:active:not(:disabled) { transform: translateY(0); }

                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .login-btn-arrow {
                    font-size: 18px;
                    transition: transform 0.2s;
                }

                .login-btn:hover:not(:disabled) .login-btn-arrow {
                    transform: translateX(4px);
                }

                .login-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                .login-divider {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin: 28px 0;
                }

                .login-divider-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                }

                .login-divider-text {
                    font-size: 12px;
                    color: rgba(255,255,255,0.2);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    white-space: nowrap;
                }

                .login-footer {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .login-footer-text {
                    font-size: 12px;
                    color: rgba(255,255,255,0.2);
                }

                .login-security-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: rgba(5,150,105,0.6);
                    font-weight: 500;
                }

                .login-security-dot {
                    width: 6px;
                    height: 6px;
                    background: #059669;
                    border-radius: 50%;
                    animation: pulse-dot 2s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }

                /* ── RESPONSIVE ── */
                @media (max-width: 900px) {
                    .login-left { display: none; }
                    .login-right {
                        flex: 1;
                        padding: 40px 32px;
                    }
                }

                @media (max-width: 480px) {
                    .login-right { padding: 32px 24px; }
                    .login-form-title { font-size: 28px; }
                }
            `}</style>

            <div className="login-root">

                {/* ── LEFT PANEL ── */}
                <div className="login-left">
                    <div className="login-left-bg" />
                    <div className="login-left-overlay" />

                    {/* Logo */}
                    <div className="login-left-content">
                        <div className="login-logo">
                            <div className="login-logo-icon">
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                            </div>
                            <span className="login-logo-text">Hotel Sistema</span>
                            <span className="login-logo-badge">Pro</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <div className="login-left-middle">
                        <h1 className="login-headline">
                            Gestión hotelera<br />
                            <span>inteligente</span> y<br />
                            segura.
                        </h1>
                        <p className="login-subtitle">
                            Administra reservas, habitaciones y huéspedes desde un solo panel centralizado.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="login-stats">
                        <div className="login-stat">
                            <span className="login-stat-value">100%</span>
                            <span className="login-stat-label">Seguro</span>
                        </div>
                        <div className="login-stat-divider" />
                        <div className="login-stat">
                            <span className="login-stat-value">24/7</span>
                            <span className="login-stat-label">Disponible</span>
                        </div>
                        <div className="login-stat-divider" />
                        <div className="login-stat">
                            <span className="login-stat-value">PEN</span>
                            <span className="login-stat-label">Multi-moneda</span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="login-right">
                    <div className="login-form-header">
                        <div className="login-form-eyebrow">Panel de administración</div>
                        <h2 className="login-form-title">Bienvenido<br />de nuevo</h2>
                        <p className="login-form-desc">Ingresa tus credenciales para acceder al sistema.</p>
                    </div>

                    {error && (
                        <div className="login-error">
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="login-field">
                            <label className="login-label">{t('login.email') || 'Correo electrónico'}</label>
                            <div className="login-input-wrap">
                                <input
                                    type="email"
                                    required
                                    className="login-input"
                                    placeholder="admin@hotel.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                                <span className="login-input-icon"><FaEnvelope /></span>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="login-field">
                            <label className="login-label">{t('login.password') || 'Contraseña'}</label>
                            <div className="login-input-wrap">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="login-input"
                                    placeholder="••••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <span className="login-input-icon"><FaLock /></span>
                                <button
                                    type="button"
                                    className="login-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="login-row">
                            <label className="login-remember">
                                <input type="checkbox" />
                                <span>Recordarme</span>
                            </label>
                            <a href="#" className="login-forgot">¿Olvidaste tu clave?</a>
                        </div>

                        {/* Submit */}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="login-spinner" />
                                    <span>{t('login.signingIn') || 'Ingresando...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('login.signIn') || 'Iniciar sesión'}</span>
                                    <span className="login-btn-arrow">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="login-footer">
                        <span className="login-footer-text">© 2026 Hotel Sistema</span>
                        <div className="login-security-badge">
                            <div className="login-security-dot" />
                            Conexión segura
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;