/**
 * useTranslation hook for multi-language support
 * Provides translations and language switching functionality
 */
import { useState, useCallback, useEffect } from 'react'

// Translation dictionaries
const translations: Record<string, Record<string, string>> = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.askAI': 'Ask AI',
        'nav.resources': 'Resources',
        'nav.reflections': 'Reflections',
        'nav.history': 'History',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',

        // Dashboard
        'dashboard.welcome': 'Welcome back',
        'dashboard.askQuestion': 'Ask a Question',
        'dashboard.viewResources': 'View Resources',
        'dashboard.myReflections': 'My Reflections',

        // Ask Question
        'ask.placeholder': 'Type your question here...',
        'ask.submit': 'Get Answer',
        'ask.voiceInput': 'Voice Input',
        'ask.listening': 'Listening...',

        // Resources
        'resources.title': 'Learning Resources',
        'resources.search': 'Search resources...',
        'resources.filter': 'Filter',
        'resources.viewAll': 'View All',

        // Reflections
        'reflections.title': 'My Reflections',
        'reflections.new': 'New Reflection',
        'reflections.daily': 'Daily Reflection',
        'reflections.lesson': 'Lesson Reflection',

        // Common
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.submit': 'Submit',
        'common.success': 'Success!',
        'common.error': 'An error occurred',
    },
    hi: {
        // Navigation
        'nav.home': 'होम',
        'nav.askAI': 'AI से पूछें',
        'nav.resources': 'संसाधन',
        'nav.reflections': 'चिंतन',
        'nav.history': 'इतिहास',
        'nav.profile': 'प्रोफ़ाइल',
        'nav.settings': 'सेटिंग्स',
        'nav.logout': 'लॉग आउट',

        // Dashboard
        'dashboard.welcome': 'स्वागत है',
        'dashboard.askQuestion': 'प्रश्न पूछें',
        'dashboard.viewResources': 'संसाधन देखें',
        'dashboard.myReflections': 'मेरे चिंतन',

        // Ask Question
        'ask.placeholder': 'यहाँ अपना प्रश्न लिखें...',
        'ask.submit': 'उत्तर प्राप्त करें',
        'ask.voiceInput': 'वॉइस इनपुट',
        'ask.listening': 'सुन रहा हूँ...',

        // Resources
        'resources.title': 'शिक्षण संसाधन',
        'resources.search': 'संसाधन खोजें...',
        'resources.filter': 'फ़िल्टर',
        'resources.viewAll': 'सभी देखें',

        // Reflections
        'reflections.title': 'मेरे चिंतन',
        'reflections.new': 'नया चिंतन',
        'reflections.daily': 'दैनिक चिंतन',
        'reflections.lesson': 'पाठ चिंतन',

        // Common
        'common.loading': 'लोड हो रहा है...',
        'common.save': 'सहेजें',
        'common.cancel': 'रद्द करें',
        'common.submit': 'जमा करें',
        'common.success': 'सफलता!',
        'common.error': 'एक त्रुटि हुई',
    },
    ta: {
        'nav.home': 'முகப்பு',
        'nav.askAI': 'AI கேள்',
        'nav.resources': 'வளங்கள்',
        'nav.logout': 'வெளியேறு',
        'common.loading': 'ஏற்றுகிறது...',
    },
    te: {
        'nav.home': 'హోమ్',
        'nav.askAI': 'AI అడగండి',
        'nav.resources': 'వనరులు',
        'nav.logout': 'లాగ్ అవుట్',
        'common.loading': 'లోడ్ అవుతోంది...',
    },
    kn: {
        'nav.home': 'ಮುಖಪುಟ',
        'nav.askAI': 'AI ಕೇಳಿ',
        'nav.resources': 'ಸಂಪನ್ಮೂಲಗಳು',
        'nav.logout': 'ಲಾಗ್ ಔಟ್',
        'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    },
}

// Get stored language or default to English
const getStoredLanguage = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('govtech_language') || 'en'
    }
    return 'en'
}

export function useTranslationHook() {
    const [language, setLanguageState] = useState(getStoredLanguage)

    // Translate a key
    const t = useCallback((key: string, fallback?: string): string => {
        const langDict = translations[language] || translations.en
        return langDict[key] || translations.en[key] || fallback || key
    }, [language])

    // Change language
    const setLanguage = useCallback((lang: string) => {
        if (translations[lang]) {
            setLanguageState(lang)
            localStorage.setItem('govtech_language', lang)
        }
    }, [])

    // Available languages
    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
        { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
        { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
        { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    ]

    return {
        t,
        language,
        setLanguage,
        languages,
    }
}

export default useTranslationHook
