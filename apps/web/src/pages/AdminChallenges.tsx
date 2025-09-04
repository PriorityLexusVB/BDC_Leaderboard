import { useState } from 'react';
import { authFetch } from '../lib/auth';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export default function AdminChallenges() {
  const [name, setName] = useState('Weekly Points Race');
  const [description, setDescription] = useState('Most points this week');
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0,16));
  const [endAt, setEndAt] = useState(new Date(Date.now()+7*864e5).toISOString().slice(0,16));
  const [msg, setMsg] = useState('');

  async function createChallenge(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const r = await authFetch(`${API}/admin/challenges`, {
        method:'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          name,
          description,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        throw new Error(j.error ? JSON.stringify(j.error) : 'Create failed');
      }
      const j = await r.json();
      setMsg(`Created challenge #${j.id}`);
    } catch (err:any) {
      setMsg(err.message || String(err));
    }
  }

  return (
    <div style={{maxWidth:700, margin:'24px auto', padding:16}}>
      <h2>Create Challenge</h2>
      <form onSubmit={createChallenge} style={{display:'grid', gap:12}}>
        <label>Name<input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%'}}/></label>
        <label>Description<input value={description} onChange={e=>setDescription(e.target.value)} style={{width:'100%'}}/></label>
        <label>Start (local)<input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} /></label>
        <label>End (local)<input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} /></label>
        <button type="submit">Create</button>
      </form>
      {msg && <div style={{marginTop:12}}>{msg}</div>}
      <div style={{marginTop:24}}>
        <a href={`${API}/challenges/active`} target="_blank" rel="noreferrer">View Active Challenges (raw JSON)</a>
      </div>
    </div>
  );
}
