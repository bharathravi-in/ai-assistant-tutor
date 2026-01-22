/**
 * MyVisits - Teacher view of scheduled interventions/visits from CRPs
 */
import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, CalendarCheck, CalendarPlus } from 'lucide-react'
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

const purposeLabels: Record<string, { label: string; color: string }> = {
    routine: { label: 'Routine Visit', color: 'bg-blue-100 text-blue-700' },
    follow_up: { label: 'Follow-up', color: 'bg-amber-100 text-amber-700' },
    training: { label: 'Training', color: 'bg-purple-100 text-purple-700' },
    observation: { label: 'Observation', color: 'bg-green-100 text-green-700' },
}

const statusIcons: Record<string, JSX.Element> = {
    scheduled: <CalendarCheck className="w-4 h-4 text-blue-500" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    cancelled: <XCircle className="w-4 h-4 text-red-500" />,
}

// Generate Google Calendar URL for a visit
const generateCalendarUrl = (visit: Visit): string => {
    const startDate = new Date(`${visit.date}T${visit.time}:00`)
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
    const startDate = new Date(`${visit.date}T${visit.time}:00`)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

    const formatIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EducationAI//CRP Visit//EN
BEGIN:VEVENT
UID:visit-${visit.id}@educationai.com
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
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes} ${ampm}`
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRP Visits</h1>
                    <p className="text-gray-500">Interventions and support visits scheduled by your CRP</p>
                </div>
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
                <div className="space-y-3">
                    {displayVisits.map((visit) => (
                        <div key={visit.id} className="card p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {statusIcons[visit.status]}
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${purposeLabels[visit.purpose]?.color || 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {purposeLabels[visit.purpose]?.label || visit.purpose}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(visit.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(visit.time)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            <MapPin className="w-4 h-4" />
                                            <span>{visit.school}</span>
                                        </div>
                                    </div>

                                    {visit.notes && (
                                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                            {visit.notes}
                                        </p>
                                    )}

                                    {/* Add to Calendar buttons - only for scheduled visits */}
                                    {visit.status === 'scheduled' && (
                                        <div className="mt-3 flex gap-2">
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

                                <div className={`px-2 py-1 text-xs font-medium rounded ${visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

