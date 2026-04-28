import { createContext, useState, useEffect } from 'react';
import { subscribeToNeeds } from '../services/firestore';

// eslint-disable-next-line react-refresh/only-export-components
export const NeedsContext = createContext({ needs: [], loading: true, error: null });

export function NeedsProvider({ children }) {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToNeeds(
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
  }, []);

  return (
    <NeedsContext.Provider value={{ needs, loading, error }}>
      {children}
    </NeedsContext.Provider>
  );
}
