import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppLanguages } from '../../hooks/useAppLanguages'
import NotificationBell from '../NotificationBell'
import OfflineIndicator from '../OfflineIndicator'
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
    Users,
    AlertTriangle,
    BarChart3,
    FileText,
    MessageSquare,
    BookMarked,
    Clipboard,
    ClipboardList,
    Inbox,
    Database,
    Library,
    CheckSquare,
    PenTool,
    Calendar,
    MessagesSquare
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
    const { languages, changeLanguage } = useAppLanguages()
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
                // { icon: Inbox, label: 'Shared Queries', path: `/${basePath}/shared-queries` },
                // { icon: FileText, label: 'Teacher Resources', path: `/${basePath}/teacher-resources` },
                // { icon: MessageSquare, label: 'Request Feedback', path: `/${basePath}/request-feedback` },
                { icon: Clipboard, label: 'Surveys', path: `/${basePath}/surveys` },
                { icon: AlertTriangle, label: 'Interventions', path: `/${basePath}/interventions` },
                // { icon: Sparkles, label: 'Feedback Assistant', path: `/${basePath}/feedback-assist` },
                { icon: BookOpen, label: 'Create Content', path: `/${basePath}/resources/create` },
                { icon: CheckSquare, label: 'Content Approval', path: `/${basePath}/content-approval` },
                { icon: Library, label: 'Content Library', path: `/${basePath}/content-library` },
                { icon: BarChart3, label: 'Reports', path: `/${basePath}/reports` },
            ]
            // ARP-specific items
            if (role === 'arp') {
                navItems.push(
                    { icon: Users, label: 'User Management', path: '/arp/users' },
                    // { icon: BookOpen, label: 'Programs', path: '/arp/programs' },
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
            { icon: MessagesSquare, label: 'Chat', path: '/teacher/chat' },
            { icon: History, label: t('nav.history'), path: '/teacher/history' },
            { icon: BarChart3, label: 'Analytics', path: '/analytics' },
            { icon: BookOpen, label: 'Learning', path: '/learning' },
            { icon: BookMarked, label: 'Resources', path: '/teacher/resources' },
            { icon: PenTool, label: 'My Content', path: '/teacher/my-content' },
            { icon: Library, label: 'Content Library', path: '/teacher/content-library' },
            { icon: ClipboardList, label: 'Surveys', path: '/teacher/feedback-inbox' },
            { icon: Calendar, label: 'CRP Visits', path: '/teacher/my-visits' },
            // { icon: Clipboard, label: 'Reflections', path: '/teacher/reflections' },
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
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden no-print"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full ${sidebarWidth}
                bg-white/80 dark:bg-black/80 backdrop-blur-xl
                border-r border-gray-100/50 dark:border-white/5
                transform transition-all duration-300 ease-in-out
                lg:translate-x-0 no-print
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-100/50 dark:border-white/5`}>
                    <Link to="/" className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#007AFF] text-white shadow-sm"
                        >
                            <Library className="w-5 h-5" />
                        </div>
                        {!sidebarCollapsed && (
                            <div>
                                <span className="text-xl font-medium tracking-tight text-[#1C1C1E] dark:text-white">
                                    Pathshala
                                </span>
                                <p className="text-[10px] uppercase tracking-wider text-[#8E8E93] font-semibold">AI Teaching</p>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-[10px]"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* User info */}
                {!sidebarCollapsed && (
                    <div className="p-6 border-b border-gray-100/50 dark:border-white/5">
                        <div className="flex items-center gap-3 p-4 rounded-[12px] bg-[#F2F2F7] dark:bg-white/5">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#8E8E93]/10 dark:bg-white/10"
                            >
                                <User className="w-5 h-5 text-[#8E8E93]" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-[#1C1C1E] dark:text-white truncate text-sm">
                                    {user?.name || user?.phone}
                                </p>
                                <p className="text-[11px] uppercase tracking-wider text-[#007AFF] font-bold">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {sidebarCollapsed && (
                    <div className="p-3 border-b border-gray-100/50 dark:border-white/5">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto bg-[#F2F2F7] dark:bg-white/5"
                        >
                            <User className="w-5 h-5 text-[#8E8E93]" />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className={`p-4 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]`}>
                    {getNavItems().map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center gap-3 p-3 transition-all duration-200
                                    ${sidebarCollapsed ? 'justify-center rounded-full' : 'rounded-[10px]'}
                                    ${isActive
                                        ? 'nav-item-active'
                                        : 'text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/5'}
                                `}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#007AFF]' : ''}`} />
                                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
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
                    {/* Language selector - from master data */}
                    {!sidebarCollapsed && languages.length > 0 && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <select
                                value={i18n.language}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer"
                                dir="ltr"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.native_name}
                                    </option>
                                ))}
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
                <header className="sticky top-0 z-30 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-b border-gray-100/50 dark:border-white/5 no-print">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-[10px] transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-600 dark:text-white" />
                        </button>

                        <div className="flex-1 lg:flex-none">
                            <h1 className="text-lg font-medium text-[#1C1C1E] dark:text-white text-center lg:text-left lg:hidden">
                                Pathshala
                            </h1>
                        </div>

                        {/* Desktop header content */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10">
                                <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                                <span className="text-sm text-[#1C1C1E] dark:text-[#8E8E93] font-medium">AI Ready</span>
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
            <div className="fixed bottom-6 right-6 z-40 no-print">
                {/* Help Panel */}
                {helpOpen && (
                    <div className="fixed bottom-24 right-6 w-96 max-h-[70vh] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-3xl rounded-[20px] shadow-2xl border border-gray-100/50 dark:border-white/5 z-50 animate-slide-up no-print overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-[#1C1C1E] dark:text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[#007AFF]" />
                                    Support Assistant
                                </h3>
                                <button
                                    onClick={() => setHelpOpen(false)}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-[#8E8E93]" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Tips */}
                                <div className="p-4 bg-[#F2F2F7] dark:bg-white/5 rounded-[12px]">
                                    <h4 className="text-sm font-medium text-[#1C1C1E] dark:text-white mb-3">Quick Tips</h4>
                                    <ul className="space-y-3 text-[13px] text-[#8E8E93]">
                                        <li className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                                            Ask AI for lesson plan ideas
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                                            Add classroom context for better responses
                                        </li>
                                    </ul>
                                </div>

                                {/* Features */}
                                <div>
                                    <h4 className="text-sm font-medium text-[#1C1C1E] dark:text-white mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#007AFF]" />
                                        Capabilities
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: Mic, label: 'Voice Input' },
                                            { icon: BookOpen, label: 'Resources' },
                                            { icon: MessageCircle, label: 'Analytic AI' },
                                            { icon: GraduationCap, label: 'Pedagogy' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-[#1C1C1E] dark:text-[#8E8E93] p-3 bg-[#F2F2F7] dark:bg-white/5 rounded-[10px]">
                                                <item.icon className="w-3.5 h-3.5 text-[#007AFF]" />
                                                <span>{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100/50 dark:border-white/5">
                                    <p className="text-[11px] text-[#8E8E93] text-center">
                                        Need more help? Contact your DIET administrator
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Button */}
                <button
                    onClick={() => setHelpOpen(!helpOpen)}
                    className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 bg-[#007AFF] fixed bottom-6 right-6 z-50 ${helpOpen ? 'rotate-45 bg-[#8E8E93]' : ''}`}
                >
                    {helpOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                </button>
            </div>

            {/* Offline Indicator */}
            <OfflineIndicator />
        </div >
    )
}
