import { useState } from 'react';
import { classifyNeed, checkDuplicateNeeds } from '../../services/gemini';
import { addNeed, linkNeeds } from '../../services/firestore';
import { useOrg } from '../../context/OrgContext';
import { useNeeds } from '../../hooks/useNeeds';
import { getFewShotExamples, formatFewShotBlock } from '../../services/corrections';
import LoadingSpinner from '../common/LoadingSpinner';
import DuplicationCheck from './DuplicationCheck';

export default function TextSubmitForm() {
  const [form, setForm] = useState({
    location: '',
    description: '',
    affectedGroup: '',
    reporterName: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [dedupResult, setDedupResult] = useState(null);
  const [pendingClassification, setPendingClassification] = useState(null);

  const { currentOrg } = useOrg();
  const { needs: existingNeeds } = useNeeds();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveNeed = async (classification, linkedNeedIds = []) => {
    setLoading(true);
    try {
      const needId = await addNeed({
        source: 'text',
        rawImageUrl: null,
        location: form.location,
        description: form.description,
        affectedGroup: form.affectedGroup,
        reporterName: form.reporterName || null,
        urgency: classification.urgency,
        needType: classification.needType,
        aiReason: classification.reason,
        aiConfidence: classification.confidence,
        aiUnreadParts: null,
        linkedNeedIds,
        volunteersNeeded: classification.volunteersNeeded || 1,
      }, currentOrg?.id);

      if (linkedNeedIds.length > 0) {
        await linkNeeds([needId, ...linkedNeedIds]);
      }

      setResult({ id: needId, ...classification });
      setForm({ location: '', description: '', affectedGroup: '', reporterName: '' });
      setDedupResult(null);
      setPendingClassification(null);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save need');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location || !form.description || !form.affectedGroup) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setDedupResult(null);

    try {
      // 1. Fetch adaptive few-shot examples from past corrections
      const examples = await getFewShotExamples(currentOrg?.id);
      const fewShotBlock = formatFewShotBlock(examples);

      // 2. Classify with Gemini (with adaptive learning context)
      const classification = await classifyNeed({
        location: form.location,
        description: form.description,
        affectedGroup: form.affectedGroup,
        fewShotBlock,
      });
      setPendingClassification(classification);

      // 3. AI Crisis Deduplication Check (skip if no open needs to compare against)
      const openNeeds = existingNeeds.filter((n) => n.status !== 'resolved');
      if (openNeeds.length > 0) {
        const dupCheck = await checkDuplicateNeeds({
          newNeed: { ...form, needType: classification.needType },
          existingNeeds: openNeeds,
        });

        if (dupCheck.isDuplicate || dupCheck.relationship === 'related') {
          setDedupResult(dupCheck);
          setLoading(false);
          return; // Stop here and show DuplicationCheck
        }
      }

      // 4. Save to Firestore (Unique)
      await saveNeed(classification, []);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to classify and submit need');
      setLoading(false);
    }
  };

  const handleCreateSeparate = () => {
    saveNeed(pendingClassification, []);
  };

  const handleLinkAndCreate = async (relatedNeedIds, combinedVolunteersNeeded) => {
    const classification = { ...pendingClassification };
    if (combinedVolunteersNeeded) {
        classification.volunteersNeeded = combinedVolunteersNeeded;
    }
    await saveNeed(classification, relatedNeedIds);
  };

  const urgencyColor = {
    HIGH: 'text-urgent-high',
    MEDIUM: 'text-urgent-medium',
    LOW: 'text-urgent-low',
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-1">Submit a Need</h2>
        <p className="text-xs text-text-secondary">
          Describe a community need and AI will classify its urgency and type.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label" htmlFor="location">
            Location *
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="form-input"
            placeholder="e.g., Ward 5, Dharwad"
            value={form.location}
            onChange={handleChange}
            required
            disabled={loading || dedupResult}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="description">
            Problem Description *
          </label>
          <textarea
            id="description"
            name="description"
            className="form-input min-h-[120px] resize-y"
            placeholder="Describe the community need in detail..."
            value={form.description}
            onChange={handleChange}
            required
            disabled={loading || dedupResult}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="affectedGroup">
            Affected Group *
          </label>
          <input
            id="affectedGroup"
            name="affectedGroup"
            type="text"
            className="form-input"
            placeholder="e.g., Elderly residents, Children under 5"
            value={form.affectedGroup}
            onChange={handleChange}
            required
            disabled={loading || dedupResult}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="reporterName">
            Reporter Name <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="reporterName"
            name="reporterName"
            type="text"
            className="form-input"
            placeholder="Your name"
            value={form.reporterName}
            onChange={handleChange}
            disabled={loading || dedupResult}
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high">
            {error}
          </div>
        )}

        {!dedupResult && (
          <button
            type="submit"
            className="btn-primary w-full py-3 text-base"
            disabled={loading || !form.location || !form.description || !form.affectedGroup}
          >
            {loading ? 'Analyzing with AI...' : 'Classify & Submit Need'}
          </button>
        )}
      </form>

      {loading && !dedupResult && (
        <div className="mt-6">
          <LoadingSpinner text="AI is analyzing the report..." />
        </div>
      )}

      {dedupResult && (
        <div className="mt-6">
          <DuplicationCheck
            dedupResult={dedupResult}
            existingNeeds={existingNeeds}
            onCreateSeparate={handleCreateSeparate}
            onLinkAndCreate={handleLinkAndCreate}
            onCancel={() => {
              setDedupResult(null);
              setPendingClassification(null);
            }}
          />
        </div>
      )}

      {result && !dedupResult && (
        <div className="mt-6 glass-card-elevated p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <span className="text-sm font-semibold text-text-primary">Need Submitted Successfully</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Urgency:</span>
              <span className={`font-bold ${urgencyColor[result.urgency]}`}>
                {result.urgency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Type:</span>
              <span className="text-secondary font-medium">{result.needType}</span>
            </div>
            <div className="pt-2 border-t border-white/[0.04]">
              <p className="text-xs text-text-muted italic">"{result.reason}"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
