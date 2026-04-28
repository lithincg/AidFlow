import { useState } from 'react';
import { useNeeds } from '../../hooks/useNeeds';

/**
 * CrisisCluster — Shows a badge on NeedCards that are linked to other reports.
 * Allows expanding to see a brief summary of the linked reports.
 */
export default function CrisisCluster({ linkedNeedIds }) {
  const [expanded, setExpanded] = useState(false);
  const { needs } = useNeeds();

  if (!linkedNeedIds || linkedNeedIds.length === 0) return null;

  const linkedNeeds = linkedNeedIds
    .map(id => needs.find(n => n.id === id))
    .filter(Boolean);

  if (linkedNeeds.length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-white/[0.04]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center gap-1.5 text-[10px] text-text-secondary hover:text-text-primary transition-colors bg-white/[0.02] hover:bg-white/[0.05] px-2 py-1 rounded"
      >
        <span className="text-accent">🔗</span>
        <span className="font-medium">
          {linkedNeeds.length} related report{linkedNeeds.length > 1 ? 's' : ''}
        </span>
        <span className="opacity-50 ml-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-white/[0.06] animate-fade-in" onClick={e => e.stopPropagation()}>
          {linkedNeeds.map(need => (
            <div key={need.id} className="text-[10px]">
              <span className="text-text-muted">📍 {need.location}</span>
              <span className="mx-1 text-text-muted opacity-50">•</span>
              <span className="text-text-secondary">{need.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
