import { createContext, useState, useEffect, useContext } from 'react';
import { subscribeToNeeds } from '../services/firestore';
import { OrgContext } from './OrgContext';

// eslint-disable-next-line react-refresh/only-export-components
export const NeedsContext = createContext({ needs: [], loading: true, error: null });

export function NeedsProvider({ children }) {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read orgId from OrgContext — null means no org selected
  const { currentOrg } = useContext(OrgContext);
  const orgId = currentOrg?.id || null;

  useEffect(() => {
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
  }, [orgId]);

  return (
    <NeedsContext.Provider value={{ needs, loading, error }}>
      {children}
    </NeedsContext.Provider>
  );
}
