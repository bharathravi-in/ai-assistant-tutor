import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Users,
    Grid3X3,
    GraduationCap,
    RefreshCw,
    MapPin,
    Award,
    Clock,
    Target,
    Star
} from 'lucide-react';
import { arpApi } from '../../services/api';

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

interface CRPPerformance {
    id: number;
    name: string;
    district: string;
    teachers_count: number;
    response_rate: number;
    avg_response_time: string;
    pending_reviews: number;
    total_responses: number;
    rating: number;
    status: string;
}

export default function ARPDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [gaps, setGaps] = useState<ConceptGap[]>([]);
    const [difficulties, setDifficulties] = useState<SubjectDifficulty[]>([]);
    const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
    const [crps, setCrps] = useState<CRPPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'crps' | 'gaps' | 'subjects' | 'heatmap'>('overview');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, gapsData, diffData, heatData, crpData] = await Promise.all([
                arpApi.getDashboard(),
                arpApi.getTrends(),
                arpApi.getSubjectDifficulty(),
                arpApi.getHeatmap(),
                arpApi.getCrpPerformance()
            ]);

            setStats(statsData);
            setGaps(gapsData);
            setDifficulties(diffData);
            setHeatmap(heatData);
            setCrps(crpData.crps || []);
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

    const getPerformanceColor = (rate: number) => {
        if (rate >= 85) return 'bg-green-100 text-green-700 border-green-200';
        if (rate >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="header-gradient">
                <div className="relative p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                                    ARP Dashboard
                                </h1>
                                <p className="text-white/70 mt-1">
                                    Academic Resource Person - Regional Analytics
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary-light)]/10 dark:bg-[var(--color-primary)]/30">
                                <TrendingUp className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total_queries}</p>
                                <p className="text-xs text-gray-500">Total Queries</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                                <Target className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${getSuccessColor(stats.success_rate)}`}>{stats.success_rate}%</p>
                                <p className="text-xs text-gray-500">Success Rate</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--color-primary-light)]/10 dark:bg-[var(--color-primary)]/30">
                                <Users className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.active_teachers}</p>
                                <p className="text-xs text-gray-500">Active Teachers</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                                <BarChart3 className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{crps.length}</p>
                                <p className="text-xs text-gray-500">CRPs Managed</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'crps', label: 'CRP Performance', icon: Users },
                    { id: 'gaps', label: 'Concept Gaps', icon: AlertTriangle },
                    { id: 'subjects', label: 'Subject Analysis', icon: BookOpen },
                    { id: 'heatmap', label: 'Grade Heatmap', icon: Grid3X3 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-6">
                    {/* Mode Breakdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Query Mode Breakdown</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats.mode_breakdown).map(([mode, count]) => (
                                <div key={mode} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                    <p className="text-2xl font-bold text-primary-600">{count}</p>
                                    <p className="text-sm text-gray-500 capitalize">{mode.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Alerts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-red-100 dark:border-red-800">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h4 className="font-semibold text-red-800 dark:text-red-300">CRPs Needing Support</h4>
                            </div>
                            <p className="text-3xl font-bold text-red-700 dark:text-red-400">
                                {crps.filter(c => c.response_rate < 70).length}
                            </p>
                            <p className="text-sm text-red-600/70 mt-1">Response rate below 70%</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
                            <div className="flex items-center gap-3 mb-3">
                                <Award className="w-5 h-5 text-green-500" />
                                <h4 className="font-semibold text-green-800 dark:text-green-300">Top Performers</h4>
                            </div>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                                {crps.filter(c => c.response_rate >= 90).length}
                            </p>
                            <p className="text-sm text-green-600/70 mt-1">Response rate above 90%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* CRP Performance Tab */}
            {activeTab === 'crps' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CRP Performance Overview</h3>
                        <p className="text-sm text-gray-500">Monitor and support your CRP network</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CRP</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">District</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Teachers</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Response Rate</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Avg Response Time</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pending</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {crps.map(crp => (
                                    <tr key={crp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
                                                    {crp.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{crp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <MapPin className="w-3 h-3" />
                                                {crp.district}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{crp.teachers_count}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(crp.response_rate)}`}>
                                                {crp.response_rate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {crp.avg_response_time}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {crp.pending_reviews > 0 ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                                    {crp.pending_reviews}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="flex items-center justify-center gap-1 text-sm font-medium text-yellow-600">
                                                <Star className="w-3 h-3 fill-yellow-400" />
                                                {crp.rating}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Concept Gaps Tab */}
            {activeTab === 'gaps' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Recurring Concept Gaps
                        </h3>
                        <p className="text-sm text-red-600/80">Topics that teachers struggle with repeatedly</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {gaps.length === 0 ? (
                            <p className="p-8 text-center text-gray-500">No recurring gaps detected</p>
                        ) : (
                            gaps.map((gap, idx) => (
                                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{gap.topic}</h4>
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-gray-500 border border-gray-100 dark:border-gray-700">
                            No subject data available
                        </div>
                    ) : (
                        difficulties.map((subj, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subj.subject}</h3>
                                    <span className={`text-lg font-bold ${getSuccessColor(subj.avg_resolution_rate)}`}>
                                        {subj.avg_resolution_rate}% success
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3">
                                    {subj.total_queries} total queries
                                </p>
                                {subj.top_challenging_topics.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Challenging Topics</p>
                                        <div className="flex flex-wrap gap-2">
                                            {subj.top_challenging_topics.map((topic, i) => (
                                                <span key={i} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-sm">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Grade × Subject Difficulty Heatmap</h3>
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
        </div>
    );
}
