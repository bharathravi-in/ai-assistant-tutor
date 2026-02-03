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
    AdminDashboard,
    Quiz,
    TLM,
    AuditResult,
    CRPResponse,
    CRPResponseCreate
} from '../types'

// Always use relative path - the dev server proxy handles routing to backend
const api = axios.create({
    baseURL: '/api',
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
            // Only redirect if not already on login page to prevent infinite loop
            if (!window.location.pathname.includes('/login') &&
                !window.location.pathname.includes('/register') &&
                !window.location.pathname.includes('/forgot-password')) {
                window.location.href = '/login'
            }
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

// Config endpoints (public access for dropdowns)
export const configApi = {
    getStates: async () => {
        const response = await api.get('/admin/config/public/states')
        return response.data
    },
    getDistricts: async (stateId?: number) => {
        const response = await api.get('/admin/config/public/districts', { params: { state_id: stateId } })
        return response.data
    },
    getBlocks: async (districtId?: number) => {
        const response = await api.get('/admin/config/public/blocks', { params: { district_id: districtId } })
        return response.data
    },
    getClusters: async (blockId?: number) => {
        const response = await api.get('/admin/config/public/clusters', { params: { block_id: blockId } })
        return response.data
    },
    getSchools: async (districtId?: number, blockId?: number, clusterId?: number) => {
        const response = await api.get('/admin/config/public/schools', {
            params: { district_id: districtId, block_id: blockId, cluster_id: clusterId }
        })
        return response.data
    },
    // App Languages (for i18n)
    getLanguages: async () => {
        const response = await api.get('/admin/config/public/languages')
        return response.data
    },
    // Admin only - all languages including inactive
    getAllLanguages: async () => {
        const response = await api.get('/admin/config/languages')
        return response.data
    },
    updateLanguage: async (id: number, data: { is_active?: boolean; sort_order?: number }) => {
        const response = await api.put(`/admin/config/languages/${id}`, data)
        return response.data
    },
    seedIndianLanguages: async () => {
        const response = await api.post('/admin/config/languages/seed-indian')
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

    generateQuiz: async (data: {
        topic: string
        content: string
        language?: string
        level?: string
    }): Promise<Quiz> => {
        const response = await api.post('/ai/generate-quiz', data)
        return response.data
    },

    generateTLM: async (data: {
        topic: string
        content: string
        language?: string
    }): Promise<TLM> => {
        const response = await api.post('/ai/generate-tlm', data)
        return response.data
    },

    auditContent: async (data: {
        topic: string
        content: string
        grade?: number
        subject?: string
        language?: string
    }): Promise<AuditResult> => {
        const response = await api.post('/ai/audit', data)
        return response.data
    },

    // Get answer for a specific question - returns simple direct answer
    getQuestionAnswer: async (data: {
        question: string
        topic?: string
        grade?: number
        language?: string
    }): Promise<{ answer: string }> => {
        const response = await api.post('/ai/answer-question', {
            question: data.question,
            topic: data.topic,
            grade: data.grade,
            language: data.language || 'en'
        })
        return { answer: response.data.answer }
    },
}

// Media endpoints
export const mediaApi = {
    upload: async (file: File): Promise<{ filename: string; content_type: string; url: string }> => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await api.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    },

    uploadVoice: async (file: File, purpose: 'reflection' | 'response' = 'reflection'): Promise<{
        filename: string,
        url: string,
        transcript: string,
        duration_sec: number
    }> => {
        const formData = new FormData()
        formData.append('file', file)
        const response = await api.post(`/media/upload-voice?purpose=${purpose}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
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

    getMyVisits: async (status?: string) => {
        const response = await api.get('/crp/teacher-visits', { params: { status } })
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

    respond: async (data: CRPResponseCreate): Promise<CRPResponse> => {
        const response = await api.post('/crp/respond', data)
        return response.data
    },

    getStats: async () => {
        const response = await api.get('/crp/stats')
        return response.data
    },

    // Teacher Network
    getTeachers: async (status?: string) => {
        const response = await api.get('/crp/teachers', { params: { status } })
        return response.data
    },

    // Visits
    getVisits: async (status?: string) => {
        const response = await api.get('/crp/visits', { params: { status } })
        return response.data
    },

    createVisit: async (data: {
        school: string
        teacher_name: string
        date: string
        time: string
        purpose: string
        notes?: string
    }) => {
        const response = await api.post('/crp/visits', data)
        return response.data
    },

    updateVisit: async (visitId: number, data: { status: string; notes?: string }) => {
        const response = await api.patch(`/crp/visits/${visitId}`, data)
        return response.data
    },

    deleteVisit: async (visitId: number) => {
        const response = await api.delete(`/crp/visits/${visitId}`)
        return response.data
    },

    // Teacher Management
    createTeacher: async (data: {
        name: string
        phone: string
        password: string
        school_name?: string
        school_district?: string
        grades?: number[]
        subjects?: string[]
    }) => {
        const response = await api.post('/crp/teachers', data)
        return response.data
    },

    // Shared Query Inbox
    getSharedQueries: async (params: {
        page?: number
        page_size?: number
        reviewed?: boolean
    } = {}) => {
        const response = await api.get('/crp/shared-queries', { params })
        return response.data
    },

    reviewSharedQuery: async (shareId: number, notes?: string) => {
        const response = await api.post(`/crp/shared-queries/${shareId}/review`, null, {
            params: { notes }
        })
        return response.data
    },
}

// ARP endpoints
export const arpApi = {
    getDashboard: async () => {
        const response = await api.get('/arp/dashboard')
        return response.data
    },
    getTrends: async (params: { days?: number } = {}) => {
        const response = await api.get('/arp/trends/recurring-gaps', { params })
        return response.data
    },
    getSubjectDifficulty: async (params: { days?: number } = {}) => {
        const response = await api.get('/arp/trends/subject-difficulty', { params })
        return response.data
    },
    getHeatmap: async (params: { days?: number } = {}) => {
        const response = await api.get('/arp/trends/grade-heatmap', { params })
        return response.data
    },
    getReviews: async (params: { page?: number; page_size?: number } = {}) => {
        const response = await api.get('/arp/review/ai-responses', { params })
        return response.data
    },
    getTrainingGaps: async (params: { days?: number } = {}) => {
        const response = await api.get('/arp/training/gap-mapping', { params })
        return response.data
    },
    getCrpPerformance: async () => {
        const response = await api.get('/arp/crps')
        return response.data
    },
    getDistrictPerformance: async () => {
        const response = await api.get('/arp/reports/districts')
        return response.data
    },

    // User Management
    getUsers: async (params: {
        role?: string
        page?: number
        page_size?: number
    } = {}) => {
        const response = await api.get('/arp/users', { params })
        return response.data
    },

    createUser: async (data: any) => {
        const response = await api.post('/arp/users', data)
        return response.data
    },

    updateUser: async (userId: number, data: any) => {
        const response = await api.put(`/arp/users/${userId}`, data)
        return response.data
    },

    toggleUserStatus: async (userId: number) => {
        const response = await api.post(`/arp/users/${userId}/toggle-status`)
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

    // DIET Analytics
    getClassroomContextAnalytics: async () => {
        const response = await api.get('/admin/analytics/classroom-context')
        return response.data
    },

    getReflectionSentimentAnalytics: async () => {
        const response = await api.get('/admin/analytics/reflection-sentiment')
        return response.data
    },

    getTrainingGaps: async (limit: number = 10) => {
        const response = await api.get('/admin/analytics/training-gaps', { params: { limit } })
        return response.data
    },
}

// Settings endpoints
export const settingsApi = {
    getSettings: async () => {
        const response = await api.get('/settings')
        return response.data
    },

    updateSettings: async (data: {
        selected_voice?: string
        voice_rate?: number
        voice_pitch?: number
        auto_play_response?: boolean
    }) => {
        const response = await api.put('/settings', data)
        return response.data
    },

    createCustomVoice: async (name: string, gender: string, audioFile: Blob) => {
        const formData = new FormData()
        formData.append('audio', audioFile, 'voice.webm')
        const response = await api.post(`/settings/voices?name=${encodeURIComponent(name)}&gender=${gender}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    },

    deleteCustomVoice: async (voiceId: number) => {
        const response = await api.delete(`/settings/voices/${voiceId}`)
        return response.data
    },
}

// Teacher Support endpoints (Phase 2)
export const teacherSupportApi = {
    getClassroomHelp: async (data: {
        challenge: string
        grade?: number
        subject?: string
        topic?: string
        students_level?: string
        is_multigrade?: boolean
        class_size?: number
        instructional_time_minutes?: number
    }) => {
        const response = await api.post('/teacher/classroom-help', data)
        return response.data
    },

    getMicroLearning: async (data: {
        topic: string
        grade: number
        subject: string
        duration_minutes?: number
    }) => {
        const response = await api.post('/teacher/micro-learning', data)
        return response.data
    },

    getQuickPrompts: async () => {
        const response = await api.get('/teacher/quick-prompts')
        return response.data
    },
}

// CRP Support endpoints (Phase 3)
export const crpSupportApi = {
    generateFeedback: async (data: {
        teacher_name: string
        class_observed: string
        subject: string
        topic_taught: string
        observation_notes: string
        strengths_observed?: string
        areas_of_concern?: string
    }) => {
        const response = await api.post('/crp/generate-feedback', data)
        return response.data
    },

    generateImprovementPlan: async (data: {
        teacher_name: string
        key_areas: string[]
        current_strengths: string[]
        visit_frequency?: string
    }) => {
        const response = await api.post('/crp/generate-improvement-plan', data)
        return response.data
    },

    getObservationTemplate: async () => {
        const response = await api.get('/crp/observation-template')
        return response.data
    },
}

// Resources endpoints
export const resourcesApi = {
    getResources: async (params: {
        page?: number
        page_size?: number
        category?: string
        type?: string
        grade?: string
        subject?: string
        search?: string
        bookmarked_only?: boolean
    }) => {
        const response = await api.get('/resources', { params })
        return response.data
    },

    getResource: async (id: number) => {
        const response = await api.get(`/resources/${id}`)
        return response.data
    },

    bookmarkResource: async (resourceId: number) => {
        const response = await api.post(`/resources/${resourceId}/bookmark`)
        return response.data
    },

    removeBookmark: async (resourceId: number) => {
        const response = await api.delete(`/resources/${resourceId}/bookmark`)
        return response.data
    },

    updateProgress: async (resourceId: number, data: {
        progress_percent?: number
        is_completed?: boolean
    }) => {
        const response = await api.post(`/resources/${resourceId}/progress`, data)
        return response.data
    },

    getStats: async () => {
        const response = await api.get('/resources/stats/summary')
        return response.data
    },

    // Resource CRUD (Admin/CRP/ARP)
    createResource: async (data: {
        title: string
        description?: string
        type: string
        category: string
        grade?: string
        subject?: string
        duration?: string
        content_url?: string
        thumbnail_url?: string
        tags?: string
        is_featured?: boolean
    }) => {
        const response = await api.post('/resources', data)
        return response.data
    },

    updateResource: async (resourceId: number, data: {
        title?: string
        description?: string
        type?: string
        category?: string
        grade?: string
        subject?: string
        duration?: string
        content_url?: string
        thumbnail_url?: string
        tags?: string
        is_featured?: boolean
        is_active?: boolean
    }) => {
        const response = await api.put(`/resources/${resourceId}`, data)
        return response.data
    },

    deleteResource: async (resourceId: number) => {
        const response = await api.delete(`/resources/${resourceId}`)
        return response.data
    },

    analyzeResource: async (resourceId: number) => {
        const response = await api.get(`/resources/${resourceId}/analyze`)
        return response.data
    },

    askAboutResource: async (resourceId: number, question: string) => {
        const response = await api.post(`/resources/${resourceId}/ask`, { question })
        return response.data
    },
}

export const storageApi = {
    uploadFile: async (file: File, folder: string = 'general') => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const response = await api.post('/storage/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return response.data
    },

    getSignedUrl: async (path: string, expiration: number = 60) => {
        const response = await api.get('/storage/signed-url', {
            params: { path, expiration }
        })
        return response.data
    },
}

// Feedback endpoints
export const feedbackApi = {
    // Get pending feedback requests for current user
    getInbox: async () => {
        const response = await api.get('/feedback/inbox')
        return response.data
    },

    // Get feedback requests sent by current user
    getSent: async () => {
        const response = await api.get('/feedback/sent')
        return response.data
    },

    // Create a feedback request (CRP/ARP only)
    createRequest: async (data: {
        target_user_id: number
        title: string
        description?: string
        questions: Array<{
            text: string
            type: string
            options?: string[]
            required: boolean
        }>
        due_date?: string
    }) => {
        const response = await api.post('/feedback/request', data)
        return response.data
    },

    // Submit response to a feedback request
    submitResponse: async (data: {
        request_id: number
        answers: Array<{ question_index: number; answer: string }>
        additional_notes?: string
    }) => {
        const response = await api.post('/feedback/respond', data)
        return response.data
    },

    // Get responses for a feedback request (requester only)
    getResponses: async (requestId: number) => {
        const response = await api.get(`/feedback/responses/${requestId}`)
        return response.data
    },
}

// Survey endpoints
export const surveyApi = {
    // Create a new survey
    create: async (data: {
        title: string
        description?: string
        questions: Array<{
            question: string
            type: string
            options?: string[]
            required: boolean
        }>
        target_role?: string
        target_user_ids?: number[]
        start_date?: string
        end_date?: string
    }) => {
        const response = await api.post('/surveys/', data)
        return response.data
    },

    // Generate survey using AI
    generate: async (data: {
        context: string
        target_user_ids?: number[]
        num_questions?: number
    }) => {
        const response = await api.post('/surveys/generate', data)
        return response.data
    },

    // Publish a survey
    publish: async (surveyId: number) => {
        const response = await api.post(`/surveys/${surveyId}/publish`)
        return response.data
    },

    // Get surveys created by current user
    getMySurveys: async () => {
        const response = await api.get('/surveys/my-surveys')
        return response.data
    },

    // Get surveys assigned to current user
    getAssigned: async () => {
        const response = await api.get('/surveys/assigned')
        return response.data
    },

    // Submit response to a survey
    submitResponse: async (data: {
        survey_id: number
        answers: Array<{ question_index: number; answer: string }>
    }) => {
        const response = await api.post('/surveys/respond', data)
        return response.data
    },

    // Get responses for a survey (creator only)
    getResponses: async (surveyId: number) => {
        const response = await api.get(`/surveys/${surveyId}/responses`)
        return response.data
    },

    // Update a survey
    update: async (surveyId: number, data: any) => {
        const response = await api.put(`/surveys/${surveyId}`, data)
        return response.data
    },

    // Delete a survey (only if no responses)
    delete: async (surveyId: number) => {
        const response = await api.delete(`/surveys/${surveyId}`)
        return response.data
    },
}

// Program/Library endpoints
export const programApi = {
    // Create a new program
    create: async (data: {
        name: string
        description?: string
        grade?: number
        subject?: string
        cover_image_url?: string
    }) => {
        const response = await api.post('/programs/', data)
        return response.data
    },

    // List programs
    list: async (statusFilter?: string) => {
        const response = await api.get('/programs/', {
            params: statusFilter ? { status_filter: statusFilter } : undefined
        })
        return response.data
    },

    // Add resource to program
    addResource: async (programId: number, data: {
        resource_id: number
        section_name?: string
        order?: number
    }) => {
        const response = await api.post(`/programs/${programId}/resources`, data)
        return response.data
    },

    // Get program resources
    getResources: async (programId: number) => {
        const response = await api.get(`/programs/${programId}/resources`)
        return response.data
    },

    // Publish program
    publish: async (programId: number) => {
        const response = await api.post(`/programs/${programId}/publish`)
        return response.data
    },

    // Request to publish a resource
    requestPublish: async (resourceId: number) => {
        const response = await api.post('/programs/publish-request', { resource_id: resourceId })
        return response.data
    },

    // Get pending publish requests (CRP/ARP)
    getPublishRequests: async () => {
        const response = await api.get('/programs/publish-requests')
        return response.data
    },

    // Review publish request
    reviewPublishRequest: async (requestId: number, approve: boolean, notes?: string) => {
        const response = await api.post(`/programs/publish-requests/${requestId}/review`, null, {
            params: { approve, notes }
        })
        return response.data
    },
}

// Content API - Teacher-created content with approval workflow
export const contentApi = {
    // Create new content (starts as draft) with optional PDF generation and vectorization
    create: async (data: {
        title: string
        content_type: string
        description: string
        content_json?: any
        grade?: number
        subject?: string
        topic?: string
        tags?: string[]
        generate_pdf?: boolean
        vectorize?: boolean
    }) => {
        const response = await api.post('/content/', data)
        return response.data
    },

    // Get teacher's own content
    getMyContent: async (params: {
        page?: number
        page_size?: number
        status?: string
    } = {}) => {
        const response = await api.get('/content/my', { params })
        return response.data
    },

    // Get content by ID
    getById: async (id: number) => {
        const response = await api.get(`/content/${id}`)
        return response.data
    },

    // Update draft content
    update: async (id: number, data: {
        title?: string
        content_type?: string
        description?: string
        content_json?: any
        grade?: number
        subject?: string
        topic?: string
        tags?: string[]
    }) => {
        const response = await api.put(`/content/${id}`, data)
        return response.data
    },

    // Submit for review (draft → pending)
    submit: async (id: number) => {
        const response = await api.post(`/content/${id}/submit`)
        return response.data
    },

    // Delete draft content
    delete: async (id: number) => {
        const response = await api.delete(`/content/${id}`)
        return response.data
    },

    // Get pending content for review (CRP/ARP)
    getPending: async (params: {
        page?: number
        page_size?: number
        content_type?: string
    } = {}) => {
        const response = await api.get('/content/pending/review', { params })
        return response.data
    },

    // Review content (approve/reject)
    review: async (id: number, data: { approved: boolean; review_notes?: string }) => {
        const response = await api.post(`/content/${id}/review`, data)
        return response.data
    },

    // Browse content library
    browseLibrary: async (params: {
        page?: number
        page_size?: number
        content_type?: string
        grade?: number
        subject?: string
        search?: string
    } = {}) => {
        const response = await api.get('/content/library/browse', { params })
        return response.data
    },

    // Semantic search
    search: async (data: {
        query: string
        content_type?: string
        grade?: number
        subject?: string
        limit?: number
    }) => {
        const response = await api.post('/content/search', data)
        return response.data
    },

    // Like/unlike content
    toggleLike: async (id: number) => {
        const response = await api.post(`/content/${id}/like`)
        return response.data
    },

    // Get PDF for content
    getPdf: async (id: number) => {
        const response = await api.get(`/content/${id}/pdf`)
        return response.data
    },

    // Regenerate PDF for content
    regeneratePdf: async (id: number) => {
        const response = await api.post(`/content/${id}/regenerate-pdf`)
        return response.data
    },
}

// AI Tutor Specific API
export const tutorApi = {
    chat: async (data: {
        content_id: number
        active_section_id: string
        section_index?: number
        total_sections?: number
        user_message: string
        history?: any[]
        language?: string
    }): Promise<{ answer: string; section_id: string; content_id: number }> => {
        const response = await api.post('/tutor/chat', data)
        return response.data
    },
    processPdf: async (contentId: number) => {
        const response = await api.post(`/tutor/process-pdf/${contentId}`)
        return response.data
    }
}

export default api
