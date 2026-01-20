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
    Globe
} from 'lucide-react'
import { contentApi } from '../../services/api'

// Content type icons
const contentTypeIcons: Record<string, any> = {
    lesson_plan: FileText,
    activity: Activity,
    tlm: Palette,
    assessment: ClipboardCheck,
    worksheet: FileSpreadsheet,
}

// Status badges
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Draft', color: 'gray', icon: FileText },
    pending: { label: 'Pending Review', color: 'yellow', icon: Clock },
    approved: { label: 'Approved', color: 'blue', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'red', icon: XCircle },
    published: { label: 'Published', color: 'green', icon: Globe },
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
                page_size: 10,
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
        if (!confirm('Are you sure you want to delete this draft?')) return

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Content</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your created teaching materials</p>
                </div>
                <button
                    onClick={() => navigate('/teacher/content/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create New
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Status:</span>
                </div>
                <div className="flex gap-2">
                    {['', 'draft', 'pending', 'published', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {status === '' ? 'All' : statusConfig[status]?.label || status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : contents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No content yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Start creating teaching materials to share with other educators
                    </p>
                    <button
                        onClick={() => navigate('/teacher/content/create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        <Plus className="w-4 h-4" />
                        Create Your First Content
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {contents.map((content) => {
                        const TypeIcon = contentTypeIcons[content.content_type] || FileText
                        const status = statusConfig[content.status]
                        const StatusIcon = status?.icon || FileText

                        return (
                            <div
                                key={content.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Type Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                        <TypeIcon className="w-6 h-6 text-blue-500" />
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                    {content.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="capitalize">{content.content_type.replace('_', ' ')}</span>
                                                    {content.grade && <span>• Class {content.grade}</span>}
                                                    {content.subject && <span>• {content.subject}</span>}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                                                ${status?.color === 'gray' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : ''}
                                                ${status?.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : ''}
                                                ${status?.color === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : ''}
                                                ${status?.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
                                                ${status?.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
                                            `}>
                                                <StatusIcon className="w-3 h-3" />
                                                {status?.label}
                                            </span>
                                        </div>

                                        {/* Description Preview */}
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {content.description}
                                        </p>

                                        {/* Review Notes for Rejected */}
                                        {content.status === 'rejected' && content.review_notes && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    <strong>Reviewer Notes:</strong> {content.review_notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span>Updated {formatDate(content.updated_at)}</span>
                                                {content.status === 'published' && (
                                                    <>
                                                        <span>• {content.view_count} views</span>
                                                        <span>• {content.like_count} likes</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/teacher/content/view/${content.id}`)}
                                                    className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {content.status === 'draft' && (
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/teacher/content/edit/${content.id}`)}
                                                            className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSubmit(content.id)}
                                                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Submit for Review"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(content.id)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
