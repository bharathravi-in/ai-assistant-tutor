import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    User as UserIcon,
    LogOut,
    Moon,
    Sun,
    Globe,
    ChevronDown,
    UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAppLanguages } from '../../hooks/useAppLanguages';

export default function UserProfileMenu() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { languages, changeLanguage } = useAppLanguages();
    const [isOpen, setIsOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    const userRole = user?.role?.toUpperCase() || 'USER';
    const userName = user?.name || user?.phone || 'Teacher';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="User profile menu"
            >
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden border border-blue-200 dark:border-blue-800">
                    {user?.profile_image ? (
                        <img src={user.profile_image} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-5 h-5" />
                    )}
                </div>
                <div className="hidden sm:flex flex-col items-start pr-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{userName}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{userRole}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Header */}
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2 space-y-0.5">
                        <Link
                            to="/teacher/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm text-gray-700 dark:text-gray-200"
                        >
                            <UserCircle className="w-5 h-5 text-gray-400" />
                            <span>My Profile</span>
                        </Link>

                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200">
                            <Globe className="w-5 h-5 text-gray-400" />
                            <select
                                value={i18n.language}
                                onChange={(e) => {
                                    changeLanguage(e.target.value);
                                    setIsOpen(false);
                                }}
                                className="flex-1 bg-transparent focus:outline-none cursor-pointer"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.native_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm text-gray-700 dark:text-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                {darkMode ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
                                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${darkMode ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm text-red-600 dark:text-red-400 font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
