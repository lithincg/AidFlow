import { useState } from 'react';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../context/AuthContext';
import { createOrganization, joinOrganizationByName } from '../../services/firestore';

export default function OrgPicker() {
  const { user } = useAuth();
  const { userOrgs, selectOrg, refreshOrgs } = useOrg();

  const [mode, setMode] = useState(userOrgs.length > 0 ? 'select' : 'create');
  const [orgName, setOrgName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim() || !user) return;

    setLoading(true);
    setError(null);
    try {
      const newOrg = await createOrganization(orgName.trim(), user.uid, user.email);
      const orgs = await refreshOrgs();
      const created = orgs.find((o) => o.id === newOrg.id) || { id: newOrg.id, name: orgName.trim() };
      selectOrg(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinName.trim() || !user) return;

    setLoading(true);
    setError(null);
    try {
      const org = await joinOrganizationByName(joinName.trim(), user.uid);
      const orgs = await refreshOrgs();
      const joined = orgs.find((o) => o.id === org.id) || org;
      selectOrg(joined);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Existing orgs */}
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
            onClick={() => { setMode('create'); setError(null); }}
            className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
              mode === 'create'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => { setMode('join'); setError(null); }}
            className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 ${
              mode === 'join'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-white/[0.03] text-text-secondary border border-white/[0.04] hover:bg-white/[0.06]'
            }`}
          >
            Join Existing
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-urgent-high/10 border border-urgent-high/15 text-xs text-urgent-high">
            {error}
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
            <button type="submit" className="btn-primary w-full" disabled={loading || !orgName.trim()}>
              {loading ? 'Creating...' : '🏢 Create Organization'}
            </button>
          </form>
        )}

        {/* Join form */}
        {mode === 'join' && (
          <form onSubmit={handleJoin}>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Organization Name</label>
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Type the exact organization name"
              className="input-field mb-4"
              maxLength={60}
              required
              disabled={loading}
            />
            <button type="submit" className="btn-primary w-full" disabled={loading || !joinName.trim()}>
              {loading ? 'Joining...' : '🤝 Join Organization'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
