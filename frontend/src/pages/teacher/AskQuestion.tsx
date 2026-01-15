import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Send,
    Loader2,
    Sparkles,
    ChevronRight,
    Lightbulb,
    Clock,
    Users,
    Upload,
    X,
    Star,
    AlertCircle,
    Zap,
    Mic
} from 'lucide-react'
import { aiApi } from '../../services/api'

type QueryMode = 'explain' | 'assist' | 'plan'
type UrgencyLevel = 'immediate' | 'today' | 'this_week'

interface DisplayPrompt {
    icon: any
    text: string
    mode: QueryMode
}

const queryModes = [
    { id: 'explain' as QueryMode, icon: Lightbulb, label: 'Explain Topic', description: 'Get clear explanations', color: '#2563EB' },
    { id: 'assist' as QueryMode, icon: Users, label: 'Classroom Help', description: 'Handle challenges', color: '#059669' },
    { id: 'plan' as QueryMode, icon: Clock, label: 'Plan Lesson', description: 'Create lesson plans', color: '#7c3aed' },
]

const defaultQuickPrompts: DisplayPrompt[] = [
    { icon: Lightbulb, text: 'Explain photosynthesis for Class 6', mode: 'explain' },
    { icon: Clock, text: 'Create a 40-min lesson plan for Fractions', mode: 'plan' },
    { icon: Users, text: 'How to handle a noisy classroom?', mode: 'assist' },
    { icon: Star, text: 'Make learning fun for Class 5', mode: 'explain' },
]

export default function AskQuestion() {
    const navigate = useNavigate()

    const [query, setQuery] = useState('')
    const [mode, setMode] = useState<QueryMode>('explain')
    const [urgency, setUrgency] = useState<UrgencyLevel>('today')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Context fields
    const [grade, setGrade] = useState<number | undefined>()
    const [subject, setSubject] = useState('')
    const [classSize, setClassSize] = useState<number | undefined>()

    // File upload
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Quick prompts
    const quickPrompts = defaultQuickPrompts

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFilePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const clearFile = () => {
        setFilePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim() || loading) return

        setLoading(true)
        setError('')

        try {
            const response = await aiApi.ask({
                input_text: query.trim(),
                mode,
                grade,
                subject: subject || undefined,
                language: 'en',
            })

            // Navigate to response page with the response data
            navigate('/teacher/ai-response', {
                state: {
                    response: response,
                    originalQuery: query,
                    mode,
                    grade,
                    subject
                }
            })
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to get AI response. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickPrompt = (prompt: DisplayPrompt) => {
        setQuery(prompt.text)
        setMode(prompt.mode)
        textareaRef.current?.focus()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 shadow-lg">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Ask AI Assistant
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Get instant help with teaching, lesson planning, and classroom management
                    </p>
                </div>

                {/* Mode Selection */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {queryModes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${mode === m.id
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${mode === m.id ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                style={{ background: mode === m.id ? m.color : 'transparent' }}
                            >
                                <m.icon className="w-5 h-5" />
                            </div>
                            <p className={`font-medium text-sm ${mode === m.id ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                                {m.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                        </button>
                    ))}
                </div>

                {/* Main Query Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                    <form onSubmit={handleSubmit}>
                        {/* Query Input */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <textarea
                                ref={textareaRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Type your question here... e.g., 'How do I explain the water cycle to Class 5 students?'"
                                className="w-full min-h-[120px] resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg"
                                disabled={loading}
                            />

                            {/* Character count */}
                            <div className="flex items-center justify-between mt-2">
                                <span className={`text-xs ${query.length > 1000 ? 'text-accent-500' : 'text-gray-400'}`}>
                                    {query.length}/1000 characters
                                </span>
                            </div>
                        </div>

                        {/* File Preview */}
                        {filePreview && (
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="relative inline-block">
                                    <img src={filePreview} alt="Attachment" className="max-h-32 rounded-lg" />
                                    <button
                                        type="button"
                                        onClick={clearFile}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center hover:bg-accent-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Context Options */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Context (Optional)</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Grade</label>
                                    <select
                                        value={grade || ''}
                                        onChange={(e) => setGrade(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Select</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>Class {g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Select</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Science">Science</option>
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Social Studies">Social Studies</option>
                                        <option value="EVS">EVS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Class Size</label>
                                    <input
                                        type="number"
                                        value={classSize || ''}
                                        onChange={(e) => setClassSize(e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="e.g., 40"
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Urgency</label>
                                    <select
                                        value={urgency}
                                        onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="immediate">🔴 Immediate</option>
                                        <option value="today">🟡 Today</option>
                                        <option value="this_week">🟢 This Week</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border-b border-accent-200 dark:border-accent-800">
                                <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Voice Input Placeholder */}
                                <button
                                    type="button"
                                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Voice input (coming soon)"
                                    disabled
                                >
                                    <Mic className="w-5 h-5" />
                                </button>

                                {/* File Upload */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    title="Attach image"
                                >
                                    <Upload className="w-5 h-5" />
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={!query.trim() || loading}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Get Answer
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick Prompts */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-warning-500" />
                        Quick Prompts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleQuickPrompt(prompt)}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-md transition-all duration-200 text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 group-hover:bg-primary-100 transition-colors">
                                    <prompt.icon className="w-5 h-5" />
                                </div>
                                <span className="flex-1 text-gray-700 dark:text-gray-300 text-sm">
                                    {prompt.text}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
