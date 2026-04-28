import { useState } from 'react';
import { updateVolunteer, deleteVolunteer } from '../../services/firestore';

export default function VolunteerCard({ volunteer, needs }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    name: volunteer.name || '',
    skills: (volunteer.skills || []).join(', '),
    zone: volunteer.zone || '',
    phone: volunteer.phone || '',
  });

  const isFree = volunteer.status === 'free';

  // Find names of assigned needs
  const assignedNeedNames = (volunteer.assignedNeedIds || [])
    .map((nId) => {
      const need = (needs || []).find((n) => n.id === nId);
      return need ? `${need.needType} — ${need.location}` : nId;
    });

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateVolunteer(volunteer.id, {
        name: editForm.name.trim(),
        skills: editForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        zone: editForm.zone.trim(),
        phone: editForm.phone.trim() || null,
      });
      setEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteVolunteer(volunteer.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className={`glass-card p-4 transition-all duration-300 ${isFree ? 'volunteer-card-free' : 'volunteer-card-busy'}`}>
      {editing ? (
        /* ── Edit Mode ──────────────── */
        <div className="space-y-3">
          <input
            className="edit-field"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Name"
          />
          <input
            className="edit-field"
            value={editForm.skills}
            onChange={(e) => setEditForm((p) => ({ ...p, skills: e.target.value }))}
            placeholder="Skills (comma-separated)"
          />
          <input
            className="edit-field"
            value={editForm.zone}
            onChange={(e) => setEditForm((p) => ({ ...p, zone: e.target.value }))}
            placeholder="Zone"
          />
          <input
            className="edit-field"
            value={editForm.phone}
            onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Phone (optional)"
          />
          <div className="flex gap-2">
            <button className="btn-primary flex-1 py-2 text-xs" onClick={handleSave} disabled={busy}>
              {busy ? 'Saving...' : '💾 Save'}
            </button>
            <button
              className="btn-secondary py-2 text-xs"
              onClick={() => {
                setEditing(false);
                setEditForm({
                  name: volunteer.name || '',
                  skills: (volunteer.skills || []).join(', '),
                  zone: volunteer.zone || '',
                  phone: volunteer.phone || '',
                });
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* ── View Mode ──────────────── */
        <div>
          {/* Header: name + status badge */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-bold text-text-primary">{volunteer.name}</h4>
            <span className={`vol-status-badge ${isFree ? 'vol-free' : 'vol-busy'}`}>
              {isFree ? '🟢 Free' : '🔴 Busy'}
            </span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(volunteer.skills || []).map((skill, i) => (
              <span key={i} className="vol-skill-tag">{skill}</span>
            ))}
          </div>

          {/* Zone + Phone */}
          <div className="flex items-center gap-3 text-xs text-text-secondary mb-2">
            <span>📍 {volunteer.zone || 'No zone'}</span>
            {volunteer.phone && <span>📞 {volunteer.phone}</span>}
          </div>

          {/* Tasks completed */}
          <div className="text-[10px] text-text-muted mb-2">
            ✅ {volunteer.tasksCompleted || 0} tasks completed
          </div>

          {/* Assigned needs (if busy) */}
          {!isFree && assignedNeedNames.length > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-urgent-high/5 border border-urgent-high/10">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-1">Working on:</p>
              {assignedNeedNames.map((name, i) => (
                <p key={i} className="text-xs text-text-secondary">• {name}</p>
              ))}
            </div>
          )}

          {/* Confirm delete bar */}
          {confirmDelete && (
            <div className="confirm-bar mt-3">
              <span className="text-xs text-urgent-high flex-1">Delete this volunteer?</span>
              <button className="btn-danger text-xs px-2.5 py-1" onClick={handleDelete} disabled={busy}>
                {busy ? '...' : 'Yes'}
              </button>
              <button className="btn-secondary text-xs px-2.5 py-1" onClick={() => setConfirmDelete(false)}>
                No
              </button>
            </div>
          )}

          {/* Actions */}
          {!confirmDelete && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              <button
                className="action-btn text-xs flex-1"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                ✏️ Edit
              </button>
              <button
                className="action-btn danger text-xs flex-1"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
