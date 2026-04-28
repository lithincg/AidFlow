import { createContext, useState, useEffect } from 'react';
import { subscribeToVolunteers } from '../services/firestore';

// eslint-disable-next-line react-refresh/only-export-components
export const VolunteersContext = createContext({ volunteers: [], loading: true, error: null });

export function VolunteersProvider({ children }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToVolunteers(
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
  }, []);

  return (
    <VolunteersContext.Provider value={{ volunteers, loading, error }}>
      {children}
    </VolunteersContext.Provider>
  );
}
