import { useState, useEffect } from 'react'
import {
    Settings,
    Bell,
    Globe,
    Save,
    Loader2,
    Palette,
    Bot,
    Cloud,
    Mail,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import { initializeTheme } from '../../hooks/useOrgSettings'

interface OrgSettings {
    id: number
    name: string
    logo_url: string | null
    primary_color: string
    ai_provider: string
    ai_model: string
    storage_provider: string
    email_enabled: boolean
    sms_enabled: boolean
    default_language: string
    notifications_enabled: boolean
    auto_approve_content: boolean
}

const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
    { value: 'google', label: 'Google AI', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
    { value: 'azure', label: 'Azure OpenAI', models: ['gpt-4', 'gpt-35-turbo'] },
]

const STORAGE_PROVIDERS = [
    { value: 'local', label: 'Local Storage' },
    { value: 's3', label: 'AWS S3' },
    { value: 'gcs', label: 'Google Cloud Storage' },
    { value: 'azure', label: 'Azure Blob Storage' },
]

export default function AdminSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [settings, setSettings] = useState<OrgSettings>({
        id: 1,
        name: 'District Education Office',
        logo_url: null,
        primary_color: '#1E40AF',
        ai_provider: 'google',
        ai_model: 'gemini-1.5-flash',
        storage_provider: 'local',
        email_enabled: false,
        sms_enabled: false,
        default_language: 'en',
        notifications_enabled: true,
        auto_approve_content: false
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const response = await api.get('/admin/organization/settings')
            setSettings(prev => ({ ...prev, ...response.data }))
        } catch (err) {
            console.log('Using default settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            await api.put('/admin/organization/settings', settings)
            initializeTheme()
            setSuccess('Settings saved successfully!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const selectedProvider = AI_PROVIDERS.find(p => p.value === settings.ai_provider)

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Gradient Header Banner */}
            <div className="header-gradient">
                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Settings</h1>
                                <p className="text-white/70 text-sm">Organization settings and preferences</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 dark:text-green-300">{success}</p>
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">General</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Organization Name</label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={e => setSettings({ ...settings, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Logo URL</label>
                            <input
                                type="text"
                                value={settings.logo_url || ''}
                                onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Branding - Color Picker */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Branding</h3>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Primary Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={settings.primary_color}
                                onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                                className="w-14 h-14 rounded-xl border-0 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={settings.primary_color}
                                onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">This color will be applied to buttons, sidebar, and accents.</p>
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">AI Configuration</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">AI Provider</label>
                            <select
                                value={settings.ai_provider}
                                onChange={e => setSettings({
                                    ...settings,
                                    ai_provider: e.target.value,
                                    ai_model: AI_PROVIDERS.find(p => p.value === e.target.value)?.models[0] || ''
                                })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {AI_PROVIDERS.map(provider => (
                                    <option key={provider.value} value={provider.value}>{provider.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Model</label>
                            <select
                                value={settings.ai_model}
                                onChange={e => setSettings({ ...settings, ai_model: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                {selectedProvider?.models.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Localization */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Localization</h3>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Default Language</label>
                        <select
                            value={settings.default_language}
                            onChange={e => setSettings({ ...settings, default_language: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="ta">Tamil</option>
                            <option value="te">Telugu</option>
                        </select>
                    </div>
                </div>

                {/* Storage */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                            <Cloud className="w-5 h-5 text-cyan-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Storage</h3>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Storage Provider</label>
                        <select
                            value={settings.storage_provider}
                            onChange={e => setSettings({ ...settings, storage_provider: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {STORAGE_PROVIDERS.map(provider => (
                                <option key={provider.value} value={provider.value}>{provider.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                <p className="text-xs text-gray-500">Send email alerts for important updates</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, email_enabled: !settings.email_enabled })}
                                className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.email_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${settings.email_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">SMS Notifications</p>
                                <p className="text-xs text-gray-500">Send SMS for urgent alerts</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, sms_enabled: !settings.sms_enabled })}
                                className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${settings.sms_enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${settings.sms_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
