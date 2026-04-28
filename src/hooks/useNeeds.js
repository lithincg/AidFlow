import { useContext, useMemo } from 'react';
import { NeedsContext } from '../context/NeedsContext';

export function useNeeds() {
  const context = useContext(NeedsContext);
  
  if (!context) {
    throw new Error('useNeeds must be used within a NeedsProvider');
  }

  // Sort: HIGH first, then MEDIUM, then LOW; within same urgency, newest first
  const sortedNeeds = useMemo(() => {
    return [...context.needs].sort((a, b) => {
      const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const urgDiff =
        (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
      if (urgDiff !== 0) return urgDiff;
      // Newer first within same urgency
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  }, [context.needs]);

  return { needs: sortedNeeds, loading: context.loading, error: context.error };
}

