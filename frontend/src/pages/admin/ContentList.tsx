import { useState, useEffect } from 'react'
import {
    FileText,
    Plus,
    Loader2,
    Search,
    Filter,
    Download,
    Eye,
    Edit2,
    Archive,
    Video,
    BookOpen,
    Gamepad2
} from 'lucide-react'
import { resourcesApi } from '../../services/api'

interface Resource {
    id: number
    title: string
    description: string | null
    resource_type: string
    category: string
    grade: number | null
    subject: string | null
    file_url: string | null
    thumbnail_url: string | null
    view_count: number
    is_active: boolean
    created_at: string
}

const RESOURCE_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'document', label: 'Document', icon: FileText },
    { value: 'guide', label: 'Guide', icon: BookOpen },
    { value: 'activity', label: 'Activity', icon: Gamepad2 },
]

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'pedagogy', label: 'Pedagogy' },
    { value: 'subject', label: 'Subject' },
    { value: 'management', label: 'Management' },
    { value: 'assessment', label: 'Assessment' },
]

export default function ContentList() {
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        loadResources()
    }, [page, typeFilter, categoryFilter])

    const loadResources = async () => {
        setLoading(true)
        try {
            const response = await resourcesApi.getResources({
                page,
                page_size: 20,
                type: typeFilter || undefined,
                category: categoryFilter || undefined,
                search: searchQuery || undefined
            })
            setResources(response.resources || [])
            setTotalPages(response.total_pages || 1)
        } catch (err) {
            console.error('Failed to load resources:', err)
            // Sample data for demo
            setResources([
                { id: 1, title: 'Fractions Teaching Guide', description: 'Complete guide for teaching fractions', resource_type: 'guide', category: 'subject', grade: 5, subject: 'Mathematics', file_url: null, thumbnail_url: null, view_count: 245, is_active: true, created_at: '2026-01-10' },
                { id: 2, title: 'Classroom Management Tips', description: 'Video on managing classroom', resource_type: 'video', category: 'management', grade: null, subject: null, file_url: null, thumbnail_url: null, view_count: 189, is_active: true, created_at: '2026-01-08' },
                { id: 3, title: 'Science Experiments Activity', description: 'Hands-on experiments for students', resource_type: 'activity', category: 'pedagogy', grade: 6, subject: 'Science', file_url: null, thumbnail_url: null, view_count: 312, is_active: true, created_at: '2026-01-05' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        loadResources()
    }

    const getTypeIcon = (type: string) => {
        const found = RESOURCE_TYPES.find(t => t.value === type)
        const Icon = found?.icon || FileText
        return <Icon className="w-5 h-5" />
    }

    const handleExport = () => {
        // Convert to CSV
        const csv = [
            ['ID', 'Title', 'Type', 'Category', 'Grade', 'Subject', 'Views', 'Created At'].join(','),
            ...resources.map(r => [
                r.id,
                `"${r.title}"`,
                r.resource_type,
                r.category,
                r.grade || '',
                r.subject || '',
                r.view_count,
                r.created_at
            ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'content_export.csv'
        a.click()
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6">
                <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Content Library</h1>
                                <p className="text-white/70 text-sm">Manage all resources</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExport}
                                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Export
                            </button>
                            <a
                                href="/admin/resources/create"
                                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Resource
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search resources..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                    >
                        {RESOURCE_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2.5 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-white font-medium flex items-center gap-2 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resource</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grade</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Views</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {resources.map((resource) => (
                                    <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                    {getTypeIcon(resource.resource_type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{resource.title}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{resource.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs capitalize">
                                                {resource.resource_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{resource.category}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{resource.grade ? `Class ${resource.grade}` : '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{resource.view_count}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${resource.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {resource.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="View">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Edit">
                                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Archive">
                                                    <Archive className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {resources.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                No resources found
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
