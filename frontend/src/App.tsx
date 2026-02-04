import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useSettingsStore } from './stores/settingsStore'
import { initializeTheme } from './hooks/useOrgSettings'

// Pages
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import HelpPage from './pages/HelpPage'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherProfile from './pages/teacher/Profile'
import TeacherHistory from './pages/teacher/History'
import TeacherSettings from './pages/teacher/Settings'
import AskQuestion from './pages/teacher/AskQuestion'
import AIResponse from './pages/teacher/AIResponse'
import Resources from './pages/teacher/Resources'
import ResourcePlayer from './pages/teacher/ResourcePlayer'
import Reflections from './pages/teacher/Reflections'
import FeedbackInbox from './pages/teacher/FeedbackInbox'
import TeacherSurveys from './pages/teacher/Surveys'
import ContentCreator from './pages/teacher/ContentCreator'
import SimpleContentCreator from './pages/teacher/SimpleContentCreator'
import MyContent from './pages/teacher/MyContent'
import ContentPreview from './pages/teacher/ContentPreview'
import MyVisits from './pages/teacher/MyVisits'
import ContentLibrary from './pages/common/ContentLibrary'
import ContentBrowse from './pages/common/ContentBrowse'
import ContentPlayer from './pages/common/ContentPlayer'
import ConversationList from './components/ConversationList'
import ChatInterface from './components/ChatInterface'
import CRPDashboard from './pages/crp/Dashboard'
import FeedbackAssist from './pages/crp/FeedbackAssist'
import VisitSchedule from './pages/crp/VisitSchedule'
import ContentApproval from './pages/crp/ContentApproval'
import ContentReview from './pages/crp/ContentReview'
import TeacherNetwork from './pages/crp/TeacherNetwork'
import CRPReports from './pages/crp/Reports'
import CreateTeacher from './pages/crp/CreateTeacher'
import SharedQueryInbox from './pages/crp/SharedQueryInbox'
import RequestFeedback from './pages/crp/RequestFeedback'
import SurveyBuilder from './pages/crp/SurveyBuilder'
import TeacherResources from './pages/crp/TeacherResources'
import ARPDashboard from './pages/arp/Dashboard'
import ARPTeachers from './pages/arp/Teachers'
import ARPReports from './pages/arp/Reports'
import UserManagement from './pages/arp/UserManagement'
import ProgramBuilder from './pages/arp/ProgramBuilder'
import GapAnalysis from './pages/arp/GapAnalysis'
import AdminDashboard from './pages/admin/Dashboard'
import CreateResource from './pages/admin/CreateResource'
import AdminAnalytics from './pages/admin/Analytics'
import AdminContent from './pages/admin/Content'
import AdminUsers from './pages/admin/Users'
import AdminSettings from './pages/admin/Settings'
import SchoolConfig from './pages/admin/SchoolConfig'
import MasterData from './pages/admin/MasterData'
import OrgSettings from './pages/admin/OrgSettings'
import BulkUserImport from './pages/admin/BulkUserImport'
import ContentList from './pages/admin/ContentList'
import Reports from './pages/admin/Reports'
import SuperadminDashboard from './pages/superadmin/Dashboard'
import OrganizationSettings from './pages/superadmin/OrganizationSettings'
import OrganizationsList from './pages/superadmin/OrganizationsList'
import CreateOrganization from './pages/superadmin/CreateOrganization'
import PlansPage from './pages/superadmin/PlansPage'
import SettingsPage from './pages/superadmin/SettingsPage'
import AISettingsPage from './pages/superadmin/AISettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import LearningPage from './pages/LearningPage'
import ModuleDetailPage from './pages/ModuleDetailPage'
import ScenariosPage from './pages/ScenariosPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import MessagesPage from './pages/MessagesPage'

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
    // Initialize theme and settings on app load
    useEffect(() => {
        initializeTheme()
        if (useAuthStore.getState().isAuthenticated) {
            useSettingsStore.getState().initialize()
        }
    }, [])

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/help" element={<HelpPage />} />

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
            <Route path="/teacher/feedback-inbox" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <FeedbackInbox />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/surveys" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <TeacherSurveys />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/content/create" element={
                <ProtectedRoute roles={['teacher']}>
                    <SimpleContentCreator />
                </ProtectedRoute>
            } />
            <Route path="/teacher/content/new" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <ContentCreator />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/content/edit/:id" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <ContentCreator />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/my-content" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <MyContent />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/content-library" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <ContentLibrary />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/my-visits" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <MyVisits />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/content/preview/:id" element={
                <ProtectedRoute roles={['teacher']}>
                    <ContentPreview />
                </ProtectedRoute>
            } />
            <Route path="/teacher/chat" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <ConversationList />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/teacher/chat/:conversationId" element={
                <ProtectedRoute roles={['teacher']}>
                    <Layout>
                        <ChatInterface />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/messages" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <MessagesPage />
                    </Layout>
                </ProtectedRoute>
            } />

            {/* Common routes - Analytics & Learning */}
            <Route path="/analytics" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <AnalyticsPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/content/browse" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin', 'superadmin']}>
                    <Layout>
                        <ContentBrowse />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/content/player/:id" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin', 'superadmin']}>
                    <ContentPlayer />
                </ProtectedRoute>
            } />
            <Route path="/learning" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <LearningPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/learning/modules/:id" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <ModuleDetailPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/learning/scenarios" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <ScenariosPage />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/learning/scenarios/:id" element={
                <ProtectedRoute roles={['teacher', 'crp', 'arp', 'admin']}>
                    <Layout>
                        <ScenarioDetailPage />
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
            <Route path="/crp/resources/create" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CreateResource />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/teachers" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <TeacherNetwork />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/interventions" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <VisitSchedule />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/reports" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CRPReports />
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
            <Route path="/crp/create-teacher" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <CreateTeacher />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/shared-queries" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <SharedQueryInbox />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/request-feedback" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <RequestFeedback />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/surveys" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <SurveyBuilder />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/teacher-resources" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <TeacherResources />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/content-approval" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <ContentApproval />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/content-library" element={
                <ProtectedRoute roles={['crp']}>
                    <Layout>
                        <ContentLibrary />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/crp/content-review/:id" element={
                <ProtectedRoute roles={['crp']}>
                    <ContentReview />
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
            <Route path="/arp/resources/create" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <CreateResource />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/teachers" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPTeachers />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/interventions" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <VisitSchedule />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/reports" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ARPReports />
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
            <Route path="/arp/shared-queries" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <SharedQueryInbox />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/teacher-resources" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <TeacherResources />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/request-feedback" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <RequestFeedback />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/surveys" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <SurveyBuilder />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/users" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <UserManagement />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/programs" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ProgramBuilder />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/gap-analysis" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <GapAnalysis />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/content-approval" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ContentApproval />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/content-library" element={
                <ProtectedRoute roles={['arp']}>
                    <Layout>
                        <ContentLibrary />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/arp/content-review/:id" element={
                <ProtectedRoute roles={['arp']}>
                    <ContentReview />
                </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminDashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/resources/create" element={
                <ProtectedRoute roles={['admin', 'crp', 'arp']}>
                    <Layout>
                        <CreateResource />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminAnalytics />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminContent />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminUsers />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <AdminSettings />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/schools" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <SchoolConfig />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/master-data" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <MasterData />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/org-settings" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <OrgSettings />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/users/import" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <BulkUserImport />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/content-list" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <ContentList />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
                <ProtectedRoute roles={['admin']}>
                    <Layout>
                        <Reports />
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
            <Route path="/superadmin/organizations/new" element={
                <ProtectedRoute roles={['superadmin']}>
                    <Layout>
                        <CreateOrganization />
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
