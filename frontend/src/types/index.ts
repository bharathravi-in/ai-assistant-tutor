// User types
export type UserRole = 'teacher' | 'crp' | 'arp' | 'admin'

export interface User {
    id: number
    phone: string
    name: string | null
    role: UserRole
    language: string
    school_name: string | null
    school_district: string | null
    school_block: string | null
    school_state: string | null
    grades_taught: number[] | null
    subjects_taught: string[] | null
    is_active: boolean
    created_at: string
}

export interface AuthResponse {
    access_token: string
    token_type: string
    user: User
}

// Query types
export type QueryMode = 'explain' | 'assist' | 'plan'

export interface Query {
    id: number
    user_id: number
    mode: QueryMode
    input_text: string
    input_language: string
    grade: number | null
    subject: string | null
    topic: string | null
    ai_response: string | null
    response_language: string
    processing_time_ms: number | null
    is_resolved: boolean
    requires_crp_review: boolean
    created_at: string
    responded_at: string | null
}

export interface QueryListResponse {
    items: Query[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

// AI types
export interface AIRequest {
    mode: QueryMode
    input_text: string
    language: string
    grade?: number
    subject?: string
    topic?: string
    context?: string
}

export interface AIResponse {
    query_id: number
    mode: QueryMode
    language: string
    content: string
    structured: Record<string, unknown>
    processing_time_ms: number
    suggestions: string[]
}

// Reflection types
export interface Reflection {
    id: number
    query_id: number
    tried: boolean
    worked: boolean | null
    voice_note_url: string | null
    text_feedback: string | null
    created_at: string
}

export interface ReflectionCreate {
    query_id: number
    tried: boolean
    worked?: boolean
    text_feedback?: string
}

// CRP types
export type ResponseTag = 'effective' | 'needs_followup' | 'best_practice' | 'requires_training'

export interface CRPResponse {
    id: number
    query_id: number
    crp_id: number
    response_text: string | null
    voice_note_url: string | null
    tag: ResponseTag | null
    overrides_ai: boolean
    created_at: string
}

// Stats types
export interface TeacherStats {
    total_queries: number
    queries_by_mode: Record<QueryMode, number>
    successful_suggestions: number
    success_rate: number
}

export interface AdminDashboard {
    users_by_role: Record<UserRole, number>
    total_users: number
    total_queries: number
    queries_this_week: number
    success_rate: number
    avg_response_time_ms: number
}
