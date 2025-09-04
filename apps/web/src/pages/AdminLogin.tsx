import React, { useState } from 'react';
import { setToken } from '../lib/auth';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('changeme123');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `Login failed (${r.status})`);
      }
      const j = await r.json();
      setToken(j.token);
      setMsg('Logged in ✓  Go to Admin → Challenges or Rules.');
      // optional redirect:
      // window.location.hash = '#/admin/challenges';
    } catch (err: any) {
      setMsg(err.message || String(err));
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <h2 style={{ margin: '0 0 12px' }}>Manager Login</h2>
      <form onSubmit={submit}>
        <label>Email<br /><input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} /></label><br /><br />
        <label>Password<br /><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} /></label><br /><br />
        <button type="submit">Sign In</button>
      </form>
      {msg && <div style={{ marginTop: 12, color: '#444' }}>{msg}</div>}
    </div>
  );
}
