import { useState, useEffect } from 'react';
import { useVolunteers } from '../../hooks/useVolunteers';
import { assignVolunteersToNeed, deassignVolunteerFromNeed } from '../../services/firestore';
import { rankVolunteersForNeed } from '../../services/gemini';

export default function AssignVolunteersPanel({ need, onClose }) {
  const { freeVolunteers, loading: volLoading } = useVolunteers();
  const [selected, setSelected] = useState(new Set());
  const [ranking, setRanking] = useState(null);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // AI auto-assign result popup
  const [autoAssignResult, setAutoAssignResult] = useState(null);
  // { assignedNames: [...], reasoning: "..." }

  const assignedVols = need.assignedVolunteers || [];
  const volunteersNeeded = need.volunteersNeeded || 1;
  const assignedCount = assignedVols.length;
  const remaining = Math.max(0, volunteersNeeded - assignedCount);

  // Auto-rank free volunteers via AI when panel opens
  useEffect(() => {
    if (freeVolunteers.length > 0 && !ranking) {
      setRankingLoading(true);
      rankVolunteersForNeed({ need, freeVolunteers })
        .then((result) => setRanking(result))
        .catch((err) => {
          console.error('AI ranking failed:', err);
        })
        .finally(() => setRankingLoading(false));
    }
  }, [freeVolunteers.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort free volunteers by AI ranking
  const sortedFree = (() => {
    if (!ranking?.rankedVolunteerIds) return freeVolunteers;
    const rankMap = new Map();
    ranking.rankedVolunteerIds.forEach((id, idx) => rankMap.set(id, idx));
    return [...freeVolunteers].sort((a, b) => {
      const ra = rankMap.has(a.id) ? rankMap.get(a.id) : 9999;
      const rb = rankMap.has(b.id) ? rankMap.get(b.id) : 9999;
      return ra - rb;
    });
  })();

  const toggleSelect = (volId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(volId)) next.delete(volId);
      else next.add(volId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    setError(null);
    setSuccess(null);
    try {
      const entries = sortedFree
        .filter((v) => selected.has(v.id))
        .map((v) => ({ id: v.id, name: v.name }));
      await assignVolunteersToNeed(need.id, entries);
      setSuccess(`${entries.length} volunteer${entries.length > 1 ? 's' : ''} assigned!`);
      setSelected(new Set());
    } catch (err) {
      console.error('Assignment failed:', err);
      setError(err.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  // ── AI Auto-Assign ───────────────────────
  const handleAutoAssign = async () => {
    if (sortedFree.length === 0 || remaining <= 0) return;
    setAutoAssigning(true);
    setError(null);
    setSuccess(null);
    setAutoAssignResult(null);

    try {
      // Get fresh ranking if we don't have one yet
      let currentRanking = ranking;
      if (!currentRanking?.rankedVolunteerIds) {
        currentRanking = await rankVolunteersForNeed({ need, freeVolunteers });
        setRanking(currentRanking);
      }

      // Pick top N volunteers based on AI ranking (N = remaining slots)
      const rankedIds = currentRanking.rankedVolunteerIds || [];
      const topPicks = [];
      for (const id of rankedIds) {
        if (topPicks.length >= remaining) break;
        const vol = freeVolunteers.find((v) => v.id === id);
        if (vol) topPicks.push({ id: vol.id, name: vol.name });
      }

      // Fallback: if AI ranked fewer than needed, fill with remaining free volunteers
      if (topPicks.length < remaining) {
        for (const vol of freeVolunteers) {
          if (topPicks.length >= remaining) break;
          if (!topPicks.some((p) => p.id === vol.id)) {
            topPicks.push({ id: vol.id, name: vol.name });
          }
        }
      }

      if (topPicks.length === 0) {
        setError('No available volunteers to assign.');
        return;
      }

      // Assign them
      await assignVolunteersToNeed(need.id, topPicks);

      // Show the reasoning popup
      setAutoAssignResult({
        assignedNames: topPicks.map((p) => p.name),
        reasoning: currentRanking.reasoning || 'Volunteers were selected based on their skills and availability.',
      });
    } catch (err) {
      console.error('AI Auto-Assign failed:', err);
      setError(err.message || 'Auto-assign failed');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleRemove = async (volId) => {
    setRemoving(volId);
    setError(null);
    try {
      await deassignVolunteerFromNeed(need.id, volId);
      setSuccess('Volunteer removed');
    } catch (err) {
      console.error('Remove failed:', err);
      setError(err.message || 'Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  const isTopRanked = (volId) => {
    if (!ranking?.rankedVolunteerIds) return false;
    const idx = ranking.rankedVolunteerIds.indexOf(volId);
    return idx >= 0 && idx < volunteersNeeded;
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── AI Auto-Assign Result Popup ──────── */}
      {autoAssignResult && (
        <div className="ai-assign-popup animate-slide-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-lg">🤖</div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">AI Auto-Assigned!</h4>
              <p className="text-[10px] text-text-muted">Best volunteers selected and assigned</p>
            </div>
          </div>

          {/* Who was assigned */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">Assigned Volunteers</p>
            <div className="flex flex-wrap gap-1.5">
              {autoAssignResult.assignedNames.map((name, i) => (
                <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/15">
                  ✅ {name}
                </span>
              ))}
            </div>
          </div>

          {/* Why */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1.5">💡 Why these volunteers?</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {autoAssignResult.reasoning}
            </p>
          </div>

          <button
            className="btn-primary w-full py-2.5 mt-3"
            onClick={() => setAutoAssignResult(null)}
          >
            Got it ✓
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-primary">Volunteer Staffing</span>
          <span className="text-xs text-text-secondary">
            {assignedCount}/{volunteersNeeded} assigned
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (assignedCount / volunteersNeeded) * 100)}%`,
              background: assignedCount >= volunteersNeeded
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            }}
          />
        </div>
        {remaining > 0 && (
          <p className="text-[10px] text-urgent-medium mt-1.5">
            ⚡ {remaining} more volunteer{remaining > 1 ? 's' : ''} needed
          </p>
        )}
      </div>

      {/* ── AI Auto-Assign Button ─────────────── */}
      {remaining > 0 && sortedFree.length > 0 && !autoAssignResult && (
        <button
          className="ai-auto-assign-btn w-full"
          onClick={handleAutoAssign}
          disabled={autoAssigning || rankingLoading}
        >
          <div className="ai-auto-assign-inner">
            <span className="text-lg">{autoAssigning ? '⏳' : '🤖'}</span>
            <div className="text-left">
              <span className="text-sm font-bold block">
                {autoAssigning ? 'AI is choosing...' : 'AI Auto-Assign'}
              </span>
              <span className="text-[10px] opacity-70 block">
                {autoAssigning
                  ? 'Analyzing skills, zones & experience'
                  : `Let AI pick the best ${remaining} volunteer${remaining > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Currently Assigned */}
      {assignedVols.length > 0 && (
        <div>
          <p className="detail-label mb-2">👤 Currently Assigned</p>
          <div className="space-y-1.5">
            {assignedVols.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-assigned/5 border border-assigned/10"
              >
                <span className="text-xs font-semibold text-assigned">{v.name}</span>
                <button
                  className="text-[10px] text-urgent-high/70 hover:text-urgent-high transition-colors"
                  onClick={() => handleRemove(v.id)}
                  disabled={removing === v.id}
                >
                  {removing === v.id ? '...' : '✕ Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Reasoning (from ranking) */}
      {ranking?.reasoning && !autoAssignResult && (
        <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">🧠 AI Ranking Logic</p>
          <p className="text-xs text-text-secondary leading-relaxed">{ranking.reasoning}</p>
        </div>
      )}

      {/* ── OR divider ─────────────────────────── */}
      {remaining > 0 && sortedFree.length > 0 && !autoAssignResult && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">or pick manually</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
      )}

      {/* Free Volunteers to Select */}
      {!autoAssignResult && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="detail-label">
              {rankingLoading ? '🔄 AI is ranking...' : '📋 Available Volunteers'}
            </p>
            {selected.size > 0 && (
              <span className="text-[10px] text-accent font-medium">{selected.size} selected</span>
            )}
          </div>

          {volLoading || rankingLoading ? (
            <div className="text-center py-6 text-text-muted text-xs">Loading volunteers...</div>
          ) : sortedFree.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-text-secondary text-xs">No free volunteers available.</p>
              <p className="text-text-muted text-[10px] mt-1">Register volunteers from the Volunteers tab first.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {sortedFree.map((vol, idx) => {
                const isSelected = selected.has(vol.id);
                const isRecommended = isTopRanked(vol.id);
                return (
                  <button
                    key={vol.id}
                    onClick={() => toggleSelect(vol.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                      isSelected
                        ? 'bg-accent/10 border-accent/25 ring-1 ring-accent/20'
                        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox */}
                      <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] transition-all ${
                        isSelected
                          ? 'bg-accent text-surface-base'
                          : 'border border-white/[0.15] bg-white/[0.03]'
                      }`}>
                        {isSelected && '✓'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-primary truncate">{vol.name}</span>
                          {isRecommended && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-bold shrink-0">
                              ⭐ Best Match
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted">📍 {vol.zone}</span>
                          <span className="text-[10px] text-text-muted">·</span>
                          <span className="text-[10px] text-text-muted truncate">
                            {(vol.skills || []).slice(0, 3).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Rank number */}
                      {ranking?.rankedVolunteerIds && (
                        <span className="text-[10px] text-text-muted font-mono shrink-0">
                          #{idx + 1}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {success && (
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-accent animate-fade-in">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high animate-fade-in">
          {error}
        </div>
      )}

      {/* Actions */}
      {!autoAssignResult && (
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1 py-2.5"
            onClick={handleAssign}
            disabled={selected.size === 0 || assigning}
          >
            {assigning
              ? 'Assigning...'
              : `👥 Assign ${selected.size > 0 ? selected.size : ''} Volunteer${selected.size !== 1 ? 's' : ''}`}
          </button>
          <button className="btn-secondary py-2.5" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
