import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import Notifications from '../components/Notifications';
import {
    FileText,
    Video,
    Layout,
    CheckSquare,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Home
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Documents', path: '/dashboard/documents' },
        { icon: Video, label: 'Meetings', path: '/dashboard/meetings' },
        { icon: Layout, label: 'Whiteboard', path: '/dashboard/whiteboard' },
        { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
        { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    ];

    return (
        <div className="flex h-screen bg-[linear-gradient(to_bottom,_#0B1220_0%,_#0F1B2D_35%,_#0A0F1A_100%)] overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } bg-[#0B1220]/80 backdrop-blur-xl border-r border-gray-700/50`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                        <h1 className="text-2xl font-bold text-white">CollabSuite</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-[#1a2332] hover:text-white transition-all duration-200 group"
                            >
                                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-gray-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-[#0B1220]/60 backdrop-blur-sm border-b border-gray-700/50 px-6 py-4 relative z-20">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex-1 flex items-center justify-end gap-4 ml-auto">
                            <Notifications />
                            <h2 className="text-lg lg:text-xl font-semibold text-white truncate hidden md:block">Welcome back, {user?.name || 'User'}!</h2>
                            <h2 className="text-lg font-semibold text-white truncate md:hidden">{user?.name || 'User'}</h2>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
                    <Outlet />
                </main>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                />
            )}
        </div>
    );
};

export default DashboardLayout;
