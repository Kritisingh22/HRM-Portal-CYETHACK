/* Leave page — role-aware, but every action is authorised by the backend:
 *  • Employee: sees their OWN leave (self-scoped by the API) and can apply.
 *  • Manager:  sees their TEAM's leave and can Approve/Reject PENDING requests
 *              (the API rejects approving a non-team member's leave — 403).
 *  • HR/Admin: sees all leave and can Approve/Reject.
 * The Approve/Reject buttons call PUT /api/leaves/:id {status}. Apply calls
 * POST /api/leaves. This component only shows the controls; the server decides
 * whether the action is allowed. */
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { Card, StatusPill, Spinner, ErrorNote, EmptyState, personName } from '../../components/ui';

const TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function LeavePage({ title, scopeNote }) {
  const { user } = useAuth();
  const isEmployee = user?.role === 'EMPLOYEE';
  const canDecide = ['HR', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role);

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setRows(null); setError(null);
    api.get('/api/leaves').then((d) => setRows(d.leaves || [])).catch(setError);
  }, []);
  useEffect(load, [load]);

  async function decide(id, status) {
    setBusyId(id);
    try { await api.put('/api/leaves/' + id, { status }); load(); }
    catch { setBusyId(null); alert('That action was not permitted.'); }
  }

  return (
    <div className="ws-page">
      <div className="ws-page-head"><h1>{title || 'Leave'}</h1>{scopeNote && <span className="ws-scope">{scopeNote}</span>}</div>

      {isEmployee && <ApplyLeave onApplied={load} />}

      <Card title={canDecide ? 'Leave requests' : 'My leave'} sub={canDecide ? 'Approve or reject pending requests' : 'Your leave history'}>
        {error ? <ErrorNote error={error} /> : rows === null ? <Spinner /> : rows.length === 0 ? <EmptyState>No leave requests.</EmptyState> : (
          <div className="ws-tablewrap">
            <table className="ws-table">
              <thead><tr>{!isEmployee && <th>Employee</th>}<th>Type</th><th>From</th><th>To</th><th className="r">Days</th><th>Status</th>{canDecide && <th>Action</th>}</tr></thead>
              <tbody>
                {rows.map((l) => {
                  const pending = String(l.status).toLowerCase() === 'pending';
                  return (
                    <tr key={l._id}>
                      {!isEmployee && <td>{personName(l.employee)}</td>}
                      <td>{l.type}</td><td>{fmt(l.from)}</td><td>{fmt(l.to)}</td><td className="r">{l.days}</td>
                      <td><StatusPill value={l.status} /></td>
                      {canDecide && (
                        <td>
                          {pending ? (
                            <span className="ws-actions">
                              <button className="ws-btn sm ok" disabled={busyId === l._id} onClick={() => decide(l._id, 'Approved')}>Approve</button>
                              <button className="ws-btn sm bad" disabled={busyId === l._id} onClick={() => decide(l._id, 'Rejected')}>Reject</button>
                            </span>
                          ) : <span className="ws-muted">—</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ApplyLeave({ onApplied }) {
  const [f, setF] = useState({ type: TYPES[0], from: '', to: '', reason: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.from || !f.to) return setMsg({ err: true, text: 'Pick a start and end date.' });
    setBusy(true);
    try {
      await api.post('/api/leaves', { type: f.type, from: f.from, to: f.to, reason: f.reason });
      setMsg({ err: false, text: 'Leave request submitted.' });
      setF({ type: TYPES[0], from: '', to: '', reason: '' });
      onApplied();
    } catch (err) {
      setMsg({ err: true, text: err.status === 400 ? 'Please check the dates (end must be on/after start).' : 'Could not submit.' });
    } finally { setBusy(false); }
  }

  return (
    <Card title="Apply for leave" sub="Submit a new request to your manager">
      <form onSubmit={submit} className="ws-form-row">
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label="From" />
        <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To" />
        <input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Reason (optional)" />
        <button className="ws-btn primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
        {msg && <span className={'pf-msg' + (msg.err ? ' err' : '')}>{msg.text}</span>}
      </form>
    </Card>
  );
}
