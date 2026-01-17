import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Lock, User, Loader2, GraduationCap, ArrowRight, CheckCircle, Eye, EyeOff, Building2, BookOpen, Briefcase, MapPin } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function RegisterPage() {
    useTranslation()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    const [formData, setFormData] = useState({
        phone: '',
        name: '',
        password: '',
        school: '',
        district: '',
        subjects: '',
        experience: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!acceptTerms) {
            setError('Please accept the Terms and Conditions to continue.')
            return
        }

        setLoading(true)

        try {
            const response = await authApi.register(formData)
            setAuth(response.user, response.access_token)
            navigate('/')
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } }
            setError(error.response?.data?.detail || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const features = [
        'AI-powered teaching assistant',
        'Voice-enabled interactions',
        'Multilingual support (Hindi, Tamil, Telugu)',
        'NCERT curriculum aligned content',
        'Lesson planning & classroom management'
    ]

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)' }}
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: '#059669', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#10b981', transform: 'translate(-30%, 30%)' }} />
                <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full opacity-5" style={{ background: '#ffffff', transform: 'translate(-50%, -50%)' }} />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#059669' }}>
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-white">Gov-Tech</span>
                            <p className="text-white/70 text-sm">AI Teaching Assistant</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Join the Future of<br />
                            <span style={{ color: '#34d399' }}>Education</span>
                        </h1>
                        <p className="text-lg text-white/80 max-w-md">
                            Get instant AI support for your classroom. Free for all government school teachers.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(52, 211, 153, 0.3)' }}>
                                    <CheckCircle className="w-4 h-4 text-emerald-300" />
                                </div>
                                <span className="text-white/90">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-white/60 text-sm">
                        © 2026 Gov-Tech. Ministry of Education, Government of India.
                    </p>
                </div>
            </div>

            {/* Right side - Register form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 dark:bg-gray-900 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg" style={{ background: '#2563EB' }}>
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-500">Gov-Tech</h1>
                    </div>

                    {/* Welcome text */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
                        <p className="text-gray-500 mt-1">Start your journey with AI-powered teaching</p>
                    </div>

                    {/* Register card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            {/* Personal Information Section */}
                            <div className="space-y-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Personal Information</p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                            placeholder="Create a password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details Section */}
                            <div className="space-y-4 pt-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Professional Details</p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            School Name
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="school"
                                                value={formData.school}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                                placeholder="School"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            District
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="district"
                                                value={formData.district}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                                placeholder="District"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Subjects
                                        </label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="subjects"
                                                value={formData.subjects}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                                                placeholder="e.g., Maths, Science"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Experience
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <select
                                                name="experience"
                                                value={formData.experience}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm appearance-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="0-2">0-2 years</option>
                                                <option value="3-5">3-5 years</option>
                                                <option value="6-10">6-10 years</option>
                                                <option value="10+">10+ years</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className="pt-2">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        I agree to the <a href="#" className="text-primary-500 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-secondary-500 to-secondary-600"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-5 text-center">
                            <p className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-semibold text-primary-500 hover:text-primary-600 transition-colors hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
