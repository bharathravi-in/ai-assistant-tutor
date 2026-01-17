import { useState, useEffect } from 'react'
import { FileText, Video, Layout, Target, Search, Filter, Loader2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ContentItem {
    id: number
    title: string
    type: string
    category: string
    created_at: string
    views: number
}

export default function AdminContent() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState<ContentItem[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        // Simulate loading content
        const timer = setTimeout(() => {
            setContent([
                { id: 1, title: 'Introduction to Fractions', type: 'video', category: 'subject', created_at: '2026-01-10', views: 234 },
                { id: 2, title: 'Classroom Management Guide', type: 'document', category: 'classroom', created_at: '2026-01-08', views: 189 },
                { id: 3, title: 'NCF 2023 Overview', type: 'guide', category: 'pedagogy', created_at: '2026-01-05', views: 312 },
            ])
            setLoading(false)
        }, 800)
        return () => clearTimeout(timer)
    }, [])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return Video
            case 'document': return FileText
            case 'guide': return Layout
            default: return Target
        }
    }

    const filteredContent = content.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Management</h1>
                    <p className="text-gray-500 text-sm">Manage learning resources</p>
                </div>
                <button
                    onClick={() => navigate('/admin/resources/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Resource
                </button>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Title</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Views</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredContent.map(item => {
                                const Icon = getTypeIcon(item.type)
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                                                    <Icon className="w-4 h-4 text-primary-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{item.type}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{item.category}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.views}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{item.created_at}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
