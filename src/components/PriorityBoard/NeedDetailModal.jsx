import { useState, useEffect, useRef } from 'react';
import UrgencyBadge from './UrgencyBadge';
import AssignVolunteersPanel from './AssignVolunteersPanel';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  updateNeedStatus,
  updateNeedFields,
  deleteNeed,
  deassignNeed,
  unresolveNeed,
  resolveNeedAndFreeVolunteers,
} from '../../services/firestore';
import { logCorrection } from '../../services/corrections';

function timeAgo(timestamp) {
  if (!timestamp?.seconds) return 'just now';
  const seconds = Math.floor(Date.now() / 1000 - timestamp.seconds);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const URGENCY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'];
const NEED_TYPE_OPTIONS = ['Medical', 'Food', 'Safety', 'Infrastructure', 'Other'];

export default function NeedDetailModal({ need, onClose }) {
  const overlayRef = useRef(null);
  const { user, login } = useAuth();
  const { currentOrg } = useOrg();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // View modes
  const [editing, setEditing] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [editForm, setEditForm] = useState({
    location: '',
    description: '',
    affectedGroup: '',
    reporterName: '',
    urgency: '',
    needType: '',
  });

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState(null);

  // Computed
  const assignedVols = need?.assignedVolunteers || [];
  const volunteersNeeded = need?.volunteersNeeded || 1;
  const assignedCount = assignedVols.length;
  // Backward compat: if old data has assignedVolunteer string but no assignedVolunteers array
  const legacyVolunteer = !assignedVols.length && need?.assignedVolunteer;

  useEffect(() => {
    if (need) {
      setEditForm({
        location: need.location || '',
        description: need.description || '',
        affectedGroup: need.affectedGroup || '',
        reporterName: need.reporterName || '',
        urgency: need.urgency || 'MEDIUM',
        needType: need.needType || 'Other',
      });
      setEditing(false);
      setShowAssignPanel(false);
      setError(null);
      setSuccessMsg(null);
      setConfirmAction(null);
    }
  }, [need]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showAssignPanel) setShowAssignPanel(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, showAssignPanel]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!need) return null;

  const isOpen = need.status === 'open';
  const isAssigned = need.status === 'assigned';
  const isInProgress = need.status === 'in_progress';
  const isResolved = need.status === 'resolved';
  const canEdit = !isResolved;

  // ── Actions ──────────────────────────────

  const runAction = async (label, fn) => {
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await fn();
      setSuccessMsg(label);
      setConfirmAction(null);
      if (label === 'Need deleted') {
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      console.error(`${label} failed:`, err);
      setError(err.message || `${label} failed`);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = () =>
    runAction('Changes saved', async () => {
      const updates = {};
      if (editForm.location !== need.location) updates.location = editForm.location;
      if (editForm.description !== need.description) updates.description = editForm.description;
      if (editForm.affectedGroup !== need.affectedGroup) updates.affectedGroup = editForm.affectedGroup;
      if (editForm.reporterName !== (need.reporterName || '')) updates.reporterName = editForm.reporterName || null;
      if (editForm.urgency !== need.urgency) updates.urgency = editForm.urgency;
      if (editForm.needType !== need.needType) updates.needType = editForm.needType;

      if (Object.keys(updates).length === 0) {
        setEditing(false);
        return;
      }

      // ── AI Learning Loop: log corrections when AI fields are overridden ──
      if (updates.urgency && need.aiReason) {
        await logCorrection(need.id, currentOrg?.id, {
          field: 'urgency',
          aiValue: need.urgency,
          humanValue: updates.urgency,
          description: need.description,
          needType: need.needType,
          location: need.location,
        }, user?.uid);
      }

      if (editForm.needType && editForm.needType !== need.needType && need.aiReason) {
        await logCorrection(need.id, currentOrg?.id, {
          field: 'needType',
          aiValue: need.needType,
          humanValue: editForm.needType,
          description: need.description,
          needType: need.needType,
          location: need.location,
        }, user?.uid);
      }

      await updateNeedFields(need.id, updates);
      setEditing(false);
    });

  const handleDelete = () => runAction('Need deleted', () => deleteNeed(need.id));
  const handleDeassignAll = () => runAction('All volunteers deassigned', () => deassignNeed(need.id));
  const handleUnresolve = () => runAction('Need reopened', () => unresolveNeed(need.id));
  const handleMarkInProgress = () => runAction('Marked in progress', () => updateNeedStatus(need.id, 'in_progress'));
  const handleResolve = () =>
    runAction('Need resolved — volunteers freed', () => resolveNeedAndFreeVolunteers(need.id));
  const handleEscalate = () =>
    runAction('Escalated to HIGH', () => updateNeedFields(need.id, { urgency: 'HIGH' }));

  const statusLabel = {
    open: 'Open',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  const statusColor = {
    open: 'badge-low',
    assigned: 'badge-status-assigned',
    in_progress: 'badge-status-in_progress',
    resolved: 'badge-status-resolved',
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-panel">
        {/* ── Header ──────────────────────────── */}
        <div className="sticky top-0 bg-surface-card/95 backdrop-blur-sm border-b border-white/[0.04] px-5 py-4 flex items-center justify-between z-10"
             style={{ borderRadius: '20px 20px 0 0' }}>
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={need.urgency} />
            <span className="badge badge-type">{need.needType}</span>
            <span className={`badge ${statusColor[need.status] || ''}`}>
              {statusLabel[need.status] || need.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ────────────────────────────── */}
        <div className="px-5 py-5 space-y-5">

          {/* Feedback */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent flex items-center gap-2 animate-fade-in">
              <span>✅</span> {successMsg}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-sm text-urgent-high flex items-center gap-2 animate-fade-in">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* ── Assign Volunteers Panel ────────── */}
          {showAssignPanel ? (
            <AssignVolunteersPanel need={need} onClose={() => setShowAssignPanel(false)} />
          ) : (
            <>
              {/* ── Detail Fields ─────────────────── */}
              <div className="glass-card p-4">
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="detail-label">Location</label>
                      <input
                        className="edit-field mt-1"
                        value={editForm.location}
                        onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="detail-label">Description</label>
                      <textarea
                        className="edit-field mt-1 min-h-[100px] resize-y"
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="detail-label">Affected Group</label>
                      <input
                        className="edit-field mt-1"
                        value={editForm.affectedGroup}
                        onChange={(e) => setEditForm((p) => ({ ...p, affectedGroup: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="detail-label">Reporter Name</label>
                      <input
                        className="edit-field mt-1"
                        value={editForm.reporterName}
                        onChange={(e) => setEditForm((p) => ({ ...p, reporterName: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="detail-label">Urgency</label>
                      <div className="flex gap-2 mt-1.5">
                        {URGENCY_OPTIONS.map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setEditForm((p) => ({ ...p, urgency: u }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              editForm.urgency === u
                                ? u === 'HIGH'
                                  ? 'bg-urgent-high/20 text-urgent-high border border-urgent-high/30'
                                  : u === 'MEDIUM'
                                  ? 'bg-urgent-medium/20 text-urgent-medium border border-urgent-medium/30'
                                  : 'bg-accent/20 text-accent border border-accent/30'
                                : 'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08]'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="detail-label">Need Type</label>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {NEED_TYPE_OPTIONS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditForm((p) => ({ ...p, needType: t }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              editForm.needType === t
                                ? 'bg-secondary/20 text-secondary border border-secondary/30'
                                : 'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button className="btn-primary flex-1 py-2.5" onClick={handleSaveEdit} disabled={busy}>
                        {busy ? 'Saving...' : '💾 Save Changes'}
                      </button>
                      <button
                        className="btn-secondary py-2.5"
                        onClick={() => {
                          setEditing(false);
                          setEditForm({
                            location: need.location || '',
                            description: need.description || '',
                            affectedGroup: need.affectedGroup || '',
                            reporterName: need.reporterName || '',
                            urgency: need.urgency || 'MEDIUM',
                            needType: need.needType || 'Other',
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="detail-row">
                      <span className="detail-label">📍 Location</span>
                      <span className="detail-value">{need.location || 'Unknown location'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📝 Description</span>
                      <span className="detail-value">{need.description}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">👥 Affected Group</span>
                      <span className="detail-value">{need.affectedGroup || '—'}</span>
                    </div>
                    {need.reporterName && (
                      <div className="detail-row">
                        <span className="detail-label">🗣️ Reporter</span>
                        <span className="detail-value">{need.reporterName}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">🕐 Submitted</span>
                      <span className="detail-value text-text-secondary text-xs">
                        {timeAgo(need.createdAt)}
                        {need.source === 'ocr' && <span className="ml-2 text-secondary/60 font-medium">📸 via OCR</span>}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Volunteer Staffing Summary ────── */}
              {!editing && (
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="detail-label">
                      {isResolved ? '✅ Completed by' : '👥 Volunteers'}
                    </span>
                    {!isResolved && (
                      <span className="text-xs text-text-secondary">
                        {assignedCount}/{volunteersNeeded} needed
                      </span>
                    )}
                  </div>

                  {/* Progress bar — only for non-resolved */}
                  {!isResolved && (
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
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
                  )}

                  {/* Assigned / completed volunteer list */}
                  {assignedVols.length > 0 ? (
                    <div className="space-y-1">
                      {assignedVols.map((v) => (
                        <div key={v.id} className="flex items-center gap-2 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isResolved ? 'bg-accent' : 'bg-assigned'}`} />
                          <span className="text-text-primary font-medium">{v.name}</span>
                          {isResolved && <span className="text-text-muted text-[10px]">✓ done</span>}
                        </div>
                      ))}
                    </div>
                  ) : legacyVolunteer ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isResolved ? 'bg-accent' : 'bg-assigned'}`} />
                      <span className="text-text-primary font-medium">{legacyVolunteer}</span>
                      <span className="text-text-muted">(legacy)</span>
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">
                      {isResolved ? 'Resolver information not recorded' : 'No volunteers assigned yet'}
                    </p>
                  )}

                  {need.assignmentReason && (
                    <p className="text-xs text-text-secondary mt-2 italic">"{need.assignmentReason}"</p>
                  )}
                </div>
              )}

              {/* ── AI Insight ─────────────────────── */}
              {need.aiReason && !editing && (
                <div className="glass-card p-4">
                  <span className="detail-label">🧠 AI Analysis</span>
                  <p className="text-sm text-text-primary mt-1 leading-relaxed">{need.aiReason}</p>
                  {need.aiConfidence && (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-text-muted bg-white/[0.04] px-2 py-1 rounded-full">
                      {need.aiConfidence} confidence
                    </span>
                  )}
                </div>
              )}

              {/* ── Confirm Dialog ─────────────────── */}
              {confirmAction && (
                <div className="confirm-bar">
                  <span className="text-sm text-urgent-high flex-1">
                    {confirmAction === 'delete'
                      ? '⚠️ Permanently delete this need?'
                      : '⚠️ Remove all volunteer assignments?'}
                  </span>
                  <button
                    className="btn-danger text-xs px-3 py-1.5"
                    onClick={confirmAction === 'delete' ? handleDelete : handleDeassignAll}
                    disabled={busy}
                  >
                    {busy ? '...' : 'Yes'}
                  </button>
                  <button
                    className="btn-secondary text-xs px-3 py-1.5"
                    onClick={() => setConfirmAction(null)}
                    disabled={busy}
                  >
                    No
                  </button>
                </div>
              )}

              {/* ── Actions Grid ───────────────────── */}
              {!editing && (
                user ? (
                <div>
                  <p className="detail-label mb-2">⚡ Actions</p>
                  <div className="action-grid">
                    {/* Assign Volunteers */}
                    {canEdit && (
                      <button
                        className="action-btn success"
                        onClick={() => setShowAssignPanel(true)}
                        disabled={busy}
                      >
                        👥 Assign Volunteers
                      </button>
                    )}

                    {/* Edit */}
                    {canEdit && (
                      <button className="action-btn" onClick={() => setEditing(true)} disabled={busy}>
                        ✏️ Edit Fields
                      </button>
                    )}

                    {/* Escalate */}
                    {canEdit && need.urgency !== 'HIGH' && (
                      <button className="action-btn warning" onClick={handleEscalate} disabled={busy}>
                        🔺 Escalate
                      </button>
                    )}

                    {/* Mark In Progress */}
                    {(isOpen || isAssigned) && (
                      <button className="action-btn accent" onClick={handleMarkInProgress} disabled={busy}>
                        🔄 In Progress
                      </button>
                    )}

                    {/* Resolve */}
                    {(isOpen || isAssigned || isInProgress) && (
                      <button className="action-btn success" onClick={handleResolve} disabled={busy}>
                        ✅ Resolve
                      </button>
                    )}

                    {/* Unresolve */}
                    {isResolved && (
                      <button className="action-btn warning" onClick={handleUnresolve} disabled={busy}>
                        🔓 Reopen
                      </button>
                    )}

                    {/* Deassign All */}
                    {(isAssigned || isInProgress) && assignedCount > 0 && (
                      <button
                        className="action-btn warning"
                        onClick={() => setConfirmAction('deassign')}
                        disabled={busy}
                      >
                        🚫 Deassign All
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      className="action-btn danger"
                      onClick={() => setConfirmAction('delete')}
                      disabled={busy}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                ) : (
                <div className="glass-card p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg">🔒</span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">Sign in to manage</p>
                  <p className="text-xs text-text-secondary mb-4">
                    You must be logged in as an authorized NGO worker to edit, assign, or resolve needs.
                  </p>
                  <button onClick={login} className="btn-primary px-6 py-2 text-sm">
                    Sign in with Google
                  </button>
                </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
