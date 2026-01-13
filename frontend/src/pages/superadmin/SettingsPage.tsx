import { useState } from 'react'
import {
    Settings,
    Globe,
    Server,
    ShieldCheck,
    Bell,
    Save,
    Check
} from 'lucide-react'

interface GlobalSettings {
    platform_name: string
    support_email: string
    default_language: string
    maintenance_mode: boolean
    allow_registration: boolean
    require_email_verification: boolean
    default_ai_provider: string
    analytics_enabled: boolean
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<GlobalSettings>({
        platform_name: 'AI Teaching Assistant',
        support_email: 'support@aiteaching.com',
        default_language: 'en',
        maintenance_mode: false,
        allow_registration: true,
        require_email_verification: false,
        default_ai_provider: 'openai',
        analytics_enabled: true
    })
    const [saved, setSaved] = useState(false)

    const saveSettings = async () => {
        try {
            const token = localStorage.getItem('token')
            await fetch('/api/superadmin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error('Failed to save settings:', err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Platform Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Configure global platform settings
                        </p>
                    </div>
                </div>
                <button
                    onClick={saveSettings}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${saved
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg'
                        }`}
                >
                    {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? 'Saved!' : 'Save Settings'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            General Settings
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Platform Name
                            </label>
                            <input
                                type="text"
                                value={settings.platform_name}
                                onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Support Email
                            </label>
                            <input
                                type="email"
                                value={settings.support_email}
                                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default Language
                            </label>
                            <select
                                value={settings.default_language}
                                onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                                className="input"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="te">Telugu</option>
                                <option value="ta">Tamil</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            AI Configuration
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Default AI Provider
                            </label>
                            <select
                                value={settings.default_ai_provider}
                                onChange={(e) => setSettings({ ...settings, default_ai_provider: e.target.value })}
                                className="input"
                            >
                                <option value="openai">OpenAI (GPT-4)</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="azure">Azure OpenAI</option>
                                <option value="anthropic">Anthropic Claude</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Analytics Enabled</p>
                                <p className="text-sm text-gray-500">Track AI usage and performance</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, analytics_enabled: !settings.analytics_enabled })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.analytics_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.analytics_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Security Settings
                        </h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Allow Registration</p>
                                <p className="text-sm text-gray-500">Let new users sign up</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.allow_registration ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.allow_registration ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email Verification</p>
                                <p className="text-sm text-gray-500">Require email verification</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, require_email_verification: !settings.require_email_verification })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.require_email_verification ? 'bg-indigo-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.require_email_verification ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Maintenance */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Maintenance Mode
                        </h2>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Enable Maintenance Mode</p>
                            <p className="text-sm text-gray-500">Temporarily disable the platform</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                            className={`w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    {settings.maintenance_mode && (
                        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                ⚠️ Platform is in maintenance mode. Users cannot access the application.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
