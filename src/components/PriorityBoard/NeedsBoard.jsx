import { useState } from 'react';
import { useNeeds } from '../../hooks/useNeeds';
import NeedCard from './NeedCard';
import NeedDetailModal from './NeedDetailModal';
import LoadingSpinner from '../common/LoadingSpinner';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
];

export default function NeedsBoard() {
  const { needs, loading, error } = useNeeds();
  const [filter, setFilter] = useState('all');
  const [selectedNeedId, setSelectedNeedId] = useState(null);

  const filtered =
    filter === 'all'
      ? needs
      : needs.filter((n) => n.status === filter);

  const highCount = needs.filter((n) => n.urgency === 'HIGH' && n.status === 'open').length;
  const openCount = needs.filter((n) => n.status === 'open').length;

  // Get the live version of the selected need from the real-time needs array
  const selectedNeed = selectedNeedId ? needs.find((n) => n.id === selectedNeedId) : null;

  const handleCardClick = (need) => {
    setSelectedNeedId(need.id);
  };

  const handleCloseModal = () => {
    setSelectedNeedId(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading priority board..." />;
  }

  if (error) {
    return (
      <div className="animate-fade-in text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-urgent-high/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">⚠️</span>
        </div>
        <p className="text-urgent-high font-semibold text-sm mb-2">Connection Error</p>
        <p className="text-text-secondary text-xs mb-5 max-w-xs mx-auto">{error}</p>
        <button className="btn-secondary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Summary */}
      <div className="mb-5">
        <p className="text-sm text-text-secondary">
          <span className="font-bold text-urgent-high">{highCount} High Priority</span>
          <span className="mx-2 text-text-muted">·</span>
          <span>{openCount} Total Open</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const count =
            f.id === 'all'
              ? needs.length
              : needs.filter((n) => n.status === f.id).length;
          return (
            <button
              key={f.id}
              id={`filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                filter === f.id
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-text-secondary font-medium text-sm">
            {filter === 'all'
              ? 'No needs reported yet. Submit the first one!'
              : `No ${filter} needs right now.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((need) => (
            <NeedCard key={need.id} need={need} onClick={handleCardClick} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedNeed && (
        <NeedDetailModal need={selectedNeed} onClose={handleCloseModal} />
      )}
    </div>
  );
}
