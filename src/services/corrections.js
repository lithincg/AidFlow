/**
 * corrections.js — AI Override Tracking & Adaptive Learning
 *
 * Tracks when coordinators override AI classifications,
 * calculates accuracy metrics, and provides few-shot examples
 * for adaptive prompting.
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════════════════════
//  LOG A CORRECTION (when human overrides AI)
// ═══════════════════════════════════════════════════════

/**
 * Log when a coordinator changes an AI-classified field.
 * @param {string} needId
 * @param {string} orgId
 * @param {Object} correction - { field, aiValue, humanValue, description, needType, location }
 * @param {string} userId
 */
export async function logCorrection(needId, orgId, correction, userId) {
  if (!orgId || !needId) return;

  // Don't log if the value didn't actually change
  if (correction.aiValue === correction.humanValue) return;

  await addDoc(collection(db, 'corrections'), {
    needId,
    orgId,
    field: correction.field,           // 'urgency' | 'needType' | 'volunteersNeeded'
    aiValue: correction.aiValue,       // what AI originally said
    humanValue: correction.humanValue, // what human changed it to
    description: correction.description || '',
    needType: correction.needType || '',
    location: correction.location || '',
    correctedBy: userId,
    correctedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════
//  CALCULATE ACCURACY METRICS
// ═══════════════════════════════════════════════════════

/**
 * Subscribe to real-time accuracy metrics for an org.
 * Returns: { total, overridden, accuracy, byField }
 */
export function subscribeToAccuracy(orgId, callback) {
  if (!orgId) {
    callback({ total: 0, overridden: 0, accuracy: 100, byField: {} });
    return () => {};
  }

  // We track corrections — each correction = one override
  const q = query(
    collection(db, 'corrections'),
    where('orgId', '==', orgId),
    orderBy('correctedAt', 'desc'),
    limit(200)
  );

  return onSnapshot(q, (snapshot) => {
    const corrections = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Count unique needIds that were corrected
    const correctedNeedIds = new Set(corrections.map((c) => c.needId));
    const overridden = correctedNeedIds.size;

    // Group by field
    const byField = {};
    for (const c of corrections) {
      if (!byField[c.field]) {
        byField[c.field] = { total: 0, corrections: [] };
      }
      byField[c.field].total++;
      byField[c.field].corrections.push(c);
    }

    callback({
      corrections,
      overridden,
      byField,
    });
  });
}

/**
 * Calculate accuracy given total needs and correction data.
 * Called by the component that has access to both needs count and corrections.
 */
export function calculateAccuracy(totalNeeds, overriddenCount) {
  if (totalNeeds === 0) return 100;
  return Math.round(((totalNeeds - overriddenCount) / totalNeeds) * 100);
}

// ═══════════════════════════════════════════════════════
//  FEW-SHOT EXAMPLES (for adaptive prompting)
// ═══════════════════════════════════════════════════════

/**
 * Fetch the most recent corrections for an org to use as
 * few-shot examples in the Gemini classification prompt.
 * Returns an array of { description, aiUrgency, humanUrgency, needType }
 */
export async function getFewShotExamples(orgId, maxExamples = 5) {
  if (!orgId) return [];

  const q = query(
    collection(db, 'corrections'),
    where('orgId', '==', orgId),
    where('field', '==', 'urgency'),   // urgency corrections are most impactful
    orderBy('correctedAt', 'desc'),
    limit(maxExamples)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      description: data.description,
      location: data.location || '',
      aiUrgency: data.aiValue,
      humanUrgency: data.humanValue,
      needType: data.needType || '',
    };
  });
}

/**
 * Format few-shot examples into a prompt block for Gemini.
 */
export function formatFewShotBlock(examples) {
  if (!examples || examples.length === 0) return '';

  const lines = examples.map((ex) =>
    `- "${ex.description}" (${ex.location}, ${ex.needType}) → AI said ${ex.aiUrgency}, coordinator corrected to ${ex.humanUrgency}`
  ).join('\n');

  return `\n\nIMPORTANT - Learn from these past corrections by coordinators in this organization:
${lines}

Use these corrections to calibrate your urgency classifications. If a similar report comes in, align with the coordinator's judgment, not your previous classification.`;
}
