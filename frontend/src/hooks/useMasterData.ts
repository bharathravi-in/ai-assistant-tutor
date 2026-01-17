import { useState, useEffect } from 'react'
import api from '../services/api'

interface Subject {
    id: number
    name: string
    code: string
    name_hindi?: string
    is_active: boolean
}

interface Grade {
    id: number
    number: number
    name: string
    alias?: string
    is_active: boolean
}

interface State {
    id: number
    name: string
    code: string
    is_active: boolean
}

interface District {
    id: number
    name: string
    state_id: number
    is_active: boolean
}

interface Board {
    id: number
    name: string
    code: string
    full_name?: string
    is_active: boolean
}

interface Medium {
    id: number
    name: string
    code: string
    is_active: boolean
}

interface MasterData {
    subjects: Subject[]
    grades: Grade[]
    states: State[]
    boards: Board[]
    mediums: Medium[]
    loading: boolean
    error: string | null
    fetchDistricts: (stateId: number) => Promise<District[]>
}

// Cache for master data
let cachedSubjects: Subject[] | null = null
let cachedGrades: Grade[] | null = null
let cachedStates: State[] | null = null
let cachedBoards: Board[] | null = null
let cachedMediums: Medium[] | null = null

export function useMasterData(): MasterData {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [grades, setGrades] = useState<Grade[]>([])
    const [states, setStates] = useState<State[]>([])
    const [boards, setBoards] = useState<Board[]>([])
    const [mediums, setMediums] = useState<Medium[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setError(null)

            try {
                // Use cache if available
                if (cachedSubjects && cachedGrades && cachedStates) {
                    setSubjects(cachedSubjects)
                    setGrades(cachedGrades)
                    setStates(cachedStates)
                    setBoards(cachedBoards || [])
                    setMediums(cachedMediums || [])
                    setLoading(false)
                    return
                }

                // Fetch from public endpoints (no auth required)
                const [subjectsRes, gradesRes, statesRes, boardsRes, mediumsRes] = await Promise.all([
                    api.get('/admin/config/public/subjects').catch(() => ({ data: [] })),
                    api.get('/admin/config/public/grades').catch(() => ({ data: [] })),
                    api.get('/admin/config/public/states').catch(() => ({ data: [] })),
                    api.get('/admin/config/public/boards').catch(() => ({ data: [] })),
                    api.get('/admin/config/public/mediums').catch(() => ({ data: [] })),
                ])

                const subjectsData = subjectsRes.data || []
                const gradesData = gradesRes.data || []
                const statesData = statesRes.data || []
                const boardsData = boardsRes.data || []
                const mediumsData = mediumsRes.data || []

                // Cache the data
                cachedSubjects = subjectsData
                cachedGrades = gradesData
                cachedStates = statesData
                cachedBoards = boardsData
                cachedMediums = mediumsData

                setSubjects(subjectsData)
                setGrades(gradesData)
                setStates(statesData)
                setBoards(boardsData)
                setMediums(mediumsData)

            } catch (err: any) {
                setError('Failed to load master data')
                console.error('Failed to load master data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const fetchDistricts = async (stateId: number): Promise<District[]> => {
        try {
            const response = await api.get(`/admin/config/public/districts?state_id=${stateId}`)
            return response.data || []
        } catch (err) {
            console.error('Failed to fetch districts:', err)
            return []
        }
    }

    return {
        subjects,
        grades,
        states,
        boards,
        mediums,
        loading,
        error,
        fetchDistricts
    }
}

// Helper to get subject names as array of strings
export function useSubjectNames(): string[] {
    const { subjects } = useMasterData()
    return subjects.map(s => s.name)
}

// Helper to get grade numbers as array
export function useGradeNumbers(): number[] {
    const { grades } = useMasterData()
    return grades.map(g => g.number)
}

// Helper to get state names as array
export function useStateNames(): string[] {
    const { states } = useMasterData()
    return states.map(s => s.name)
}

export type { Subject, Grade, State, District, Board, Medium }
