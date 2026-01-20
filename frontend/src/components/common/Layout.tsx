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
    ChevronRight,
    MessageCircle,
    BookOpen,
    Mic,
    Lightbulb,
    Users,
    AlertTriangle,
    BarChart3,
    FileText,
    MessageSquare,
    BookMarked,
    Clipboard,
    ClipboardList,
    Inbox,
    Database
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import NotificationBell from './NotificationBell'

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
    const [helpOpen, setHelpOpen] = useState(false)

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

        if (role === 'admin') {
            return [
                { icon: Home, label: 'Dashboard', path: '/admin' },
                { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
                { icon: FileText, label: 'Content', path: '/admin/content-list' },
                { icon: Users, label: 'Users', path: '/admin/users' },
                { icon: Building2, label: 'Schools', path: '/admin/schools' },
                { icon: Database, label: 'Master Data', path: '/admin/master-data' },
                { icon: BookOpen, label: 'Create Resource', path: '/admin/resources/create' },
                { icon: Settings, label: 'Settings', path: '/admin/settings' },
            ]
        }

        if (role === 'crp' || role === 'arp') {
            const basePath = role
            const navItems = [
                { icon: Home, label: 'Dashboard', path: `/${basePath}` },
                { icon: Users, label: 'My Teachers', path: `/${basePath}/teachers` },
                { icon: Inbox, label: 'Shared Queries', path: `/${basePath}/shared-queries` },
                { icon: FileText, label: 'Teacher Resources', path: `/${basePath}/teacher-resources` },
                { icon: MessageSquare, label: 'Request Feedback', path: `/${basePath}/request-feedback` },
                { icon: Clipboard, label: 'Surveys', path: `/${basePath}/surveys` },
                { icon: AlertTriangle, label: 'Interventions', path: `/${basePath}/interventions` },
                { icon: Sparkles, label: 'Feedback Assistant', path: `/${basePath}/feedback-assist` },
                { icon: BookOpen, label: 'Create Content', path: `/${basePath}/resources/create` },
                { icon: BarChart3, label: 'Reports', path: `/${basePath}/reports` },
            ]
            // ARP-specific items
            if (role === 'arp') {
                navItems.push(
                    { icon: Users, label: 'User Management', path: '/arp/users' },
                    { icon: BookOpen, label: 'Programs', path: '/arp/programs' },
                    { icon: BarChart3, label: 'Gap Analysis', path: '/arp/gap-analysis' }
                )
            }
            navItems.push({ icon: Settings, label: 'Settings', path: `/${basePath}/settings` })
            return navItems
        }

        // Teacher navigation - PRD aligned
        return [
            { icon: Home, label: t('nav.home'), path: '/teacher' },
            { icon: MessageSquare, label: 'Ask AI', path: '/teacher/ask-question' },
            { icon: History, label: t('nav.history'), path: '/teacher/history' },
            { icon: BookMarked, label: 'Resources', path: '/teacher/resources' },
            { icon: Inbox, label: 'Feedback', path: '/teacher/feedback-inbox' },
            { icon: Clipboard, label: 'Reflections', path: '/teacher/reflections' },
            { icon: User, label: t('nav.profile'), path: '/teacher/profile' },
            { icon: Settings, label: 'Settings', path: '/teacher/settings' }
        ]
    }


    const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72'
    const marginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
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
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600"
                        >
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <span className="font-bold text-gray-800 dark:text-white whitespace-nowrap">
                                    EducationAI
                                </span>
                                <p className="text-xs text-gray-500">AI Teaching</p>
                            </div>
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
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-secondary-500 to-secondary-600"
                            >
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white truncate text-sm">
                                    {user?.name || user?.phone}
                                </p>
                                <p className="text-xs capitalize text-primary-600 dark:text-primary-400">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {sidebarCollapsed && (
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br from-secondary-500 to-secondary-600"
                        >
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className={`p-3 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]`}>
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
                                        ? 'sidebar-active font-medium'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}
                                `}
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
                        className={`flex items-center gap-3 px-3 py-2.5 w-full text-accent-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
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
                                EducationAI
                            </h1>
                        </div>

                        {/* Desktop header content */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-900/20">
                                <div className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                                <span className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">AI Ready</span>
                            </div>

                            {/* Real Notification Bell */}
                            <NotificationBell />
                        </div>

                        <div className="w-10 lg:hidden" />
                    </div>
                </header>

                {/* Page content */}
                <main className="min-h-[calc(100vh-65px)] p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Floating Help Button and Panel */}
            <div className="fixed bottom-6 right-6 z-40">
                {/* Help Panel */}
                {helpOpen && (
                    <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-white" />
                                    <span className="font-semibold text-white">Quick Help</span>
                                </div>
                                <button onClick={() => setHelpOpen(false)} className="text-white/80 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                            {/* Quick Tips */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-warning-500" />
                                    Quick Tips
                                </h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                        Use voice input for natural queries
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                        Add classroom context for better responses
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                        Review your query history for insights
                                    </li>
                                </ul>
                            </div>

                            {/* Features */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary-500" />
                                    Key Features
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <Mic className="w-3.5 h-3.5 text-secondary-500" />
                                        <span>Voice Input</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                                        <span>NCERT Aligned</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <MessageCircle className="w-3.5 h-3.5 text-secondary-500" />
                                        <span>AI Responses</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
                                        <span>TLM Design</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                    Need more help? Contact your DIET administrator
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Button */}
                <button
                    onClick={() => setHelpOpen(!helpOpen)}
                    className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 bg-gradient-to-br from-primary-500 to-primary-600 ${helpOpen ? 'rotate-45' : ''}`}
                >
                    {helpOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                </button>
            </div>
        </div>
    )
}
