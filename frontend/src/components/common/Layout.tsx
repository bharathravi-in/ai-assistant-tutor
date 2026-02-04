import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NotificationBell from '../NotificationBell'
import OfflineIndicator from '../OfflineIndicator'
import UserProfileMenu from './UserProfileMenu'
import {
    Home,
    History,
    Menu,
    X,
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
    Library,
    CheckSquare,
    PenTool,
    Calendar,
    MessagesSquare,
    Clipboard,
    ClipboardList,
    Globe,
    Moon,
    Sun
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useAppLanguages } from '../../hooks/useAppLanguages'

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const { t, i18n } = useTranslation()
    const location = useLocation()
    const { user } = useAuthStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)

    const { languages, changeLanguage } = useAppLanguages()
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'))

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

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', newMode ? 'dark' : 'light')
    }

    const getNavItems = () => {
        const role = user?.role?.toLowerCase()

        if (role === 'superadmin') {
            return [
                { icon: Home, label: 'Dashboard', path: '/superadmin' },
                { icon: Building2, label: 'Organizations', path: '/superadmin/organizations' },
                { icon: CreditCard, label: 'Plans', path: '/superadmin/plans' },
                { icon: Sparkles, label: 'AI Settings', path: '/superadmin/ai-settings' },
                // { icon: MessageSquare, label: 'Direct Chat', path: '/messages' },
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
                { icon: BookOpen, label: 'Create Resource', path: '/admin/resources/create' },
                // { icon: MessageSquare, label: 'Direct Chat', path: '/messages' },
                // { icon: Settings, label: 'Settings', path: '/admin/settings' },
            ]
        }

        if (role === 'crp' || role === 'arp') {
            const basePath = role
            const navItems = [
                { icon: Home, label: 'Dashboard', path: `/${basePath}` },
                { icon: Users, label: 'My Teachers', path: `/${basePath}/teachers` },
                { icon: Clipboard, label: 'Surveys', path: `/${basePath}/surveys` },
                { icon: AlertTriangle, label: 'Interventions', path: `/${basePath}/interventions` },
                { icon: BookOpen, label: 'Create Content', path: `/${basePath}/resources/create` },
                { icon: CheckSquare, label: 'Content Approval', path: `/${basePath}/content-approval` },
                { icon: Library, label: 'Content Library', path: `/${basePath}/content-library` },
                { icon: BarChart3, label: 'Reports', path: `/${basePath}/reports` },
            ]
            if (role === 'arp') {
                navItems.push(
                    { icon: Users, label: 'User Management', path: '/arp/users' },
                    { icon: BarChart3, label: 'Gap Analysis', path: '/arp/gap-analysis' }
                )
            }
            navItems.push(
                { icon: MessageSquare, label: 'Connect', path: '/messages' },
                // { icon: Settings, label: 'Settings', path: `/${basePath}/settings` }
            )
            return navItems
        }

        return [
            { icon: Home, label: t('nav.home'), path: '/teacher' },
            { icon: MessageSquare, label: 'Ask AI', path: '/teacher/ask-question' },
            { icon: MessagesSquare, label: 'Chat', path: '/teacher/chat' },
            { icon: History, label: t('nav.history'), path: '/teacher/history' },
            { icon: BarChart3, label: 'Analytics', path: '/analytics' },
            { icon: PenTool, label: 'My Creations', path: '/teacher/my-content' },
            { icon: Library, label: 'Browse Library', path: '/content/browse' },
            { icon: ClipboardList, label: 'Surveys', path: '/teacher/feedback-inbox' },
            { icon: Calendar, label: 'CRP Visits', path: '/teacher/my-visits' },
            { icon: MessageSquare, label: 'Connect with CRP', path: '/messages' },
            // { icon: Settings, label: 'Settings', path: '/teacher/settings' }
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
                bg-[#F8F9FB] dark:bg-[#1C1C1E]
                border-r border-gray-200 dark:border-white/10
                transform transition-all duration-300 ease-in-out
                lg:translate-x-0 no-print
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className={`flex flex-col h-full`}>
                    {/* Logo */}
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} p-6 border-b border-gray-100/50 dark:border-white/5`}>
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#007AFF] text-white shadow-sm">
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

                    {/* Navigation */}
                    <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
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
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
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
                </div>
            </aside>

            {/* Main content */}
            <div className={`${marginLeft} transition-all duration-300 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-gray-900`}>
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#1C1C1E] backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm no-print">
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
                            {/* <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E5E5EA] dark:bg-white/10">
                                <div className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                                <span className="text-sm text-[#1C1C1E] dark:text-[#8E8E93] font-medium">AI Ready</span>
                            </div> */}

                            {/* <div className="w-px h-8 bg-gray-100 dark:bg-white/10 mx-1" /> */}

                            {/* New Header Settings */}
                            {/* <div className="flex items-center gap-1">
                                
                            </div> */}

                            {/* <div className="w-px h-8 bg-gray-100 dark:bg-white/10 mx-1" /> */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors"
                                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                            </button>

                            <div className="relative group p-2">
                                <Globe className="w-5 h-5 text-emerald-500 cursor-pointer" />
                                <select
                                    value={i18n.language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    title="Change Language"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.code} value={lang.code} className="dark:bg-gray-800">
                                            {lang.native_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <NotificationBell />

                            <button
                                onClick={() => setHelpOpen(!helpOpen)}
                                className={`p-2 rounded-lg transition-colors ${helpOpen ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                                title="Support & Help"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>

                            {/* <div className="w-px h-8 bg-gray-100 dark:bg-white/10 mx-2" /> */}
                            <UserProfileMenu />
                        </div>
                        <div className="w-10 lg:hidden" />
                    </div>

                    {/* Help Dropdown Panel */}
                    {helpOpen && (
                        <div className="absolute top-full right-20 mt-2 w-96 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-medium text-[#1C1C1E] dark:text-white flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-[#007AFF]" />
                                        Support Assistant
                                    </h3>
                                    <button onClick={() => setHelpOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-4 h-4 text-[#8E8E93]" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-[#F2F2F7] dark:bg-white/5 rounded-[12px]">
                                        <h4 className="text-sm font-medium text-[#1C1C1E] dark:text-white mb-3">Quick Tips</h4>
                                        <ul className="space-y-3 text-[13px] text-[#8E8E93]">
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                                                Use Voice Input (Mic icon) for hands-free queries.
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                                                Ask AI to simplify complex topics for students.
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                                                Check 'Learning' for teacher-specific training.
                                            </li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-[#1C1C1E] dark:text-white mb-4 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-[#007AFF]" />
                                            Key Features
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { icon: Mic, label: 'Voice Help' },
                                                { icon: BookOpen, label: 'Lesson Units' },
                                                { icon: MessageCircle, label: '24/7 AI Chat' },
                                                { icon: GraduationCap, label: 'Pedagogy' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs text-[#1C1C1E] dark:text-[#8E8E93] p-3 bg-[#F2F2F7] dark:bg-white/5 rounded-[10px]">
                                                    <item.icon className="w-3.5 h-3.5 text-[#007AFF]" />
                                                    <span>{item.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-[11px] text-[#8E8E93] text-center font-medium">
                                            Educational Support: +91 000-000-0000<br />
                                            Technical Issues: support@pathshala.edu
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto relative">
                    {children}
                </main>
            </div>

            <OfflineIndicator />
        </div>
    )
}
