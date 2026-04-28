import { createContext, useState, useEffect, useContext } from 'react';
import { subscribeToVolunteers } from '../services/firestore';
import { OrgContext } from './OrgContext';
import { demoVolunteers, isDemoMode } from '../demo/demoMode';

// eslint-disable-next-line react-refresh/only-export-components
export const VolunteersContext = createContext({ volunteers: [], loading: true, error: null });

export function VolunteersProvider({ children }) {
  const demo = isDemoMode();
  const [volunteers, setVolunteers] = useState(demo ? demoVolunteers : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState(null);

  const { currentOrg } = useContext(OrgContext);
  const orgId = currentOrg?.id || null;

  useEffect(() => {
    if (demo) {
      setVolunteers(demoVolunteers);
      setLoading(false);
      setError(null);
      return undefined;
    }
    // Full isolation: no org = no data
    if (!orgId) {
      setVolunteers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToVolunteers(
      orgId,
      (updatedVolunteers) => {
        setVolunteers(updatedVolunteers);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Volunteers subscription error:', err);
        setError(err.message || 'Failed to load volunteers');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId, demo]);

  return (
    <VolunteersContext.Provider value={{ volunteers, loading, error }}>
      {children}
    </VolunteersContext.Provider>
  );
}
