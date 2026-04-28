import UrgencyBadge from './UrgencyBadge';
import { useAuth } from '../../context/AuthContext';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NeedCard({ need, onClick }) {
  const { user } = useAuth();
  const borderClass = {
    open: `need-card-${(need.urgency || 'low').toLowerCase()}`,
    assigned: 'need-card-assigned',
    in_progress: 'need-card-assigned',
    resolved: 'need-card-resolved',
  };

  const statusBadgeClass = {
    assigned: 'badge-status-assigned',
    in_progress: 'badge-status-in_progress',
    resolved: 'badge-status-resolved',
  };

  const isHighOpen = need.urgency === 'HIGH' && need.status === 'open';

  // Multi-volunteer support
  const assignedVols = need.assignedVolunteers || [];
  const volunteersNeeded = need.volunteersNeeded || 1;
  const assignedCount = assignedVols.length;
  // Backward compat
  const legacyVolunteer = !assignedCount && need.assignedVolunteer;
  const displayCount = legacyVolunteer ? 1 : assignedCount;

  return (
    <div
      className={`glass-card p-4 ${borderClass[need.status] || borderClass.open} ${
        isHighOpen ? 'pulse-urgent' : ''
      } animate-slide-up transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 cursor-pointer group`}
      onClick={() => onClick?.(need)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(need); }}
    >
      {/* Top row: badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-2">
          <UrgencyBadge urgency={need.urgency} />
          <span className="badge badge-type">{need.needType}</span>
        </div>
        {need.status !== 'open' && (
          <span className={`badge ${statusBadgeClass[need.status] || ''}`}>
            {need.status === 'in_progress' ? 'In Progress' : need.status}
          </span>
        )}
      </div>

      {/* Location */}
      <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-1.5">
        <span className="text-xs opacity-40">📍</span>
        {need.location || 'Unknown location'}
      </h3>

      {/* Description */}
      <p className="text-xs text-text-secondary line-clamp-2 mb-2 leading-relaxed">
        {need.description}
      </p>

      {/* Affected group */}
      {need.affectedGroup && (
        <p className="text-xs text-text-secondary/60 mb-3">
          <span className="font-medium text-text-secondary">Affected:</span> {need.affectedGroup}
        </p>
      )}

      {/* Volunteer staffing indicator */}
      {(displayCount > 0 || volunteersNeeded > 1) && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-text-muted font-medium">
              👥 {displayCount}/{volunteersNeeded} volunteer{volunteersNeeded > 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (displayCount / volunteersNeeded) * 100)}%`,
                background: displayCount >= volunteersNeeded
                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                  : displayCount > 0
                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                  : 'transparent',
              }}
            />
          </div>
          {/* Show first 2 volunteer names */}
          {assignedVols.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {assignedVols.slice(0, 2).map((v) => (
                <span key={v.id} className="text-[10px] text-assigned font-medium">
                  {v.name}{assignedVols.length > 2 ? ',' : ''}
                </span>
              ))}
              {assignedVols.length > 2 && (
                <span className="text-[10px] text-text-muted">+{assignedVols.length - 2} more</span>
              )}
            </div>
          )}
          {legacyVolunteer && (
            <p className="text-[10px] text-assigned font-medium mt-1">
              {legacyVolunteer}
            </p>
          )}
        </div>
      )}

      {/* AI reason */}
      <div className="border-t border-white/[0.04] pt-2 mt-2">
        <p className="text-[11px] text-text-muted italic leading-relaxed">
          🧠 {need.aiReason}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">{timeAgo(need.createdAt)}</span>
          {need.source === 'ocr' && (
            <span className="text-[10px] text-secondary/60 font-medium">📸 OCR</span>
          )}
        </div>
        <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {user ? 'Click to manage →' : 'View details →'}
        </span>
      </div>
    </div>
  );
}
