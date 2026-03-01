import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { FaSearch, FaSignOutAlt, FaGlobe, FaBars } from 'react-icons/fa';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [showDropdown, setShowDropdown] = useState(false);

    const userName = localStorage.getItem('userName') || 'Admin User';
    const userRole = localStorage.getItem('role') || 'Staff';

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <header
            className="bg-white h-16 flex items-center justify-between px-4 lg:px-6 border-b border-neutral-200 fixed top-0 right-0 z-40 transition-all duration-300"
            style={{ left: 'var(--sidebar-width, 256px)' }}
        >
            {/* Left */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Hamburger — mobile únicamente */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-neutral-500 hover:text-neutral-800 transition-colors p-1 flex-shrink-0"
                >
                    <FaBars className="text-lg" />
                </button>

                {/* Buscador */}
                <button
                    onClick={() => {
                        const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                        document.dispatchEvent(event);
                    }}
                    className="hidden md:flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 rounded-md px-3 py-2 flex-1 max-w-sm transition-colors"
                >
                    <FaSearch className="text-neutral-400 text-sm flex-shrink-0" />
                    <span className="text-neutral-400 text-sm">{t('common.search')}</span>
                    <kbd className="ml-auto text-xs text-neutral-400 bg-white border border-neutral-300 rounded px-1.5 py-0.5 flex-shrink-0">
                        {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                    </kbd>
                </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {/* Idioma */}
                <div className="flex items-center gap-1.5 text-xs">
                    <FaGlobe className="text-neutral-400" />
                    <button
                        onClick={() => i18n.changeLanguage('en')}
                        className={`font-medium transition-colors ${i18n.language === 'en' ? 'text-emerald-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        EN
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                        onClick={() => i18n.changeLanguage('es')}
                        className={`font-medium transition-colors ${i18n.language === 'es' ? 'text-emerald-600' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        ES
                    </button>
                </div>

                {/* Notificaciones */}
                <NotificationBell />

                <div className="h-6 w-px bg-neutral-200" />

                {/* Usuario */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2.5 hover:bg-neutral-50 rounded-md px-2 py-1.5 transition-colors"
                    >
                        <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden lg:block text-left">
                            <p className="text-sm font-semibold text-neutral-800 leading-tight">{userName}</p>
                            <p className="text-xs text-neutral-500 leading-tight">{userRole}</p>
                        </div>
                    </button>

                    {showDropdown && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                                >
                                    <FaSignOutAlt className="text-xs" />
                                    {t('nav.logout','cerrar sesión')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;