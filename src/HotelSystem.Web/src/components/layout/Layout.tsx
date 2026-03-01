import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const sidebarWidth = collapsed ? 60 : 256;

    return (
        <div
            className="bg-neutral-50 min-h-screen font-sans"
            style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(prev => !prev)}
            />

            <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Overlay mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main — margen y padding-top dinámicos */}
            <main
                className="transition-all duration-300 p-6 pt-[88px]"
                style={{ marginLeft: `var(--sidebar-width, 256px)` }}
            >
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;