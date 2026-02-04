import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut,
    ChevronDown,
    UserCircle,
    Settings
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function UserProfileMenu() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
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
                        <UserCircle className="w-5 h-5" />
                    )}
                </div>
                <div className="hidden sm:flex flex-col items-start pr-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{userName}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{userRole}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* User Header */}
                    <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-900/50 dark:to-blue-900/20 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate text-lg tracking-tight">{userName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-medium">{user?.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 space-y-1">
                        <Link
                            to="/teacher/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-sm text-gray-700 dark:text-gray-200 hover:shadow-sm"
                        >
                            <UserCircle className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">My Profile</span>
                        </Link>
                        {(userRole === 'TEACHER' || userRole === 'ADMIN') && <Link
                            to="/teacher/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all text-sm text-gray-700 dark:text-gray-200 hover:shadow-sm"
                        >
                            <Settings className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">Settings</span>
                        </Link>}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm text-red-600 dark:text-red-400 font-bold"
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
