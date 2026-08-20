import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import { PostProvider } from './context/PostContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RbacRoleBanner } from './components/RbacRoleBanner';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { ChangeAvatarModal } from './components/ChangeAvatarModal';
import { LandingPage } from './pages/Landing';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MessagesPage } from './pages/MessagesPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ApiTestPage } from './pages/ApiTestPage';
import { SearchPage } from './pages/SearchPage';
import { JobsPage } from './pages/JobsPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { TimeTrackingPage } from './pages/TimeTrackingPage';
import { CommunityChatPage } from './pages/CommunityChatPage';

// Scroll to top on navigation change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// ==========================================
// 1. AUTH GUARD: Protected Route (Authenticated users only)
// ==========================================
const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the Login page with return destination state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// ==========================================
// 2. ADMIN GUARD: Admin Route (Authenticated Admins only)
// ==========================================
const AdminRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// ==========================================
// 3. GUEST GUARD: Public Only Route (Unauthenticated users only)
// ==========================================
const PublicOnlyRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect already authenticated users away from login/register directly to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

// ==========================================
// 4. PUBLIC LAYOUT (Landing, About, Public Pricing)
// ==========================================
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// ==========================================
// 5. AUTHENTICATED APP LAYOUT (Dashboard, Messages, Projects, etc.)
// ==========================================
const AuthenticatedLayout: React.FC = () => {
  const { isCreatePostOpen, setIsCreatePostOpen, isCreateCommunityOpen, setIsCreateCommunityOpen } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* RBAC Role Testing Banner */}
      <RbacRoleBanner />

      {/* Authenticated Navbar */}
      <Navbar />

      {/* Main Protected Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Authenticated Global Modals */}
      <StripeCheckoutModal />
      <ChangeAvatarModal />
      <CreatePostModal isOpen={isCreatePostOpen} onClose={() => setIsCreatePostOpen(false)} />
      <CreateCommunityModal isOpen={isCreateCommunityOpen} onClose={() => setIsCreateCommunityOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CommunityProvider>
        <PostProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ======================================================== */}
              {/* A. STANDALONE AUTHENTICATION ROUTES (Pure Login/Signup)   */}
              {/* No Navbar, No Footer, No Modals, No Dashboard components */}
              {/* ======================================================== */}
              <Route
                path="/signin"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <AuthPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/verify-email"
                element={<VerifyEmailPage />}
              />
              <Route
                path="/api-test"
                element={<ApiTestPage />}
              />

              {/* ======================================================== */}
              {/* B. PUBLIC PAGES (With Public Navbar & Public Footer)      */}
              {/* ======================================================== */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/pricing" element={<PricingPage />} />
              </Route>

              {/* ======================================================== */}
              {/* C. PROTECTED ROUTES (Authenticated Dashboard & Community) */}
              {/* ======================================================== */}
              <Route
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:id" element={<CommunitiesPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectsPage />} />
                <Route path="/matches" element={<ProjectsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/billing" element={<SubscriptionPage />} />
                <Route path="/time-tracking" element={<TimeTrackingPage />} />
                <Route path="/community-chat" element={<CommunityChatPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/profile" element={<OnboardingPage />} />
                <Route path="/settings" element={<OnboardingPage />} />
                <Route path="/notifications" element={<DashboardPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Admin Console nested with AdminRoute protection */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* ======================================================== */}
              {/* D. FALLBACK / CATCH-ALL                                  */}
              {/* ======================================================== */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PostProvider>
      </CommunityProvider>
    </AuthProvider>
  );
}
