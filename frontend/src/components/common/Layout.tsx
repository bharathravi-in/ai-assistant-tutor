import { useState } from 'react'
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
    HelpCircle
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
    const [darkMode, setDarkMode] = useState(false)

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
        const baseItems = [
            { icon: Home, label: t('nav.home'), path: `/${user?.role === 'admin' ? 'admin' : user?.role === 'crp' || user?.role === 'arp' ? 'crp' : 'teacher'}` },
            { icon: History, label: t('nav.history'), path: `/${user?.role}/history` },
            { icon: User, label: t('nav.profile'), path: `/${user?.role}/profile` },
        ]
        return baseItems
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full w-72 
                bg-white dark:bg-gray-800 
                border-r border-gray-200 dark:border-gray-700
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 shadow-soft-lg
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-800 dark:text-white">
                            {t('app.name')}
                        </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* User info */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white truncate">
                                {user?.name || user?.phone}
                            </p>
                            <p className="text-sm text-primary-600 dark:text-primary-400 capitalize">
                                {user?.role}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {getNavItems().map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}
                                `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 bg-white dark:bg-gray-800">
                    {/* Language selector */}
                    <div className="flex items-center gap-3 px-4 py-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <select
                            value={i18n.language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                        </select>
                    </div>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        {darkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">{t('nav.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-72">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-600 dark:text-white" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-800 dark:text-white lg:hidden">
                            {t('app.name')}
                        </h1>
                        <div className="w-10 lg:hidden" />
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Floating Help Button */}
            <button className="fab animate-bounce-soft">
                <HelpCircle className="w-6 h-6" />
            </button>
        </div>
    )
}
