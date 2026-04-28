import { createContext, useState, useEffect, useContext } from 'react';
import { subscribeToNeeds } from '../services/firestore';
import { OrgContext } from './OrgContext';
import { demoNeeds, isDemoMode } from '../demo/demoMode';

// eslint-disable-next-line react-refresh/only-export-components
export const NeedsContext = createContext({ needs: [], loading: true, error: null });

export function NeedsProvider({ children }) {
  const demo = isDemoMode();
  const [needs, setNeeds] = useState(demo ? demoNeeds : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState(null);

  // Read orgId from OrgContext — null means no org selected
  const { currentOrg } = useContext(OrgContext);
  const orgId = currentOrg?.id || null;

  useEffect(() => {
    if (demo) {
      setNeeds(demoNeeds);
      setLoading(false);
      setError(null);
      return undefined;
    }
    // Full isolation: no org = no data
    if (!orgId) {
      setNeeds([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToNeeds(
      orgId,
      (updatedNeeds) => {
        setNeeds(updatedNeeds);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError(err.message || 'Failed to load needs');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, demo]);

  return (
    <NeedsContext.Provider value={{ needs, loading, error }}>
      {children}
    </NeedsContext.Provider>
  );
}
