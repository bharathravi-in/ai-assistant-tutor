import { useState, useEffect } from 'react'
import {
    Calendar,
    MapPin,
    Clock,
    Plus,
    CheckCircle,
    XCircle,
    User,
    Target,
    X,
    Loader2
} from 'lucide-react'
import { crpApi } from '../../services/api'

interface Visit {
    id: number
    school: string
    teacher: string
    date: string
    time: string
    purpose: 'routine' | 'follow_up' | 'training' | 'observation'
    status: 'scheduled' | 'completed' | 'cancelled'
    notes?: string
}

const PURPOSE_CONFIG: Record<string, { label: string; color: string }> = {
    routine: { label: 'Routine Visit', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    follow_up: { label: 'Follow Up', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    training: { label: 'Training', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    observation: { label: 'Observation', color: 'bg-green-100 text-green-700 border-green-200' },
}

export default function VisitSchedule() {
    const [visits, setVisits] = useState<Visit[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewVisit, setShowNewVisit] = useState(false)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [newVisit, setNewVisit] = useState({
        school: '',
        teacher: '',
        date: '',
        time: '10:00',
        purpose: 'routine' as const
    })

    useEffect(() => {
        loadVisits()
    }, [])

    const loadVisits = async () => {
        try {
            const data = await crpApi.getVisits()
            setVisits(data.visits || [])
        } catch (err) {
            console.error('Failed to load visits:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateVisit = async () => {
        if (!newVisit.school || !newVisit.teacher || !newVisit.date) return

        setSubmitting(true)
        try {
            await crpApi.createVisit({
                school: newVisit.school,
                teacher_name: newVisit.teacher,
                date: newVisit.date,
                time: newVisit.time,
                purpose: newVisit.purpose
            })
            setShowNewVisit(false)
            setNewVisit({ school: '', teacher: '', date: '', time: '10:00', purpose: 'routine' })
            loadVisits()
        } catch (err) {
            console.error('Failed to create visit:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const markComplete = async (id: number, notes: string) => {
        try {
            await crpApi.updateVisit(id, { status: 'completed', notes })
            loadVisits()
            setSelectedVisit(null)
        } catch (err) {
            console.error('Failed to complete visit:', err)
        }
    }

    const cancelVisit = async (id: number) => {
        try {
            await crpApi.updateVisit(id, { status: 'cancelled' })
            loadVisits()
            setSelectedVisit(null)
        } catch (err) {
            console.error('Failed to cancel visit:', err)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700'
            case 'cancelled': return 'bg-red-100 text-red-700'
            default: return 'bg-blue-100 text-blue-700'
        }
    }

    // Get visits for display
    const upcomingVisits = visits.filter(v => v.status === 'scheduled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const pastVisits = visits.filter(v => v.status !== 'scheduled').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visit Schedule</h1>
                    <p className="text-gray-500">Plan and track school visits</p>
                </div>
                <button
                    onClick={() => setShowNewVisit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Schedule Visit
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingVisits.length}</p>
                            <p className="text-xs text-gray-500">Upcoming</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visits.filter(v => v.status === 'completed').length}</p>
                            <p className="text-xs text-gray-500">Completed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Target className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visits.filter(v => v.purpose === 'follow_up').length}</p>
                            <p className="text-xs text-gray-500">Follow-ups</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Set(visits.map(v => v.teacher)).size}</p>
                            <p className="text-xs text-gray-500">Teachers Visited</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Visits */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Visits</h2>
                </div>
                {upcomingVisits.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No upcoming visits scheduled</p>
                        <button
                            onClick={() => setShowNewVisit(true)}
                            className="mt-3 text-primary-500 font-medium hover:underline"
                        >
                            Schedule your first visit
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {upcomingVisits.map(visit => (
                            <div
                                key={visit.id}
                                onClick={() => setSelectedVisit(visit)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-primary-50 dark:bg-primary-900/30 rounded-lg px-3 py-2">
                                            <p className="text-xs text-primary-600 font-medium">
                                                {new Date(visit.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                                            </p>
                                            <p className="text-xl font-bold text-primary-700">
                                                {new Date(visit.date).getDate()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{visit.school}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <User className="w-3 h-3" />
                                                {visit.teacher}
                                                <span>•</span>
                                                <Clock className="w-3 h-3" />
                                                {visit.time}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${PURPOSE_CONFIG[visit.purpose].color}`}>
                                        {PURPOSE_CONFIG[visit.purpose].label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Visits */}
            {pastVisits.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visit History</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {pastVisits.slice(0, 5).map(visit => (
                            <div key={visit.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${visit.status === 'completed' ? 'bg-green-100' : 'bg-red-100'}`}>
                                            {visit.status === 'completed' ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{visit.school}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(visit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(visit.status)}`}>
                                        {visit.status}
                                    </span>
                                </div>
                                {visit.notes && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 ml-14 italic">
                                        "{visit.notes}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Visit Modal */}
            {showNewVisit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-primary-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Schedule New Visit</h3>
                                <button onClick={() => setShowNewVisit(false)} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School</label>
                                <input
                                    type="text"
                                    value={newVisit.school}
                                    onChange={e => setNewVisit({ ...newVisit, school: e.target.value })}
                                    placeholder="e.g., GPS Rampur"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher</label>
                                <input
                                    type="text"
                                    value={newVisit.teacher}
                                    onChange={e => setNewVisit({ ...newVisit, teacher: e.target.value })}
                                    placeholder="e.g., Priya Sharma"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newVisit.date}
                                        onChange={e => setNewVisit({ ...newVisit, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newVisit.time}
                                        onChange={e => setNewVisit({ ...newVisit, time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                                <select
                                    value={newVisit.purpose}
                                    onChange={e => setNewVisit({ ...newVisit, purpose: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="routine">Routine Visit</option>
                                    <option value="follow_up">Follow Up</option>
                                    <option value="training">Training</option>
                                    <option value="observation">Observation</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex gap-3">
                            <button
                                onClick={() => setShowNewVisit(false)}
                                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVisit}
                                disabled={!newVisit.school || !newVisit.teacher || !newVisit.date}
                                className="flex-1 py-2 px-4 rounded-lg bg-primary-500 text-white font-medium disabled:opacity-50"
                            >
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Visit Detail Modal */}
            {selectedVisit && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-primary-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Visit Details</h3>
                                <button onClick={() => setSelectedVisit(null)} className="text-white/70 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedVisit.school}</p>
                                    <p className="text-sm text-gray-500">{selectedVisit.teacher}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(selectedVisit.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <p className="text-gray-900 dark:text-white">{selectedVisit.time}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-gray-400" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${PURPOSE_CONFIG[selectedVisit.purpose].color}`}>
                                    {PURPOSE_CONFIG[selectedVisit.purpose].label}
                                </span>
                            </div>
                            {selectedVisit.status === 'scheduled' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Completion Notes</label>
                                    <textarea
                                        id="visit-notes"
                                        placeholder="Add notes about the visit..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex gap-3">
                            {selectedVisit.status === 'scheduled' ? (
                                <>
                                    <button
                                        onClick={() => cancelVisit(selectedVisit.id)}
                                        className="flex-1 py-2 px-4 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50"
                                    >
                                        Cancel Visit
                                    </button>
                                    <button
                                        onClick={() => {
                                            const notes = (document.getElementById('visit-notes') as HTMLTextAreaElement)?.value || ''
                                            markComplete(selectedVisit.id, notes)
                                        }}
                                        className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600"
                                    >
                                        <CheckCircle className="w-4 h-4 inline mr-1" />
                                        Mark Complete
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="flex-1 py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
