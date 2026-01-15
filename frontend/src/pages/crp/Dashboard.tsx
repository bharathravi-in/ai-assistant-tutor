import { useState, useEffect } from 'react'
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
    MessageSquare,
    User,
    ChevronRight,
    Loader2,
    X,
    Sparkles,
    Users,
    TrendingUp
} from 'lucide-react'
import { crpApi } from '../../services/api'
import type { Query } from '../../types'
import VoiceRecorder from '../../components/common/VoiceRecorder'

export default function CRPDashboard() {
    const [queries, setQueries] = useState<Query[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
    const [stats, setStats] = useState<{
        pending_reviews: number
        queries_today: number
    } | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [isVoiceMode, setIsVoiceMode] = useState(false)
    const [voiceUrl, setVoiceUrl] = useState<string | null>(null)
    const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
    const [filterMode, setFilterMode] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [queriesData, statsData] = await Promise.all([
                crpApi.getQueries({ page_size: 20 }),
                crpApi.getStats()
            ])
            setQueries(queriesData.items)
            setStats(statsData)
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRespond = async (isOverride: boolean = false) => {
        if (!selectedQuery) return

        const obsNotes = (document.getElementById('obs-notes') as HTMLTextAreaElement)?.value || ''
        const responseText = (document.getElementById('crp-response') as HTMLTextAreaElement)?.value || ''

        setSubmitting(true)
        try {
            await crpApi.respond({
                query_id: selectedQuery.id,
                response_text: responseText || voiceTranscript || '',
                observation_notes: obsNotes,
                voice_note_url: voiceUrl || undefined,
                voice_note_transcript: voiceTranscript || undefined,
                tag: isOverride ? 'best_practice' : 'effective',
                overrides_ai: isOverride
            })
            setSelectedQuery(null)
            loadData()
        } catch (err) {
            console.error('Failed to respond:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'explain': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            case 'assist': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
            case 'plan': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const filteredQueries = queries.filter(q => {
        if (filterMode === 'all') return true
        if (filterMode === 'pending') return q.requires_crp_review
        if (filterMode === 'resolved') return q.is_resolved
        return q.mode === filterMode
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 animate-spin" />
                    <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Hero Header - Karmayogi Style */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ background: '#1e3a5f' }}>
                <div className="relative p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#e67e22' }}>
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                    CRP Dashboard
                                </h1>
                                <p className="text-white/70 mt-1">
                                    Support teachers with personalized guidance
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-white text-sm">
                                <span className="block text-white/60 text-xs">Today's Date</span>
                                <span className="font-semibold">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Clean Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#dc3545' }}>
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">
                                {stats?.pending_reviews || 0}
                            </p>
                            <p className="text-sm text-gray-500">Pending Reviews</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#1e3a5f' }}>
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">
                                {stats?.queries_today || 0}
                            </p>
                            <p className="text-sm text-gray-500">Queries Today</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#28a745' }}>
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">
                                {queries.filter(q => q.is_resolved).length}
                            </p>
                            <p className="text-sm text-gray-500">Resolved</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Query List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                Teacher Queries
                            </h2>
                            <p className="text-xs text-gray-500">{queries.length} total queries</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['all', 'pending', 'explain', 'assist', 'plan'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterMode === mode
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredQueries.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No queries found</p>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredQueries.map((query) => (
                            <div
                                key={query.id}
                                onClick={() => setSelectedQuery(query)}
                                className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 dark:text-white truncate pr-4 group-hover:text-primary-600 transition-colors">
                                                {query.input_text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${getModeColor(query.mode)}`}>
                                                    {query.mode}
                                                </span>
                                                {query.grade && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                                        Grade {query.grade}
                                                    </span>
                                                )}
                                                {query.is_multigrade && (
                                                    <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-200 dark:border-purple-800 font-medium">
                                                        Multigrade
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(query.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {query.requires_crp_review && (
                                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    Needs Review
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Query Detail Modal */}
            {selectedQuery && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-xl">
                        {/* Modal Header */}
                        <div className="p-6" style={{ background: '#1e3a5f' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Query Details</h3>
                                        <p className="text-white/70 text-sm">Review and respond to teacher</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedQuery(null)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-5">
                            {/* Question */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teacher's Question</label>
                                <p className="text-gray-800 dark:text-white mt-2 font-medium">{selectedQuery.input_text}</p>
                            </div>

                            {/* Context Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Grade', value: selectedQuery.grade || 'N/A' },
                                    { label: 'Subject', value: selectedQuery.subject || 'N/A' },
                                    { label: 'Class Type', value: selectedQuery.is_multigrade ? 'Multigrade' : 'Single' },
                                    { label: 'Class Size', value: selectedQuery.class_size || 'N/A' }
                                ].map(item => (
                                    <div key={item.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700 text-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* AI Response */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> AI Response
                                </label>
                                <div className="mt-2 p-4 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-primary-100 dark:border-gray-700 max-h-[150px] overflow-y-auto custom-scrollbar">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {selectedQuery.ai_response || 'No AI response yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Observation Notes */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Observation Notes</label>
                                <textarea
                                    id="obs-notes"
                                    placeholder="Add notes from your classroom observation..."
                                    className="w-full mt-2 p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Response Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Guidance</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsVoiceMode(!isVoiceMode)}
                                        className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                                    >
                                        {isVoiceMode ? '✏️ Switch to Text' : '🎤 Record Voice'}
                                    </button>
                                </div>

                                {isVoiceMode ? (
                                    <div className="space-y-3">
                                        <VoiceRecorder
                                            purpose="response"
                                            onUploadComplete={(url, transcript) => {
                                                setVoiceUrl(url)
                                                setVoiceTranscript(transcript)
                                                const area = document.getElementById('crp-response') as HTMLTextAreaElement
                                                if (area && !area.value) area.value = transcript
                                            }}
                                        />
                                        {voiceTranscript && (
                                            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                                                <span className="text-[10px] font-bold uppercase text-primary-600">Transcript</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">"{voiceTranscript}"</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        id="crp-response"
                                        placeholder="Provide specific, actionable guidance..."
                                        className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                        rows={4}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => handleRespond(true)}
                                disabled={submitting}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '⭐ Mark as Best Practice'}
                            </button>
                            <button
                                onClick={() => handleRespond(false)}
                                disabled={submitting}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '📤 Send Guidance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
