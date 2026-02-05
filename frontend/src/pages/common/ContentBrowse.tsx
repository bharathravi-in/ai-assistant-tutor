import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, BookOpen, Search, ChevronRight, Loader2, Eye, Heart } from 'lucide-react';
import { contentApi } from '../../services/api';
import { getLearningModules, LearningModule } from '../../services/learningService';


interface Content {
    id: number;
    title: string;
    description: string;
    content_type: string;
    grade?: number;
    subject?: string;
    topic?: string;
    author_name?: string;
    view_count: number;
    like_count: number;
    is_liked?: boolean;
    content_json?: any;
    pdf_url?: string;
    created_at: string;
}

type TabType = 'content' | 'learning';

export default function ContentBrowse() {
    const navigate = useNavigate();
    // Master data for filters (hardcoded for now or fetched from hook)

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('content');

    // Content tab state
    const [contents, setContents] = useState<Content[]>([]);
    const [contentLoading, setContentLoading] = useState(false);
    const [contentPage, setContentPage] = useState(1);
    const [contentTotal, setContentTotal] = useState(0);

    // Learning tab state
    const [modules, setModules] = useState<LearningModule[]>([]);
    const [moduleLoading, setModuleLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const filterGrade = '';
    const filterSubject = '';
    const filterType = '';

    useEffect(() => {
        if (activeTab === 'content') {
            loadContent();
        } else {
            loadModules();
        }
    }, [activeTab, contentPage, searchTerm, filterGrade, filterSubject, filterType]);

    const loadContent = async () => {
        try {
            setContentLoading(true);
            const data = await contentApi.browseLibrary({
                page: contentPage,
                page_size: 12,
                search: searchTerm || undefined,
                grade: filterGrade ? parseInt(filterGrade) : undefined,
                subject: filterSubject || undefined,
                content_type: filterType || undefined
            });
            setContents(data.items || []);
            setContentTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load content:', error);
            setContents([]);
        } finally {
            setContentLoading(false);
        }
    };

    const loadModules = async () => {
        try {
            setModuleLoading(true);
            const data = await getLearningModules({
                search: searchTerm || undefined
            });
            setModules(data || []);
        } catch (error) {
            console.error('Failed to load modules:', error);
            setModules([]);
        } finally {
            setModuleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-white p-8 font-sans mesh-bg transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center text-white shadow-purple">
                            <Library className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Content Library</h1>
                            <p className="text-zinc-500 text-sm">Browse and explore premium educational resources</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl w-full md:w-[300px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all text-sm text-zinc-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-zinc-200/50 dark:bg-white/5 p-1 rounded-xl mb-8 w-fit border border-zinc-200 dark:border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        Library
                    </button>
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'learning' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                    >
                        Courses
                    </button>
                </div>

                {/* Grid */}
                {contentLoading || moduleLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                        <p className="text-sm font-medium text-zinc-500">Loading library contents...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(activeTab === 'content' ? contents : modules as any[]).map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(activeTab === 'content' ? `/content/player/${item.id}` : `/learning/modules/${item.id}`)}
                                className="group card-hover overflow-hidden transition-all cursor-pointer flex flex-col h-full bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md"
                            >
                                <div className="h-32 bg-zinc-50 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-black flex items-center justify-center border-b border-zinc-100 dark:border-white/5 group-hover:bg-zinc-100 dark:group-hover:from-zinc-700 transition-colors relative">
                                    <BookOpen className="w-10 h-10 text-zinc-300 dark:text-purple-500/50 group-hover:scale-110 group-hover:text-purple-600 transition-all dark:group-hover:text-purple-500" />
                                    {item.subject && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] font-bold text-purple-600 uppercase">
                                            {item.subject}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 rounded uppercase tracking-wider border border-zinc-200 dark:border-white/5">
                                            {item.content_type?.replace('_', ' ') || item.category || 'Article'}
                                        </span>
                                        {item.grade && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded uppercase tracking-wider border border-purple-500/20">
                                                Class {item.grade}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-500 transition-colors line-clamp-2 mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 line-clamp-2 flex-1">
                                        {item.description}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-zinc-400">
                                            <div className="flex items-center gap-1 text-[10px]">
                                                <Eye className="w-3 h-3" />
                                                {item.view_count || 0}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px]">
                                                <Heart className="w-3 h-3" />
                                                {item.like_count || 0}
                                            </div>
                                        </div>
                                        <div className="text-purple-600 group-hover:translate-x-1 transition-transform">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {activeTab === 'content' && contentTotal > 12 && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                        <button
                            onClick={() => setContentPage(p => Math.max(1, p - 1))}
                            disabled={contentPage === 1}
                            className="p-2 border border-zinc-200 dark:border-white/10 rounded-lg disabled:opacity-20 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-400 group transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 rotate-180 group-hover:text-purple-600" />
                        </button>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Page {contentPage}</span>
                        <button
                            onClick={() => setContentPage(p => p + 1)}
                            disabled={contentPage >= Math.ceil(contentTotal / 12)}
                            className="p-2 border border-zinc-200 dark:border-white/10 rounded-lg disabled:opacity-20 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-400 group transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 group-hover:text-purple-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
