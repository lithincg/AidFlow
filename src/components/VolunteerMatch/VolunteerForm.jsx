import { useState } from 'react';
import { matchVolunteerToNeed } from '../../services/gemini';
import { getOpenHighPriorityNeeds } from '../../services/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import MatchResult from './MatchResult';

export default function VolunteerForm() {
  const [form, setForm] = useState({
    name: '',
    skills: '',
    zone: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [openNeeds, setOpenNeeds] = useState([]);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.skills || !form.zone) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get open HIGH priority needs
      const needs = await getOpenHighPriorityNeeds();
      setOpenNeeds(needs);

      if (needs.length === 0) {
        setError('No open HIGH priority needs to match against. Try again when needs are reported.');
        setLoading(false);
        return;
      }

      // Get AI recommendation
      const match = await matchVolunteerToNeed({
        volunteerName: form.name,
        skills: form.skills,
        zone: form.zone,
        openNeeds: needs,
      });

      setResult(match);
    } catch (err) {
      console.error('Match error:', err);
      setError(err.message || 'Failed to find a match');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentConfirmed = () => {
    setResult(null);
    setForm({ name: '', skills: '', zone: '' });
  };

  if (result) {
    return (
      <MatchResult
        result={result}
        volunteer={form}
        openNeeds={openNeeds}
        onConfirm={handleAssignmentConfirmed}
        onBack={() => setResult(null)}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-text-primary mb-1">Match Volunteer</h2>
        <p className="text-xs text-text-secondary">
          Enter a volunteer's profile and AI will recommend the best assignment from open HIGH priority needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="form-label" htmlFor="vol-name">
            Volunteer Name *
          </label>
          <input
            id="vol-name"
            name="name"
            type="text"
            className="form-input"
            placeholder="e.g., Priya Sharma"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="vol-skills">
            Skills * <span className="text-text-muted">(comma-separated)</span>
          </label>
          <input
            id="vol-skills"
            name="skills"
            type="text"
            className="form-input"
            placeholder="e.g., First Aid, Nursing, Child Care"
            value={form.skills}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="form-label" htmlFor="vol-zone">
            Available Zone *
          </label>
          <input
            id="vol-zone"
            name="zone"
            type="text"
            className="form-input"
            placeholder="e.g., Hubli, Dharwad"
            value={form.zone}
            onChange={handleChange}
            required
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
          disabled={loading || !form.name || !form.skills || !form.zone}
        >
          {loading ? 'Finding Best Match...' : 'Find Best Match'}
        </button>
      </form>

      {loading && (
        <div className="mt-6">
          <LoadingSpinner text="AI is analyzing volunteer-need compatibility..." />
        </div>
      )}
    </div>
  );
}
