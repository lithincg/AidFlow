import { useState } from 'react';

/**
 * DuplicationCheck — Pre-submit similarity panel.
 * Shows when AI detects a new need may be a duplicate or related to existing needs.
 * User can choose to link, create separate, or cancel.
 */
export default function DuplicationCheck({ dedupResult, existingNeeds, onCreateSeparate, onLinkAndCreate, onCancel }) {
  const [linking, setLinking] = useState(false);

  if (!dedupResult) return null;

  const { relationship, relatedNeedIds, mergeRecommendation, confidence, combinedVolunteersNeeded } = dedupResult;

  // Find the actual need objects for display
  const relatedNeeds = (relatedNeedIds || [])
    .map((id) => existingNeeds.find((n) => n.id === id))
    .filter(Boolean);

  const isDuplicate = relationship === 'duplicate';
  const isRelated = relationship === 'related';

  const borderColor = isDuplicate
    ? 'border-urgent-high/20'
    : isRelated
    ? 'border-urgent-medium/20'
    : 'border-accent/20';

  const bgColor = isDuplicate
    ? 'bg-urgent-high/5'
    : isRelated
    ? 'bg-urgent-medium/5'
    : 'bg-accent/5';

  const icon = isDuplicate ? '⚠️' : isRelated ? '🔗' : '✅';
  const title = isDuplicate
    ? 'Possible Duplicate Detected'
    : isRelated
    ? 'Related Reports Found'
    : 'Unique Report';

  const handleLinkAndCreate = async () => {
    setLinking(true);
    try {
      await onLinkAndCreate(relatedNeedIds, combinedVolunteersNeeded);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className={`rounded-2xl p-5 border ${borderColor} ${bgColor} animate-slide-up space-y-4`}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <div>
          <h4 className="text-sm font-bold text-text-primary">{title}</h4>
          <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium">
            AI Deduplication · {confidence} confidence
          </p>
        </div>
      </div>

      {/* AI Recommendation */}
      {mergeRecommendation && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">
            🧠 AI Analysis
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{mergeRecommendation}</p>
        </div>
      )}

      {/* Related needs list */}
      {relatedNeeds.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-2">
            {isDuplicate ? '⚠️ Existing matching reports' : '🔗 Related existing reports'}
          </p>
          <div className="space-y-1.5">
            {relatedNeeds.map((need) => {
              const urgColor = {
                HIGH: '#fb7185',
                MEDIUM: '#fbbf24',
                LOW: '#34d399',
              };
              return (
                <div
                  key={need.id}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{
                      background: `${urgColor[need.urgency] || '#71717a'}15`,
                      color: urgColor[need.urgency] || '#71717a',
                    }}
                  >
                    {need.urgency}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary truncate">
                      📍 {need.location}
                    </p>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {need.description}
                    </p>
                  </div>
                  <span className="text-[9px] text-text-muted shrink-0 capitalize">
                    {need.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isDuplicate ? (
          <>
            <button
              className="btn-secondary flex-1 py-2.5 text-xs"
              onClick={onCreateSeparate}
            >
              Create Anyway (Not a Duplicate)
            </button>
            <button
              className="btn-danger py-2.5 text-xs px-4"
              onClick={onCancel}
            >
              Cancel
            </button>
          </>
        ) : isRelated ? (
          <>
            <button
              className="btn-primary flex-1 py-2.5 text-xs"
              onClick={handleLinkAndCreate}
              disabled={linking}
            >
              {linking ? 'Linking...' : '🔗 Link & Create'}
            </button>
            <button
              className="btn-secondary flex-1 py-2.5 text-xs"
              onClick={onCreateSeparate}
            >
              Create Separate
            </button>
            <button
              className="btn-danger py-2.5 text-xs px-3"
              onClick={onCancel}
            >
              ✕
            </button>
          </>
        ) : (
          <button
            className="btn-primary flex-1 py-2.5 text-xs"
            onClick={onCreateSeparate}
          >
            ✅ Submit Need
          </button>
        )}
      </div>
    </div>
  );
}
