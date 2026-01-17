import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Lock, Loader2, GraduationCap, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
    const { i18n } = useTranslation()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await authApi.login(phone, password)
            setAuth(response.user, response.access_token)
            navigate('/')
        } catch (err: unknown) {
            const error = err as { response?: { data?: { detail?: string } } }
            setError(error.response?.data?.detail || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)' }}
            >
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: '#059669', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#10b981', transform: 'translate(-30%, 30%)' }} />
                <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full opacity-5" style={{ background: '#ffffff', transform: 'translate(-50%, -50%)' }} />

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#10B981' }}>
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-white">EducationAI</span>
                            <p className="text-white/70 text-sm">DIET Teacher Support</p>
                        </div>
                    </div>
                </div>

                {/* Tagline */}
                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-bold text-white leading-tight">
                        Empowering<br />
                        <span style={{ color: '#34d399' }}>Teachers</span><br />
                        with AI
                    </h1>
                    <p className="text-xl text-white/80 max-w-md">
                        Your intelligent assistant for classroom management, lesson planning, and real-time teaching support for government schools.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-3 pt-4">
                        {['🎤 Voice Enabled', '🌐 Multilingual', '⚡ Instant Support', '📚 NCERT Aligned'].map((feature) => (
                            <span
                                key={feature}
                                className="px-4 py-2 rounded-full text-sm font-medium text-white/90 backdrop-blur-sm"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-white/60 text-sm">
                        © 2026 Gov-Tech AI Teaching Assistant. Ministry of Education, Government of India.
                    </p>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 dark:bg-gray-900">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={{ background: '#2563EB' }}>
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-primary-500">Gov-Tech</h1>
                        <p className="text-gray-500 text-sm">AI Teaching Assistant</p>
                    </div>

                    {/* Welcome text */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back!</h2>
                        <p className="text-gray-500 mt-2">Sign in to continue to your dashboard</p>
                    </div>

                    {/* Login card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
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
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary-500 to-primary-600"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Language selector - Compact */}
                    <div className="mt-6">
                        <div className="flex items-center justify-center gap-1 mb-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400">Select Language</span>
                        </div>
                        <div className="flex justify-center gap-2">
                            {[
                                { code: 'en', label: 'EN', name: 'English' },
                                { code: 'hi', label: 'हि', name: 'Hindi' },
                                { code: 'ta', label: 'த', name: 'Tamil' },
                                { code: 'te', label: 'తె', name: 'Telugu' },
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    title={lang.name}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${i18n.language === lang.code
                                        ? 'bg-primary-500 text-white shadow-md scale-110'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:scale-105'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
