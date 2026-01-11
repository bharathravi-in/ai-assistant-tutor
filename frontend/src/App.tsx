import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherDashboard from './pages/teacher/Dashboard'
import CRPDashboard from './pages/crp/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'

// Layout
import Layout from './components/common/Layout'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
    const { isAuthenticated, user } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (roles && user && !roles.includes(user.role)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

function RoleBasedRedirect() {
    const { user } = useAuthStore()

    if (!user) return <Navigate to="/login" replace />

    switch (user.role) {
        case 'admin':
            return <Navigate to="/admin" replace />
        case 'crp':
        case 'arp':
            return <Navigate to="/crp" replace />
        default:
            return <Navigate to="/teacher" replace />
    }
}

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Role-based redirect */}
            <Route path="/" element={
                <ProtectedRoute>
                    <RoleBasedRedirect />
                </ProtectedRoute>
            } />

            {/* Teacher routes */}
            <Route path="/teacher/*" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherDashboard />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* CRP/ARP routes */}
            <Route path="/crp/*" element={
                <ProtectedRoute roles={['crp', 'arp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/*" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminDashboard />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
