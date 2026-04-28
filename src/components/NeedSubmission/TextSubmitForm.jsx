import { useState } from 'react';
import { classifyNeed } from '../../services/gemini';
import { addNeed } from '../../services/firestore';
import { useOrg } from '../../context/OrgContext';
import LoadingSpinner from '../common/LoadingSpinner';

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
  const { currentOrg } = useOrg();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.location || !form.description || !form.affectedGroup) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Classify with Gemini
      const classification = await classifyNeed({
        location: form.location,
        description: form.description,
        affectedGroup: form.affectedGroup,
      });

      // 2. Save to Firestore
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
      }, currentOrg?.id);

      setResult({ id: needId, ...classification });
      setForm({ location: '', description: '', affectedGroup: '', reporterName: '' });
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to classify and submit need');
    } finally {
      setLoading(false);
    }
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
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full py-3 text-base"
          disabled={loading || !form.location || !form.description || !form.affectedGroup}
        >
          {loading ? 'Analyzing with AI...' : 'Classify & Submit Need'}
        </button>
      </form>

      {loading && (
        <div className="mt-6">
          <LoadingSpinner text="AI is analyzing the urgency..." />
        </div>
      )}

      {result && (
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
