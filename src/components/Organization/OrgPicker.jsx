import { useState, useEffect } from 'react';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { createOrganization, joinOrganizationById, getAllOrganizations } from '../../services/firestore';

export default function OrgPicker() {
  const { user } = useAuth();
  const { userOrgs, selectOrg, refreshOrgs } = useOrg();

  const [mode, setMode] = useState(userOrgs.length > 0 ? 'select' : 'browse');
  const [orgName, setOrgName] = useState('');
  const [orgPin, setOrgPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // All public orgs for "browse" mode
  const [allOrgs, setAllOrgs] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // PIN prompt state
  const [joiningOrg, setJoiningOrg] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(null);

  // Fetch all orgs when browse mode is active
  useEffect(() => {
    if (mode === 'browse') {
      setLoadingOrgs(true);
      getAllOrganizations()
        .then((orgs) => {
          const userOrgIds = new Set(userOrgs.map(o => o.id));
          setAllOrgs(orgs.filter(o => !userOrgIds.has(o.id)));
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingOrgs(false));
    }
  }, [mode, userOrgs]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim() || !orgPin.trim() || !user) return;
    if (orgPin.length !== 4 || !/^\d{4}$/.test(orgPin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newOrg = await createOrganization(orgName.trim(), user.uid, user.email, orgPin.trim());
      const orgs = await refreshOrgs();
      const created = orgs.find((o) => o.id === newOrg.id) || { id: newOrg.id, name: orgName.trim() };
      selectOrg(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClick = (org) => {
    setJoiningOrg(org);
    setPinInput('');
    setPinError(null);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim() || !user || !joiningOrg) return;

    // Verify PIN matches
    if (pinInput.trim() !== joiningOrg.pin) {
      setPinError('Incorrect PIN. Please try again.');
      return;
    }

    setLoading(true);
    setPinError(null);
    try {
      await joinOrganizationById(joiningOrg.id, user.uid);
      const orgs = await refreshOrgs();
      const joined = orgs.find((o) => o.id === joiningOrg.id) || joiningOrg;
      selectOrg(joined);
      setJoiningOrg(null);
    } catch (err) {
      setPinError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrgs = allOrgs.filter(o =>
    o.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // ── PIN Prompt Modal ──
  if (joiningOrg) {
    return (
      <div className="flex h-[80vh] items-center justify-center animate-fade-in">
        <div className="bg-surface-card border border-white/[0.04] p-8 rounded-2xl max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-accent font-bold text-xl">🔐</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Enter Organization PIN</h2>
            <p className="text-text-secondary text-sm">
              Enter the 4-digit PIN for <strong className="text-accent">{joiningOrg.name}</strong>
            </p>
          </div>

          {pinError && (
            <div className="mb-4 p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit}>
            <div className="flex justify-center mb-5">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                className="input-field text-center text-2xl font-mono tracking-[0.5em] max-w-[180px]"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setJoiningOrg(null); setPinInput(''); setPinError(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-text-secondary text-sm font-medium hover:bg-white/[0.04] transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading || pinInput.length !== 4}
              >
                {loading ? 'Joining...' : '🔓 Join'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Main OrgPicker ──
  return (
    <div className="flex h-[80vh] items-center justify-center animate-fade-in">
      <div className="bg-surface-card border border-white/[0.04] p-8 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-surface-base font-bold text-xl">🏢</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Select Your Organization</h2>
          <p className="text-text-secondary text-sm">
            Choose an existing NGO or create a new one to get started.
          </p>
        </div>

        {/* Existing user orgs */}
        {userOrgs.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Your Organizations</p>
            <div className="space-y-2">
              {userOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => selectOrg(org)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-accent/10 hover:border-accent/20 transition-all duration-200 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                    {org.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{org.name}</p>
                    <p className="text-xs text-text-muted">{org.memberCount || 1} member{(org.memberCount || 1) !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-text-muted group-hover:text-accent transition-colors">→</span>
                </button>
              ))}
            </div>
            <div className="h-px bg-white/[0.06] my-5" />
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('browse'); setError(null); }}
            className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
              mode === 'browse'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
            }`}
          >
            Browse & Join
          </button>
          <button
            onClick={() => { setMode('create'); setError(null); }}
            className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
              mode === 'create'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
            {error}
          </div>
        )}

        {/* Browse & Join */}
        {mode === 'browse' && (
          <div>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="🔍 Search organizations..."
              className="input-field mb-3"
              disabled={loading}
            />

            {loadingOrgs ? (
              <div className="text-center py-6 text-text-muted text-sm">Loading organizations...</div>
            ) : filteredOrgs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-muted text-sm mb-1">
                  {allOrgs.length === 0 ? 'No organizations available' : 'No matches found'}
                </p>
                <p className="text-text-muted text-xs">Try creating a new one instead</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleJoinClick(org)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-accent/10 hover:border-accent/20 transition-all duration-200 text-left group disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-text-secondary font-bold text-sm shrink-0 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                      {org.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{org.name}</p>
                      <p className="text-xs text-text-muted">{org.memberCount || 1} member{(org.memberCount || 1) !== 1 ? 's' : ''} · 🔐 PIN required</p>
                    </div>
                    <span className="text-[10px] font-medium text-accent/60 group-hover:text-accent bg-accent/5 px-2 py-1 rounded-lg transition-colors">
                      Join
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create form */}
        {mode === 'create' && (
          <form onSubmit={handleCreate}>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Dharwad Relief Network"
              className="input-field mb-4"
              maxLength={60}
              required
              disabled={loading}
            />
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Set a 4-Digit PIN</label>
            <p className="text-[11px] text-text-muted mb-2">Others will need this PIN to join your organization.</p>
            <input
              type="text"
              inputMode="numeric"
              value={orgPin}
              onChange={(e) => setOrgPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="e.g. 1234"
              className="input-field mb-5 text-center font-mono tracking-widest"
              maxLength={4}
              required
              disabled={loading}
            />
            <button type="submit" className="btn-primary w-full" disabled={loading || !orgName.trim() || orgPin.length !== 4}>
              {loading ? 'Creating...' : '🏢 Create Organization'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
