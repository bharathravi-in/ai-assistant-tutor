import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Lock, User, UserPlus, Loader2, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function RegisterPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    const [formData, setFormData] = useState({
        phone: '',
        name: '',
        password: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
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
        'Multilingual support',
        'Lesson planning & classroom management'
    ]

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: '#EF951E', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#F69953', transform: 'translate(-30%, 30%)' }} />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#EF951E' }}>
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">AI Teaching</span>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Join the Future of<br />
                            <span style={{ color: '#F69953' }}>Education</span>
                        </h1>
                        <p className="text-lg text-white/80 max-w-md">
                            Get instant AI support for your classroom. Free for all government school teachers.
                        </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(246, 153, 83, 0.3)' }}>
                                    <CheckCircle className="w-4 h-4" style={{ color: '#F69953' }} />
                                </div>
                                <span className="text-white/90">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-white/60 text-sm">
                        By registering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>

            {/* Right side - Register form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#264092' }}>
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: '#264092' }}>AI Teaching</h1>
                    </div>

                    {/* Welcome text */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
                        <p className="text-gray-500 mt-2">Start your journey with AI-powered teaching</p>
                    </div>

                    {/* Register card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'rgba(38, 64, 146, 0.3)' } as React.CSSProperties}
                                        onFocus={(e) => e.target.style.borderColor = '#264092'}
                                        onBlur={(e) => e.target.style.borderColor = ''}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'rgba(38, 64, 146, 0.3)' } as React.CSSProperties}
                                        onFocus={(e) => e.target.style.borderColor = '#264092'}
                                        onBlur={(e) => e.target.style.borderColor = ''}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'rgba(38, 64, 146, 0.3)' } as React.CSSProperties}
                                        onFocus={(e) => e.target.style.borderColor = '#264092'}
                                        onBlur={(e) => e.target.style.borderColor = ''}
                                        placeholder="Create a password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #EF951E 0%, #F69953 100%)' }}
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

                        <div className="mt-6 text-center">
                            <p className="text-gray-500">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-semibold transition-colors hover:underline"
                                    style={{ color: '#264092' }}
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
