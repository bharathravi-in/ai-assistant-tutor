"""
Internationalization Utilities
"""
from typing import Dict

# Language mappings
LANGUAGE_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "हिंदी",
    "ta": "தமிழ்",
    "te": "తెలుగు",
    "kn": "ಕನ್ನಡ",
    "mr": "मराठी",
}

# UI Translations (basic)
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        "welcome": "Welcome to AI Teaching Assistant",
        "explain_mode": "Explain / Teach",
        "assist_mode": "Classroom Assist",
        "plan_mode": "Plan Lesson",
        "ask_placeholder": "Ask your teaching question...",
        "tried_label": "Did you try this suggestion?",
        "worked_label": "Did it work?",
    },
    "hi": {
        "welcome": "AI शिक्षण सहायक में आपका स्वागत है",
        "explain_mode": "समझाएं / सिखाएं",
        "assist_mode": "कक्षा सहायता",
        "plan_mode": "पाठ योजना",
        "ask_placeholder": "अपना शिक्षण प्रश्न पूछें...",
        "tried_label": "क्या आपने यह सुझाव आज़माया?",
        "worked_label": "क्या यह काम किया?",
    },
}


def get_translation(key: str, language: str = "en") -> str:
    """Get a translated string for a given key and language."""
    lang_translations = TRANSLATIONS.get(language, TRANSLATIONS["en"])
    return lang_translations.get(key, TRANSLATIONS["en"].get(key, key))


def get_language_name(code: str) -> str:
    """Get the display name for a language code."""
    return LANGUAGE_NAMES.get(code, code)
