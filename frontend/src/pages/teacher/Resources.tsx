import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    BookOpen,
    Video,
    FileText,
    Bookmark,
    BookmarkCheck,
    Clock,
    Star,
    ChevronRight,
    Play,
    GraduationCap,
    Lightbulb,
    Users,
    Grid,
    List,
    Loader2,
    RefreshCw,
    X,
    ExternalLink,
    CheckCircle
} from 'lucide-react'
import { resourcesApi } from '../../services/api'

interface Resource {
    id: number
    title: string
    description: string | null
    type: string
    category: string
    grade: string | null
    subject: string | null
    duration: string | null
    content_url: string | null
    thumbnail_url: string | null
    is_bookmarked: boolean
    is_completed: boolean
    progress_percent: number
    view_count: number
    is_featured: boolean
}

interface ResourceListResponse {
    items: Resource[]
    total_items: number
    page: number
    page_size: number
}

const CATEGORIES = [
    { id: 'all', label: 'All Resources', icon: Grid },
    { id: 'pedagogy', label: 'Teaching Strategies', icon: Lightbulb },
    { id: 'classroom', label: 'Classroom Management', icon: Users },
    { id: 'subject', label: 'Subject Specific', icon: BookOpen },
    { id: 'assessment', label: 'Assessment', icon: FileText },
]

export default function Resources() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [selectedGrade, setSelectedGrade] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalItems, setTotalItems] = useState(0)
    const [page, setPage] = useState(1)
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

    const fetchResources = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response: ResourceListResponse = await resourcesApi.getResources({
                page,
                page_size: 20,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                grade: selectedGrade || undefined,
                subject: selectedSubject || undefined,
                search: searchQuery || undefined,
            })
            setResources(response.items)
            setTotalItems(response.total_items)
        } catch (err: any) {
            console.error('Failed to fetch resources:', err)
            setError(err.response?.data?.detail || 'Failed to load resources')
        } finally {
            setLoading(false)
        }
    }, [page, selectedCategory, selectedGrade, selectedSubject, searchQuery])

    useEffect(() => {
        fetchResources()
    }, [fetchResources])

    const toggleBookmark = async (id: number, isBookmarked: boolean) => {
        try {
            if (isBookmarked) {
                await resourcesApi.removeBookmark(id)
            } else {
                await resourcesApi.bookmarkResource(id)
            }
            // Update local state
            setResources(prev => prev.map(r =>
                r.id === id ? { ...r, is_bookmarked: !isBookmarked } : r
            ))
        } catch (err) {
            console.error('Failed to toggle bookmark:', err)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return Video
            case 'document': return FileText
            case 'guide': return BookOpen
            case 'activity': return GraduationCap
            default: return FileText
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'video': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            case 'document': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            case 'guide': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            case 'activity': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            default: return 'bg-gray-100 text-gray-600'
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Learning Resources</h1>
                    <p className="text-gray-500">Explore teaching strategies, activities, and professional development materials</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search resources..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All Grades</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                                    <option key={g} value={`Class ${g}`}>Class {g}</option>
                                ))}
                            </select>

                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">All Subjects</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Science">Science</option>
                                <option value="Language">Language</option>
                                <option value="Social Studies">Social Studies</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                >
                                    <Grid className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                                >
                                    <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900 dark:text-white">{resources.length}</span> of {totalItems} resources
                    </p>
                    {error && (
                        <button
                            onClick={fetchResources}
                            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Preview Modal */}
                {selectedResource && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResource(null)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className={`p-6 ${getTypeColor(selectedResource.type)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {(() => { const Icon = getTypeIcon(selectedResource.type); return <Icon className="w-8 h-8" /> })()}
                                        <div>
                                            <span className="px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full capitalize">
                                                {selectedResource.type}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedResource(null)}
                                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {selectedResource.title}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    {selectedResource.description}
                                </p>

                                {/* Meta Info */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
                                        <GraduationCap className="w-4 h-4" />
                                        {selectedResource.grade || 'All Grades'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
                                        <BookOpen className="w-4 h-4" />
                                        {selectedResource.subject || 'General'}
                                    </span>
                                    {selectedResource.duration && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
                                            <Clock className="w-4 h-4" />
                                            {selectedResource.duration}
                                        </span>
                                    )}
                                </div>

                                {/* Content Preview Placeholder */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Content Preview</h3>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            This resource provides comprehensive guidance on <strong>{selectedResource.title.toLowerCase()}</strong>.
                                            It covers key concepts, practical strategies, and examples that teachers can apply in their classrooms.
                                        </p>
                                        <ul className="text-gray-600 dark:text-gray-400 mt-3 space-y-2">
                                            <li>• Introduction to the topic</li>
                                            <li>• Step-by-step implementation guide</li>
                                            <li>• Practical classroom examples</li>
                                            <li>• Tips for different learning levels</li>
                                            <li>• Assessment strategies</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => toggleBookmark(selectedResource.id, selectedResource.is_bookmarked)}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${selectedResource.is_bookmarked
                                            ? 'bg-warning-100 text-warning-700 hover:bg-warning-200'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                            }`}
                                    >
                                        {selectedResource.is_bookmarked ? (
                                            <><BookmarkCheck className="w-5 h-5" /> Bookmarked</>
                                        ) : (
                                            <><Bookmark className="w-5 h-5" /> Save for Later</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate(`/teacher/resources/${selectedResource.id}`, {
                                                state: { resource: selectedResource }
                                            })
                                        }}
                                        className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors"
                                    >
                                        {selectedResource.is_completed ? (
                                            <><CheckCircle className="w-5 h-5" /> Continue Learning</>
                                        ) : (
                                            <><ExternalLink className="w-5 h-5" /> Start Learning</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resources Grid/List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-3'
                    }>
                        {resources.map(resource => {
                            const TypeIcon = getTypeIcon(resource.type)

                            if (viewMode === 'list') {
                                return (
                                    <div
                                        key={resource.id}
                                        onClick={() => setSelectedResource(resource)}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(resource.type)}`}>
                                                <TypeIcon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{resource.title}</h3>
                                                    {resource.is_completed && (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-secondary-100 text-secondary-600 rounded-full">Completed</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">{resource.description}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                    <span>{resource.grade || 'All'}</span>
                                                    <span>•</span>
                                                    <span>{resource.subject || 'General'}</span>
                                                    {resource.duration && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {resource.duration}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(resource.id, resource.is_bookmarked) }}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    {resource.is_bookmarked
                                                        ? <BookmarkCheck className="w-5 h-5 text-warning-500" />
                                                        : <Bookmark className="w-5 h-5 text-gray-400" />
                                                    }
                                                </button>
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={resource.id}
                                    onClick={() => setSelectedResource(resource)}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                                >
                                    {/* Thumbnail */}
                                    <div className={`h-32 flex items-center justify-center relative ${getTypeColor(resource.type)}`}>
                                        <TypeIcon className="w-12 h-12" />
                                        {resource.type === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                                    <Play className="w-6 h-6 text-gray-900 ml-1" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getTypeColor(resource.type)}`}>
                                                {resource.type}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleBookmark(resource.id, resource.is_bookmarked) }}
                                                className="p-1"
                                            >
                                                {resource.is_bookmarked
                                                    ? <BookmarkCheck className="w-4 h-4 text-warning-500" />
                                                    : <Bookmark className="w-4 h-4 text-gray-400" />
                                                }
                                            </button>
                                        </div>

                                        <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">{resource.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{resource.description}</p>

                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{resource.grade || 'All'} • {resource.subject || 'General'}</span>
                                            {resource.duration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {resource.duration}
                                                </span>
                                            )}
                                        </div>

                                        {resource.is_completed && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <span className="flex items-center gap-1 text-xs text-secondary-600">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    Completed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
