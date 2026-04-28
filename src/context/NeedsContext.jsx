import { createContext, useState, useEffect, useContext } from 'react';
import { subscribeToNeeds, subscribeToAllNeeds } from '../services/firestore';
import { OrgContext } from './OrgContext';

// eslint-disable-next-line react-refresh/only-export-components
export const NeedsContext = createContext({ needs: [], loading: true, error: null });

export function NeedsProvider({ children }) {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read orgId from OrgContext — null means public board (all orgs)
  const { currentOrg } = useContext(OrgContext);
  const orgId = currentOrg?.id || null;

  useEffect(() => {
    setLoading(true);
    setError(null);

    const subscribeFn = orgId
      ? (cb, errCb) => subscribeToNeeds(orgId, cb, errCb)
      : (cb, errCb) => subscribeToAllNeeds(cb, errCb);

    const unsubscribe = subscribeFn(
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
