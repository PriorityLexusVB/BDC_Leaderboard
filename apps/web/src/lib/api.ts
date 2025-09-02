export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export async function getLeaderboard(period: 'daily'|'weekly'|'monthly'|'all'='weekly') {
  const res = await fetch(`${API_BASE}/leaderboard?period=${period}`);
  if (!res.ok) throw new Error('Failed to load leaderboard');
  return res.json();
}

export async function getAgentDashboard(agentId: string) {
  const res = await fetch(`${API_BASE}/agents/${agentId}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}
