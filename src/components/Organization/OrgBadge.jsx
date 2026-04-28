import { useState, useRef, useEffect } from 'react';
import { useOrg } from '../../context/OrgContext';

export default function OrgBadge() {
  const { currentOrg, userOrgs, selectOrg, clearOrg } = useOrg();
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOrg) return null;

  const otherOrgs = userOrgs.filter((o) => o.id !== currentOrg.id);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setShowDropdown((p) => !p)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-all duration-200 text-xs"
        title="Switch organization"
      >
        <span className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center text-accent font-bold text-[10px]">
          {currentOrg.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
        <span className="text-accent font-semibold max-w-[100px] truncate hidden sm:block">
          {currentOrg.name}
        </span>
        <svg className="w-3 h-3 text-accent/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-surface-card border border-white/[0.08] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Current Organization</p>
            <p className="text-sm font-bold text-text-primary truncate">{currentOrg.name}</p>
          </div>

          {otherOrgs.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider">Switch To</p>
              {otherOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => { selectOrg(org); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <span className="w-6 h-6 rounded-md bg-white/[0.06] flex items-center justify-center text-text-secondary font-bold text-[10px]">
                    {org.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="text-xs text-text-secondary truncate">{org.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/[0.06] pt-1">
            <button
              onClick={() => { clearOrg(); setShowDropdown(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left text-xs text-text-muted"
            >
              <span>↩</span>
              <span>Change Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
