import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Users, ClipboardList, Send, Mic, Loader2, Sparkles, MessageCircle } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { aiApi } from '../../services/api'
import type { QueryMode } from '../../types'
import AIResponse from '../../components/teacher/AIResponse'
import ReflectionForm from '../../components/teacher/ReflectionForm'
import VoiceAssistant from '../../components/teacher/VoiceAssistant'

const modes: { id: QueryMode; icon: typeof BookOpen; label: string; description: string; gradient: string; bgColor: string }[] = [
    { id: 'explain', icon: BookOpen, label: 'Explain', description: 'Learn how to teach concepts effectively', gradient: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'assist', icon: Users, label: 'Assist', description: 'Get real-time classroom help', gradient: 'from-orange-500 to-pink-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'plan', icon: ClipboardList, label: 'Plan', description: 'Create structured lesson plans', gradient: 'from-green-500 to-teal-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
]

export default function TeacherDashboard() {
    const { t, i18n } = useTranslation()
    const { mode, setMode, isLoading, setLoading, currentResponse, setResponse, setError } = useChatStore()
    const [inputText, setInputText] = useState('')
    const [showReflection, setShowReflection] = useState(false)
    const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)

    const currentModeConfig = modes.find(m => m.id === mode) || modes[0]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim() || isLoading) return

        setLoading(true)
        setShowReflection(false)

        try {
            const response = await aiApi.ask({
                mode,
                input_text: inputText,
                language: i18n.language,
            })
            setResponse(response)
            setInputText('')
        } catch (err) {
            setError('Failed to get response. Please try again.')
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Welcome Header with Voice Assistant Button */}
            <div className="card-gradient">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                {t('dashboard.welcome') || 'Welcome, Teacher!'}
                            </h1>
                            <p className="text-white/80 mt-1">
                                {t('dashboard.subtitle') || 'Your AI assistant is ready to help'}
                            </p>
                        </div>
                    </div>

                    {/* Voice Assistant Button */}
                    <button
                        onClick={() => setShowVoiceAssistant(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:scale-105"
                    >
                        <Mic className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Voice Assistant</span>
                    </button>
                </div>
            </div>

            {/* Quick Voice Access Banner */}
            <div
                onClick={() => setShowVoiceAssistant(true)}
                className="card-hover p-4 cursor-pointer flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800"
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                            Ask your doubt instantly
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Tap to speak or type in Hindi, English, or any language
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500 text-white text-sm">
                    <Mic className="w-4 h-4" />
                    Tap to talk
                </div>
            </div>

            {/* Mode Selector */}
            <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
                    Choose Assistance Mode
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modes.map((m) => {
                        const isActive = mode === m.id
                        return (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`
                                    mode-card text-left
                                    ${isActive ? 'active' : ''}
                                `}
                            >
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center
                                    ${isActive
                                        ? `bg-gradient-to-br ${m.gradient} text-white shadow-lg`
                                        : `${m.bgColor} text-gray-600 dark:text-gray-300`}
                                `}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-white'}`}>
                                        {t(`modes.${m.id}.title`) || m.label}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {t(`modes.${m.id}.description`) || m.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Text Input Area */}
            <div className="card p-6">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Or type your question:
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t(`modes.${mode}.placeholder`) || "Type your question here..."}
                            className="input min-h-[120px] pr-14 resize-none text-base"
                            disabled={isLoading}
                        />

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading || !inputText.trim()}
                            className={`
                                absolute bottom-4 right-4
                                p-3 rounded-full transition-all duration-200
                                bg-gradient-to-r ${currentModeConfig.gradient} text-white
                                disabled:opacity-50 disabled:cursor-not-allowed
                                hover:shadow-lg
                            `}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Response */}
            {isLoading && (
                <div className="card p-10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-indigo-500 animate-spin" />
                        </div>
                        <p className="text-gray-500">{t('chat.thinking') || 'Thinking...'}</p>
                    </div>
                </div>
            )}

            {currentResponse && !isLoading && (
                <>
                    <AIResponse response={currentResponse} mode={mode} />

                    {!showReflection && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowReflection(true)}
                                className="btn-secondary"
                            >
                                {t('reflection.title') || 'Add Reflection'}
                            </button>
                        </div>
                    )}

                    {showReflection && (
                        <ReflectionForm
                            queryId={currentResponse.query_id}
                            onComplete={() => setShowReflection(false)}
                        />
                    )}
                </>
            )}

            {/* Voice Assistant Modal */}
            <VoiceAssistant
                isOpen={showVoiceAssistant}
                onClose={() => setShowVoiceAssistant(false)}
            />

            {/* Floating Voice Button */}
            <button
                onClick={() => setShowVoiceAssistant(true)}
                className="fab"
                title="Voice Assistant"
            >
                <Mic className="w-6 h-6" />
            </button>
        </div>
    )
}
