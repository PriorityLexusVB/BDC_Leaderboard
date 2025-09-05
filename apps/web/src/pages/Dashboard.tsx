import React, { useEffect, useState } from "react";

type TeamRow = { name: string };
type AgentRow = {
  id: string;
  first_name?: string;
  last_name?: string;
  outbound_calls: number;
  connected_calls: number;
  connect_rate: number; // %
  appts_set: number;
  points: number;
};

export default function Dashboard() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [team, setTeam] = useState<string>("");
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to load teams; if endpoint not present, fall back to a single "All" team.
  async function loadTeams() {
    try {
      const res = await fetch("/api/teams/public/allowed");
      if (!res.ok) throw new Error("teams endpoint not available");
      const data: TeamRow[] = await res.json();
      setTeams(data);
      if (data.length && !team) setTeam(data[0].name);
    } catch {
      const fallback = [{ name: "All" }];
      setTeams(fallback);
      if (!team) setTeam(fallback[0].name);
    }
  }

  // Load metrics; if /api/metrics/agents is not implemented yet,
  // fall back to /api/leaderboard?period=weekly and map to rows.
  async function loadMetrics(selectedTeam: string, signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);

      // Preferred endpoint (if you add it later)
      const q = new URLSearchParams();
      q.set("period", "weekly");
      if (selectedTeam) q.set("team", selectedTeam);

      const res = await fetch(`/api/metrics/agents?${q.toString()}`, { signal });
      if (res.ok) {
        const data: AgentRow[] = await res.json();
        setRows(data);
        return;
      }

      // Fallback to current leaderboard API
      const lb = await fetch("/api/leaderboard?period=weekly", { signal });
      if (!lb.ok) throw new Error(`Failed: ${lb.status}`);
      const lbData: Array<{ id: string; first_name?: string; last_name?: string; points: number }> =
        await lb.json();

      const mapped: AgentRow[] = lbData.map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        outbound_calls: 0,
        connected_calls: 0,
        connect_rate: 0,
        appts_set: 0,
        points: p.points,
      }));

      setRows(mapped);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    loadMetrics(team, ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          marginBottom: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, marginRight: "auto" }}>Team Leaderboard</h2>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#666" }}>Team</span>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            style={{ padding: 6, borderRadius: 8, border: "1px solid #ddd" }}
          >
            {teams.length === 0 && <option value="">No teams</option>}
            {teams.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
        }}
      >
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div style={{ color: "red" }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No data yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "8px 4px" }}>Agent</th>
                  <th style={{ padding: "8px 4px" }}>Outbound</th>
                  <th style={{ padding: "8px 4px" }}>Connected</th>
                  <th style={{ padding: "8px 4px" }}>Connect %</th>
                  <th style={{ padding: "8px 4px" }}>Appts Set</th>
                  <th style={{ padding: "8px 4px" }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                    <td style={{ padding: "8px 4px" }}>
                      {r.first_name || r.last_name
                        ? `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim()
                        : r.id}
                    </td>
                    <td style={{ padding: "8px 4px" }}>{r.outbound_calls}</td>
                    <td style={{ padding: "8px 4px" }}>{r.connected_calls}</td>
                    <td style={{ padding: "8px 4px" }}>{r.connect_rate}%</td>
                    <td style={{ padding: "8px 4px" }}>{r.appts_set}</td>
                    <td style={{ padding: "8px 4px", fontWeight: 700 }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
