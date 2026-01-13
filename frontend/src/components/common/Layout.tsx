import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Home,
    History,
    User,
    LogOut,
    Menu,
    X,
    Globe,
    Moon,
    Sun,
    GraduationCap,
    HelpCircle,
    Sparkles,
    Building2,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuthStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [darkMode, setDarkMode] = useState(false)

    // Auto collapse on smaller desktop screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
                setSidebarCollapsed(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle('dark')
    }

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang)
    }

    const getNavItems = () => {
        const role = user?.role?.toLowerCase()

        if (role === 'superadmin') {
            return [
                { icon: Home, label: 'Dashboard', path: '/superadmin' },
                { icon: Building2, label: 'Organizations', path: '/superadmin/organizations' },
                { icon: CreditCard, label: 'Plans', path: '/superadmin/plans' },
                { icon: Sparkles, label: 'AI Settings', path: '/superadmin/ai-settings' },
                { icon: Settings, label: 'Settings', path: '/superadmin/settings' },
            ]
        }

        const basePath = role === 'admin' ? 'admin' : role === 'crp' || role === 'arp' ? 'crp' : 'teacher'
        const items = [
            { icon: Home, label: t('nav.home'), path: `/${basePath}` },
        ]

        if (role === 'crp' || role === 'arp') {
            items.push({ icon: Sparkles, label: 'Feedback Assistant', path: '/crp/feedback-assist' })
        }

        items.push(
            { icon: History, label: t('nav.history'), path: `/${basePath}/history` },
            { icon: User, label: t('nav.profile'), path: `/${basePath}/profile` },
            { icon: Settings, label: 'Settings', path: `/${basePath}/settings` }
        )

        return items
    }

    const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72'
    const marginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full ${sidebarWidth}
                bg-white dark:bg-gray-800 
                border-r border-gray-100 dark:border-gray-700
                transform transition-all duration-300 ease-in-out
                lg:translate-x-0 shadow-xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-gray-100 dark:border-gray-700`}>
                    <Link to="/" className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' }}
                        >
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <span className="font-bold text-gray-800 dark:text-white whitespace-nowrap">
                                AI Teaching
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* User info */}
                {!sidebarCollapsed && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(38, 64, 146, 0.05)' }}>
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                            >
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white truncate text-sm">
                                    {user?.name || user?.phone}
                                </p>
                                <p className="text-xs capitalize" style={{ color: '#264092' }}>
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {sidebarCollapsed && (
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
                            style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                        >
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className={`p-3 space-y-1 flex-1`}>
                    {getNavItems().map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                                    ${sidebarCollapsed ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'font-medium text-white shadow-lg'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}
                                `}
                                style={isActive ? { background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' } : {}}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Collapse toggle - Desktop only */}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                    )}
                </button>

                {/* Bottom actions */}
                <div className={`absolute bottom-0 left-0 right-0 ${sidebarCollapsed ? 'p-2' : 'p-3'} border-t border-gray-100 dark:border-gray-700 space-y-1 bg-white dark:bg-gray-800`}>
                    {/* Language selector */}
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <select
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिंदी</option>
                                <option value="ta">தமிழ்</option>
                                <option value="te">తెలుగు</option>
                                <option value="kn">ಕನ್ನಡ</option>
                            </select>
                        </div>
                    )}

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className={`flex items-center gap-3 px-3 py-2.5 w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
                        {!sidebarCollapsed && (
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {darkMode ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 px-3 py-2.5 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span className="font-medium">{t('nav.logout')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`${marginLeft} transition-all duration-300`}>
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 py-3 lg:py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-600 dark:text-white" />
                        </button>

                        <div className="flex-1 lg:flex-none">
                            <h1 className="text-lg font-semibold text-gray-800 dark:text-white text-center lg:text-left lg:hidden">
                                AI Teaching
                            </h1>
                        </div>

                        {/* Desktop header content */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">AI Ready</span>
                            </div>
                        </div>

                        <div className="w-10 lg:hidden" />
                    </div>
                </header>

                {/* Page content */}
                <main className="min-h-[calc(100vh-65px)]">
                    {children}
                </main>
            </div>

            {/* Floating Help Button */}
            <button
                className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 hidden lg:flex"
                style={{ background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' }}
            >
                <HelpCircle className="w-5 h-5" />
            </button>
        </div>
    )
}
