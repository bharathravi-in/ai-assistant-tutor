import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Video,
    FileText,
    Layout,
    Target,
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle,
    Image,
    Link as LinkIcon,
    Upload,
    X,
    AlertCircle,
    Hash,
} from 'lucide-react'
import { resourcesApi, storageApi } from '../../services/api'
import { useMasterData } from '../../hooks/useMasterData'

const RESOURCE_TYPES = [
    { value: 'video', label: 'Video', icon: Video, accept: 'video/*' },
    { value: 'document', label: 'Document', icon: FileText, accept: '.pdf,.doc,.docx,.ppt,.pptx' },
    { value: 'guide', label: 'Guide', icon: Layout, accept: '.pdf,.png,.jpg,.jpeg' },
    { value: 'activity', label: 'Activity', icon: Target, accept: '*' },
]

const CATEGORIES = [
    { value: 'pedagogy', label: 'Pedagogy' },
    { value: 'classroom', label: 'Management' },
    { value: 'subject', label: 'Subject' },
    { value: 'assessment', label: 'Assessment' },
]

const isValidUrl = (str: string): boolean => {
    if (!str) return false
    try {
        new URL(str)
        return true
    } catch {
        return false
    }
}

export default function CreateResource() {
    const { grades: masterGrades, subjects: masterSubjects } = useMasterData()
    const GRADES = [...masterGrades.map(g => String(g.number)), 'All']
    const SUBJECTS = [...masterSubjects.map(s => s.name), 'General']
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        category: '',
        grade: '',
        subject: '',
        duration: '',
        content_url: '',
        thumbnail_url: '',
        tags: '',
        is_featured: false
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            handleFileUpload(file)
        }
    }

    const handleFileUpload = async (file: File) => {
        setUploading(true)
        setError(null)
        try {
            const result = await storageApi.uploadFile(file, 'resources')
            setFormData(prev => ({ ...prev, content_url: result.url }))
        } catch (err) {
            setError('Upload failed. Please try again.')
            setSelectedFile(null)
        } finally {
            setUploading(false)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setFormData(prev => ({ ...prev, content_url: '' }))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isFormValid) return

        setSubmitting(true)
        setError(null)
        try {
            await resourcesApi.createResource({
                ...formData,
                description: formData.description || undefined,
                grade: formData.grade || undefined,
                subject: formData.subject || undefined,
                duration: formData.duration || undefined,
                content_url: formData.content_url,
                thumbnail_url: formData.thumbnail_url || undefined,
                tags: formData.tags || undefined,
            })
            setSuccess(true)
            setTimeout(() => navigate(-1), 1500)
        } catch (err) {
            setError('Failed to publish resource. Please check all fields.')
        } finally {
            setSubmitting(false)
        }
    }

    const isContentUrlValid = isValidUrl(formData.content_url)
    const isThumbnailUrlValid = !formData.thumbnail_url || isValidUrl(formData.thumbnail_url)
    const isFormValid = formData.title && formData.type && formData.category && isContentUrlValid && isThumbnailUrlValid && !uploading

    const selectedType = RESOURCE_TYPES.find(t => t.value === formData.type)

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resource Published!</h2>
                <p className="text-gray-500 text-sm mt-1">Redirecting...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 pb-8">
            {/* Gradient Header Banner */}
            <div className="header-gradient mb-6 mt-4">
                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                <ArrowLeft className="w-5 h-5 text-white" />
                            </button>
                            <h1 className="text-2xl font-bold text-white">Create Resource</h1>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !isFormValid}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Publish
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <p className="text-rose-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Row 1: Type & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Format *</label>
                        <div className="grid grid-cols-4 gap-2">
                            {RESOURCE_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value })}
                                    className={`p-3 rounded-lg border text-center transition-all ${formData.type === type.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                        }`}
                                >
                                    <type.icon className={`w-5 h-5 mx-auto mb-1 ${formData.type === type.value ? 'text-primary-500' : 'text-gray-400'}`} />
                                    <p className={`text-[10px] font-bold ${formData.type === type.value ? 'text-primary-600' : 'text-gray-500'}`}>{type.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Category *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.value })}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${formData.category === cat.value
                                        ? 'border-primary-500 bg-primary-600 text-white'
                                        : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-200'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Title */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter a clear, descriptive title"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                </div>

                {/* Row 3: Upload & URLs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Content Source *</label>

                    {!selectedFile ? (
                        <div className={`relative h-28 flex items-center justify-center border-2 border-dashed rounded-xl transition-all ${formData.type ? 'border-primary-200 hover:border-primary-500 cursor-pointer' : 'border-gray-100 opacity-50'
                            }`}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept={selectedType?.accept || '*'}
                                disabled={!formData.type}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="text-center">
                                <Upload className={`w-6 h-6 mx-auto mb-1 ${formData.type ? 'text-primary-500' : 'text-gray-300'}`} />
                                <p className="text-xs font-bold text-gray-500">{formData.type ? 'Click to upload' : 'Select format first'}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500 text-white rounded-lg flex items-center justify-center">
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                                <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <button type="button" onClick={removeFile} className="p-1 hover:bg-rose-100 rounded-full"><X className="w-4 h-4 text-rose-500" /></button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Content URL *</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.content_url}
                                    onChange={e => setFormData({ ...formData, content_url: e.target.value })}
                                    placeholder="https://..."
                                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none ${formData.content_url && !isContentUrlValid ? 'border-rose-400 focus:ring-rose-500' : 'border-transparent focus:ring-primary-500'
                                        } focus:ring-2`}
                                />
                            </div>
                            {formData.content_url && !isContentUrlValid && <p className="text-[10px] text-rose-500 mt-1">Please enter a valid URL</p>}
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Thumbnail URL</label>
                            <div className="relative">
                                <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={formData.thumbnail_url}
                                    onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                    placeholder="https://..."
                                    className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none ${formData.thumbnail_url && !isThumbnailUrlValid ? 'border-rose-400 focus:ring-rose-500' : 'border-transparent focus:ring-primary-500'
                                        } focus:ring-2`}
                                />
                            </div>
                            {formData.thumbnail_url && !isThumbnailUrlValid && <p className="text-[10px] text-rose-500 mt-1">Please enter a valid URL</p>}
                        </div>
                    </div>
                </div>

                {/* Row 4: Metadata */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Metadata</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Grade</label>
                            <select value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold outline-none">
                                <option value="">Any</option>
                                {GRADES.map(g => <option key={g} value={g}>{g === 'All' ? 'All' : `Grade ${g}`}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Subject</label>
                            <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold outline-none">
                                <option value="">General</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Duration</label>
                            <input type="text" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g. 15 min" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tags</label>
                            <div className="relative">
                                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="comma,sep" className="w-full pl-7 pr-2 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-xs font-bold outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 5: Description & Featured */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the resource content and learning outcomes..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Featured</p>
                                <p className="text-[10px] text-gray-500">Pin to spotlight</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                                className={`w-11 h-6 rounded-full transition-all flex items-center px-1 ${formData.is_featured ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${formData.is_featured ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
