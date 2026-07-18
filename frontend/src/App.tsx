import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { Spinner } from './components/ui/Spinner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CookieBanner } from './components/ui/CookieBanner';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { isOnboardingDone } from './components/onboarding/onboardingState';
import { useAuthStore } from './store/authStore';
import { useTrainingStore } from './store/trainingStore';
import { pingBackend } from './services/api';

// Route-level code-splitting: only the landing page ships in the initial chunk;
// every other page (and the charts / trainers they pull in) loads on navigation.
const TrainingPage = lazy(() => import('./pages/TrainingPage').then(m => ({ default: m.TrainingPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const TablePage = lazy(() => import('./pages/TablePage').then(m => ({ default: m.TablePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PokerRulesPage = lazy(() => import('./components/training/PokerRulesPage').then(m => ({ default: m.PokerRulesPage })));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage').then(m => ({ default: m.GlossaryPage })));
const LearningPathPage = lazy(() => import('./pages/LearningPathPage').then(m => ({ default: m.LearningPathPage })));
const PremiumPage = lazy(() => import('./pages/PremiumPage').then(m => ({ default: m.PremiumPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const CGUPage          = lazy(() => import('./pages/CGUPage').then(m => ({ default: m.CGUPage })));
const PrivacyPage      = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const VerifyEmailPage      = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage   = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage    = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AchievementsPage     = lazy(() => import('./pages/AchievementsPage').then(m => ({ default: m.AchievementsPage })));
// Internal developer docs — reachable only by typing the URL, never linked from
// any nav/menu/button. Rendered standalone below, outside the consumer Layout.
const DocumentationPage    = lazy(() => import('./pages/DocumentationPage').then(m => ({ default: m.DocumentationPage })));

// Every real page keeps the normal app Layout (Navbar/Footer/back button).
// /documentation is intercepted earlier by AppShell and never reaches here.
function AppRoutes() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rules" element={<PokerRulesPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/learning-path" element={<LearningPathPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/stats/:username" element={<StatsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/cgu"          element={<CGUPage />} />
            <Route path="/privacy"      element={<PrivacyPage />} />
            <Route path="/verify-email"    element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/achievements"   element={<AchievementsPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

// Chrome shared by every real page: cookie banner, analytics, first-visit
// onboarding modal. Skipped entirely on /documentation (see AppShell below) —
// that page is a bare internal doc, not part of the consumer product surface.
function AppChrome() {
  const fetchMe = useAuthStore(s => s.fetchMe);
  const startSession = useTrainingStore(s => s.startSession);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Wake up Render backend immediately so it's ready when the user hits a module
    pingBackend();
    startSession('preflop');
    fetchMe();

    // First-visit onboarding questionnaire — shown to everyone (logged in or not)
    // who hasn't completed it yet on this device.
    if (!isOnboardingDone()) {
      const timer = setTimeout(() => setShowOnboarding(true), 700);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <AppRoutes />
      <CookieBanner />
      <Analytics />
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      </AnimatePresence>
    </>
  );
}

// /documentation renders completely bare (no chrome, no onboarding, no cookie
// banner) — it's an internal doc page, not part of the consumer product.
function AppShell() {
  const { pathname } = useLocation();
  if (pathname === '/documentation') {
    return (
      <Suspense fallback={<Spinner />}>
        <DocumentationPage />
      </Suspense>
    );
  }
  return <AppChrome />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
