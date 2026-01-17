import { useState, useEffect } from 'react'
import {
    BookOpen,
    MessageSquare,
    Star,
    Calendar,
    ChevronRight,
    Plus,
    Loader2,
    CheckCircle,
    Clock,
    TrendingUp,
    Lightbulb,
    Heart,
    Mic,
    MicOff
} from 'lucide-react'
import { useVoiceInput } from '../../hooks/useVoiceInput'

interface Reflection {
    id: number
    content: string
    type: 'daily' | 'weekly' | 'lesson' | 'challenge'
    created_at: string
    sentiment?: string
}

const REFLECTION_PROMPTS = [
    { id: 'daily', icon: Calendar, label: 'Daily Reflection', description: 'How was your teaching day?', color: '#2563EB' },
    { id: 'lesson', icon: BookOpen, label: 'Lesson Reflection', description: 'What worked in today\'s lesson?', color: '#059669' },
    { id: 'challenge', icon: TrendingUp, label: 'Challenge Faced', description: 'Share a classroom challenge', color: '#DC2626' },
    { id: 'success', icon: Star, label: 'Success Story', description: 'Celebrate a win today!', color: '#F59E0B' },
]

const QUICK_PROMPTS = [
    'What went well in today\'s class?',
    'What would I do differently next time?',
    'Which student showed improvement today?',
    'What new strategy did I try?',
    'What support do I need from my mentor?',
]

export default function Reflections() {
    const [reflections, setReflections] = useState<Reflection[]>([])
    const [loading, setLoading] = useState(false)
    const [showNewReflection, setShowNewReflection] = useState(false)
    const [newReflection, setNewReflection] = useState('')
    const [selectedType, setSelectedType] = useState<string>('daily')
    const [submitting, setSubmitting] = useState(false)

    // Voice input for reflections
    const {
        isListening,
        isSupported: voiceSupported,
        startListening,
        stopListening,
    } = useVoiceInput({
        language: 'en-IN',
        onResult: (text) => {
            setNewReflection(prev => prev + (prev ? ' ' : '') + text)
        }
    })

    const toggleVoiceInput = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    useEffect(() => {
        loadReflections()
    }, [])


    const loadReflections = async () => {
        setLoading(true)
        try {
            // This would fetch from API - using empty for now
            setReflections([])
        } catch (err) {
            console.error('Failed to load reflections:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitReflection = async () => {
        if (!newReflection.trim() || submitting) return

        setSubmitting(true)
        try {
            // TODO: Create proper reflection API endpoint for standalone reflections
            // For now, just simulate success
            await new Promise(resolve => setTimeout(resolve, 500))
            setNewReflection('')
            setShowNewReflection(false)
            // loadReflections()
        } catch (err) {
            console.error('Failed to submit reflection:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Reflections</h1>
                            <p className="text-gray-500">Capture your teaching journey and insights</p>
                        </div>
                        <button
                            onClick={() => setShowNewReflection(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Reflection
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reflections.length}</p>
                                <p className="text-xs text-gray-500">Total Reflections</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                                <p className="text-xs text-gray-500">This Week</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
                                <Star className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                                <p className="text-xs text-gray-500">Streak Days</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">😊</p>
                                <p className="text-xs text-gray-500">Avg Mood</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Reflection Modal */}
                {showNewReflection && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Reflection</h2>

                                {/* Type Selection */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {REFLECTION_PROMPTS.map(prompt => (
                                        <button
                                            key={prompt.id}
                                            onClick={() => setSelectedType(prompt.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedType === prompt.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <prompt.icon className="w-5 h-5 mb-1" style={{ color: prompt.color }} />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{prompt.label}</p>
                                            <p className="text-xs text-gray-500">{prompt.description}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Quick Prompts */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Quick Prompts</p>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_PROMPTS.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setNewReflection(prompt)}
                                                className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Text Input with Voice */}
                                <div className="relative">
                                    <textarea
                                        value={newReflection}
                                        onChange={(e) => setNewReflection(e.target.value)}
                                        placeholder="Write or speak your reflection..."
                                        className="w-full h-32 p-3 pr-12 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={toggleVoiceInput}
                                        disabled={!voiceSupported}
                                        className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${isListening
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : voiceSupported
                                                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-primary-100 hover:text-primary-600'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        title={isListening ? 'Stop recording' : 'Start voice input'}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                </div>
                                {isListening && (
                                    <p className="text-xs text-red-500 mt-1 animate-pulse">🔴 Listening... speak now</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setShowNewReflection(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitReflection}
                                        disabled={!newReflection.trim() || submitting}
                                        className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Save Reflection
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reflections List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Reflections</h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : reflections.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                                <Lightbulb className="w-8 h-8 text-primary-500" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start Reflecting</h3>
                            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                                Capture your teaching experiences and insights. Regular reflection helps you grow as an educator.
                            </p>
                            <button
                                onClick={() => setShowNewReflection(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Write Your First Reflection
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {reflections.map(reflection => (
                                <div key={reflection.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 flex-shrink-0">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-900 dark:text-white line-clamp-2">{reflection.content}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(reflection.created_at)}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
