import { useState, useEffect } from 'react';
import { useNeeds } from '../../hooks/useNeeds';
import { subscribeToAccuracy, calculateAccuracy } from '../../services/corrections';
import { useOrg } from '../../context/OrgContext';

/**
 * AIAccuracyBadge — Shows live AI classification accuracy for the current org.
 * Displays overridden count / total needs and the accuracy percentage.
 */
export default function AIAccuracyBadge() {
  const { currentOrg } = useOrg();
  const { needs } = useNeeds();
  const [correctionData, setCorrectionData] = useState({ overridden: 0, byField: {} });

  useEffect(() => {
    if (!currentOrg?.id) return;
    const unsub = subscribeToAccuracy(currentOrg.id, setCorrectionData);
    return unsub;
  }, [currentOrg?.id]);

  // Only count needs that have been AI-classified (have aiReason)
  const classifiedNeeds = needs.filter((n) => n.aiReason);
  const total = classifiedNeeds.length;
  const overridden = correctionData.overridden;
  const accuracy = calculateAccuracy(total, overridden);

  // Don't show if no needs classified yet
  if (total === 0) return null;

  // Color based on accuracy
  const color =
    accuracy >= 85
      ? { text: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)' }
      : accuracy >= 70
      ? { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)' }
      : { text: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.15)' };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
      title={`AI classified ${total} needs. Coordinators overrode ${overridden} classifications. Accuracy: ${accuracy}%.`}
    >
      <span className="text-sm">🧠</span>
      <span style={{ color: color.text }}>
        AI {accuracy}%
      </span>
      {overridden > 0 && (
        <span className="text-text-muted text-[10px]">
          ({overridden} corrected)
        </span>
      )}
    </div>
  );
}
