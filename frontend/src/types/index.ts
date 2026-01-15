// User types
export type UserRole = 'teacher' | 'crp' | 'arp' | 'admin' | 'superadmin' | 'student'

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
    is_multigrade: boolean
    class_size: number | null
    instructional_time_minutes: number | null
    media_path: string | null
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
    media_path?: string
    is_multigrade?: boolean
    class_size?: number
    instructional_time_minutes?: number
}

export interface AIResponse {
    query_id: number
    mode: QueryMode
    language: string
    content: string
    structured: Record<string, any>
    processing_time_ms: number
    suggestions: string[]
    query?: Query
}

export interface QuickPrompt {
    icon: string
    text: string
    mode: QueryMode
}

export interface QuizQuestion {
    id: number
    type: 'mcq' | 'fill_in_the_blank' | 'true_false'
    question: string
    options?: string[]
    answer: string
    explanation?: string
}

export interface Quiz {
    title: string
    description: string
    questions: QuizQuestion[]
}

export interface Flashcard {
    front: string
    back: string
}

export interface DIYWorkshop {
    title: string
    materials: string[]
    steps: string[]
    usage_tips: string
}

export interface AuditResult {
    is_compliant: boolean
    compliance_score: number
    strengths: string[]
    weaknesses: string[]
    improvement_suggestions: string[]
    ncert_ref?: string
}

export interface PosterTemplate {
    title: string
    key_sections: string[]
    visual_layout_description: string
}

export interface VisualKit {
    flashcards: Flashcard[]
    poster_template: PosterTemplate
}

export interface TLM {
    diy_workshop: DIYWorkshop
    visual_kit: VisualKit
}

// Reflection types
export interface Reflection {
    id: number
    query_id: number
    tried: boolean
    worked: boolean | null
    voice_note_url: string | null
    voice_note_transcript: string | null
    pedagogical_sentiment: string | null
    analysis_json: string | null
    text_feedback: string | null
    created_at: string
}

export interface ReflectionCreate {
    query_id: number
    tried: boolean
    worked?: boolean
    text_feedback?: string
    voice_note_url?: string
    voice_note_transcript?: string
}

// CRP types
export type ResponseTag = 'effective' | 'needs_followup' | 'best_practice' | 'requires_training'

export interface CRPResponse {
    id: number
    query_id: number
    crp_id: number
    response_text: string | null
    voice_note_url: string | null
    voice_note_transcript: string | null
    observation_notes: string | null
    tag: ResponseTag | null
    is_best_practice: boolean
    overrides_ai: boolean
    created_at: string
}

export interface CRPResponseCreate {
    query_id: number
    response_text?: string
    voice_note_url?: string
    voice_note_transcript?: string
    observation_notes?: string
    tag?: string
    overrides_ai?: boolean
    override_reason?: string
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

// Course types
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface CourseContentSection {
    title: string
    content: string
    key_points: string[]
    examples: Array<{
        title: string
        problem: string
        solution: string
    }>
}

export interface CourseContent {
    title: string
    description: string
    learning_objectives: string[]
    sections: CourseContentSection[]
    practice_questions: Array<{
        question: string
        type: string
        options?: string[]
        answer: string
        explanation: string
    }>
    key_takeaways: string[]
    fun_fact?: string
}

export interface Course {
    id: number
    title: string
    description: string | null
    subject: string
    grade: number
    topic: string
    enrollment_code: string
    content: CourseContent | null
    duration_minutes: number | null
    status: CourseStatus
    student_count: number
    created_at: string
    updated_at: string
    published_at: string | null
    created_by_name?: string
}

export interface CourseListResponse {
    items: Course[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

// Student Enrollment types
export interface Enrollment {
    id: number
    course_id: number
    course_title: string
    course_subject: string
    course_grade: number
    course_topic: string
    completion_percent: number
    enrolled_at: string
    last_accessed_at: string | null
    completed_at: string | null
}

export interface EnrollmentProgress {
    sections_completed: number[]
    current_section: number
    quiz_scores: Record<string, number>
    time_spent_minutes: number
}

// Course Chat types
export interface ChatMessage {
    id: number
    message: string
    response: string
    is_on_topic: boolean
    created_at: string
}

export interface ChatHistoryResponse {
    items: ChatMessage[]
    total: number
}

