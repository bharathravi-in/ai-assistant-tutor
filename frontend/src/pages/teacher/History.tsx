import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    History,
    Search,
    Lightbulb,
    Users,
    Clock,
    MessageSquare,
    ExternalLink,
    Bot,
    MessageCircle
} from 'lucide-react'
import { teacherApi } from '../../services/api'
import * as chatService from '../../services/chatService'
import { Conversation } from '../../types/chat'

interface Query {
    id: number
    mode: string
    input_text: string
    ai_response: string
    structured?: any
    created_at: string
}

const modeIcons: Record<string, typeof Lightbulb> = {
    EXPLAIN: Lightbulb,
    ASSIST: Users,
    PLAN: Clock,
    ASK: MessageSquare,
}

const modeColors: Record<string, string> = {
    EXPLAIN: '#2563EB',
    ASSIST: '#059669',
    PLAN: '#2563EB',
    ASK: '#EA580C',
}

const modeLabels: Record<string, string> = {
    EXPLAIN: 'Explain',
    ASSIST: 'Assist',
    PLAN: 'Plan',
    ASK: 'Ask',
}

type TabType = 'ask-ai' | 'chats'

export default function TeacherHistory() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [queries, setQueries] = useState<Query[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'ask-ai')
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterMode, setFilterMode] = useState<string | null>(searchParams.get('mode'))

    useEffect(() => {
        setSearchParams({ tab: activeTab }, { replace: true })
        if (activeTab === 'ask-ai') {
            loadQueries()
        } else {
            loadChats()
        }
    }, [activeTab])

    const loadQueries = async () => {
        setLoading(true)
        try {
            const data = await teacherApi.getQueries({ page_size: 50 })
            setQueries((data.items || []).map((item: any) => ({
                id: item.id,
                mode: item.mode?.toUpperCase() || 'EXPLAIN',
                input_text: item.input_text || '',
                ai_response: item.ai_response || '',
                structured: item.structured,
                created_at: item.created_at
            })))
        } catch (error) {
            console.error('Failed to load history:', error)
            setQueries([])
        } finally {
            setLoading(false)
        }
    }

    const loadChats = async () => {
        setLoading(true)
        try {
            const data = await chatService.listConversations({ page_size: 50 })
            setConversations(data.conversations || [])
        } catch (error) {
            console.error('Failed to load chat history:', error)
            setConversations([])
        } finally {
            setLoading(false)
        }
    }

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.input_text.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesMode = !filterMode || q.mode === filterMode
        return matchesSearch && matchesMode
    })

    const filteredChats = conversations.filter(c =>
        (c.title || 'Untitled Chat').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.topic || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const handleQueryClick = (query: Query) => {
        navigate(`/teacher/ask-question?historyId=${query.id}`)
    }

    const handleChatClick = (conversation: Conversation) => {
        navigate(`/teacher/chat/${conversation.id}`)
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin" style={{ borderTopColor: '#2563EB' }} />
                    <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8 bg-[#F8F9FB] dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <History className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your previous interactions
                                </p>
                            </div>
                        </div>

                        {/* Custom Tab Switcher */}
                        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-full md:w-auto">
                            <button
                                onClick={() => setActiveTab('ask-ai')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'ask-ai'
                                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    ASK AI
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('chats')}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'chats'
                                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    CHATS
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search your ${activeTab === 'ask-ai' ? 'queries' : 'chats'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                            />
                        </div>

                        {/* Mode Filters (Only for Ask AI) */}
                        {activeTab === 'ask-ai' && (
                            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                {['EXPLAIN', 'ASSIST', 'PLAN'].map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setFilterMode(filterMode === mode ? null : mode)}
                                        className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterMode === mode ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                                            }`}
                                        style={filterMode === mode ? { background: modeColors[mode] } : {}}
                                    >
                                        {modeLabels[mode]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'ask-ai' ? (
                    filteredQueries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredQueries.map((query) => {
                                const ModeIcon = modeIcons[query.mode] || MessageSquare
                                return (
                                    <button
                                        key={query.id}
                                        onClick={() => handleQueryClick(query)}
                                        className="group text-left bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ background: `${modeColors[query.mode]}15`, color: modeColors[query.mode] }}
                                            >
                                                <ModeIcon className="w-5 h-5" />
                                            </div>
                                            <span
                                                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                                                style={{ background: `${modeColors[query.mode]}15`, color: modeColors[query.mode] }}
                                            >
                                                {modeLabels[query.mode]}
                                            </span>
                                        </div>

                                        <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {query.input_text}
                                        </h3>

                                        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{formatDate(query.created_at)} • {formatTime(query.created_at)}</span>
                                            </div>
                                            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            title="No queries found"
                            description="Start by asking the AI a question."
                            actionText="Ask AI Now"
                            onAction={() => navigate('/teacher/ask-question')}
                        />
                    )
                ) : (
                    filteredChats.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredChats.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => handleChatClick(conv)}
                                    className="group text-left bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/30 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        {conv.topic && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                                {conv.topic}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {conv.title || 'Untitled Conversation'}
                                    </h3>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-4 italic">
                                        Grade {conv.grade} • {conv.subject}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{conv.last_message_at ? formatDate(conv.last_message_at) : formatDate(conv.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="font-bold">Resume</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No chats yet"
                            description="Have a multi-turn conversation with your AI Tutor."
                            actionText="Start Chatting"
                            onAction={() => navigate('/teacher/chat')}
                        />
                    )
                )}
            </div>
        </div>
    )
}

function EmptyState({ title, description, actionText, onAction }: { title: string, description: string, actionText: string, onAction: () => void }) {
    return (
        <div className="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {description}
            </p>
            <button
                onClick={onAction}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
                {actionText}
            </button>
        </div>
    )
}

