import { useState, useRef } from 'react'
import {
    Upload,
    Users,
    FileSpreadsheet,
    Download,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Eye
} from 'lucide-react'
import api from '../../services/api'

interface PreviewUser {
    row: number
    phone: string
    name: string
    role: string
    school_name?: string
    school_district?: string
    valid: boolean
    error?: string
}

export default function BulkUserImport() {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<PreviewUser[]>([])
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setError('')
        setResult(null)
        setLoading(true)

        try {
            // Parse CSV
            const text = await selectedFile.text()
            const lines = text.split('\n').filter(line => line.trim())
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim())

            const users: PreviewUser[] = []
            for (let i = 1; i < lines.length && i <= 10; i++) {
                const values = lines[i].split(',').map(v => v.trim())
                const phoneIdx = headers.indexOf('phone')
                const nameIdx = headers.indexOf('name')
                const roleIdx = headers.indexOf('role')
                const schoolIdx = headers.indexOf('school_name')
                const districtIdx = headers.indexOf('school_district')

                const user: PreviewUser = {
                    row: i + 1,
                    phone: phoneIdx >= 0 ? values[phoneIdx] : '',
                    name: nameIdx >= 0 ? values[nameIdx] : '',
                    role: roleIdx >= 0 ? values[roleIdx]?.toUpperCase() || 'TEACHER' : 'TEACHER',
                    school_name: schoolIdx >= 0 ? values[schoolIdx] : undefined,
                    school_district: districtIdx >= 0 ? values[districtIdx] : undefined,
                    valid: true
                }

                // Validate
                if (!user.phone || user.phone.length < 10) {
                    user.valid = false
                    user.error = 'Invalid phone'
                }
                if (!['TEACHER', 'CRP', 'ARP'].includes(user.role)) {
                    user.valid = false
                    user.error = 'Invalid role'
                }

                users.push(user)
            }

            setPreview(users)
        } catch (err) {
            setError('Failed to parse CSV file')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        if (!file) return

        setImporting(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await api.post('/admin/users/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setResult(response.data)
            setPreview([])
            setFile(null)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Import failed')
        } finally {
            setImporting(false)
        }
    }

    const downloadTemplate = () => {
        const csv = 'phone,name,role,school_name,school_district,school_state\n9876543210,John Doe,TEACHER,Government School,Bangalore Urban,Karnataka'
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'user_import_template.csv'
        a.click()
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Bulk User Import
                        </h1>
                        <p className="text-gray-500 text-sm">Import users from CSV file</p>
                    </div>
                </div>

                <button
                    onClick={downloadTemplate}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    Download Template
                </button>
            </div>

            {/* Messages */}
            {result && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 dark:text-green-300">
                        Import complete! {result.success} users created, {result.failed} failed.
                    </p>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Upload Area */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 transition-colors"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-400">CSV files only</p>
                </div>
            </div>

            {/* Preview */}
            {loading && (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            )}

            {preview.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-gray-500" />
                            <h2 className="font-semibold text-gray-800 dark:text-white">
                                Preview (first 10 rows)
                            </h2>
                        </div>
                        <button
                            onClick={() => { setPreview([]); setFile(null) }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Row</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">School</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {preview.map((user) => (
                                    <tr key={user.row} className={user.valid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                                        <td className="px-4 py-3 text-gray-500">{user.row}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{user.phone}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.name}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded-full text-xs">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.school_name || '-'}</td>
                                        <td className="px-4 py-3">
                                            {user.valid ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Valid
                                                </span>
                                            ) : (
                                                <span className="text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" /> {user.error}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={handleImport}
                            disabled={importing || preview.every(u => !u.valid)}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            Import Users
                        </button>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">CSV Format Requirements</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Required columns: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">phone</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">name</code></li>
                    <li>• Optional columns: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">role</code> (TEACHER/CRP/ARP), <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">school_name</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">school_district</code>, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">school_state</code></li>
                    <li>• Phone numbers must be 10+ digits</li>
                    <li>• Default role is TEACHER if not specified</li>
                </ul>
            </div>
        </div>
    )
}
