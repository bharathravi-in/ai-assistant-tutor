import { useState, useEffect } from 'react'
import {
    FileText,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    ThumbsUp,
    ThumbsDown,
    X,
    User,
    Filter
} from 'lucide-react'
import { programApi } from '../../services/api'

interface PublishRequest {
    id: number
    resource_id: number
    resource_title: string | null
    requested_by_name: string | null
    status: string
    review_notes: string | null
    requested_at: string
    reviewed_at: string | null
}

export default function TeacherResources() {
    const [requests, setRequests] = useState<PublishRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<PublishRequest | null>(null)
    const [reviewNotes, setReviewNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

    useEffect(() => {
        loadRequests()
    }, [])

    const loadRequests = async () => {
        try {
            const data = await programApi.getPublishRequests()
            setRequests(data.items || [])
        } catch (err) {
            console.error('Failed to load publish requests:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = async (approve: boolean) => {
        if (!selectedRequest) return
        setSubmitting(true)

        try {
            await programApi.reviewPublishRequest(selectedRequest.id, approve, reviewNotes || undefined)
            setSelectedRequest(null)
            setReviewNotes('')
            loadRequests()
        } catch (err) {
            console.error('Failed to review request:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true
        return r.status === filter
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                )
            case 'approved':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Approved
                    </span>
                )
            case 'rejected':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected
                    </span>
                )
            default:
                return null
        }
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
                                <h1 className="text-2xl font-bold text-white">Teacher Resources</h1>
                                <p className="text-white/70 text-sm">Review and publish teacher-created content</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                                <span className="text-2xl font-bold text-white">
                                    {requests.filter(r => r.status === 'pending').length}
                                </span>
                                <span className="text-sm text-white/70 ml-1">pending</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 mr-2">Status:</span>
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Request List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No publish requests found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Requests appear here when teachers submit resources for review
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                onClick={() => {
                                    setSelectedRequest(request)
                                    setReviewNotes(request.review_notes || '')
                                }}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                {request.resource_title || 'Untitled Resource'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{request.requested_by_name || 'Unknown Teacher'}</span>
                                                <span className="text-gray-300">•</span>
                                                <span>{new Date(request.requested_at).toLocaleDateString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(request.status)}
                                        <Eye className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Review Resource</h3>
                                        <p className="text-white/70 text-sm">Publish to library</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Resource</label>
                                <p className="text-gray-800 dark:text-white mt-1 font-medium">
                                    {selectedRequest.resource_title || 'Untitled Resource'}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Submitted By</label>
                                <p className="text-gray-800 dark:text-white mt-1">
                                    {selectedRequest.requested_by_name || 'Unknown Teacher'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(selectedRequest.requested_at).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                                    Review Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add feedback for the teacher..."
                                    className="w-full p-4 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                                    rows={3}
                                />
                            </div>

                            {selectedRequest.status !== 'pending' && (
                                <div className={`p-3 rounded-lg ${selectedRequest.status === 'approved'
                                    ? 'bg-green-50 dark:bg-green-900/20'
                                    : 'bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                    <p className={`text-sm ${selectedRequest.status === 'approved'
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-red-700 dark:text-red-400'
                                        }`}>
                                        {selectedRequest.status === 'approved' ? (
                                            <><CheckCircle className="w-4 h-4 inline mr-1" /> Already approved</>
                                        ) : (
                                            <><XCircle className="w-4 h-4 inline mr-1" /> Already rejected</>
                                        )}
                                        {selectedRequest.reviewed_at && ` on ${new Date(selectedRequest.reviewed_at).toLocaleDateString('en-IN')}`}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {selectedRequest.status === 'pending' && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                                <button
                                    onClick={() => handleReview(false)}
                                    disabled={submitting}
                                    className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ThumbsDown className="w-4 h-4" />
                                            Reject
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleReview(true)}
                                    disabled={submitting}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <ThumbsUp className="w-4 h-4" />
                                            Approve & Publish
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {selectedRequest.status !== 'pending' && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="w-full py-3 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
