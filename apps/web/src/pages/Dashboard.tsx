import React, { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

type LeaderRow = {
  agent_id: string;
  points: number;
  rank?: number | null;
};

export default function Dashboard() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const r = await fetch(`${API}/leaderboard?period=weekly`, { credentials: 'omit' });
        if (!r.ok) throw new Error(`Leaderboard failed (${r.status})`);
        const j = await r.json();
        if (!cancelled) setRows(Array.isArray(j) ? j : []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || String(e));
          // optional: some placeholder so UI isn't empty
          setRows([
            { agent_id: 'sample@agent', points: 0, rank: 1 },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '16px auto' }}>
      <h2>Weekly Leaderboard</h2>

      {loading && <div style={{ padding: 12 }}>Loading…</div>}

      {!!error && (
        <div style={{ color: 'red', marginBottom: 12 }}>
          Couldn’t load live data: {error}
          <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>
            Check API at <code>{API}/leaderboard?period=weekly</code> and CORS/env.
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#fafafa' }}>
            <tr>
              <th style={th}>Rank</th>
              <th style={th}>Agent</th>
              <th style={th}>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: 16, textAlign: 'center' }}>No data yet.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.agent_id}-${i}`} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={td}>{r.rank ?? i + 1}</td>
                  <td style={td}>{r.agent_id}</td>
                  <td style={td}>{r.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 13, color: '#444' };
const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' };
