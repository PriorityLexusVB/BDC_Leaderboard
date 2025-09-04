import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';

type Rule = {
  id?: number;
  event_type: string;
  points_value: number;
  description?: string | null;
  is_active?: boolean;
};

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export default function AdminRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');
      try {
        const r = await authFetch(`${API}/admin/rules`);
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        const data = await r.json();
        setRules(data);
      } catch (e: any) {
        setMsg(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateRule(idx: number, patch: Partial<Rule>) {
    setRules((arr) => {
      const copy = arr.slice();
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function addRow() {
    setRules((arr) => [
      ...arr,
      { event_type: '', points_value: 0, description: '', is_active: true },
    ]);
  }

  async function saveAll() {
    setMsg('');
    try {
      // basic client-side validation
      for (const r of rules) {
        if (!r.event_type || r.event_type.trim().length < 2) {
          throw new Error('Each rule needs a valid event_type (min 2 chars).');
        }
        if (Number.isNaN(Number(r.points_value))) {
          throw new Error('points_value must be a number.');
        }
      }

      const r = await authFetch(`${API}/admin/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          rules.map(({ event_type, points_value, description, is_active }) => ({
            event_type: event_type.trim(),
            points_value: Number(points_value),
            description: (description ?? '').toString(),
            is_active: Boolean(is_active),
          }))
        ),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ? JSON.stringify(j.error) : `Save failed (${r.status})`);
      }
      const j = await r.json();
      setMsg(`Saved ${j.count} rule(s) ✔`);
    } catch (e: any) {
      setMsg(e.message || String(e));
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading rules…</div>;

  return (
    <div style={{ maxWidth: 900, margin: '16px auto', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Gamification Rules</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow}>Add Rule</button>
          <button onClick={saveAll} style={{ fontWeight: 600 }}>Save All</button>
        </div>
      </div>

      {msg && <div style={{ padding: 16, color: '#444' }}>{msg}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr>
              <th style={th}>Event Type</th>
              <th style={th}>Points</th>
              <th style={th}>Description</th>
              <th style={th}>Active</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={td}>
                  <input
                    value={r.event_type}
                    onChange={(e) => updateRule(idx, { event_type: e.target.value })}
                    style={input}
                    placeholder="FAST_RESPONSE"
                  />
                </td>
                <td style={td}>
                  <input
                    type="number"
                    value={r.points_value}
                    onChange={(e) => updateRule(idx, { points_value: Number(e.target.value) })}
                    style={{ ...input, width: 100 }}
                  />
                </td>
                <td style={td}>
                  <input
                    value={r.description ?? ''}
                    onChange={(e) => updateRule(idx, { description: e.target.value })}
                    style={input}
                    placeholder="Description…"
                  />
                </td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!r.is_active}
                    onChange={(e) => updateRule(idx, { is_active: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#777' }}>
                  No rules yet — click “Add Rule” to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: 12, color: '#666', fontSize: 12 }}>
        Tip: event types should match what your webhook emits (e.g., FAST_RESPONSE, HIGH_SCORE, OPPORTUNITY).
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 13, color: '#444' };
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' };
const input: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 };
