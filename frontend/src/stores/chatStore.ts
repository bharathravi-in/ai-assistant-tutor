import { create } from 'zustand'
import type { QueryMode, AIResponse } from '../types'

interface ChatState {
    mode: QueryMode
    isLoading: boolean
    currentResponse: AIResponse | null
    error: string | null
    setMode: (mode: QueryMode) => void
    setLoading: (loading: boolean) => void
    setResponse: (response: AIResponse | null) => void
    setError: (error: string | null) => void
    reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
    mode: 'explain',
    isLoading: false,
    currentResponse: null,
    error: null,

    setMode: (mode) => set({ mode, currentResponse: null, error: null }),
    setLoading: (isLoading) => set({ isLoading }),
    setResponse: (currentResponse) => set({ currentResponse, isLoading: false, error: null }),
    setError: (error) => set({ error, isLoading: false }),
    reset: () => set({ currentResponse: null, error: null, isLoading: false }),
}))
