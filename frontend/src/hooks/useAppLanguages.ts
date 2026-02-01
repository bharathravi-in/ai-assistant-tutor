import { useState, useEffect, useCallback } from 'react'
import { configApi } from '../services/api'
import { useTranslation } from 'react-i18next'

export interface AppLanguage {
    id: number
    code: string
    name: string
    native_name: string
    script?: string
    direction: 'ltr' | 'rtl'
    is_active: boolean
    sort_order: number
}

interface UseAppLanguagesResult {
    languages: AppLanguage[]
    currentLanguage: AppLanguage | null
    isLoading: boolean
    error: string | null
    changeLanguage: (code: string) => void
    refetch: () => Promise<void>
}

// Cache languages to avoid repeated API calls
let cachedLanguages: AppLanguage[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAppLanguages(): UseAppLanguagesResult {
    const { i18n } = useTranslation()
    const [languages, setLanguages] = useState<AppLanguage[]>(cachedLanguages || [])
    const [isLoading, setIsLoading] = useState(!cachedLanguages)
    const [error, setError] = useState<string | null>(null)

    const fetchLanguages = useCallback(async () => {
        // Use cache if valid
        if (cachedLanguages && Date.now() - cacheTimestamp < CACHE_DURATION) {
            setLanguages(cachedLanguages)
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            const data = await configApi.getLanguages()
            cachedLanguages = data
            cacheTimestamp = Date.now()
            setLanguages(data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch languages:', err)
            setError(err.message || 'Failed to load languages')
            // Fallback to default languages if API fails
            const fallbackLanguages: AppLanguage[] = [
                { id: 1, code: 'en', name: 'English', native_name: 'English', direction: 'ltr', is_active: true, sort_order: 1 },
                { id: 2, code: 'hi', name: 'Hindi', native_name: 'हिन्दी', direction: 'ltr', is_active: true, sort_order: 2 },
            ]
            setLanguages(fallbackLanguages)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLanguages()
    }, [fetchLanguages])

    const changeLanguage = useCallback((code: string) => {
        i18n.changeLanguage(code)
        localStorage.setItem('language', code)
        // Update document direction for RTL languages
        const lang = languages.find(l => l.code === code)
        if (lang) {
            document.documentElement.dir = lang.direction
            document.documentElement.lang = code
        }
    }, [i18n, languages])

    const currentLanguage = languages.find(l => l.code === i18n.language) || null

    return {
        languages,
        currentLanguage,
        isLoading,
        error,
        changeLanguage,
        refetch: fetchLanguages,
    }
}

// Hook for Admin to manage all languages (including inactive)
interface UseAdminLanguagesResult {
    languages: AppLanguage[]
    isLoading: boolean
    error: string | null
    toggleLanguage: (id: number, isActive: boolean) => Promise<void>
    seedLanguages: () => Promise<{ message: string; total_available: number }>
    refetch: () => Promise<void>
}

export function useAdminLanguages(): UseAdminLanguagesResult {
    const [languages, setLanguages] = useState<AppLanguage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLanguages = useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await configApi.getAllLanguages()
            setLanguages(data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch admin languages:', err)
            setError(err.message || 'Failed to load languages')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLanguages()
    }, [fetchLanguages])

    const toggleLanguage = useCallback(async (id: number, isActive: boolean) => {
        try {
            await configApi.updateLanguage(id, { is_active: isActive })
            setLanguages(prev => prev.map(lang => 
                lang.id === id ? { ...lang, is_active: isActive } : lang
            ))
            // Clear cache so public API gets fresh data
            cachedLanguages = null
        } catch (err: any) {
            console.error('Failed to toggle language:', err)
            throw err
        }
    }, [])

    const seedLanguages = useCallback(async () => {
        try {
            const result = await configApi.seedIndianLanguages()
            await fetchLanguages() // Refresh list
            cachedLanguages = null // Clear cache
            return result
        } catch (err: any) {
            console.error('Failed to seed languages:', err)
            throw err
        }
    }, [fetchLanguages])

    return {
        languages,
        isLoading,
        error,
        toggleLanguage,
        seedLanguages,
        refetch: fetchLanguages,
    }
}

export default useAppLanguages
