import { useState, useEffect } from 'react'
import {
    Building2,
    Loader2,
    Save,
    Upload,
    Sparkles,
    Cloud,
    Mail,
    Shield,
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

export default function OrgSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [settings, setSettings] = useState<OrgSettings>({
        id: 1,
        name: 'Gov-Tech AI Teaching',
        logo_url: null,
        primary_color: '#0D9488',
        ai_provider: 'google',
        ai_model: 'gemini-1.5-flash',
        storage_provider: 'local',
        email_enabled: false,
        sms_enabled: false
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const response = await api.get('/admin/organization/settings')
            setSettings(response.data)
        } catch (err) {
            // Use defaults if API fails
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
            // Apply the new theme immediately
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
                <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Organization Settings
                        </h1>
                        <p className="text-gray-500 text-sm">Configure your organization</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

            {/* Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 dark:text-green-300">{success}</p>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branding Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Upload className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Branding</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Organization Name
                            </label>
                            <input
                                type="text"
                                value={settings.name}
                                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Logo URL
                            </label>
                            <input
                                type="text"
                                value={settings.logo_url || ''}
                                onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                                placeholder="https://..."
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Primary Color
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.primary_color}
                                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                    className="w-12 h-12 rounded-lg border-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={settings.primary_color}
                                    onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">AI Configuration</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                AI Provider
                            </label>
                            <select
                                value={settings.ai_provider}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    ai_provider: e.target.value,
                                    ai_model: AI_PROVIDERS.find(p => p.value === e.target.value)?.models[0] || ''
                                }))}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                            >
                                {AI_PROVIDERS.map(provider => (
                                    <option key={provider.value} value={provider.value}>{provider.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Model
                            </label>
                            <select
                                value={settings.ai_model}
                                onChange={(e) => setSettings(prev => ({ ...prev, ai_model: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                            >
                                {selectedProvider?.models.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                <strong>Note:</strong> API keys are configured in environment variables for security.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Storage */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Storage</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Storage Provider
                        </label>
                        <select
                            value={settings.storage_provider}
                            onChange={(e) => setSettings(prev => ({ ...prev, storage_provider: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
                        >
                            {STORAGE_PROVIDERS.map(provider => (
                                <option key={provider.value} value={provider.value}>{provider.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-green-500" />
                        <h2 className="font-semibold text-gray-800 dark:text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.email_enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, email_enabled: e.target.checked }))}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full transition-colors ${settings.email_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.email_enabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                </div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700 dark:text-gray-300">SMS Notifications</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.sms_enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                                    className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full transition-colors ${settings.sms_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.sms_enabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}
