/**
 * MyVisits - Teacher view of scheduled interventions/visits from CRPs
 * 
 * Simple read-only view - teachers see upcoming CRP visits to be prepared
 */
import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, CalendarCheck, CalendarPlus, User } from 'lucide-react'
import { teacherApi } from '../../services/api'

interface Visit {
    id: number
    school: string
    teacher: string
    date: string
    time: string
    purpose: string
    status: string
    notes?: string
    created_at: string
}

interface VisitsResponse {
    visits: Visit[]
    upcoming: Visit[]
    past: Visit[]
    total: number
    stats: {
        upcoming_count: number
        completed: number
        cancelled: number
    }
}

const purposeLabels: Record<string, { label: string; color: string; icon: string }> = {
    routine: { label: 'Routine Visit', color: 'bg-blue-100 text-blue-700', icon: '📋' },
    follow_up: { label: 'Follow-up', color: 'bg-amber-100 text-amber-700', icon: '🔄' },
    training: { label: 'Training', color: 'bg-purple-100 text-purple-700', icon: '📚' },
    observation: { label: 'Classroom Observation', color: 'bg-green-100 text-green-700', icon: '👀' },
    support: { label: 'Support Visit', color: 'bg-indigo-100 text-indigo-700', icon: '🤝' },
    assessment: { label: 'Assessment', color: 'bg-pink-100 text-pink-700', icon: '📝' },
}

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: <CalendarCheck className="w-4 h-4" /> },
    confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> },
}

// Generate Google Calendar URL for a visit
const generateCalendarUrl = (visit: Visit): string => {
    const startDate = new Date(`${visit.date}T${visit.time || '10:00'}:00`)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration

    const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    const title = encodeURIComponent(`CRP Visit: ${purposeLabels[visit.purpose]?.label || visit.purpose}`)
    const description = encodeURIComponent(`CRP visit at ${visit.school}${visit.notes ? '\n\nNotes: ' + visit.notes : ''}`)
    const location = encodeURIComponent(visit.school)
    const dates = `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${description}&location=${location}`
}

// Generate ICS file content for download
const generateIcsContent = (visit: Visit): string => {
    const startDate = new Date(`${visit.date}T${visit.time || '10:00'}:00`)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const formatIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pathshala//CRP Visit//EN
BEGIN:VEVENT
UID:visit-${visit.id}@Pathshala.com
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
SUMMARY:CRP Visit: ${purposeLabels[visit.purpose]?.label || visit.purpose}
DESCRIPTION:CRP visit at ${visit.school}${visit.notes ? '\\nNotes: ' + visit.notes : ''}
LOCATION:${visit.school}
END:VEVENT
END:VCALENDAR`
}

const downloadIcs = (visit: Visit) => {
    const content = generateIcsContent(visit)
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `crp-visit-${visit.date}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export default function MyVisits() {
    const [data, setData] = useState<VisitsResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

    useEffect(() => {
        loadVisits()
    }, [])

    const loadVisits = async () => {
        try {
            const result = await teacherApi.getMyVisits()
            setData(result)
        } catch (err) {
            console.error('Failed to load visits:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'Time TBD'
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
    }

    const getDaysUntil = (dateStr: string) => {
        const visitDate = new Date(dateStr)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        visitDate.setHours(0, 0, 0, 0)
        const diffTime = visitDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return { text: 'Today', color: 'text-red-600 bg-red-50' }
        if (diffDays === 1) return { text: 'Tomorrow', color: 'text-orange-600 bg-orange-50' }
        if (diffDays <= 7) return { text: `In ${diffDays} days`, color: 'text-blue-600 bg-blue-50' }
        return { text: `In ${diffDays} days`, color: 'text-gray-600 bg-gray-50' }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
        )
    }

    const displayVisits = activeTab === 'upcoming' ? data?.upcoming : data?.past

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRP Visits</h1>
                <p className="text-gray-500">Support visits scheduled by your Cluster Resource Person</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-[#007AFF]">{data?.stats.upcoming_count || 0}</div>
                    <div className="text-xs text-gray-500">Upcoming</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{data?.stats.completed || 0}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-gray-400">{data?.stats.cancelled || 0}</div>
                    <div className="text-xs text-gray-500">Cancelled</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upcoming'
                        ? 'border-[#007AFF] text-[#007AFF]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Upcoming ({data?.upcoming?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'past'
                        ? 'border-[#007AFF] text-[#007AFF]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Past ({data?.past?.length || 0})
                </button>
            </div>

            {/* Visits List */}
            {!displayVisits || displayVisits.length === 0 ? (
                <div className="card p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {activeTab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {activeTab === 'upcoming'
                            ? 'Your CRP will schedule visits to support you'
                            : 'Your visit history will appear here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayVisits.map((visit) => {
                        const daysInfo = activeTab === 'upcoming' ? getDaysUntil(visit.date) : null
                        const purposeInfo = purposeLabels[visit.purpose] || { label: visit.purpose, color: 'bg-gray-100 text-gray-700', icon: '📅' }
                        const statusInfo = statusConfig[visit.status] || statusConfig.scheduled

                        return (
                            <div key={visit.id} className="card p-5 hover:shadow-lg transition-all duration-200">
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{purposeInfo.icon}</div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                {purposeInfo.label}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {daysInfo && (
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${daysInfo.color}`}>
                                            {daysInfo.text}
                                        </span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{formatDate(visit.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{formatTime(visit.time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{visit.school}</span>
                                    </div>
                                </div>

                                {/* Notes from CRP */}
                                {visit.notes && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <User className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Message from CRP</p>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">{visit.notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Calendar Actions - only for upcoming visits */}
                                {activeTab === 'upcoming' && visit.status !== 'cancelled' && (
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <a
                                            href={generateCalendarUrl(visit)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#007AFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
                                        >
                                            <CalendarPlus className="w-3.5 h-3.5" />
                                            Add to Google Calendar
                                        </a>
                                        <button
                                            onClick={() => downloadIcs(visit)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <CalendarPlus className="w-3.5 h-3.5" />
                                            Download .ics
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Info Banner */}
            {activeTab === 'upcoming' && data?.upcoming && data.upcoming.length > 0 && (
                <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 <strong>Tip:</strong> Add visits to your calendar to ensure you're prepared. Your CRP visits are an opportunity for professional development and support.
                    </p>
                </div>
            )}
        </div>
    )
}
