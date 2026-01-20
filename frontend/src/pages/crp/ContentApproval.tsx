import { useState, useEffect } from 'react'
import {
    CheckCircle,
    XCircle,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    User,
    Clock,
    Loader2,
    Eye,
    MessageSquare,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { contentApi } from '../../services/api'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'

// Content type icons
const contentTypeIcons: Record<string, any> = {
    lesson_plan: FileText,
    activity: Activity,
    tlm: Palette,
    assessment: ClipboardCheck,
    worksheet: FileSpreadsheet,
}

interface Content {
    id: number
    title: string
    content_type: string
    description: string
    grade?: number
    subject?: string
    topic?: string
    author_name?: string
    created_at: string
    tags?: string[]
}

export default function ContentApproval() {
    const [contents, setContents] = useState<Content[]>([])
    const [loading, setLoading] = useState(true)
    const [contentTypeFilter, setContentTypeFilter] = useState('')
    const [totalPages, setTotalPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)

    // Review state
    const [reviewingId, setReviewingId] = useState<number | null>(null)
    const [reviewNotes, setReviewNotes] = useState('')
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadPendingContent()
    }, [currentPage, contentTypeFilter])

    const loadPendingContent = async () => {
        setLoading(true)
        try {
            const data = await contentApi.getPending({
                page: currentPage,
                page_size: 10,
                content_type: contentTypeFilter || undefined
            })
            setContents(data.items)
            setTotalPages(data.total_pages)
        } catch (err) {
            console.error('Failed to load pending content:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async (id: number, approved: boolean) => {
        setSubmitting(true)
        try {
            await contentApi.review(id, {
                approved,
                review_notes: reviewNotes || undefined
            })
            setReviewingId(null)
            setReviewNotes('')
            loadPendingContent()
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Review failed')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Approval</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Review and approve teacher-created content for the library
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="w-4 h-4" />
                    Filter by type:
                </div>
                <select
                    value={contentTypeFilter}
                    onChange={(e) => { setContentTypeFilter(e.target.value); setCurrentPage(1) }}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="lesson_plan">Lesson Plans</option>
                    <option value="activity">Activities</option>
                    <option value="tlm">TLMs</option>
                    <option value="assessment">Assessments</option>
                    <option value="worksheet">Worksheets</option>
                </select>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : contents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <CheckCircle className="w-16 h-16 text-green-300 dark:text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All caught up!</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        No pending content to review
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {contents.map((content) => {
                        const TypeIcon = contentTypeIcons[content.content_type] || FileText
                        const isExpanded = expandedId === content.id
                        const isReviewing = reviewingId === content.id

                        return (
                            <div
                                key={content.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                                            <TypeIcon className="w-6 h-6 text-yellow-500" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {content.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="capitalize">{content.content_type.replace('_', ' ')}</span>
                                                        {content.grade && <span>• Class {content.grade}</span>}
                                                        {content.subject && <span>• {content.subject}</span>}
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                                    <Clock className="w-3 h-3" />
                                                    Pending
                                                </span>
                                            </div>

                                            {/* Author & Date */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" /> {content.author_name || 'Unknown'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> Submitted {formatDate(content.created_at)}
                                                </span>
                                            </div>

                                            {/* Tags */}
                                            {content.tags && content.tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {content.tags.map((tag) => (
                                                        <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle Preview */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : content.id)}
                                        className="mt-4 flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {isExpanded ? 'Hide Preview' : 'Show Preview'}
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Expandable Content Preview */}
                                {isExpanded && (
                                    <div className="px-5 pb-5">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto">
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <MarkdownRenderer content={content.description} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Section */}
                                {isReviewing ? (
                                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    <MessageSquare className="w-4 h-4 inline mr-1" />
                                                    Review Notes (optional)
                                                </label>
                                                <textarea
                                                    value={reviewNotes}
                                                    onChange={(e) => setReviewNotes(e.target.value)}
                                                    placeholder="Add feedback for the author..."
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleReview(content.id, true)}
                                                    disabled={submitting}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                                >
                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                    Approve & Publish
                                                </button>
                                                <button
                                                    onClick={() => handleReview(content.id, false)}
                                                    disabled={submitting}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                                                >
                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => { setReviewingId(null); setReviewNotes('') }}
                                                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 flex items-center gap-3">
                                        <button
                                            onClick={() => setReviewingId(content.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700"
                                        >
                                            Review Content
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
