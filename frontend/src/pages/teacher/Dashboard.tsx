import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Sparkles,
    MessageSquare,
    History,
    BookOpen,
    FileText,
    Mic,
    ChevronRight,
    TrendingUp,
    BarChart3,
    ClipboardList,
    Users,
    Lightbulb,
    Clock,
    ArrowRight,
    Zap
} from 'lucide-react'
import { teacherApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import VoiceAssistant from '../../components/teacher/VoiceAssistant'
import type { TeacherStats, Query } from '../../types'

const modeIcons: Record<string, typeof BookOpen> = {
    explain: BookOpen,
    EXPLAIN: BookOpen,
    assist: Users,
    ASSIST: Users,
    plan: ClipboardList,
    PLAN: ClipboardList,
}

const modeColors: Record<string, string> = {
    explain: '#264092',
    EXPLAIN: '#264092',
    assist: '#EF951E',
    ASSIST: '#EF951E',
    plan: '#22c55e',
    PLAN: '#22c55e',
}

export default function TeacherDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
    const [stats, setStats] = useState<TeacherStats | null>(null)
    const [recentQueries, setRecentQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, queriesData] = await Promise.all([
                    teacherApi.getStats(),
                    teacherApi.getQueries({ page_size: 3 })
                ])
                setStats(statsData)
                setRecentQueries(queriesData.items || [])
            } catch (error) {
                console.error('Failed to load dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays === 1) return 'Yesterday'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const quickLinks = [
        {
            title: 'Ask AI',
            description: 'Get instant help with teaching',
            icon: MessageSquare,
            color: '#264092',
            path: '/teacher/ask-question'
        },
        {
            title: 'History',
            description: 'View past queries',
            icon: History,
            color: '#EF951E',
            path: '/teacher/history'
        },
        {
            title: 'Resources',
            description: 'Learning materials',
            icon: BookOpen,
            color: '#22c55e',
            path: '/teacher/resources'
        },
        {
            title: 'Reflections',
            description: 'Your teaching feedback',
            icon: FileText,
            color: '#8b5cf6',
            path: '/teacher/reflections'
        }
    ]

    const tips = [
        "Try using 'Explain Mode' to simplify complex topics for your students.",
        "Use 'Plan Lesson' to create engaging, time-bound lesson plans.",
        "Add reflections after trying AI suggestions to improve future responses.",
        "Voice input is available for hands-free queries while teaching."
    ]
    const randomTip = tips[Math.floor(Math.random() * tips.length)]

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Welcome Header */}
                <div
                    className="relative rounded-3xl p-6 lg:p-8 text-white overflow-hidden shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: '#EF951E', transform: 'translate(30%, -40%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: '#F69953', transform: 'translate(-30%, 30%)' }} />

                    <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239, 149, 30, 0.9)' }}>
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold">
                                        Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}!
                                    </h1>
                                    <p className="text-white/70 text-sm lg:text-base">Here's your teaching assistant dashboard</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    AI Ready
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowVoiceAssistant(true)}
                            className="group flex items-center gap-3 px-6 py-4 rounded-2xl text-white transition-all duration-300 hover:scale-105 shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                        >
                            <div className="relative">
                                <Mic className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                            </div>
                            <div className="text-left">
                                <span className="block font-semibold">Voice Assistant</span>
                                <span className="block text-xs text-white/80">Tap to speak</span>
                            </div>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Clickable to History */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/teacher/history')}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                <BarChart3 className="w-5 h-5" style={{ color: '#264092' }} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Total Queries</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all ml-auto" />
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">
                            {loading ? '...' : stats?.total_queries || 0}
                        </p>
                    </button>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                                <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Success Rate</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">
                            {loading ? '...' : `${Math.round(stats?.success_rate || 0)}%`}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/teacher/history?mode=EXPLAIN')}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(38, 64, 146, 0.1)' }}>
                                <BookOpen className="w-5 h-5" style={{ color: '#264092' }} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Explain Mode</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all ml-auto" />
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">
                            {loading ? '...' : stats?.queries_by_mode?.explain || 0}
                        </p>
                    </button>

                    <button
                        onClick={() => navigate('/teacher/history?mode=PLAN')}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:shadow-lg hover:border-primary-300 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239, 149, 30, 0.1)' }}>
                                <ClipboardList className="w-5 h-5" style={{ color: '#EF951E' }} />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Plan Mode</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all ml-auto" />
                        </div>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">
                            {loading ? '...' : stats?.queries_by_mode?.plan || 0}
                        </p>
                    </button>
                </div>

                {/* Quick Links */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 text-left hover:scale-[1.02]"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                                    style={{ background: `${link.color}15`, color: link.color }}
                                >
                                    <link.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{link.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                                <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: link.color }}>
                                    Go <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Row: Recent Activity + Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                Recent Activity
                            </h3>
                            <button
                                onClick={() => navigate('/teacher/history')}
                                className="text-sm font-medium flex items-center gap-1 hover:underline"
                                style={{ color: '#264092' }}
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                                </div>
                            ) : recentQueries.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No queries yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Start by asking the AI assistant</p>
                                    <button
                                        onClick={() => navigate('/teacher/ask')}
                                        className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium"
                                        style={{ background: '#264092' }}
                                    >
                                        Ask AI
                                    </button>
                                </div>
                            ) : (
                                recentQueries.map((query) => {
                                    const ModeIcon = modeIcons[query.mode] || MessageSquare
                                    const modeColor = modeColors[query.mode] || '#6b7280'
                                    return (
                                        <button
                                            key={query.id}
                                            onClick={() => navigate('/teacher/history')}
                                            className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${modeColor}15`, color: modeColor }}
                                            >
                                                <ModeIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-800 dark:text-white font-medium line-clamp-1">
                                                    {query.input_text}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTimeAgo(query.created_at)}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Tip of the Day */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Lightbulb className="w-5 h-5 text-amber-600" />
                            </div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Tip of the Day</h3>
                        </div>
                        <p className="text-amber-900/80 dark:text-amber-200/80 text-sm leading-relaxed">
                            {randomTip}
                        </p>
                        <button
                            onClick={() => navigate('/teacher/ask')}
                            className="mt-5 w-full py-3 rounded-xl text-white font-medium transition-all hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
                        >
                            Try it now →
                        </button>
                    </div>
                </div>
            </div>

            {/* Voice Assistant Modal */}
            <VoiceAssistant
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
            />
        </div>
    )
}
