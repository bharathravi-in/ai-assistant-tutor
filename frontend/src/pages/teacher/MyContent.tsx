import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    Clock,
    CheckCircle,
    XCircle,
    Send,
    Eye,
    Edit,
    Trash2,
    Loader2,
    Filter,
    Globe,
    BookOpen,
    Zap,
    BookMarked,
    Bot,
    TrendingUp,
    Heart,
    Calendar,
    ArrowRight
} from 'lucide-react'
import { contentApi } from '../../services/api'

// Utility to strip markdown and HTML formatting for clean display
const stripMarkdown = (text: string): string => {
    if (!text) return ''
    return text
        .replace(/<[^>]*>/g, '')             // HTML tags
        .replace(/#{1,6}\s?/g, '')           // Headers
        .replace(/\*\*([^*]+)\*\*/g, '$1')   // Bold
        .replace(/\*([^*]+)\*/g, '$1')       // Italic
        .replace(/__([^_]+)__/g, '$1')       // Bold alternate
        .replace(/_([^_]+)_/g, '$1')         // Italic alternate
        .replace(/~~([^~]+)~~/g, '$1')       // Strikethrough
        .replace(/`([^`]+)`/g, '$1')         // Inline code
        .replace(/```[\s\S]*?```/g, '')      // Code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
        .replace(/^[-*+]\s/gm, '')           // Bullet lists
        .replace(/^\d+\.\s/gm, '')           // Numbered lists
        .replace(/^>\s?/gm, '')              // Blockquotes
        .replace(/\|/g, ' ')                 // Table pipes
        .replace(/---+/g, '')                // Horizontal rules
        .replace(/\n{2,}/g, ' ')             // Multiple newlines
        .replace(/\n/g, ' ')                 // Single newlines
        .trim()
}

// Content type icons and colors
const contentTypeConfig: Record<string, { icon: any; label: string; gradient: string; lightBg: string; textColor: string }> = {
    lesson_plan: { icon: FileText, label: 'Lesson Plan', gradient: 'from-blue-500 to-indigo-600', lightBg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
    explanation: { icon: BookOpen, label: 'Topic Explanation', gradient: 'from-purple-500 to-pink-600', lightBg: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
    activity: { icon: Activity, label: 'Activity', gradient: 'from-green-500 to-emerald-600', lightBg: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
    tlm: { icon: Palette, label: 'TLM', gradient: 'from-orange-500 to-amber-600', lightBg: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400' },
    quick_reference: { icon: Zap, label: 'Quick Reference', gradient: 'from-yellow-500 to-orange-500', lightBg: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-600 dark:text-yellow-400' },
    assessment: { icon: ClipboardCheck, label: 'Assessment', gradient: 'from-red-500 to-rose-600', lightBg: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400' },
    worksheet: { icon: FileSpreadsheet, label: 'Worksheet', gradient: 'from-teal-500 to-cyan-600', lightBg: 'bg-teal-50 dark:bg-teal-900/20', textColor: 'text-teal-600 dark:text-teal-400' },
    study_guide: { icon: BookMarked, label: 'Study Guide', gradient: 'from-indigo-500 to-violet-600', lightBg: 'bg-indigo-50 dark:bg-indigo-900/20', textColor: 'text-indigo-600 dark:text-indigo-400' },
}

// Status badges with enhanced styling
const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string; text: string; border: string }> = {
    draft: {
        label: 'Draft',
        color: 'gray',
        icon: FileText,
        bg: 'bg-gray-100 dark:bg-gray-700/50',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-600'
    },
    pending: {
        label: 'Pending',
        color: 'yellow',
        icon: Clock,
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-700'
    },
    approved: {
        label: 'Approved',
        color: 'blue',
        icon: CheckCircle,
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700'
    },
    rejected: {
        label: 'Rejected',
        color: 'red',
        icon: XCircle,
        bg: 'bg-red-50 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-700'
    },
    published: {
        label: 'Published',
        color: 'green',
        icon: Globe,
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-700'
    },
}

interface Content {
    id: number
    title: string
    content_type: string
    description: string
    grade?: number
    subject?: string
    topic?: string
    status: string
    view_count: number
    like_count: number
    created_at: string
    updated_at: string
    published_at?: string
    review_notes?: string
}

export default function MyContent() {
    const navigate = useNavigate()
    const [contents, setContents] = useState<Content[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [totalPages, setTotalPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        loadContent()
    }, [statusFilter, currentPage])

    const loadContent = async () => {
        setLoading(true)
        try {
            const data = await contentApi.getMyContent({
                page: currentPage,
                page_size: 12, // Increased for grid
                status: statusFilter || undefined
            })
            setContents(data.items)
            setTotalPages(data.total_pages)
        } catch (err) {
            console.error('Failed to load content:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this content?')) return

        try {
            await contentApi.delete(id)
            loadContent()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete')
        }
    }

    const handleSubmit = async (id: number) => {
        try {
            await contentApi.submit(id)
            loadContent()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to submit')
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            My Creations
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Manage and track all your AI-generated teaching materials
                    </p>
                </div>
                <button
                    onClick={() => navigate('/teacher/content/create')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 font-bold text-sm"
                >
                    <Plus className="w-5 h-5" />
                    Create New Content
                </button>
            </div>

            {/* Filter Section - More compact & modern */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex gap-1">
                    {['', 'draft', 'pending', 'published', 'rejected'].map((status) => {
                        const isActive = statusFilter === status
                        return (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {status === '' ? 'All Content' : statusConfig[status]?.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 animate-pulse" />
                    ))}
                </div>
            ) : contents.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No content found</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 font-medium">
                        You haven't created any teaching materials yet or no content matches the selected filter.
                    </p>
                    <button
                        onClick={() => navigate('/teacher/content/create')}
                        className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold hover:scale-105 transition-transform"
                    >
                        Create Your First Piece
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {contents.map((content) => {
                        const type = contentTypeConfig[content.content_type] || contentTypeConfig.lesson_plan
                        const status = statusConfig[content.status]
                        const TypeIcon = type.icon
                        const StatusIcon = status?.icon

                        return (
                            <div
                                key={content.id}
                                className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/30 transition-all duration-500 hover:-translate-y-1"
                            >
                                {/* Header: Type & Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.gradient} p-0.5 shadow-lg shadow-blue-500/10`}>
                                        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[14px] flex items-center justify-center">
                                            <TypeIcon className={`w-6 h-6 ${type.textColor}`} />
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${status.bg} ${status.text} ${status.border} font-bold text-[10px] uppercase tracking-wider`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </div>
                                </div>

                                {/* Content Info */}
                                <div className="flex-1">
                                    <h3
                                        className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                        title={content.title}
                                    >
                                        {content.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className={`px-2.5 py-1 rounded-lg ${type.lightBg} ${type.textColor} text-[11px] font-bold`}>
                                            {type.label}
                                        </span>
                                        {content.grade && (
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[11px] font-bold">
                                                Class {content.grade}
                                            </span>
                                        )}
                                        {content.subject && (
                                            <span
                                                className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[11px] font-bold truncate max-w-[100px]"
                                                title={content.subject}
                                            >
                                                {content.subject}
                                            </span>
                                        )}
                                    </div>

                                    <p
                                        className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-4 leading-relaxed font-medium"
                                        title={stripMarkdown(content.description)}
                                    >
                                        {stripMarkdown(content.description)}
                                    </p>
                                </div>

                                {/* Progress/Stats (if published) or rejection notes */}
                                {content.status === 'rejected' && content.review_notes && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/50">
                                        <p className="text-[10px] text-red-600 dark:text-red-400 leading-tight line-clamp-2">
                                            <span className="font-bold uppercase mr-1">Note:</span>
                                            {content.review_notes}
                                        </p>
                                    </div>
                                )}

                                {/* Footer & Actions */}
                                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                                        <div className="flex items-center gap-1.5" title="Updated Date">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{formatDate(content.updated_at)}</span>
                                        </div>
                                        {content.status === 'published' && (
                                            <div className="flex items-center gap-1.5" title="Views">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-bold">{content.view_count}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => content.status === 'pending' ? navigate(`/teacher/content/preview/${content.id}`) : navigate(`/content/player/${content.id}`)}
                                            className="p-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                            title="View Content"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {content.status === 'draft' && (
                                            <div className="flex gap-1 animate-in fade-in slide-in-from-right-2">
                                                <button
                                                    onClick={() => navigate(`/teacher/content/edit/${content.id}`)}
                                                    className="p-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleSubmit(content.id)}
                                                    className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                                    title="Submit"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(content.id)}
                                                    className="p-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[44px] h-[44px] rounded-2xl font-black text-sm transition-all ${currentPage === page
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    )
}
