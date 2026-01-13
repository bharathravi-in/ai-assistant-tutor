import React, { useState, useEffect } from 'react'
import {
    Settings,
    Sparkles,
    Save,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    ExternalLink,
    Cpu,
    Zap,
    Cloud,
    Shield,
    Globe,
    Activity,
    ChevronRight,
    Lock
} from 'lucide-react'

interface AISettings {
    ai_provider: string
    openai_api_key: string
    openai_model: string
    gemini_api_key: string
    gemini_model: string
    azure_openai_endpoint: string
    azure_openai_key: string
    azure_openai_deployment: string
    anthropic_api_key: string
    litellm_api_key: string
    litellm_base_url: string
    litellm_model: string
}

const providers = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-3.5', icon: <Cpu className="w-5 h-5" />, color: 'from-green-500 to-emerald-600' },
    { id: 'gemini', name: 'Google Gemini', description: 'Pro, Flash 1.5', icon: <Sparkles className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 Sonnet', icon: <Shield className="w-5 h-5" />, color: 'from-orange-500 to-red-600' },
    { id: 'azure_openai', name: 'Azure OpenAI', description: 'Enterprise Grade', icon: <Cloud className="w-5 h-5" />, color: 'from-sky-500 to-blue-600' },
    { id: 'litellm', name: 'LiteLLM', description: 'Unified Gateway', icon: <Globe className="w-5 h-5" />, color: 'from-purple-500 to-violet-600' },
]

const defaultModels: Record<string, string[]> = {
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    gemini: ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
    azure_openai: ['gpt-4', 'gpt-4-turbo', 'gpt-35-turbo'],
    litellm: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'gemini-pro', 'ollama/llama2'],
}

export default function AISettingsPage() {
    const [settings, setSettings] = useState<AISettings>({
        ai_provider: 'openai',
        openai_api_key: '',
        openai_model: 'gpt-4o-mini',
        gemini_api_key: '',
        gemini_model: 'gemini-pro',
        azure_openai_endpoint: '',
        azure_openai_key: '',
        azure_openai_deployment: '',
        anthropic_api_key: '',
        litellm_api_key: '',
        litellm_base_url: '',
        litellm_model: 'gpt-4o-mini',
    })
    const [activeTab, setActiveTab] = useState('openai')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null)
    const [testing, setTesting] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/ai-settings', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setSettings(prev => ({ ...prev, ...data }))
                setActiveTab(data.ai_provider || 'openai')
            }
        } catch (err) {
            console.error('Failed to fetch AI settings:', err)
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        setSaving(true)
        setError('')
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/ai-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })
            if (response.ok) {
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            } else {
                const data = await response.json()
                setError(data.detail || 'Failed to save settings')
            }
        } catch (err) {
            setError('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const testConnection = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/ai-settings/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            })
            const data = await response.json()
            setTestResult({
                success: response.ok && data.success,
                message: data.message || (response.ok ? 'Connection successful!' : 'Connection failed')
            })
        } catch (err) {
            setTestResult({ success: false, message: 'Failed to test connection' })
        } finally {
            setTesting(false)
        }
    }

    const toggleShowKey = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-t-indigo-600 rounded-full animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-3xl bg-indigo-900 px-8 py-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-purple-500 rounded-full blur-[80px] opacity-20" />

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                            <Sparkles className="w-10 h-10 text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">AI Orchestrator</h1>
                            <p className="text-indigo-200 mt-1 font-medium italic opacity-90">
                                Powering intelligence across the platform
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={testConnection}
                            disabled={testing}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${testing
                                    ? 'bg-white/5 opacity-50 cursor-not-allowed'
                                    : 'bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 backdrop-blur-md'
                                }`}
                        >
                            {testing ? <Activity className="w-5 h-5 animate-pulse" /> : <Zap className="w-5 h-5 text-yellow-400" />}
                            {testing ? 'Verifying...' : 'Test Sync'}
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${saved
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-indigo-500/25 active:scale-95'
                                }`}
                        >
                            {saved ? <Check className="w-5 h-5" /> : saving ? <Activity className="w-5 h-5 animate-pulse" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Persisting...' : saved ? 'Applied!' : 'Save & Publish'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {(error || testResult) && (
                <div className="space-y-3 animate-in fade-in duration-500">
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <p className="font-semibold">{error}</p>
                        </div>
                    )}
                    {testResult && (
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${testResult.success
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
                            }`}>
                            <div className={`p-1.5 rounded-full ${testResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                {testResult.success ? <Check className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
                            </div>
                            <p className="font-semibold">{testResult.message}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                Model Providers
                            </h2>
                        </div>
                        <div className="p-3 space-y-1">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveTab(p.id)}
                                    className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${activeTab === p.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${p.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                                            {p.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold">{p.name}</div>
                                            <div className="text-xs opacity-70 font-medium">{p.description}</div>
                                        </div>
                                    </div>
                                    {settings.ai_provider === p.id && (
                                        <div className="px-2 py-1 rounded-md bg-indigo-500 text-[10px] text-white font-black uppercase tracking-tighter">
                                            Active
                                        </div>
                                    )}
                                    {activeTab === p.id && (
                                        <ChevronRight className="w-5 h-5 opacity-50" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex gap-4">
                            <Lock className="w-10 h-10 text-amber-500 shrink-0" />
                            <div>
                                <h3 className="font-bold text-amber-800 dark:text-amber-400">Security Note</h3>
                                <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed">
                                    All API keys are encrypted at rest using AES-256. Primary provider settings are applied globally across all teacher queries.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Configuration Area */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden min-h-[500px]">
                        <div className="bg-gray-50/50 dark:bg-gray-800/30 p-8 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {providers.find(p => p.id === activeTab)?.name} Configuration
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                                        Maintain your integration settings for this provider.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, ai_provider: activeTab })}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${settings.ai_provider === activeTab
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none'
                                        }`}
                                >
                                    {settings.ai_provider === activeTab ? 'Set as Default' : 'Enable Globally'}
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Form Fields Based on Provider */}
                            {activeTab === 'openai' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <InputGroup
                                        label="API Key"
                                        value={settings.openai_api_key}
                                        placeholder="sk-proj-..."
                                        type={showKeys.openai ? 'text' : 'password'}
                                        onToggle={() => toggleShowKey('openai')}
                                        show={showKeys.openai}
                                        onChange={(v) => setSettings({ ...settings, openai_api_key: v })}
                                        link="https://platform.openai.com/api-keys"
                                    />
                                    <SelectGroup
                                        label="Preferred Model"
                                        value={settings.openai_model}
                                        options={defaultModels.openai}
                                        onChange={(v) => setSettings({ ...settings, openai_model: v })}
                                    />
                                </div>
                            )}

                            {activeTab === 'gemini' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <InputGroup
                                        label="Google API Key"
                                        value={settings.gemini_api_key}
                                        placeholder="AIzaSy..."
                                        type={showKeys.gemini ? 'text' : 'password'}
                                        onToggle={() => toggleShowKey('gemini')}
                                        show={showKeys.gemini}
                                        onChange={(v) => setSettings({ ...settings, gemini_api_key: v })}
                                        link="https://aistudio.google.com/app/apikey"
                                    />
                                    <SelectGroup
                                        label="Model Version"
                                        value={settings.gemini_model}
                                        options={defaultModels.gemini}
                                        onChange={(v) => setSettings({ ...settings, gemini_model: v })}
                                    />
                                </div>
                            )}

                            {activeTab === 'anthropic' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <InputGroup
                                        label="Claude API Key"
                                        value={settings.anthropic_api_key}
                                        placeholder="sk-ant-..."
                                        type={showKeys.anthropic ? 'text' : 'password'}
                                        onToggle={() => toggleShowKey('anthropic')}
                                        show={showKeys.anthropic}
                                        onChange={(v) => setSettings({ ...settings, anthropic_api_key: v })}
                                        link="https://console.anthropic.com/settings/keys"
                                    />
                                </div>
                            )}

                            {activeTab === 'azure_openai' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <InputGroup
                                        label="Endpoint URL"
                                        value={settings.azure_openai_endpoint}
                                        onChange={(v) => setSettings({ ...settings, azure_openai_endpoint: v })}
                                        placeholder="https://your-resource.openai.azure.com/"
                                    />
                                    <InputGroup
                                        label="API Key"
                                        value={settings.azure_openai_key}
                                        type={showKeys.azure ? 'text' : 'password'}
                                        onToggle={() => toggleShowKey('azure')}
                                        show={showKeys.azure}
                                        onChange={(v) => setSettings({ ...settings, azure_openai_key: v })}
                                    />
                                    <InputGroup
                                        label="Deployment Name"
                                        value={settings.azure_openai_deployment}
                                        placeholder="gpt-4o-prod"
                                        onChange={(v) => setSettings({ ...settings, azure_openai_deployment: v })}
                                    />
                                </div>
                            )}

                            {activeTab === 'litellm' && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                        LiteLLM acts as a proxy, allowing you to use 100+ different models with a consistent OpenAI-compatible API.
                                    </div>
                                    <InputGroup
                                        label="LiteLLM Master Key"
                                        value={settings.litellm_api_key}
                                        placeholder="sk-..."
                                        type={showKeys.litellm ? 'text' : 'password'}
                                        onToggle={() => toggleShowKey('litellm')}
                                        show={showKeys.litellm}
                                        onChange={(v) => setSettings({ ...settings, litellm_api_key: v })}
                                        link="https://docs.litellm.ai"
                                    />
                                    <InputGroup
                                        label="Base URL"
                                        value={settings.litellm_base_url}
                                        placeholder="https://api.litellm.ai"
                                        onChange={(v) => setSettings({ ...settings, litellm_base_url: v })}
                                    />
                                    <InputGroup
                                        label="Target Model"
                                        value={settings.litellm_model}
                                        placeholder="vllm/llama-3"
                                        onChange={(v) => setSettings({ ...settings, litellm_model: v })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function InputGroup({ label, value, onChange, placeholder, type = 'text', onToggle, show, link }: any) {
    return (
        <div className="group space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-indigo-600">
                    {label}
                </label>
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
                        Get Key <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-12 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium placeholder:text-gray-300"
                />
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                    >
                        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    )
}

function SelectGroup({ label, value, options, onChange }: any) {
    return (
        <div className="group space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-indigo-600">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-12 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-800 transition-all font-bold appearance-none cursor-pointer"
            >
                {options.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    )
}
