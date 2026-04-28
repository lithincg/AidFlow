import { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Layout/Header';
import StatusBar from './components/Layout/StatusBar';
import NeedsBoard from './components/PriorityBoard/NeedsBoard';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useAuth } from './context/AuthContext';
import { useOrg } from './context/OrgContext';
import OrgPicker from './components/Organization/OrgPicker';

// Code-split: these tabs are behind auth and don't need to load upfront
const TextSubmitForm = lazy(() => import('./components/NeedSubmission/TextSubmitForm'));
const OCRUpload = lazy(() => import('./components/NeedSubmission/OCRUpload'));
const VolunteerRoster = lazy(() => import('./components/VolunteerMatch/VolunteerRoster'));

// ── Welcome Landing (shown when not logged in) ─────────
function WelcomeLanding({ login, authError }) {
  return (
    <div className="flex h-[80vh] items-center justify-center animate-fade-in">
      <div className="bg-surface-card border border-white/[0.04] p-8 rounded-2xl max-w-lg w-full text-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6">
          <span className="text-surface-base font-black text-2xl">SR</span>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          Smart Resource Allocation
        </h2>
        <p className="text-text-secondary text-sm mb-2">
          AI-powered disaster relief coordination for NGOs
        </p>
        <p className="text-text-muted text-xs mb-8 max-w-sm mx-auto leading-relaxed">
          Each organization gets its own private workspace to manage needs,
          volunteers, and AI-powered assignments. Sign in to access your
          organization's dashboard.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-lg mb-1">🎯</div>
            <p className="text-[10px] text-text-muted font-medium">AI Need Classification</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-lg mb-1">🤖</div>
            <p className="text-[10px] text-text-muted font-medium">Smart Volunteer Matching</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-lg mb-1">🏢</div>
            <p className="text-[10px] text-text-muted font-medium">Multi-NGO Isolation</p>
          </div>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
            {authError}
          </div>
        )}

        <button onClick={login} className="btn-primary w-full py-3 text-base">
          Sign in with Google
        </button>
        <p className="text-[10px] text-text-muted mt-3">
          Only authorized NGO workers can access the platform
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('board');
  const { user, loading, login, logout, authError } = useAuth();
  const { currentOrg, loading: orgLoading } = useOrg();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'board';
      setActiveTab(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
    }

    // ── Gate 1: Must be logged in for ANY tab ──
    if (!user) {
      return <WelcomeLanding login={login} authError={authError} />;
    }

    // ── Gate 2: Must have an org selected for ANY tab ──
    if (!orgLoading && !currentOrg) {
      return <OrgPicker />;
    }

    // ── Gate 3: Still loading org data ──
    if (orgLoading) {
      return <LoadingSpinner text="Loading your organization..." />;
    }

    switch (activeTab) {
      case 'board':
        return <NeedsBoard />;
      case 'submit':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading submission form..." />}>
            <div className="space-y-6 max-w-3xl mx-auto">
              <TextSubmitForm />
              <OCRUpload />
            </div>
          </Suspense>
        );
      case 'match':
        return (
          <Suspense fallback={<LoadingSpinner text="Loading volunteer roster..." />}>
            <div className="max-w-5xl mx-auto">
              <VolunteerRoster />
            </div>
          </Suspense>
        );
      default:
        return <NeedsBoard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-text-primary font-sans selection:bg-accent/20">
      <Header activeTab={activeTab} onTabChange={(id) => window.location.hash = id} user={user} login={login} logout={logout} />
      {activeTab === 'board' && user && currentOrg && <StatusBar />}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
