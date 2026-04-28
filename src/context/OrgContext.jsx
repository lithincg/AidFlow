import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserOrganizations } from '../services/firestore';
import { demoOrg, isDemoMode } from '../demo/demoMode';

// eslint-disable-next-line react-refresh/only-export-components
export const OrgContext = createContext({
  currentOrg: null,
  userOrgs: [],
  loading: true,
  selectOrg: () => {},
  clearOrg: () => {},
});

const LS_KEY = 'sra_current_org';

export function OrgProvider({ children }) {
  const demo = isDemoMode();
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(demo ? demoOrg : null);
  const [userOrgs, setUserOrgs] = useState(demo ? [demoOrg] : []);
  const [loading, setLoading] = useState(!demo);

  // Load user's organizations when auth state changes
  useEffect(() => {
    if (demo) return undefined;
    if (!user) {
      setCurrentOrg(null);
      setUserOrgs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrgs() {
      setLoading(true);
      try {
        const orgs = await getUserOrganizations(user.uid);
        if (cancelled) return;

        setUserOrgs(orgs);

        // Try to restore from localStorage
        const savedOrgId = localStorage.getItem(LS_KEY);
        if (savedOrgId) {
          const savedOrg = orgs.find((o) => o.id === savedOrgId);
          if (savedOrg) {
            setCurrentOrg(savedOrg);
          } else if (orgs.length === 1) {
            // Saved org not found but user has exactly one — auto-select it
            setCurrentOrg(orgs[0]);
            localStorage.setItem(LS_KEY, orgs[0].id);
          }
        } else if (orgs.length === 1) {
          // Auto-select if user only belongs to one org
          setCurrentOrg(orgs[0]);
          localStorage.setItem(LS_KEY, orgs[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrgs();
    return () => { cancelled = true; };
  }, [user, demo]);

  const selectOrg = useCallback((org) => {
    setCurrentOrg(org);
    if (org) {
      localStorage.setItem(LS_KEY, org.id);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  const clearOrg = useCallback(() => {
    setCurrentOrg(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  // Refresh userOrgs (called after creating/joining an org)
  const refreshOrgs = useCallback(async () => {
    if (demo) return [demoOrg];
    if (!user) return;
    try {
      const orgs = await getUserOrganizations(user.uid);
      setUserOrgs(orgs);
      return orgs;
    } catch (err) {
      console.error('Failed to refresh organizations:', err);
      return [];
    }
  }, [user, demo]);

  return (
    <OrgContext.Provider value={{ currentOrg, userOrgs, loading, selectOrg, clearOrg, refreshOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useOrg = () => useContext(OrgContext);
