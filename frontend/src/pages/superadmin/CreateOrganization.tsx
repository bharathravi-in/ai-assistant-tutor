import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Building2,
    User,
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

export default function CreateOrganization() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        // Organization details
        name: '',
        slug: '',
        contact_email: '',
        subscription_plan: 'free',
        // Admin user details
        admin_name: '',
        admin_phone: '',
        admin_password: ''
    })

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2)
        } else if (step === 2 && validateStep2()) {
            handleSubmit()
        }
    }

    const validateStep1 = () => {
        if (!formData.name.trim()) {
            setError('Organization name is required')
            return false
        }
        if (!formData.slug.trim()) {
            setError('Organization slug is required')
            return false
        }
        setError('')
        return true
    }

    const validateStep2 = () => {
        if (!formData.admin_name.trim()) {
            setError('Admin name is required')
            return false
        }
        if (!formData.admin_phone.trim() || formData.admin_phone.length < 10) {
            setError('Valid admin phone is required')
            return false
        }
        if (!formData.admin_password.trim() || formData.admin_password.length < 6) {
            setError('Password must be at least 6 characters')
            return false
        }
        setError('')
        return true
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/organizations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    navigate('/superadmin/organizations')
                }, 2000)
            } else {
                const data = await response.json()
                setError(data.detail || 'Failed to create organization')
            }
        } catch (err) {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Organization Created!
                    </h2>
                    <p className="text-gray-500 mb-4">
                        {formData.name} has been created with admin user {formData.admin_name}
                    </p>
                    <p className="text-sm text-gray-400">Redirecting to organizations list...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/superadmin')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create New Organization
                </h1>
                <p className="text-gray-500 mt-2">
                    Set up a new organization and its admin user
                </p>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center mb-8">
                <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                        {step > 1 ? <Check className="w-5 h-5" /> : '1'}
                    </div>
                    <span className={`ml-3 font-medium ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                        Organization Details
                    </span>
                </div>
                <div className="flex-1 h-1 mx-4 bg-gray-200 rounded">
                    <div className={`h-full rounded transition-all ${step > 1 ? 'bg-indigo-600 w-full' : 'w-0'}`} />
                </div>
                <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                        2
                    </div>
                    <span className={`ml-3 font-medium ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
                        Admin User
                    </span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Step Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Organization Details
                                </h2>
                                <p className="text-sm text-gray-500">Basic information about the organization</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Organization Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    name: e.target.value,
                                    slug: generateSlug(e.target.value)
                                })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="Acme Schools"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Slug (URL-friendly) *
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="acme-schools"
                            />
                            <p className="text-xs text-gray-400 mt-1">Used in URLs. Only lowercase letters, numbers, and hyphens.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contact Email
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="admin@acme.edu"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Subscription Plan
                            </label>
                            <select
                                value={formData.subscription_plan}
                                onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="free">Free</option>
                                <option value="starter">Starter</option>
                                <option value="professional">Professional</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Admin User
                                </h2>
                                <p className="text-sm text-gray-500">Create the organization's admin account</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Creating admin for: <strong>{formData.name}</strong>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admin Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.admin_name}
                                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admin Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.admin_phone}
                                onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="9876543210"
                            />
                            <p className="text-xs text-gray-400 mt-1">Admin will login with this phone number</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Admin Password *
                            </label>
                            <input
                                type="password"
                                value={formData.admin_password}
                                onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/superadmin')}
                        className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : step === 2 ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Create Organization
                            </>
                        ) : (
                            <>
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
