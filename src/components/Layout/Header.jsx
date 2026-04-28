import OrgBadge from '../Organization/OrgBadge';

export default function Header({ activeTab, onTabChange, user, login, logout }) {
  const tabs = [
    { id: 'board', label: 'Priority Board' },
    { id: 'submit', label: 'Submit Need' },
    { id: 'match', label: 'Volunteers' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.04]"
      style={{ background: 'rgba(5, 5, 7, 0.9)', backdropFilter: 'blur(24px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center text-sm font-black text-surface-base">
              SR
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight">
                Smart Resource
              </h1>
              <p className="text-[10px] font-medium text-text-secondary -mt-0.5 tracking-widest uppercase">
                AI Allocation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              Live
            </div>
            {user ? (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/[0.06]">
                <OrgBadge />
                <span className="text-xs text-text-secondary hidden sm:block">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-text-secondary hover:text-text-primary"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="ml-3 pl-3 border-l border-white/[0.06]">
                <button
                  onClick={login}
                  className="text-xs font-semibold px-4 py-1.5 rounded-lg gradient-accent text-surface-base hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 pb-0 -mb-px overflow-x-auto" role="tablist" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`tab-btn whitespace-nowrap ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
