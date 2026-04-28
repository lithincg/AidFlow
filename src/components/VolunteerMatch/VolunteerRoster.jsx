import { useState } from 'react';
import { addVolunteer } from '../../services/firestore';
import { useVolunteers } from '../../hooks/useVolunteers';
import { useNeeds } from '../../hooks/useNeeds';
import { useOrg } from '../../context/OrgContext';
import VolunteerCard from './VolunteerCard';
import LoadingSpinner from '../common/LoadingSpinner';

export default function VolunteerRoster() {
  const { volunteers, freeCount, busyCount, loading, error } = useVolunteers();
  const { needs } = useNeeds();
  const { currentOrg } = useOrg();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all | free | busy
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [form, setForm] = useState({
    name: '',
    skills: '',
    zone: '',
    phone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.skills.trim() || !form.zone.trim()) return;

    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await addVolunteer({
        name: form.name.trim(),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        zone: form.zone.trim(),
        phone: form.phone.trim() || null,
      }, currentOrg?.id);
      setForm({ name: '', skills: '', zone: '', phone: '' });
      setSubmitMsg('✅ Volunteer registered!');
      setShowForm(false);
      setTimeout(() => setSubmitMsg(null), 3000);
    } catch (err) {
      console.error('Failed to register volunteer:', err);
      setSubmitMsg('❌ ' + (err.message || 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVolunteers =
    filter === 'all'
      ? volunteers
      : volunteers.filter((v) => v.status === filter);

  if (loading) {
    return <LoadingSpinner text="Loading volunteer roster..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Volunteer Roster</h2>
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-accent">{freeCount} Free</span>
            <span className="mx-2 text-text-muted">·</span>
            <span className="font-semibold text-urgent-high">{busyCount} Busy</span>
            <span className="mx-2 text-text-muted">·</span>
            <span>{volunteers.length} Total</span>
          </p>
        </div>
        <button
          className="btn-primary py-2 px-4 text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close' : '+ Register Volunteer'}
        </button>
      </div>

      {/* Success / Error message */}
      {submitMsg && (
        <div className={`p-3 rounded-xl text-sm mb-4 animate-fade-in ${
          submitMsg.startsWith('✅')
            ? 'bg-accent/10 border border-accent/20 text-accent'
            : 'bg-urgent-high/10 border border-urgent-high/15 text-urgent-high'
        }`}>
          {submitMsg}
        </div>
      )}

      {/* Registration Form */}
      {showForm && (
        <div className="glass-card-elevated p-5 mb-6 animate-slide-up">
          <h3 className="text-sm font-bold text-text-primary mb-4">Register New Volunteer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="vol-name">Name *</label>
              <input
                id="vol-name"
                className="form-input"
                placeholder="e.g., Priya Sharma"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="vol-skills">
                Skills * <span className="text-text-muted">(comma-separated)</span>
              </label>
              <input
                id="vol-skills"
                className="form-input"
                placeholder="e.g., First Aid, Nursing, Driving"
                value={form.skills}
                onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label" htmlFor="vol-zone">Zone *</label>
                <input
                  id="vol-zone"
                  className="form-input"
                  placeholder="e.g., Hubli"
                  value={form.zone}
                  onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="vol-phone">Phone</label>
                <input
                  id="vol-phone"
                  className="form-input"
                  placeholder="Optional"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={submitting || !form.name.trim() || !form.skills.trim() || !form.zone.trim()}
            >
              {submitting ? 'Registering...' : '✅ Register Volunteer'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: 'all', label: 'All' },
          { id: 'free', label: '🟢 Free' },
          { id: 'busy', label: '🔴 Busy' },
        ].map((f) => {
          const count =
            f.id === 'all'
              ? volunteers.length
              : volunteers.filter((v) => v.status === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                filter === f.id
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high mb-4">
          {error}
        </div>
      )}

      {/* Volunteer Grid */}
      {filteredVolunteers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-text-secondary text-sm font-medium">
            {filter === 'all'
              ? 'No volunteers registered yet. Add the first one!'
              : `No ${filter} volunteers.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVolunteers.map((vol) => (
            <VolunteerCard key={vol.id} volunteer={vol} needs={needs} />
          ))}
        </div>
      )}
    </div>
  );
}
