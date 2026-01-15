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
import AskQuestion from './pages/teacher/AskQuestion'
import AIResponse from './pages/teacher/AIResponse'
import Resources from './pages/teacher/Resources'
import ResourcePlayer from './pages/teacher/ResourcePlayer'
import Reflections from './pages/teacher/Reflections'
import CRPDashboard from './pages/crp/Dashboard'
import FeedbackAssist from './pages/crp/FeedbackAssist'
import ARPDashboard from './pages/arp/Dashboard'
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

    const userRole = user?.role?.toLowerCase() || ''
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
        case 'arp':
            return <Navigate to="/arp" replace />
        case 'crp':
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
            <Route path="/teacher/ask-question" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <AskQuestion />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/ai-response" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <AIResponse />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/reflections" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <Reflections />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/resources" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <Resources />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/resources/:id" element={
                <ProtectedRoute roles={['teacher']}>
                    <ResourcePlayer />
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


            {/* CRP routes */}
            <Route path="/crp" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/feedback-assist" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <FeedbackAssist />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/teachers" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/interventions" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/reports" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CRPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/history" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <TeacherHistory />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/profile" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <TeacherProfile />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/settings" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <TeacherSettings />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* ARP routes */}
            <Route path="/arp" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/feedback-assist" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <FeedbackAssist />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/teachers" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/interventions" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/reports" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/history" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <TeacherHistory />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/profile" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <TeacherProfile />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/settings" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <TeacherSettings />
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
