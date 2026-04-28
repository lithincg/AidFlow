import { useState } from 'react';
import { addNeed } from '../../services/firestore';
import { useOrg } from '../../context/OrgContext';
import UrgencyBadge from '../PriorityBoard/UrgencyBadge';

export default function OCRReviewCard({ data, imageUrl, onConfirm, onRetry }) {
  const [form, setForm] = useState({
    location: data.location || '',
    description: data.description || '',
    affectedGroup: data.affectedGroup || '',
    urgency: data.urgency || 'MEDIUM',
    needType: data.needType || 'Other',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { currentOrg } = useOrg();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await addNeed({
        source: 'ocr',
        rawImageUrl: null, // Avoid storing ephemeral blob URL
        location: form.location,
        description: form.description,
        affectedGroup: form.affectedGroup,
        reporterName: null,
        urgency: form.urgency,
        needType: form.needType,
        aiReason: data.reason || 'Classified by OCR',
        aiConfidence: data.confidence || 'medium',
        aiUnreadParts: data.unreadParts || null,
      }, currentOrg?.id);
      onConfirm();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save need');
    } finally {
      setSaving(false);
    }
  };

  const isLowConfidence = data.confidence === 'low';

  return (
    <div className="animate-slide-up space-y-4">
      {/* Confidence warning */}
      {isLowConfidence && (
        <div className="p-3 rounded-xl bg-urgent-medium/10 border border-urgent-medium/15 text-xs text-urgent-medium flex items-start gap-2">
          <span>⚠️</span>
          <span>AI had difficulty reading this image. Please review all fields carefully.</span>
        </div>
      )}

      {/* Unread parts warning */}
      {data.unreadParts && data.unreadParts !== 'null' && (
        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/15 text-xs text-secondary flex items-start gap-2">
          <span>📝</span>
          <span>Parts not fully read: {data.unreadParts}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📸</span>
          <span className="text-sm font-semibold text-text-primary">Extracted Data</span>
        </div>
        <UrgencyBadge urgency={form.urgency} />
      </div>

      {/* Image thumbnail */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Uploaded report"
          className="w-full max-h-40 object-contain rounded-xl bg-surface-card"
        />
      )}

      {/* Editable fields */}
      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="form-label">Location</label>
          <input
            name="location"
            className="form-input"
            value={form.location}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="form-label">Problem Description</label>
          <textarea
            name="description"
            className="form-input min-h-[80px] resize-y"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="form-label">Affected Group</label>
          <input
            name="affectedGroup"
            className="form-input"
            value={form.affectedGroup}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Urgency</label>
            <select
              name="urgency"
              className="form-input"
              value={form.urgency}
              onChange={handleChange}
            >
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <div>
            <label className="form-label">Need Type</label>
            <select
              name="needType"
              className="form-input"
              value={form.needType}
              onChange={handleChange}
            >
              <option value="Medical">Medical</option>
              <option value="Food">Food</option>
              <option value="Safety">Safety</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Raw text extracted */}
        {data.rawTextExtracted && (
          <div>
            <label className="form-label">Raw Text Extracted</label>
            <div className="text-xs text-text-muted bg-surface-base p-3 rounded-lg font-mono leading-relaxed border border-white/[0.04]">
              {data.rawTextExtracted}
            </div>
          </div>
        )}
      </div>

      {/* AI reasoning */}
      <div className="text-xs text-text-muted italic px-1">
        🧠 AI reasoning: "{data.reason}"
      </div>

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
          disabled={saving}
        >
          {saving ? 'Saving...' : '✅ Confirm & Add to Board'}
        </button>
        <button className="btn-secondary" onClick={onRetry}>
          🔄 Retry
        </button>
      </div>
    </div>
  );
}
