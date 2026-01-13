import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherProfile from './pages/teacher/Profile'
import TeacherHistory from './pages/teacher/History'
import TeacherSettings from './pages/teacher/Settings'
import CRPDashboard from './pages/crp/Dashboard'
import FeedbackAssist from './pages/crp/FeedbackAssist'
import AdminDashboard from './pages/admin/Dashboard'
import SuperadminDashboard from './pages/superadmin/Dashboard'
import OrganizationSettings from './pages/superadmin/OrganizationSettings'
import OrganizationsList from './pages/superadmin/OrganizationsList'
import PlansPage from './pages/superadmin/PlansPage'
import SettingsPage from './pages/superadmin/SettingsPage'
import AISettingsPage from './pages/superadmin/AISettingsPage'

// Layout
import Layout from './components/common/Layout'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
    const { isAuthenticated, user } = useAuthStore()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    const userRole = user?.role?.toLowerCase()
    if (roles && user && !roles.includes(userRole)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

function RoleBasedRedirect() {
    const { user } = useAuthStore()

    if (!user) return <Navigate to="/login" replace />

    const role = user.role?.toLowerCase()
    switch (role) {
        case 'superadmin':
            return <Navigate to="/superadmin" replace />
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
            <Route path="/teacher" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/profile" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherProfile />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/history" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherHistory />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/settings" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherSettings />
                    </Layout>
                </ProtectedRoute>
            } />


            {/* CRP/ARP routes */}
            <Route path="/crp" element={
                <ProtectedRoute roles={['crp', 'arp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/feedback-assist" element={
                <ProtectedRoute roles={['crp', 'arp']}>
                    <Layout>
                        <FeedbackAssist />
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

            {/* Superadmin routes */}
            <Route path="/superadmin" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <SuperadminDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/superadmin/organizations" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <OrganizationsList />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/superadmin/organizations/:orgId" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <OrganizationSettings />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/superadmin/plans" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <PlansPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/superadmin/settings" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <SettingsPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/superadmin/ai-settings" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <AISettingsPage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
