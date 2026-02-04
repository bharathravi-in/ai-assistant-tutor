import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    BookOpen,
    Zap,
    BookMarked,
    Loader2,
    User,
    Calendar,
    Tag,
    GraduationCap,
    AlertCircle,
    MessageSquare,
    Eye,
    FileType,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { contentApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

// Content type icons
const contentTypeIcons: Record<string, any> = {
    lesson_plan: FileText,
    explanation: BookOpen,
    activity: Activity,
    tlm: Palette,
    quick_reference: Zap,
    assessment: ClipboardCheck,
    worksheet: FileSpreadsheet,
    study_guide: BookMarked,
}

const contentTypeLabels: Record<string, string> = {
    lesson_plan: 'Lesson Plan',
    explanation: 'Topic Explanation',
    activity: 'Activity',
    tlm: 'TLM',
    quick_reference: 'Quick Reference',
    assessment: 'Assessment',
    worksheet: 'Worksheet',
    study_guide: 'Study Guide',
}

type ViewMode = 'pdf' | 'markdown'

export default function ContentReview() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [viewMode, setViewMode] = useState<ViewMode>('markdown')
    const [reviewNotes, setReviewNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showMetadata, setShowMetadata] = useState(true)

    // Determine base path based on user role
    const basePath = user?.role?.toLowerCase() === 'arp' ? '/arp' : '/crp'

    useEffect(() => {
        if (id) {
            loadContent(parseInt(id))
        }
    }, [id])

    const loadContent = async (contentId: number) => {
        try {
            const data = await contentApi.getById(contentId)
            setContent(data)
            // Default to PDF view if PDF is available
            if (data.pdf_url) {
                setViewMode('pdf')
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load content')
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async (approved: boolean) => {
        if (!content) return

        setSubmitting(true)
        try {
            await contentApi.review(content.id, {
                approved,
                review_notes: reviewNotes || undefined
            })
            navigate(`${basePath}/content-approval`)
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Review failed')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error || !content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Content</h2>
                <p className="text-gray-500 mb-6">{error || 'Content not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Go Back
                </button>
            </div>
        )
    }

    const TypeIcon = contentTypeIcons[content.content_type] || FileText

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`${basePath}/content-approval`)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                    <TypeIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {content.title}
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {contentTypeLabels[content.content_type]} • By {content.author_name || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleReview(false)}
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Reject
                            </button>
                            <button
                                onClick={() => handleReview(true)}
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Approve & Publish
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* View Mode Toggle */}
                    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('markdown')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'markdown'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                Markdown Preview
                            </button>
                            {content.pdf_url && (
                                <button
                                    onClick={() => setViewMode('pdf')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'pdf'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <FileType className="w-4 h-4" />
                                    PDF Document
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content View */}
                    <div className="flex-1 overflow-auto p-6">
                        {viewMode === 'pdf' && content.pdf_url ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full">
                                <iframe
                                    src={`${content.pdf_url}#toolbar=1&navpanes=0&view=FitH`}
                                    className="w-full h-full border-none min-h-[700px]"
                                    title="PDF Preview"
                                />
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                                    <div className="prose prose-lg dark:prose-invert max-w-none">
                                        <MarkdownRenderer content={content.description} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {/* Metadata Accordion */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowMetadata(!showMetadata)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <span className="font-semibold text-gray-900 dark:text-white">Content Details</span>
                            {showMetadata ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>
                        {showMetadata && (
                            <div className="px-6 pb-4 space-y-3">
                                {content.grade && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <GraduationCap className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">Class {content.grade}</span>
                                    </div>
                                )}
                                {content.subject && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">{content.subject}</span>
                                    </div>
                                )}
                                {content.topic && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Tag className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">Topic:</span>
                                        <span className="text-gray-900 dark:text-white font-medium">{content.topic}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Author:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{content.author_name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{formatDate(content.created_at)}</span>
                                </div>
                                {content.tags && content.tags.length > 0 && (
                                    <div className="pt-2">
                                        <div className="flex flex-wrap gap-2">
                                            {content.tags.map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Review Notes */}
                    <div className="flex-1 overflow-auto p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-gray-400" />
                                <label className="font-semibold text-gray-900 dark:text-white">
                                    Review Notes
                                </label>
                            </div>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add feedback for the author (optional)...&#10;&#10;• Suggestions for improvement&#10;• Issues found&#10;• Praise for good work"
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                These notes will be visible to the content author.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleReview(false)}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 font-medium"
                            >
                                <XCircle className="w-5 h-5" />
                                Reject
                            </button>
                            <button
                                onClick={() => handleReview(true)}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 font-medium shadow-lg shadow-green-500/20"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
