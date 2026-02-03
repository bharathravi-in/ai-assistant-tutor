import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { settingsApi } from '../services/api'

export interface CustomVoice {
    id: string
    name: string
    gender: 'male' | 'female'
    audioUrl: string
    createdAt: string
}

interface SettingsState {
    selectedVoice: string
    voiceRate: number
    voicePitch: number
    autoPlayResponse: boolean
    customVoices: CustomVoice[]
    isInitialized: boolean

    // Actions
    setSettings: (settings: Partial<Omit<SettingsState, 'isInitialized' | 'customVoices'>>) => void
    addCustomVoice: (voice: CustomVoice) => void
    removeCustomVoice: (voiceId: string) => void
    initialize: () => Promise<void>
    updateRemote: (data: any) => Promise<void>
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            selectedVoice: 'voice-1',
            voiceRate: 1,
            voicePitch: 1,
            autoPlayResponse: false,
            customVoices: [],
            isInitialized: false,

            setSettings: (newSettings) => {
                set((state) => ({ ...state, ...newSettings }))
            },

            addCustomVoice: (voice) => {
                set((state) => ({
                    customVoices: [...state.customVoices, voice]
                }))
            },

            removeCustomVoice: (voiceId) => {
                set((state) => ({
                    customVoices: state.customVoices.filter(v => v.id !== voiceId),
                    selectedVoice: state.selectedVoice === voiceId ? 'voice-1' : state.selectedVoice
                }))
            },

            initialize: async () => {
                if (get().isInitialized) return

                try {
                    const data = await settingsApi.getSettings()
                    set({
                        selectedVoice: data.selectedVoice || 'voice-1',
                        voiceRate: data.voiceRate || 1,
                        voicePitch: data.voicePitch || 1,
                        autoPlayResponse: data.autoPlayResponse || false,
                        customVoices: data.customVoices || [],
                        isInitialized: true
                    })
                } catch (error) {
                    console.error('Failed to initialize settings store:', error)
                    // Fallback to persisted state if API fails
                    set({ isInitialized: true })
                }
            },

            updateRemote: async (data) => {
                try {
                    await settingsApi.updateSettings(data)
                } catch (error) {
                    console.error('Failed to sync settings with remote:', error)
                    throw error
                }
            }
        }),
        {
            name: 'settings-storage',
            partialize: (state) => ({
                selectedVoice: state.selectedVoice,
                voiceRate: state.voiceRate,
                voicePitch: state.voicePitch,
                autoPlayResponse: state.autoPlayResponse,
                customVoices: state.customVoices
            })
        }
    )
)
