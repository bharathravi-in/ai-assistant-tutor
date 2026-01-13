import { useState, useEffect } from 'react'
import {
    TrendingUp,
    Edit,
    Save,
    X,
    Check,
    DollarSign,
    Users,
    MessageSquare,
    HardDrive
} from 'lucide-react'

interface PlanLimits {
    id: number
    name: string
    max_users: number
    max_queries_per_month: number
    max_storage_gb: number
    features: string[]
    price_monthly: number
    price_yearly: number
    is_active: boolean
}

const defaultPlans: PlanLimits[] = [
    {
        id: 1,
        name: 'free',
        max_users: 10,
        max_queries_per_month: 100,
        max_storage_gb: 1,
        features: ['Basic AI assistance', 'Email support'],
        price_monthly: 0,
        price_yearly: 0,
        is_active: true
    },
    {
        id: 2,
        name: 'starter',
        max_users: 50,
        max_queries_per_month: 500,
        max_storage_gb: 10,
        features: ['Basic AI assistance', 'Priority support', 'Analytics'],
        price_monthly: 29,
        price_yearly: 290,
        is_active: true
    },
    {
        id: 3,
        name: 'professional',
        max_users: 200,
        max_queries_per_month: 2000,
        max_storage_gb: 50,
        features: ['Advanced AI', 'Priority support', 'Analytics', 'Custom branding'],
        price_monthly: 99,
        price_yearly: 990,
        is_active: true
    },
    {
        id: 4,
        name: 'enterprise',
        max_users: -1,
        max_queries_per_month: -1,
        max_storage_gb: -1,
        features: ['Unlimited AI', 'Dedicated support', 'Full analytics', 'White-label', 'SSO', 'API access'],
        price_monthly: 299,
        price_yearly: 2990,
        is_active: true
    }
]

const planColors: Record<string, string> = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-blue-600',
    professional: 'from-purple-500 to-purple-600',
    enterprise: 'from-amber-500 to-orange-500',
}

export default function PlansPage() {
    const [plans, setPlans] = useState<PlanLimits[]>(defaultPlans)
    const [loading, setLoading] = useState(true)
    const [editingPlan, setEditingPlan] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<PlanLimits | null>(null)

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/superadmin/plans', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                if (data.length > 0) {
                    setPlans(data)
                }
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (plan: PlanLimits) => {
        setEditingPlan(plan.id)
        setEditForm({ ...plan })
    }

    const cancelEditing = () => {
        setEditingPlan(null)
        setEditForm(null)
    }

    const savePlan = async () => {
        if (!editForm) return
        try {
            const token = localStorage.getItem('token')
            await fetch(`/api/superadmin/plans/${editForm.name}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            })
            setPlans(plans.map(p => p.id === editForm.id ? editForm : p))
            cancelEditing()
        } catch (err) {
            console.error('Failed to save plan:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Subscription Plans
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Configure plan limits and pricing
                    </p>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="card overflow-hidden">
                        <div className={`p-6 bg-gradient-to-br ${planColors[plan.name] || planColors.free} text-white`}>
                            <h3 className="text-xl font-bold capitalize mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">
                                    ${editingPlan === plan.id ? editForm?.price_monthly : plan.price_monthly}
                                </span>
                                <span className="text-white/70">/month</span>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {editingPlan === plan.id && editForm ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Max Users</label>
                                        <input
                                            type="number"
                                            value={editForm.max_users}
                                            onChange={(e) => setEditForm({ ...editForm, max_users: parseInt(e.target.value) })}
                                            className="input text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Queries/Month</label>
                                        <input
                                            type="number"
                                            value={editForm.max_queries_per_month}
                                            onChange={(e) => setEditForm({ ...editForm, max_queries_per_month: parseInt(e.target.value) })}
                                            className="input text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Storage (GB)</label>
                                        <input
                                            type="number"
                                            value={editForm.max_storage_gb}
                                            onChange={(e) => setEditForm({ ...editForm, max_storage_gb: parseInt(e.target.value) })}
                                            className="input text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Monthly Price</label>
                                        <input
                                            type="number"
                                            value={editForm.price_monthly}
                                            onChange={(e) => setEditForm({ ...editForm, price_monthly: parseInt(e.target.value) })}
                                            className="input text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={savePlan} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium flex items-center justify-center gap-1">
                                            <Save className="w-4 h-4" /> Save
                                        </button>
                                        <button onClick={cancelEditing} className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center gap-1">
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-gray-500">
                                                <Users className="w-4 h-4" /> Max Users
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-gray-500">
                                                <MessageSquare className="w-4 h-4" /> Queries/Month
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {plan.max_queries_per_month === -1 ? 'Unlimited' : plan.max_queries_per_month.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-gray-500">
                                                <HardDrive className="w-4 h-4" /> Storage
                                            </span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {plan.max_storage_gb === -1 ? 'Unlimited' : `${plan.max_storage_gb} GB`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 mb-2">Features</p>
                                        <div className="space-y-1">
                                            {plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <Check className="w-4 h-4 text-green-500" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => startEditing(plan)}
                                        className="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Plan
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
