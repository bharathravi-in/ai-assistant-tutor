import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

const getModeColor = (mode: string) => {
    const m = mode.toLowerCase();
    if (m === 'explain') return 'text-[#007AFF]';
    if (m === 'assist') return 'text-[#FF9500]';
    if (m === 'plan') return 'text-[#34C759]';
    return 'text-[#8E8E93]';
};

const getModeBg = (mode: string) => {
    const m = mode.toLowerCase();
    if (m === 'explain') return 'bg-[#007AFF]/10';
    if (m === 'assist') return 'bg-[#FF9500]/10';
    if (m === 'plan') return 'bg-[#34C759]/10';
    return 'bg-[#F2F2F7]';
};

export default function TeacherDashboard() {
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
            color: '#007AFF',
            path: '/teacher/ask-question'
        },
        {
            title: 'History',
            description: 'View past queries',
            icon: History,
            color: '#FF9500',
            path: '/teacher/history'
        },
        {
            title: 'Resources',
            description: 'Learning materials',
            icon: BookOpen,
            color: '#34C759',
            path: '/teacher/resources'
        },
        {
            title: 'Surveys',
            description: 'Surveys List',
            icon: FileText,
            color: '#AF52DE',
            path: '/teacher/feedback-inbox'
        }
    ]

    const tips = [
        "Try using 'Explain Mode' to simplify complex topics for your   students.",
        "Use 'Plan Lesson' to create engaging, time-bound lesson plans.",
        "Add reflections after trying AI suggestions to improve future responses.",
        "Voice input is available for hands-free queries while teaching."
    ]
    const randomTip = tips[Math.floor(Math.random() * tips.length)]

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Welcome Header */}
                <div className="card-highlight p-6 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#007AFF] to-[#0051FF] border-none">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full -mr-40 -mt-40" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#FF9500]/20 blur-[80px] rounded-full -ml-30 -mb-30" />

                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[22px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-4xl font-black text-white leading-tight">
                                    Welcome, {user?.name?.split(' ')[0] || 'Teacher'}!
                                </h1>
                                <p className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
                                    Your personal AI teaching ensemble is active
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowVoiceAssistant(true)}
                            className="group flex items-center gap-4 px-8 py-4 rounded-[22px] bg-white text-[#007AFF] font-black text-sm transition-all hover:scale-105 shadow-xl hover:shadow-white/10 active:scale-[0.98]"
                        >
                            <Mic className="w-5 h-5 group-hover:animate-pulse" />
                            Voice Assistant
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <button
                        onClick={() => navigate('/teacher/history')}
                        className="card-highlight p-6 text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-[#007AFF]" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#AEAEB2] group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Total Queries</p>
                        <p className="text-3xl font-black text-[#1C1C1E] dark:text-white">
                            {loading ? '...' : stats?.total_queries || 0}
                        </p>
                    </button>

                    <div className="card-highlight p-6">
                        <div className="w-10 h-10 rounded-xl bg-[#34C759]/10 flex items-center justify-center mb-4">
                            <TrendingUp className="w-5 h-5 text-[#34C759]" />
                        </div>
                        <p className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Success Rate</p>
                        <p className="text-3xl font-black text-[#34C759]">
                            {loading ? '...' : `${Math.round(stats?.success_rate || 0)}%`}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/teacher/history?mode=EXPLAIN')}
                        className="card-highlight p-6 text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-[#007AFF]" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#AEAEB2] group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Explain Mode</p>
                        <p className="text-3xl font-black text-[#1C1C1E] dark:text-white">
                            {loading ? '...' : stats?.queries_by_mode?.explain || 0}
                        </p>
                    </button>

                    <button
                        onClick={() => navigate('/teacher/history?mode=PLAN')}
                        className="card-highlight p-6 text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#34C759]/10 flex items-center justify-center">
                                <ClipboardList className="w-5 h-5 text-[#34C759]" />
                            </div>
                            <ArrowRight className="w-4 h-4 text-[#AEAEB2] group-hover:text-[#34C759] group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm font-bold text-[#8E8E93] uppercase tracking-widest mb-1">Plan Mode</p>
                        <p className="text-3xl font-black text-[#1C1C1E] dark:text-white">
                            {loading ? '...' : stats?.queries_by_mode?.plan || 0}
                        </p>
                    </button>
                </div>

                {/* Quick Links */}
                <div>
                    <h2 className="text-sm font-black text-[#8E8E93] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <Zap className="w-4 h-4 text-[#FF9500]" />
                        Priority Actions
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="group card p-6 text-left active:scale-[0.98] transition-all"
                            >
                                <div
                                    className="w-12 h-12 rounded-[18px] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm"
                                    style={{ background: `${link.color}15`, color: link.color }}
                                >
                                    <link.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-[#1C1C1E] dark:text-white mb-2">{link.title}</h3>
                                <p className="text-[11px] font-medium text-[#8E8E93] leading-relaxed mb-4">{link.description}</p>
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: link.color }}>
                                    Launch <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Row: Recent Activity + Tips */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 card overflow-hidden">
                        <div className="p-6 border-b border-[#E5E5EA] dark:border-white/5 flex items-center justify-between bg-[#F2F2F7]/30 dark:bg-white/5">
                            <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <Clock className="w-4 h-4 text-[#8E8E93]" />
                                Recent Activity
                            </h3>
                            <button
                                onClick={() => navigate('/teacher/history')}
                                className="text-[10px] font-black text-[#007AFF] uppercase tracking-widest hover:underline"
                            >
                                View Global Log
                            </button>
                        </div>
                        <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                            {loading ? (
                                <div className="p-20 text-center animate-pulse text-[#AEAEB2]">Optimizing history...</div>
                            ) : recentQueries.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 rounded-full bg-[#F2F2F7] dark:bg-white/5 flex items-center justify-center mx-auto mb-6">
                                        <MessageSquare className="w-8 h-8 text-[#AEAEB2]" />
                                    </div>
                                    <p className="text-[#1C1C1E] dark:text-white font-bold mb-1">Silence is Golden</p>
                                    <p className="text-xs text-[#8E8E93]">No academic inquiries recorded yet</p>
                                </div>
                            ) : (
                                recentQueries.map((query) => {
                                    const ModeIcon = modeIcons[query.mode] || MessageSquare
                                    return (
                                        <button
                                            key={query.id}
                                            onClick={() => navigate('/teacher/history')}
                                            className="w-full p-6 flex items-center gap-5 hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-all group text-left"
                                        >
                                            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${getModeBg(query.mode)} ${getModeColor(query.mode)}`}>
                                                <ModeIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[#1C1C1E] dark:text-white font-bold text-sm mb-1 line-clamp-1">
                                                    {query.input_text}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${getModeColor(query.mode)}`}>
                                                        {query.mode}
                                                    </span>
                                                    <span className="text-[10px] text-[#AEAEB2] font-bold uppercase tracking-widest">
                                                        {formatTimeAgo(query.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-[#AEAEB2] group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Tip of the Day */}
                    <div className="bg-[#FF9500]/5 dark:bg-[#FF9500]/10 rounded-[32px] border border-[#FF9500]/10 p-8 flex flex-col justify-between h-full group hover:border-[#FF9500]/30 transition-all">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#FF9500]/10 flex items-center justify-center">
                                    <Lightbulb className="w-5 h-5 text-[#FF9500]" />
                                </div>
                                <h3 className="text-sm font-bold text-[#FF9500] uppercase tracking-widest">Ensemble Tip</h3>
                            </div>
                            <p className="text-[#1C1C1E] dark:text-white text-base font-medium leading-relaxed italic">
                                "{randomTip}"
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/teacher/ask')}
                            className="mt-10 w-full py-4 rounded-[18px] bg-[#FF9500] text-white font-black text-sm transition-all hover:scale-105 shadow-lg shadow-[#FF9500]/20 active:scale-[0.98]"
                        >
                            Try Now
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
