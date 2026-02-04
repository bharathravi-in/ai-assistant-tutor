import { useState, useEffect } from 'react'
import {
    Search,
    FileText,
    Activity,
    Palette,
    ClipboardCheck,
    FileSpreadsheet,
    Heart,
    Eye,
    User,
    Filter,
    Loader2,
    Bot,
    BookOpen,
    X,
    Download,
    GitFork
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contentApi } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { useMasterData } from '../../hooks/useMasterData'
import MarkdownRenderer from '../../components/common/MarkdownRenderer'
import StructuredAIResponse from '../../components/common/StructuredAIResponse'

// Content type icons
const contentTypeIcons: Record<string, any> = {
    lesson_plan: FileText,
    activity: Activity,
    tlm: Palette,
    assessment: ClipboardCheck,
    worksheet: FileSpreadsheet,
}

const contentTypeColors: Record<string, string> = {
    lesson_plan: 'blue',
    activity: 'green',
    tlm: 'pink',
    assessment: 'purple',
    worksheet: 'orange',
}

interface Content {
    id: number
    title: string
    content_type: string
    description: string
    content_json?: {
        original_query?: string
        ai_response?: string
        structured_data?: any
        generation_mode?: string
    }
    grade?: number
    subject?: string
    topic?: string
    author_name?: string
    view_count: number
    like_count: number
    is_liked: boolean
    published_at?: string
    tags?: string[]
    pdf_url?: string
    parent_id?: number
    remix_count: number
}

export default function ContentLibrary() {
    const { grades, subjects } = useMasterData()

    const [contents, setContents] = useState<Content[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [contentTypeFilter, setContentTypeFilter] = useState('')
    const [gradeFilter, setGradeFilter] = useState<number | null>(null)
    const [subjectFilter, setSubjectFilter] = useState('')
    const [totalPages, setTotalPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)

    // Content Viewer modal
    const [selectedContent, setSelectedContent] = useState<Content | null>(null)
    const [loadingContent, setLoadingContent] = useState(false)
    const [remixing, setRemixing] = useState(false)

    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isTeacher = user?.role?.toLowerCase() === 'teacher'

    useEffect(() => {
        loadContent()
    }, [currentPage, contentTypeFilter, gradeFilter, subjectFilter])

    const loadContent = async () => {
        setLoading(true)
        try {
            const data = await contentApi.browseLibrary({
                page: currentPage,
                page_size: 12,
                content_type: contentTypeFilter || undefined,
                grade: gradeFilter || undefined,
                subject: subjectFilter || undefined,
                search: searchQuery || undefined
            })
            setContents(data.items)
            setTotalPages(data.total_pages)
        } catch (err) {
            console.error('Failed to load content:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        loadContent()
    }

    // Open content viewer and fetch full content (also increments view count)
    const openContentViewer = async (contentId: number) => {
        setLoadingContent(true)
        try {
            const fullContent = await contentApi.getById(contentId)
            setSelectedContent(fullContent)
        } catch (err) {
            console.error('Failed to load content:', err)
        } finally {
            setLoadingContent(false)
        }
    }

    const handleDownloadPdf = async (contentId: number) => {
        try {
            const result = await contentApi.getPdf(contentId)
            if (result?.pdf_url) {
                window.open(result.pdf_url, '_blank')
            }
        } catch (err) {
            console.error('Failed to download PDF:', err)
        }
    }

    const handleLike = async (id: number) => {
        try {
            const result = await contentApi.toggleLike(id)
            setContents(contents.map(c =>
                c.id === id
                    ? { ...c, is_liked: result.liked, like_count: result.like_count }
                    : c
            ))
            if (selectedContent?.id === id) {
                setSelectedContent({ ...selectedContent, is_liked: result.liked, like_count: result.like_count })
            }
        } catch (err) {
            console.error('Failed to toggle like:', err)
        }
    }

    const handleRemix = async (id: number) => {
        if (!confirm('This will create a new draft in your collection based on this content. Proceed?')) return

        setRemixing(true)
        try {
            await contentApi.remix(id)
            setSelectedContent(null)
            navigate('/teacher/my-content')
        } catch (err) {
            console.error('Failed to remix content:', err)
            alert('Failed to remix content. Please try again.')
        } finally {
            setRemixing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <BookOpen className="w-7 h-7 text-blue-500" />
                    Content Library
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Browse and discover teaching materials shared by educators
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for lesson plans, activities, TLMs..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors flex items-center gap-2"
                >
                    <Bot className="w-5 h-5" />
                    Search
                </button>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Filter className="w-4 h-4" />
                    Filters:
                </div>

                {/* Content Type Filter */}
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

                {/* Grade Filter */}
                <select
                    value={gradeFilter || ''}
                    onChange={(e) => { setGradeFilter(e.target.value ? parseInt(e.target.value) : null); setCurrentPage(1) }}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                    <option value="">All Grades</option>
                    {grades.map((g: any) => (
                        <option key={g.id} value={g.grade_number}>Class {g.grade_number}</option>
                    ))}
                </select>

                {/* Subject Filter */}
                <select
                    value={subjectFilter}
                    onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1) }}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                    <option value="">All Subjects</option>
                    {subjects.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                </select>

                {/* Clear Filters */}
                {(contentTypeFilter || gradeFilter || subjectFilter) && (
                    <button
                        onClick={() => { setContentTypeFilter(''); setGradeFilter(null); setSubjectFilter(''); setCurrentPage(1) }}
                        className="text-sm text-blue-500 hover:text-blue-600"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : contents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No content found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contents.map((content) => {
                        const TypeIcon = contentTypeIcons[content.content_type] || FileText
                        const color = contentTypeColors[content.content_type] || 'blue'

                        return (
                            <div
                                key={content.id}
                                onClick={() => openContentViewer(content.id)}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                            >
                                {/* Header */}
                                <div className={`p-4 bg-gradient-to-r from-${color}-50 to-${color}-100/50 dark:from-${color}-900/20 dark:to-${color}-900/10`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-${color}-500 flex items-center justify-center`}>
                                            <TypeIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                {content.content_type.replace('_', ' ')}
                                            </span>
                                            {content.grade && (
                                                <span className="ml-2 text-xs bg-white/50 dark:bg-gray-700/50 px-2 py-0.5 rounded">
                                                    Class {content.grade}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors">
                                        {content.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                        {content.description}
                                    </p>

                                    {/* Tags */}
                                    {content.tags && content.tags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {content.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <User className="w-4 h-4" />
                                            <span>{content.author_name || 'Anonymous'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" /> {content.view_count}
                                            </span>
                                            {content.remix_count > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <GitFork className="w-4 h-4" /> {content.remix_count}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleLike(content.id) }}
                                                className={`flex items-center gap-1 ${content.is_liked ? 'text-red-500' : ''}`}
                                            >
                                                <Heart className={`w-4 h-4 ${content.is_liked ? 'fill-current' : ''}`} /> {content.like_count}
                                            </button>
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
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
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

            {/* Content Viewer Modal */}
            {(selectedContent || loadingContent) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {loadingContent ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        ) : selectedContent && (
                            <>
                                {/* Modal Header */}
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedContent.title}</h2>
                                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="capitalize">{selectedContent.content_type.replace('_', ' ')}</span>
                                            {selectedContent.grade && <span>• Class {selectedContent.grade}</span>}
                                            {selectedContent.subject && <span>• {selectedContent.subject}</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedContent(null)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body - Show full AI response */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {selectedContent.content_json?.structured_data ? (
                                        <StructuredAIResponse
                                            content={selectedContent.content_json.ai_response || selectedContent.description}
                                            structured={selectedContent.content_json.structured_data}
                                        />
                                    ) : selectedContent.content_json?.ai_response ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <MarkdownRenderer content={selectedContent.content_json.ai_response} />
                                        </div>
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <MarkdownRenderer content={selectedContent.description} />
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" /> {selectedContent.author_name || 'Anonymous'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" /> {selectedContent.view_count} views
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isTeacher && (
                                            <button
                                                onClick={() => handleRemix(selectedContent.id)}
                                                disabled={remixing}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                                            >
                                                {remixing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <GitFork className="w-4 h-4" />
                                                )}
                                                Remix & Adapt
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDownloadPdf(selectedContent.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download PDF
                                        </button>
                                        <button
                                            onClick={() => handleLike(selectedContent.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectedContent.is_liked
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                }`}
                                        >
                                            <Heart className={`w-5 h-5 ${selectedContent.is_liked ? 'fill-current' : ''}`} />
                                            {selectedContent.is_liked ? 'Liked' : 'Like'} ({selectedContent.like_count})
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
