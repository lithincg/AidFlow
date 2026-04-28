import { useState } from 'react';
import {
  assignVolunteerToNeedTransaction,
} from '../../services/firestore';
import UrgencyBadge from '../PriorityBoard/UrgencyBadge';

export default function MatchResult({ result, volunteer, openNeeds, onConfirm, onBack }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  // Find the recommended need from the list
  const recommendedNeed = openNeeds.find((n) => n.id === result.recommendedNeedId);
  const alternativeNeed = result.alternativeNeedId
    ? openNeeds.find((n) => n.id === result.alternativeNeedId)
    : null;

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      if (!recommendedNeed) {
        throw new Error('The recommended need is invalid or no longer available.');
      }

      // Perform transaction to ensure atomic assignment
      await assignVolunteerToNeedTransaction(
        {
          name: volunteer.name,
          skills: volunteer.skills.split(',').map((s) => s.trim()),
          zone: volunteer.zone,
        },
        {
          volunteerName: volunteer.name,
          needId: result.recommendedNeedId,
          needSummary: result.recommendedNeedSummary || recommendedNeed?.description || '',
          aiReason: result.reason,
        },
        result.recommendedNeedId,
        {
          assignedVolunteer: volunteer.name,
          assignmentReason: result.reason,
        }
      );

      setConfirmed(true);
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.message || 'Failed to confirm assignment');
    } finally {
      setConfirming(false);
    }
  };

  // No match found
  if (!result.recommendedNeedId) {
    return (
      <div className="animate-slide-up space-y-4">
        <div className="glass-card-elevated p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🔍</span>
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-2">No Match Found</h3>
          <p className="text-xs text-text-secondary mb-3">{result.reason}</p>
          {result.suggestion && (
            <p className="text-xs text-secondary italic">💡 {result.suggestion}</p>
          )}
        </div>
        <button className="btn-secondary w-full" onClick={onBack}>
          ← Try Different Profile
        </button>
      </div>
    );
  }

  // Confirmed state
  if (confirmed) {
    return (
      <div className="animate-slide-up space-y-4">
        <div className="glass-card-elevated p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">✅</span>
          </div>
          <h3 className="text-sm font-bold text-text-primary mb-2">Assignment Confirmed!</h3>
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-accent">{volunteer.name}</span> has been assigned.
            Check the Priority Board to see the update.
          </p>
        </div>
        <button className="btn-primary w-full py-3" onClick={onConfirm}>
          Match Another Volunteer
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary">AI Recommendation</h3>
        <span className={`badge ${
          result.confidence === 'high' ? 'badge-low' : result.confidence === 'medium' ? 'badge-medium' : 'badge-high'
        }`}>
          {result.confidence} confidence
        </span>
      </div>

      {/* Volunteer summary */}
      <div className="glass-card p-4">
        <p className="text-[10px] text-text-muted uppercase font-semibold mb-2 tracking-widest">
          Volunteer
        </p>
        <p className="text-sm font-bold text-text-primary">{volunteer.name}</p>
        <p className="text-xs text-text-secondary mt-1">
          Skills: {volunteer.skills} · Zone: {volunteer.zone}
        </p>
      </div>

      {/* Recommended need */}
      <div className="glass-card-elevated p-4 border-l-4 border-urgent-high">
        <p className="text-[10px] text-accent uppercase font-semibold mb-2 tracking-widest">
          ⭐ Recommended Assignment
        </p>
        {recommendedNeed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UrgencyBadge urgency={recommendedNeed.urgency} />
              <span className="badge badge-type">{recommendedNeed.needType}</span>
            </div>
            <p className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <span className="text-xs opacity-40">📍</span>
              {recommendedNeed.location}
            </p>
            <p className="text-xs text-text-secondary line-clamp-2">
              {recommendedNeed.description}
            </p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">
            {result.recommendedNeedSummary}
          </p>
        )}
      </div>

      {/* AI reasoning */}
      <div className="glass-card p-4">
        <p className="text-[10px] text-text-muted uppercase font-semibold mb-2 tracking-widest">
          🧠 Why This Match
        </p>
        <p className="text-sm text-text-primary leading-relaxed">{result.reason}</p>
        {result.caveat && (
          <p className="text-xs text-urgent-medium mt-2 italic">⚠️ {result.caveat}</p>
        )}
      </div>

      {/* Alternative */}
      {alternativeNeed && (
        <div className="glass-card p-3 opacity-50">
          <p className="text-[10px] text-text-muted uppercase font-semibold mb-1 tracking-widest">
            Alternative Option
          </p>
          <p className="text-xs text-text-secondary">
            📍 {alternativeNeed.location} — {alternativeNeed.description?.substring(0, 80)}...
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          className="btn-primary flex-1 py-3"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? 'Assigning...' : '✅ Confirm Assignment'}
        </button>
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
