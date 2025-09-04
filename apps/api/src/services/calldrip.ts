const base = process.env.CALLDRIP_API_BASE || '';
const key = process.env.CALLDRIP_API_KEY || '';
const account = process.env.CALLDRIP_ACCOUNT_ID || '';

export async function fetchScoredData(params: { since?: string; until?: string; page?: number }) {
  if (!base) throw new Error('CALLDRIP_API_BASE not configured');
  const url = new URL(`${base}/scoreddata`);
  if (params.since) url.searchParams.set('since', params.since);
  if (params.until) url.searchParams.set('until', params.until);
  if (params.page) url.searchParams.set('page', String(params.page));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}`, 'X-Account': account } as any });
  if (!res.ok) throw new Error(`Calldrip scoreddata ${res.status}`);
  return res.json();
}

export async function clickToCall(payload: { userId: string; customerPhone: string; firstName?: string }) {
  if (!base) throw new Error('CALLDRIP_API_BASE not configured');
  const res = await fetch(`${base}/clicktocall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Account': account } as any,
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Calldrip clickToCall ${res.status}`);
  return res.json();
}
