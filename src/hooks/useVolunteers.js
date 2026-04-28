import { useContext, useMemo } from 'react';
import { VolunteersContext } from '../context/VolunteersContext';

export function useVolunteers() {
  const { volunteers, loading, error } = useContext(VolunteersContext);

  const sorted = useMemo(() => {
    return [...volunteers].sort((a, b) => {
      // Free volunteers first
      if (a.status === 'free' && b.status !== 'free') return -1;
      if (a.status !== 'free' && b.status === 'free') return 1;
      // Then by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [volunteers]);

  const freeVolunteers = useMemo(
    () => sorted.filter((v) => v.status === 'free'),
    [sorted]
  );

  const busyVolunteers = useMemo(
    () => sorted.filter((v) => v.status === 'busy'),
    [sorted]
  );

  const getVolunteerById = (id) => volunteers.find((v) => v.id === id) || null;

  return {
    volunteers: sorted,
    freeVolunteers,
    busyVolunteers,
    loading,
    error,
    getVolunteerById,
    totalCount: volunteers.length,
    freeCount: freeVolunteers.length,
    busyCount: busyVolunteers.length,
  };
}
