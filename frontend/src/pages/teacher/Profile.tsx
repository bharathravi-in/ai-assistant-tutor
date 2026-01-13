import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    User,
    Phone,
    Mail,
    School,
    Globe,
    Moon,
    Sun,
    Bell,
    Save,
    Check,
    Camera,
    Briefcase,
    Users
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
]

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'EVS', 'Computer Science']

export default function TeacherProfile() {
    const { t } = useTranslation()
    const { user } = useAuthStore()
    const [saved, setSaved] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isDark, setIsDark] = useState(false)

    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        school_name: user?.school_name || '',
        school_district: user?.school_district || '',
        school_state: user?.school_state || '',
        grades_taught: user?.grades_taught || [],
        subjects_taught: user?.subjects_taught || [],
        language: user?.language || 'en',
        notifications_enabled: true,
    })

    const toggleGrade = (grade: string) => {
        setProfile(prev => ({
            ...prev,
            grades_taught: prev.grades_taught.includes(grade)
                ? prev.grades_taught.filter((g: string) => g !== grade)
                : [...prev.grades_taught, grade]
        }))
    }

    const toggleSubject = (subject: string) => {
        setProfile(prev => ({
            ...prev,
            subjects_taught: prev.subjects_taught.includes(subject)
                ? prev.subjects_taught.filter((s: string) => s !== subject)
                : [...prev.subjects_taught, subject]
        }))
    }

    const handleLanguageChange = (lang: string) => {
        setProfile(prev => ({ ...prev, language: lang }))
    }

    const toggleDarkMode = () => {
        setIsDark(!isDark)
        document.documentElement.classList.toggle('dark')
    }

    const handleSave = async () => {
        setSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="min-h-[calc(100vh-80px)] p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <div
                    className="relative rounded-3xl p-6 lg:p-8 text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #264092 0%, #1c3070 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: '#EF951E', transform: 'translate(30%, -40%)' }} />

                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold">
                                {profile.name?.charAt(0)?.toUpperCase() || 'T'}
                            </div>
                            <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                style={{ background: '#EF951E' }}
                            >
                                <Camera className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl lg:text-3xl font-bold">{profile.name || 'Teacher'}</h1>
                            <p className="text-white/70">{profile.email}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                                    {user?.role || 'Teacher'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                            <User className="w-5 h-5" style={{ color: '#264092' }} />
                            Personal Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                    style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                        style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                        style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* School Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                            <School className="w-5 h-5" style={{ color: '#264092' }} />
                            School Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">School Name</label>
                                <input
                                    type="text"
                                    value={profile.school_name}
                                    onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                    style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">District</label>
                                <input
                                    type="text"
                                    value={profile.school_district}
                                    onChange={(e) => setProfile({ ...profile, school_district: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                    style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">State</label>
                                <input
                                    type="text"
                                    value={profile.school_state}
                                    onChange={(e) => setProfile({ ...profile, school_state: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 transition-all"
                                    style={{ '--tw-ring-color': '#264092' } as React.CSSProperties}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grades & Subjects */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                            <Users className="w-5 h-5" style={{ color: '#264092' }} />
                            Classes & Subjects
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Grades You Teach</label>
                                <div className="flex flex-wrap gap-2">
                                    {GRADES.map(grade => (
                                        <button
                                            key={grade}
                                            onClick={() => toggleGrade(grade)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${profile.grades_taught.includes(grade)
                                                    ? 'text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                }`}
                                            style={profile.grades_taught.includes(grade) ? { background: '#264092' } : {}}
                                        >
                                            {grade}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Subjects You Teach</label>
                                <div className="flex flex-wrap gap-2">
                                    {SUBJECTS.map(subject => (
                                        <button
                                            key={subject}
                                            onClick={() => toggleSubject(subject)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${profile.subjects_taught.includes(subject)
                                                    ? 'text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                }`}
                                            style={profile.subjects_taught.includes(subject) ? { background: '#EF951E' } : {}}
                                        >
                                            {subject}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                            <Briefcase className="w-5 h-5" style={{ color: '#264092' }} />
                            Preferences
                        </h2>
                        <div className="space-y-5">
                            {/* Language */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                                    <Globe className="w-4 h-4 inline mr-2" />
                                    Preferred Language
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${profile.language === lang.code
                                                    ? 'text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                                }`}
                                            style={profile.language === lang.code ? { background: '#264092' } : {}}
                                        >
                                            <span>{lang.flag}</span>
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dark Mode */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                    {isDark ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
                                    <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className="relative w-14 h-7 rounded-full transition-colors"
                                    style={{ background: isDark ? '#264092' : '#d1d5db' }}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${isDark ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">Notifications</span>
                                </div>
                                <button
                                    onClick={() => setProfile({ ...profile, notifications_enabled: !profile.notifications_enabled })}
                                    className="relative w-14 h-7 rounded-full transition-colors"
                                    style={{ background: profile.notifications_enabled ? '#EF951E' : '#d1d5db' }}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${profile.notifications_enabled ? 'left-8' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${saved ? 'bg-green-500' : ''
                        }`}
                    style={!saved ? { background: 'linear-gradient(135deg, #264092 0%, #3451a8 100%)' } : {}}
                >
                    {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
