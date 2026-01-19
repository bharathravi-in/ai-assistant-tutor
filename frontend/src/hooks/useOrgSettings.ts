import { useState, useEffect } from 'react'
import api from '../services/api'

interface OrgSettings {
    id: number
    name: string
    logo_url: string | null
    primary_color: string
    ai_provider: string
    ai_model: string
    storage_provider: string
    email_enabled: boolean
    sms_enabled: boolean
}

// Convert hex to HSL for generating color variations
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return { h: 0, s: 0, l: 0 }

    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: h = ((b - r) / d + 2) / 6; break
            case b: h = ((r - g) / d + 4) / 6; break
        }
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
}

// Generate light and dark variants
function generateColorVariants(hex: string): { base: string; light: string; dark: string } {
    const hsl = hexToHSL(hex)

    // Light variant: increase lightness by 10%
    const lightL = Math.min(hsl.l + 10, 90)
    // Dark variant: decrease lightness by 10%  
    const darkL = Math.max(hsl.l - 10, 10)

    return {
        base: hex,
        light: `hsl(${hsl.h}, ${hsl.s}%, ${lightL}%)`,
        dark: `hsl(${hsl.h}, ${hsl.s}%, ${darkL}%)`
    }
}

// Apply color to CSS variables
function applyPrimaryColor(color: string) {
    const root = document.documentElement
    const variants = generateColorVariants(color)

    root.style.setProperty('--color-primary', variants.base)
    root.style.setProperty('--color-primary-light', variants.light)
    root.style.setProperty('--color-primary-dark', variants.dark)

    // Also update Tailwind-style colors for consistency
    root.style.setProperty('--tw-primary', variants.base)
}

// Cache for org settings
let cachedOrgSettings: OrgSettings | null = null

export function useOrgSettings() {
    const [settings, setSettings] = useState<OrgSettings | null>(cachedOrgSettings)
    const [loading, setLoading] = useState(!cachedOrgSettings)

    useEffect(() => {
        const loadSettings = async () => {
            if (cachedOrgSettings) {
                applyPrimaryColor(cachedOrgSettings.primary_color)
                return
            }

            try {
                const response = await api.get('/admin/organization/settings')
                const orgSettings = response.data
                cachedOrgSettings = orgSettings
                setSettings(orgSettings)

                // Apply primary color to CSS
                if (orgSettings.primary_color) {
                    applyPrimaryColor(orgSettings.primary_color)
                }
            } catch (err) {
                // Use default color if API fails
                console.log('Using default theme settings')
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
    }, [])

    return { settings, loading }
}

// Initialize theme on app load (call once in App.tsx)
// This should only run once and silently fail for unauthenticated users
let themeInitialized = false

export async function initializeTheme() {
    // Prevent multiple initialization attempts
    if (themeInitialized) return
    themeInitialized = true

    try {
        const response = await api.get('/admin/organization/settings')
        const orgSettings = response.data
        cachedOrgSettings = orgSettings

        if (orgSettings.primary_color) {
            applyPrimaryColor(orgSettings.primary_color)
        }
    } catch (err: any) {
        // Silently fail for 401 (not authenticated) or other errors
        // Don't log to avoid console noise
        if (err?.response?.status !== 401) {
            console.log('Using default theme')
        }
    }
}

export type { OrgSettings }
