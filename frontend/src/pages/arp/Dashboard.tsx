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
        if (score >= 70) return 'bg-[#FF3B30]';
        if (score >= 40) return 'bg-[#FF9500]';
        return 'bg-[#34C759]';
    };

    const getSuccessColor = (rate: number) => {
        if (rate >= 70) return 'text-[#34C759]';
        if (rate >= 40) return 'text-[#FF9500]';
        return 'text-[#FF3B30]';
    };

    const getPerformanceColor = (rate: number) => {
        if (rate >= 85) return 'bg-[#34C759]/10 text-[#34C759] border-transparent';
        if (rate >= 70) return 'bg-[#FF9500]/10 text-[#FF9500] border-transparent';
        return 'bg-[#FF3B30]/10 text-[#FF3B30] border-transparent';
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
            <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-[32px] border border-[#E5E5EA] dark:border-white/5 shadow-ios p-8 lg:p-10 mb-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/5 blur-3xl rounded-full -mr-20 -mt-20" />
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-[20px] bg-[#007AFF] flex items-center justify-center shadow-lg shadow-[#007AFF]/20">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-white tracking-tight">
                                Regional Analytics
                            </h1>
                            <p className="text-[#8E8E93] font-medium mt-1">
                                Academic resource monitoring & regional insights
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-3 px-6 py-3 bg-[#F2F2F7] dark:bg-white/5 border border-transparent dark:border-white/10 text-[#1C1C1E] dark:text-white rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                        <RefreshCw className="w-4 h-4 text-[#007AFF]" />
                        Sync Realtime Data
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Queries', val: stats.total_queries, icon: TrendingUp, color: '#007AFF' },
                        { label: 'Success Rate', val: `${stats.success_rate}%`, icon: Target, color: '#34C759', sub: getSuccessColor(stats.success_rate) },
                        { label: 'Active Teachers', val: stats.active_teachers, icon: Users, color: '#5856D6' },
                        { label: 'CRPs Managed', val: crps.length, icon: BarChart3, color: '#FF9500' }
                    ].map((item, i) => (
                        <div key={i} className="card p-6 flex items-start justify-between group hover:border-[#007AFF]/30 transition-all">
                            <div>
                                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">{item.label}</p>
                                <h4 className={`text-3xl font-bold ${item.sub || 'text-[#1C1C1E] dark:text-white'}`}>{item.val}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-[#F2F2F7] dark:bg-white/5 transition-transform group-hover:scale-110">
                                <item.icon className="w-6 h-6" style={{ color: item.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs - Segmented Control */}
            <div className="p-1.5 bg-[#F2F2F7] dark:bg-white/5 rounded-[18px] flex w-fit gap-1 overflow-x-auto max-w-full">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'crps', label: 'CRP Registry', icon: Users },
                    { id: 'gaps', label: 'Concept Gaps', icon: AlertTriangle },
                    { id: 'subjects', label: 'Subjects', icon: BookOpen },
                    { id: 'heatmap', label: 'Heatmap', icon: Grid3X3 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-white/10 shadow-ios text-[#007AFF] animate-scale-in'
                            : 'text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-8 animate-fade-in">
                    {/* Mode Breakdown */}
                    <div className="card-highlight p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                                <Grid3X3 className="w-4 h-4 text-[#007AFF]" />
                            </div>
                            <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-widest">Inquiry Distribution</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {Object.entries(stats.mode_breakdown).map(([mode, count]) => (
                                <div key={mode} className="text-center p-6 bg-[#F2F2F7] dark:bg-white/5 rounded-[24px] border border-transparent hover:border-[#007AFF]/20 transition-all group">
                                    <p className="text-3xl font-bold text-[#007AFF] mb-1 group-hover:scale-110 transition-transform">{count}</p>
                                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">{mode.replace('_', ' ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Alerts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#FF3B30]/5 dark:bg-[#FF3B30]/10 rounded-[28px] p-8 border border-[#FF3B30]/10 flex items-start gap-6 group hover:border-[#FF3B30]/30 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-[#FF3B30] flex items-center justify-center shadow-lg shadow-[#FF3B30]/20">
                                <AlertTriangle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-bold text-[#FF3B30] uppercase tracking-widest mb-1">Intervention Required</h4>
                                <p className="text-3xl font-bold text-[#1C1C1E] dark:text-white">{crps.filter(c => c.response_rate < 70).length}</p>
                                <p className="text-sm text-[#8E8E93] font-medium mt-2 leading-tight">CRPs with response rate below 70% proficiency threshold.</p>
                            </div>
                        </div>
                        <div className="bg-[#34C759]/5 dark:bg-[#34C759]/10 rounded-[28px] p-8 border border-[#34C759]/10 flex items-start gap-6 group hover:border-[#34C759]/30 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-[#34C759] flex items-center justify-center shadow-lg shadow-[#34C759]/20">
                                <Award className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest mb-1">High Performance</h4>
                                <p className="text-3xl font-bold text-[#1C1C1E] dark:text-white">{crps.filter(c => c.response_rate >= 90).length}</p>
                                <p className="text-sm text-[#8E8E93] font-medium mt-2 leading-tight">Elite CRPs exceeding 90% engagement and quality.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CRP Performance Tab */}
            {activeTab === 'crps' && (
                <div className="card-highlight overflow-hidden animate-fade-in">
                    <div className="p-8 border-b border-[#E5E5EA] dark:border-white/5 bg-[#F2F2F7]/30 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[#007AFF]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-widest">Network Performance</h3>
                                    <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">Benchmarking Regional Resource Persons</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#F2F2F7] dark:bg-white/5">
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Official</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Region</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Load</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Engagement</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Latency</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-center text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                                {crps.map(crp => (
                                    <tr key={crp.id} className="hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#0051FF] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                                    {crp.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-bold text-[#1C1C1E] dark:text-white text-sm">{crp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#8E8E93]">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {crp.district}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-sm font-bold text-[#1C1C1E] dark:text-white">{crp.teachers_count} <span className="text-[10px] text-[#AEAEB2] font-medium uppercase ml-0.5">Docs</span></span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getPerformanceColor(crp.response_rate)}`}>
                                                {crp.response_rate}%
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8E8E93]">
                                                <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
                                                {crp.avg_response_time}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {crp.pending_reviews > 0 ? (
                                                <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#FF9500]/10 text-[#FF9500] uppercase tracking-widest">
                                                    {crp.pending_reviews} Pending
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-[#AEAEB2] font-bold uppercase tracking-widest">Clear</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#FF9500]">
                                                <Star className="w-3.5 h-3.5 fill-[#FF9500]" />
                                                {crp.rating.toFixed(1)}
                                            </div>
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
                <div className="card-highlight overflow-hidden animate-fade-in">
                    <div className="p-8 border-b border-[#FF3B30]/10 bg-[#FF3B30]/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#FF3B30] flex items-center justify-center shadow-lg shadow-[#FF3B30]/20">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#FF3B30] uppercase tracking-widest">Critical Concept Gaps</h3>
                            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">Automated detection of recurring academic friction</p>
                        </div>
                    </div>
                    <div className="divide-y divide-[#E5E5EA] dark:divide-white/5">
                        {gaps.length === 0 ? (
                            <div className="p-20 text-center">
                                <Target className="w-12 h-12 text-[#AEAEB2] mx-auto mb-4" />
                                <p className="text-[#8E8E93] font-medium">No recurring gaps detected</p>
                            </div>
                        ) : (
                            gaps.map((gap, idx) => (
                                <div key={idx} className="p-6 hover:bg-[#F2F2F7] dark:hover:bg-white/5 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-[16px] bg-[#F2F2F7] dark:bg-white/10 flex items-center justify-center group-hover:bg-[#FF3B30]/10 transition-colors">
                                                <BookOpen className="w-6 h-6 text-[#AEAEB2] group-hover:text-[#FF3B30]" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#1C1C1E] dark:text-white mb-1">{gap.topic}</h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                                    <span className="px-2 py-0.5 rounded-full bg-[#F2F2F7] dark:bg-white/10">{gap.subject}</span>
                                                    <span>Grade {gap.grade}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="px-3 py-1 bg-[#FF3B30]/10 text-[#FF3B30] rounded-full text-[10px] font-bold uppercase tracking-widest mb-1.5 inline-block">
                                                {gap.occurrence_count} Incidents
                                            </div>
                                            <p className={`text-xs font-black ${getSuccessColor(100 - gap.failed_rate)}`}>
                                                {gap.failed_rate}% Proficiency Deficit
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {difficulties.length === 0 ? (
                        <div className="md:col-span-2 card p-20 text-center text-[#8E8E93]">
                            No subject data available
                        </div>
                    ) : (
                        difficulties.map((subj, idx) => (
                            <div key={idx} className="card p-8 group hover:border-[#007AFF]/30 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white mb-1.5">{subj.subject}</h3>
                                        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest italic">
                                            {subj.total_queries} Systematic Inquiries
                                        </p>
                                    </div>
                                    <div className={`text-2xl font-black ${getSuccessColor(subj.avg_resolution_rate)}`}>
                                        {subj.avg_resolution_rate}%
                                        <p className="text-[9px] font-bold text-[#AEAEB2] uppercase tracking-widest text-right">Mastery</p>
                                    </div>
                                </div>

                                {subj.top_challenging_topics.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-[#AEAEB2] uppercase tracking-widest border-b border-[#E5E5EA] dark:border-white/5 pb-2">Academic Obstacles</p>
                                        <div className="flex flex-wrap gap-2">
                                            {subj.top_challenging_topics.map((topic, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-[#F2F2F7] dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl text-[11px] font-bold text-[#1C1C1E] dark:text-white group-hover:border-[#007AFF]/20 transition-all">
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
                <div className="card-highlight p-8 animate-fade-in">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                            <Grid3X3 className="w-4 h-4 text-[#007AFF]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-white uppercase tracking-widest">Regional Heatmap</h3>
                            <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mt-0.5">Correlation between academic grade and subject friction</p>
                        </div>
                    </div>

                    {heatmap.length === 0 ? (
                        <div className="p-20 text-center text-[#8E8E93]">No heatmap data available</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            {heatmap.map((cell, idx) => (
                                <div
                                    key={idx}
                                    className={`p-6 rounded-[28px] text-white ${getDifficultyColor(cell.difficulty_score)} shadow-lg shadow-[#000]/5 transition-transform hover:scale-105 cursor-default relative overflow-hidden group`}
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl rounded-full -mr-8 -mt-8" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Grade {cell.grade}</p>
                                    <p className="font-black text-lg mb-4 leading-tight">{cell.subject}</p>
                                    <div className="pt-4 border-t border-white/20">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                            {cell.query_count} Inquiries
                                        </p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Resolution</span>
                                            <span className="text-xs font-black">{cell.success_rate}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-12 flex items-center justify-center gap-8 py-6 bg-[#F2F2F7] dark:bg-white/5 rounded-[24px]">
                        {[
                            { color: '#34C759', label: 'Optimal' },
                            { color: '#FF9500', label: 'Compromised' },
                            { color: '#FF3B30', label: 'Risk Zone' }
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2.5">
                                <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
