import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useTTS } from '../hooks/useTTS'

// Types
export interface LessonStep {
    id: string
    title: string
    type: 'explanation' | 'activity' | 'assessment' | 'mnemonic' | 'script' | 'example' | 'tlm' | 'warning' | 'discussion' | 'tip'
    content: string
    narration: string
}

export type AudioState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED'
export type LessonMode = 'teacher-led' | 'student-led'

interface LessonState {
    contentId: number | null
    steps: LessonStep[]
    currentStepIndex: number
    audioState: AudioState
    mode: LessonMode
    language: string
    isAskAIActive: boolean
}

interface LessonActions {
    setContent: (contentId: number, steps: LessonStep[]) => void
    goToStep: (index: number) => void
    nextStep: () => void
    prevStep: () => void
    play: () => void
    pause: () => void
    resume: () => void
    stop: () => void
    setLanguage: (lang: string) => void
    setMode: (mode: LessonMode) => void
    setAskAIActive: (active: boolean) => void
    reset: () => void
}

interface LessonContextValue {
    state: LessonState
    actions: LessonActions
    // Computed values
    currentStep: LessonStep | null
    isFirstStep: boolean
    isLastStep: boolean
    canGoNext: boolean
    canGoPrev: boolean
    progress: number // 0 to 100
}

const initialState: LessonState = {
    contentId: null,
    steps: [],
    currentStepIndex: 0,
    audioState: 'IDLE',
    mode: 'teacher-led',
    language: 'en',
    isAskAIActive: false
}

const LessonStepContext = createContext<LessonContextValue | null>(null)

export const useLessonStep = () => {
    const context = useContext(LessonStepContext)
    if (!context) {
        throw new Error('useLessonStep must be used within a LessonStepProvider')
    }
    return context
}

interface LessonStepProviderProps {
    children: ReactNode
}

export const LessonStepProvider: React.FC<LessonStepProviderProps> = ({ children }) => {
    const [state, setState] = useState<LessonState>(initialState)
    const { speak, stop: stopTTS, pause: pauseTTS, resume: resumeTTS } = useTTS()

    // Actions
    const setContent = useCallback((contentId: number, steps: LessonStep[]) => {
        stopTTS()
        setState(prev => ({
            ...initialState,
            contentId,
            steps,
            audioState: 'IDLE',
            language: prev.language, // Preserve language across content changes
            mode: prev.mode // Preserve mode across content changes
        }))
    }, [stopTTS])

    const goToStep = useCallback((index: number) => {
        stopTTS()
        setState(prev => {
            if (index >= 0 && index < prev.steps.length) {
                return {
                    ...prev,
                    currentStepIndex: index,
                    audioState: 'IDLE'
                }
            }
            return prev
        })
    }, [stopTTS])

    const nextStep = useCallback(() => {
        setState(prev => {
            if (prev.currentStepIndex < prev.steps.length - 1) {
                // We use setTimeout to break the call stack if needed, but since goToStep is now functional, 
                // we can just inline the logic or call it if it's stable.
                // However, functional update is best here.
                stopTTS()
                return {
                    ...prev,
                    currentStepIndex: prev.currentStepIndex + 1,
                    audioState: 'IDLE'
                }
            }
            return prev
        })
    }, [stopTTS])

    const prevStep = useCallback(() => {
        setState(prev => {
            if (prev.currentStepIndex > 0) {
                stopTTS()
                return {
                    ...prev,
                    currentStepIndex: prev.currentStepIndex - 1,
                    audioState: 'IDLE'
                }
            }
            return prev
        })
    }, [stopTTS])

    const play = useCallback(() => {
        setState(prev => {
            const currentStep = prev.steps[prev.currentStepIndex]
            if (currentStep?.narration) {
                speak(currentStep.narration, {
                    onStart: () => setState(p => ({ ...p, audioState: 'PLAYING' })),
                    onEnd: () => setState(p => ({ ...p, audioState: 'COMPLETED' })),
                    onError: () => setState(p => ({ ...p, audioState: 'IDLE' }))
                })
                return { ...prev, audioState: 'PLAYING' }
            }
            return prev
        })
    }, [speak])

    const pause = useCallback(() => {
        pauseTTS()
        setState(prev => ({ ...prev, audioState: 'PAUSED' }))
    }, [pauseTTS])

    const resume = useCallback(() => {
        resumeTTS()
        setState(prev => ({ ...prev, audioState: 'PLAYING' }))
    }, [resumeTTS])

    const stop = useCallback(() => {
        stopTTS()
        setState(prev => ({ ...prev, audioState: 'IDLE' }))
    }, [stopTTS])

    const setLanguage = useCallback((lang: string) => {
        stopTTS()
        setState(prev => ({ ...prev, language: lang, audioState: 'IDLE' }))
    }, [stopTTS])

    const setMode = useCallback((mode: LessonMode) => {
        setState(prev => ({ ...prev, mode }))
    }, [])

    const setAskAIActive = useCallback((active: boolean) => {
        setState(prev => ({ ...prev, isAskAIActive: active }))
    }, [])

    const reset = useCallback(() => {
        stopTTS()
        setState(initialState)
    }, [stopTTS])

    const actions = useMemo(() => ({
        setContent,
        goToStep,
        nextStep,
        prevStep,
        play,
        pause,
        resume,
        stop,
        setLanguage,
        setMode,
        setAskAIActive,
        reset
    }), [
        setContent,
        goToStep,
        nextStep,
        prevStep,
        play,
        pause,
        resume,
        stop,
        setLanguage,
        setMode,
        setAskAIActive,
        reset
    ])

    // Computed values
    const currentStep = state.steps[state.currentStepIndex] || null
    const isFirstStep = state.currentStepIndex === 0
    const isLastStep = state.currentStepIndex === state.steps.length - 1
    const canGoNext = !isLastStep && state.steps.length > 0
    const canGoPrev = !isFirstStep && state.steps.length > 0
    const progress = state.steps.length > 0
        ? ((state.currentStepIndex + 1) / state.steps.length) * 100
        : 0

    const value: LessonContextValue = {
        state,
        actions,
        currentStep,
        isFirstStep,
        isLastStep,
        canGoNext,
        canGoPrev,
        progress
    }

    return (
        <LessonStepContext.Provider value={value}>
            {children}
        </LessonStepContext.Provider>
    )
}

export default LessonStepContext
