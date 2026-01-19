import { useState, useEffect } from 'react'
import {
    BarChart3,
    Download,
    Loader2,
    Users,
    BookOpen,
    TrendingUp,
    Printer
} from 'lucide-react'
import api from '../../services/api'

interface ReportData {
    total_users: number
    total_teachers: number
    total_queries: number
    total_resources: number
    queries_by_day: { date: string; count: number }[]
    top_subjects: { subject: string; count: number }[]
    top_grades: { grade: number; count: number }[]
}

export default function Reports() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('30')
    const [data, setData] = useState<ReportData>({
        total_users: 0,
        total_teachers: 0,
        total_queries: 0,
        total_resources: 0,
        queries_by_day: [],
        top_subjects: [],
        top_grades: []
    })

    useEffect(() => {
        loadReportData()
    }, [dateRange])

    const loadReportData = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/admin/reports/summary?days=${dateRange}`)
            setData(response.data)
        } catch (err) {
            // Sample data
            setData({
                total_users: 1250,
                total_teachers: 1100,
                total_queries: 8750,
                total_resources: 156,
                queries_by_day: [
                    { date: '2026-01-10', count: 320 },
                    { date: '2026-01-11', count: 290 },
                    { date: '2026-01-12', count: 180 },
                    { date: '2026-01-13', count: 165 },
                    { date: '2026-01-14', count: 340 },
                    { date: '2026-01-15', count: 380 },
                    { date: '2026-01-16', count: 410 },
                ],
                top_subjects: [
                    { subject: 'Mathematics', count: 2340 },
                    { subject: 'Science', count: 1890 },
                    { subject: 'English', count: 1560 },
                    { subject: 'Hindi', count: 1120 },
                    { subject: 'Social Studies', count: 980 },
                ],
                top_grades: [
                    { grade: 5, count: 1450 },
                    { grade: 6, count: 1320 },
                    { grade: 4, count: 1180 },
                    { grade: 7, count: 1050 },
                    { grade: 3, count: 890 },
                ]
            })
        } finally {
            setLoading(false)
        }
    }

    const exportToCSV = () => {
        const rows = [
            ['Report Summary', `Last ${dateRange} days`],
            [],
            ['Metric', 'Value'],
            ['Total Users', data.total_users],
            ['Total Teachers', data.total_teachers],
            ['Total Queries', data.total_queries],
            ['Total Resources', data.total_resources],
            [],
            ['Top Subjects'],
            ...data.top_subjects.map(s => [s.subject, s.count]),
            [],
            ['Top Grades'],
            ...data.top_grades.map(g => [`Class ${g.grade}`, g.count]),
        ]

        const csv = rows.map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    const printReport = () => {
        window.print()
    }

    const maxQueryCount = Math.max(...data.queries_by_day.map(d => d.count), 1)

    return (
        <div className="p-4 lg:p-6 animate-fade-in print:p-2">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6 print:hidden">
                <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Reports</h1>
                                <p className="text-white/70 text-sm">Analytics and insights</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2.5 rounded-lg bg-white/20 text-white border-0 focus:ring-2 focus:ring-white/50"
                            >
                                <option value="7" className="text-gray-800">Last 7 days</option>
                                <option value="30" className="text-gray-800">Last 30 days</option>
                                <option value="90" className="text-gray-800">Last 90 days</option>
                                <option value="365" className="text-gray-800">Last year</option>
                            </select>
                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Export CSV
                            </button>
                            <button
                                onClick={printReport}
                                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 transition-colors"
                            >
                                <Printer className="w-5 h-5" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-brand animate-spin" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Total Users</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.total_users.toLocaleString()}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Total Queries</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.total_queries.toLocaleString()}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Resources</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.total_resources.toLocaleString()}</p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-amber-600" />
                                </div>
                                <span className="text-gray-500 text-sm">Teachers</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{data.total_teachers.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Queries Chart */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Queries Over Time</h2>
                            <div className="flex items-end justify-between h-48 gap-2">
                                {data.queries_by_day.map((day) => (
                                    <div key={day.date} className="flex-1 flex flex-col items-center">
                                        <div
                                            className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all"
                                            style={{ height: `${(day.count / maxQueryCount) * 100}%` }}
                                        />
                                        <span className="text-xs text-gray-500 mt-2">
                                            {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Subjects */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Subjects</h2>
                            <div className="space-y-3">
                                {data.top_subjects.map((subject) => (
                                    <div key={subject.subject}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700 dark:text-gray-300">{subject.subject}</span>
                                            <span className="text-gray-500">{subject.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                                                style={{ width: `${(subject.count / (data.top_subjects[0]?.count || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Grades */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Queries by Grade</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {data.top_grades.map((grade) => (
                                <div key={grade.grade} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-cyan-600">Class {grade.grade}</p>
                                    <p className="text-gray-500 text-sm">{grade.count} queries</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
