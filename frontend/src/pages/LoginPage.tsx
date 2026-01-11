import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Phone, Lock, LogIn, Loader2, GraduationCap } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
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
        <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 mb-4 shadow-lg shadow-primary-500/30">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">{t('app.name')}</h1>
                    <p className="text-gray-500 mt-2">{t('app.tagline')}</p>
                </div>

                {/* Login card */}
                <div className="card p-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                        {t('auth.loginTitle')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-600 text-sm dark:bg-danger-500/10 dark:border-danger-500/20 dark:text-danger-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('auth.phone')}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="input pl-12"
                                    placeholder="9876543210"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-12"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {t('auth.login')}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                                {t('auth.register')}
                            </Link>
                        </p>
                    </div>

                    {/* Language selector */}
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${i18n.language === 'en'
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('hi')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${i18n.language === 'hi'
                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            हिंदी
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-sm mt-6">
                    Empowering Teachers with AI
                </p>
            </div>
        </div>
    )
}
