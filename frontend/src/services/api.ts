import axios from 'axios'
import type {
    AuthResponse,
    User,
    AIRequest,
    AIResponse,
    Query,
    QueryListResponse,
    ReflectionCreate,
    Reflection,
    TeacherStats,
    AdminDashboard
} from '../types'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth endpoints
export const authApi = {
    register: async (data: {
        phone: string
        name?: string
        password?: string
        language?: string
    }): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', data)
        return response.data
    },

    login: async (phone: string, password?: string): Promise<AuthResponse> => {
        const formData = new FormData()
        formData.append('username', phone)
        formData.append('password', password || '')
        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    },

    getMe: async (): Promise<User> => {
        const response = await api.get('/auth/me')
        return response.data
    },

    getLanguages: async (): Promise<{ code: string; name: string }[]> => {
        const response = await api.get('/auth/languages')
        return response.data
    },
}

// AI endpoints
export const aiApi = {
    ask: async (request: AIRequest): Promise<AIResponse> => {
        const response = await api.post('/ai/ask', request)
        return response.data
    },

    explain: async (params: {
        input_text: string
        language?: string
        grade?: number
        subject?: string
    }): Promise<AIResponse> => {
        const response = await api.post('/ai/explain', null, { params })
        return response.data
    },

    assist: async (params: {
        input_text: string
        language?: string
        context?: string
    }): Promise<AIResponse> => {
        const response = await api.post('/ai/assist', null, { params })
        return response.data
    },

    plan: async (params: {
        input_text: string
        language?: string
        grade?: number
        subject?: string
        topic?: string
    }): Promise<AIResponse> => {
        const response = await api.post('/ai/plan', null, { params })
        return response.data
    },
}

// Teacher endpoints
export const teacherApi = {
    getQueries: async (params: {
        page?: number
        page_size?: number
        mode?: string
    }): Promise<QueryListResponse> => {
        const response = await api.get('/teacher/queries', { params })
        return response.data
    },

    getQuery: async (id: number): Promise<Query> => {
        const response = await api.get(`/teacher/queries/${id}`)
        return response.data
    },

    submitReflection: async (data: ReflectionCreate): Promise<Reflection> => {
        const response = await api.post('/teacher/reflections', data)
        return response.data
    },

    getStats: async (): Promise<TeacherStats> => {
        const response = await api.get('/teacher/stats')
        return response.data
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put('/teacher/profile', data)
        return response.data
    },
}

// CRP endpoints
export const crpApi = {
    getQueries: async (params: {
        page?: number
        page_size?: number
        mode?: string
        grade?: number
        subject?: string
        requires_review?: boolean
    }): Promise<QueryListResponse> => {
        const response = await api.get('/crp/queries', { params })
        return response.data
    },

    getQueryDetail: async (id: number) => {
        const response = await api.get(`/crp/queries/${id}`)
        return response.data
    },

    respond: async (data: {
        query_id: number
        response_text?: string
        tag?: string
        overrides_ai?: boolean
        override_reason?: string
    }) => {
        const response = await api.post('/crp/respond', data)
        return response.data
    },

    getStats: async () => {
        const response = await api.get('/crp/stats')
        return response.data
    },
}

// Admin endpoints
export const adminApi = {
    getDashboard: async (): Promise<AdminDashboard> => {
        const response = await api.get('/admin/dashboard')
        return response.data
    },

    getQueryAnalytics: async (params: {
        start_date?: string
        end_date?: string
        group_by?: string
    }) => {
        const response = await api.get('/admin/analytics/queries', { params })
        return response.data
    },

    getHeatmap: async () => {
        const response = await api.get('/admin/analytics/heatmap')
        return response.data
    },

    getEffectiveness: async () => {
        const response = await api.get('/admin/analytics/effectiveness')
        return response.data
    },

    getUsers: async (params: {
        role?: string
        page?: number
        page_size?: number
    }) => {
        const response = await api.get('/admin/users', { params })
        return response.data
    },
}

export default api
