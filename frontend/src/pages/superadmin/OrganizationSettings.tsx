import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Save,
    Building2,
    Key,
    Cloud,
    Webhook,
    Shield,
    ToggleLeft,
    ToggleRight,
    Eye,
    EyeOff,
    Check,
    AlertCircle
} from 'lucide-react'

interface Organization {
    id: number
    name: string
    slug: string
    subscription_plan: string
    is_active: boolean
}

interface Settings {
    id: number
    organization_id: number
    ai_provider: string
    openai_api_key_masked: string | null
    openai_model: string
    gemini_api_key_masked: string | null
    gemini_model: string
    storage_provider: string
    gcs_bucket_name: string | null
    s3_bucket_name: string | null
    voice_enabled: boolean
    multilingual_enabled: boolean
    custom_branding_enabled: boolean
    advanced_analytics_enabled: boolean
    api_access_enabled: boolean
    webhook_url: string | null
    sso_enabled: boolean
    sso_provider: string | null
    lms_enabled: boolean
    lms_provider: string | null
}

export default function OrganizationSettings() {
    const { orgId } = useParams<{ orgId: string }>()
    const navigate = useNavigate()
    const [org, setOrg] = useState<Organization | null>(null)
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('ai')
    const [showApiKey, setShowApiKey] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Form state for editable fields
    const [formData, setFormData] = useState({
        ai_provider: 'openai',
        openai_api_key: '',
        openai_model: 'gpt-4o-mini',
        gemini_api_key: '',
        gemini_model: 'gemini-pro',
        storage_provider: 'local',
        gcs_bucket_name: '',
        gcs_service_account_key: '',
        s3_bucket_name: '',
        s3_region: '',
        s3_access_key: '',
        s3_secret_key: '',
        voice_enabled: true,
        multilingual_enabled: true,
        custom_branding_enabled: false,
        advanced_analytics_enabled: false,
        api_access_enabled: false,
        webhook_url: '',
        webhook_secret: '',
        sso_enabled: false,
        sso_provider: '',
        sso_client_id: '',
        sso_client_secret: '',
        lms_enabled: false,
        lms_provider: '',
        lms_api_url: '',
        lms_api_key: '',
    })

    useEffect(() => {
        fetchData()
    }, [orgId])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch organization
            const orgRes = await fetch(`/api/superadmin/organizations/${orgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (orgRes.ok) {
                const orgData = await orgRes.json()
                setOrg(orgData)
            }

            // Fetch settings
            const settingsRes = await fetch(`/api/superadmin/organizations/${orgId}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json()
                setSettings(settingsData)
                // Update form with existing values
                setFormData(prev => ({
                    ...prev,
                    ai_provider: settingsData.ai_provider || 'openai',
                    openai_model: settingsData.openai_model || 'gpt-4o-mini',
                    gemini_model: settingsData.gemini_model || 'gemini-pro',
                    storage_provider: settingsData.storage_provider || 'local',
                    gcs_bucket_name: settingsData.gcs_bucket_name || '',
                    s3_bucket_name: settingsData.s3_bucket_name || '',
                    voice_enabled: settingsData.voice_enabled,
                    multilingual_enabled: settingsData.multilingual_enabled,
                    custom_branding_enabled: settingsData.custom_branding_enabled,
                    advanced_analytics_enabled: settingsData.advanced_analytics_enabled,
                    api_access_enabled: settingsData.api_access_enabled,
                    webhook_url: settingsData.webhook_url || '',
                    sso_enabled: settingsData.sso_enabled,
                    sso_provider: settingsData.sso_provider || '',
                    lms_enabled: settingsData.lms_enabled,
                    lms_provider: settingsData.lms_provider || '',
                }))
            }
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        setSaving(true)
        try {
            const token = localStorage.getItem('token')

            // Only send fields that have values
            const payload: any = {}
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    payload[key] = value
                }
            })

            const response = await fetch(`/api/superadmin/organizations/${orgId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
                fetchData() // Refresh data
            }
        } catch (err) {
            console.error('Failed to save settings:', err)
        } finally {
            setSaving(false)
        }
    }

    const tabs = [
        { id: 'ai', label: 'AI Configuration', icon: Key },
        { id: 'storage', label: 'Storage', icon: Cloud },
        { id: 'features', label: 'Features', icon: ToggleLeft },
        { id: 'integrations', label: 'Integrations', icon: Webhook },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/superadmin')}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Building2 className="w-7 h-7 text-indigo-500" />
                            {org?.name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Configure organization settings and integrations
                        </p>
                    </div>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saveSuccess ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {saveSuccess ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card p-6">
                {activeTab === 'ai' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Provider Configuration</h3>
                        <p className="text-sm text-gray-500">Configure which AI provider this organization uses and the associated API keys.</p>

                        {/* Provider Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                AI Provider
                            </label>
                            <select
                                value={formData.ai_provider}
                                onChange={(e) => setFormData({ ...formData, ai_provider: e.target.value })}
                                className="input max-w-xs"
                            >
                                <option value="openai">OpenAI (GPT-4)</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="azure_openai">Azure OpenAI</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                            </select>
                        </div>

                        {/* OpenAI Settings */}
                        {formData.ai_provider === 'openai' && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">OpenAI Settings</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={formData.openai_api_key}
                                            onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
                                            className="input pr-10"
                                            placeholder={settings?.openai_api_key_masked || 'sk-...'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {settings?.openai_api_key_masked && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Current: {settings.openai_api_key_masked}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model
                                    </label>
                                    <select
                                        value={formData.openai_model}
                                        onChange={(e) => setFormData({ ...formData, openai_model: e.target.value })}
                                        className="input max-w-xs"
                                    >
                                        <option value="gpt-4o-mini">GPT-4o Mini (Fast, Cheap)</option>
                                        <option value="gpt-4o">GPT-4o (Powerful)</option>
                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Gemini Settings */}
                        {formData.ai_provider === 'gemini' && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Google Gemini Settings</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                    </label>
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={formData.gemini_api_key}
                                        onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                                        className="input"
                                        placeholder={settings?.gemini_api_key_masked || 'AIza...'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Model
                                    </label>
                                    <select
                                        value={formData.gemini_model}
                                        onChange={(e) => setFormData({ ...formData, gemini_model: e.target.value })}
                                        className="input max-w-xs"
                                    >
                                        <option value="gemini-pro">Gemini Pro</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'storage' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Configuration</h3>
                        <p className="text-sm text-gray-500">Configure cloud storage for files and assets.</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Storage Provider
                            </label>
                            <select
                                value={formData.storage_provider}
                                onChange={(e) => setFormData({ ...formData, storage_provider: e.target.value })}
                                className="input max-w-xs"
                            >
                                <option value="local">Local Storage</option>
                                <option value="gcs">Google Cloud Storage</option>
                                <option value="s3">Amazon S3</option>
                                <option value="azure_blob">Azure Blob Storage</option>
                            </select>
                        </div>

                        {formData.storage_provider === 'gcs' && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Google Cloud Storage</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Bucket Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.gcs_bucket_name}
                                        onChange={(e) => setFormData({ ...formData, gcs_bucket_name: e.target.value })}
                                        className="input"
                                        placeholder="my-bucket"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Service Account Key (JSON)
                                    </label>
                                    <textarea
                                        value={formData.gcs_service_account_key}
                                        onChange={(e) => setFormData({ ...formData, gcs_service_account_key: e.target.value })}
                                        className="input min-h-[100px] font-mono text-sm"
                                        placeholder='{"type": "service_account", ...}'
                                    />
                                </div>
                            </div>
                        )}

                        {formData.storage_provider === 's3' && (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Amazon S3</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Bucket Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.s3_bucket_name}
                                            onChange={(e) => setFormData({ ...formData, s3_bucket_name: e.target.value })}
                                            className="input"
                                            placeholder="my-bucket"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Region
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.s3_region}
                                            onChange={(e) => setFormData({ ...formData, s3_region: e.target.value })}
                                            className="input"
                                            placeholder="us-east-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Access Key
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.s3_access_key}
                                            onChange={(e) => setFormData({ ...formData, s3_access_key: e.target.value })}
                                            className="input"
                                            placeholder="AKIA..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Secret Key
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.s3_secret_key}
                                            onChange={(e) => setFormData({ ...formData, s3_secret_key: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feature Flags</h3>
                        <p className="text-sm text-gray-500">Enable or disable features for this organization.</p>

                        <div className="space-y-4">
                            {[
                                { key: 'voice_enabled', label: 'Voice Assistant', description: 'Enable voice input and text-to-speech' },
                                { key: 'multilingual_enabled', label: 'Multilingual Support', description: 'Support for Hindi, Tamil, Telugu, Kannada, Marathi' },
                                { key: 'custom_branding_enabled', label: 'Custom Branding', description: 'Allow custom logo and colors' },
                                { key: 'advanced_analytics_enabled', label: 'Advanced Analytics', description: 'Detailed usage analytics and reports' },
                                { key: 'api_access_enabled', label: 'API Access', description: 'Enable REST API access for integrations' },
                            ].map((feature) => (
                                <div
                                    key={feature.key}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{feature.label}</p>
                                        <p className="text-sm text-gray-500">{feature.description}</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({
                                            ...formData,
                                            [feature.key]: !formData[feature.key as keyof typeof formData]
                                        })}
                                        className={`p-1 rounded-full transition-colors ${formData[feature.key as keyof typeof formData]
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        {formData[feature.key as keyof typeof formData] ? (
                                            <ToggleRight className="w-8 h-8" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Third-Party Integrations</h3>
                        <p className="text-sm text-gray-500">Configure webhooks, SSO, and LMS integrations.</p>

                        {/* Webhooks */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Webhook className="w-5 h-5" /> Webhooks
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.webhook_url}
                                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                                    className="input"
                                    placeholder="https://example.com/webhook"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Webhook Secret
                                </label>
                                <input
                                    type="password"
                                    value={formData.webhook_secret}
                                    onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                                    className="input"
                                    placeholder="whsec_..."
                                />
                            </div>
                        </div>

                        {/* SSO */}
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5" /> Single Sign-On (SSO)
                                </h4>
                                <button
                                    onClick={() => setFormData({ ...formData, sso_enabled: !formData.sso_enabled })}
                                    className={`p-1 rounded-full transition-colors ${formData.sso_enabled
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                        }`}
                                >
                                    {formData.sso_enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                </button>
                            </div>
                            {formData.sso_enabled && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            SSO Provider
                                        </label>
                                        <select
                                            value={formData.sso_provider}
                                            onChange={(e) => setFormData({ ...formData, sso_provider: e.target.value })}
                                            className="input"
                                        >
                                            <option value="">Select Provider</option>
                                            <option value="google">Google Workspace</option>
                                            <option value="azure_ad">Microsoft Azure AD</option>
                                            <option value="okta">Okta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Client ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.sso_client_id}
                                            onChange={(e) => setFormData({ ...formData, sso_client_id: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Client Secret
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.sso_client_secret}
                                            onChange={(e) => setFormData({ ...formData, sso_client_secret: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
