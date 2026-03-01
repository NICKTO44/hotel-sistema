import { Link, useLocation } from 'react-router-dom';
import {
    FaHome, FaBed, FaCalendarAlt, FaConciergeBell, FaUser, FaSignOutAlt,
    FaBroom, FaShapes, FaTimes, FaCog, FaUserShield, FaHistory, FaChartLine,
    FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/api';
import { useSettings } from '../../hooks/useSettings';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) => {
    const location = useLocation();
    const { t } = useTranslation();
    const { data: settings } = useSettings();

    const menuItems = [
        { name: t('sidebar.dashboard'),    icon: FaHome,          path: '/' },
        { name: t('sidebar.frontDesk'),    icon: FaConciergeBell, path: '/front-desk' },
        { name: t('sidebar.reservations'), icon: FaCalendarAlt,   path: '/reservations' },
        { name: t('sidebar.guests'),       icon: FaUser,          path: '/guests' },
        { name: t('sidebar.rooms'),        icon: FaBed,           path: '/rooms' },
        { name: t('sidebar.housekeeping'), icon: FaBroom,         path: '/housekeeping' },
        { name: t('sidebar.roomTypes'),    icon: FaShapes,        path: '/room-types' },
        { name: t('sidebar.reports'),      icon: FaChartLine,     path: '/reports' },
        { name: t('sidebar.users'),        icon: FaUserShield,    path: '/users' },
        { name: t('sidebar.auditLogs'),    icon: FaHistory,       path: '/audit-logs' },
        { name: t('sidebar.settings'),     icon: FaCog,           path: '/settings' },
        { name: t('sidebar.profile'),      icon: FaUser,          path: '/profile' },
    ];

    const handleLogout = () => {
        authService.logout();
        window.location.href = '/login';
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) onClose();
    };

    return (
        <div
            className={clsx(
                'h-screen flex flex-col fixed left-0 top-0 z-50',
                'bg-neutral-950 border-r border-neutral-800',
                'transition-all duration-300',
                // Mobile: slide
                isOpen ? 'translate-x-0' : '-translate-x-full',
                'lg:translate-x-0',
            )}
            style={{ width: collapsed ? '60px' : '256px' }}
        >
            {/* Header */}
            <div className="h-16 flex items-center border-b border-neutral-800 flex-shrink-0 px-3 gap-2">
                {/* Logo — oculto al colapsar */}
                {!collapsed && (
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        {settings?.logoBase64 && (
                            <img src={settings.logoBase64} alt="Logo" className="h-7 w-7 object-contain rounded flex-shrink-0" />
                        )}
                        <span className="text-white font-semibold text-sm tracking-wide whitespace-nowrap truncate">
                            {settings?.companyName || 'Hotel System'}
                        </span>
                    </div>
                )}

                {/* Botón colapsar — desktop */}
                <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex items-center justify-center flex-shrink-0 text-neutral-500 hover:text-white hover:bg-neutral-800 p-1.5 rounded transition-colors ml-auto"
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {collapsed
                        ? <FaChevronRight className="text-xs" />
                        : <FaChevronLeft className="text-xs" />
                    }
                </button>

                {/* Botón cerrar — mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden flex-shrink-0 text-neutral-500 hover:text-white transition-colors p-1"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            title={collapsed ? item.name : undefined}
                            className={clsx(
                                'flex items-center gap-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150',
                                collapsed ? 'justify-center px-0' : 'px-3',
                                isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            )}
                        >
                            <item.icon className="text-base flex-shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-2 py-4 border-t border-neutral-800 flex-shrink-0">
                <button
                    onClick={handleLogout}
                    title={collapsed ? t('sidebar.logout') : undefined}
                    className={clsx(
                        'flex items-center gap-3 py-2.5 w-full rounded-md text-sm font-medium',
                        'text-neutral-400 hover:bg-red-600/20 hover:text-red-400 transition-all duration-150',
                        collapsed ? 'justify-center px-0' : 'px-3'
                    )}
                >
                    <FaSignOutAlt className="text-base flex-shrink-0" />
                    {!collapsed && <span>{t('sidebar.logout')}</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;