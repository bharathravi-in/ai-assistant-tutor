import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Users,
    CheckCircle,
    Grid3X3,
    GraduationCap,
    RefreshCw
} from 'lucide-react';

interface DashboardStats {
    period: string;
    total_queries: number;
    mode_breakdown: Record<string, number>;
    success_rate: number;
    active_teachers: number;
    crp_responses: number;
    queries_per_teacher: number;
}

interface ConceptGap {
    topic: string;
    subject: string | null;
    grade: number | null;
    occurrence_count: number;
    failed_rate: number;
    sample_queries: string[];
}

interface SubjectDifficulty {
    subject: string;
    total_queries: number;
    avg_resolution_rate: number;
    top_challenging_topics: string[];
}

interface HeatmapCell {
    grade: number;
    subject: string;
    query_count: number;
    success_rate: number;
    difficulty_score: number;
}

export default function ARPDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [gaps, setGaps] = useState<ConceptGap[]>([]);
    const [difficulties, setDifficulties] = useState<SubjectDifficulty[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'gaps' | 'subjects' | 'heatmap'>('overview');

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [statsRes, gapsRes, diffRes, heatRes] = await Promise.all([
                fetch(`/api/arp/dashboard`, { headers }),
                fetch(`/api/arp/trends/recurring-gaps`, { headers }),
                fetch(`/api/arp/trends/subject-difficulty`, { headers }),
                fetch(`/api/arp/trends/grade-heatmap`, { headers })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (gapsRes.ok) setGaps(await gapsRes.json());
            if (diffRes.ok) setDifficulties(await diffRes.json());
            if (heatRes.ok) setHeatmap(await heatRes.json());
        } catch (error) {
            console.error('Failed to fetch ARP data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getDifficultyColor = (score: number) => {
        if (score >= 70) return 'bg-red-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getSuccessColor = (rate: number) => {
        if (rate >= 70) return 'text-green-600';
        if (rate >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="w-8 h-8 text-indigo-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">ARP Dashboard</h1>
                                <p className="text-sm text-gray-500">Academic Resource Person Analytics</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="flex gap-2 border-b border-gray-200">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'gaps', label: 'Concept Gaps', icon: AlertTriangle },
                        { id: 'subjects', label: 'Subject Analysis', icon: BookOpen },
                        { id: 'heatmap', label: 'Grade Heatmap', icon: Grid3X3 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-100 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Queries</p>
                                        <p className="text-2xl font-bold">{stats.total_queries}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Success Rate</p>
                                        <p className={`text-2xl font-bold ${getSuccessColor(stats.success_rate)}`}>
                                            {stats.success_rate}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Active Teachers</p>
                                        <p className="text-2xl font-bold">{stats.active_teachers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-100 rounded-lg">
                                        <BarChart3 className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Queries/Teacher</p>
                                        <p className="text-2xl font-bold">{stats.queries_per_teacher}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mode Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h3 className="text-lg font-semibold mb-4">Query Mode Breakdown</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(stats.mode_breakdown).map(([mode, count]) => (
                                    <div key={mode} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-indigo-600">{count}</p>
                                        <p className="text-sm text-gray-500 capitalize">{mode.replace('_', ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Concept Gaps Tab */}
                {activeTab === 'gaps' && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-red-50">
                            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Recurring Concept Gaps
                            </h3>
                            <p className="text-sm text-red-600">Topics that teachers struggle with repeatedly</p>
                        </div>
                        <div className="divide-y">
                            {gaps.length === 0 ? (
                                <p className="p-8 text-center text-gray-500">No recurring gaps detected</p>
                            ) : (
                                gaps.map((gap, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900">{gap.topic}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {gap.subject && `${gap.subject} • `}
                                                    {gap.grade && `Grade ${gap.grade}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {gap.occurrence_count} occurrences
                                                </span>
                                                <p className={`text-sm mt-1 ${getSuccessColor(100 - gap.failed_rate)}`}>
                                                    {gap.failed_rate}% failure rate
                                                </p>
                                            </div>
                                        </div>
                                        {gap.sample_queries.length > 0 && (
                                            <div className="mt-2 text-sm text-gray-600 italic">
                                                "{gap.sample_queries[0]}..."
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Subject Analysis Tab */}
                {activeTab === 'subjects' && (
                    <div className="grid gap-4">
                        {difficulties.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                                No subject data available
                            </div>
                        ) : (
                            difficulties.map((subj, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">{subj.subject}</h3>
                                        <span className={`text-lg font-bold ${getSuccessColor(subj.avg_resolution_rate)}`}>
                                            {subj.avg_resolution_rate}% success
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">
                                        {subj.total_queries} total queries
                                    </p>
                                    {subj.top_challenging_topics.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                                                Challenging Topics
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {subj.top_challenging_topics.map((topic, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Heatmap Tab */}
                {activeTab === 'heatmap' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border">
                        <h3 className="text-lg font-semibold mb-4">Grade × Subject Difficulty Heatmap</h3>
                        {heatmap.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No heatmap data available</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="grid gap-2" style={{
                                    gridTemplateColumns: `repeat(${Math.min(heatmap.length, 10)}, minmax(120px, 1fr))`
                                }}>
                                    {heatmap.map((cell, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-lg text-white ${getDifficultyColor(cell.difficulty_score)}`}
                                        >
                                            <p className="font-bold">Grade {cell.grade}</p>
                                            <p className="text-sm opacity-90">{cell.subject}</p>
                                            <p className="text-xs mt-2 opacity-80">
                                                {cell.query_count} queries • {cell.success_rate}% success
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span> Low Difficulty
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span> High Difficulty
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
