import { useNeeds } from '../../hooks/useNeeds';
import { useVolunteers } from '../../hooks/useVolunteers';

export default function StatusBar() {
  const { needs, loading } = useNeeds();
  const { totalCount, freeCount, busyCount, loading: volLoading } = useVolunteers();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="shimmer h-8 rounded-xl w-80"></div>
      </div>
    );
  }

  const openNeeds = needs.filter((n) => n.status === 'open');
  const highNeeds = openNeeds.filter((n) => n.urgency === 'HIGH');
  const assignedNeeds = needs.filter((n) => n.status === 'assigned' || n.status === 'in_progress');
  const resolvedNeeds = needs.filter((n) => n.status === 'resolved');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <div className="flex flex-wrap gap-3 text-xs font-medium">
        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-urgent-high"></span>
          <span className="text-text-secondary">{highNeeds.length} High Priority</span>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          <span className="text-text-secondary">{openNeeds.length} Open</span>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-assigned"></span>
          <span className="text-text-secondary">{assignedNeeds.length} Assigned</span>
        </div>
        <div className="flex items-center gap-2 glass-card px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-resolved"></span>
          <span className="text-text-secondary">{resolvedNeeds.length} Resolved</span>
        </div>

        {/* Volunteer stats */}
        {!volLoading && totalCount > 0 && (
          <>
            <div className="w-px h-5 bg-white/[0.06] self-center hidden sm:block" />
            <div className="flex items-center gap-2 glass-card px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span className="text-text-secondary">{freeCount} Free</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-urgent-medium"></span>
              <span className="text-text-secondary">{busyCount} Busy</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
