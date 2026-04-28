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

    if (activeTab === 'submit' || activeTab === 'match') {
      if (!user) {
        return (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="bg-surface-card border border-white/[0.04] p-8 rounded-2xl max-w-md w-full text-center">
              <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-5">
                <span className="text-surface-base font-bold text-lg">🔒</span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Sign in required</h2>
              <p className="text-text-secondary text-sm mb-6">
                You must be logged in as an authorized NGO worker to access this feature.
              </p>
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
                  {authError}
                </div>
              )}
              <button onClick={login} className="btn-primary w-full">
                Sign in with Google
              </button>
            </div>
          </div>
        );
      }

      // Authenticated but no org selected — show org picker
      if (!orgLoading && !currentOrg) {
        return <OrgPicker />;
      }
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
      {activeTab === 'board' && <StatusBar />}
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
