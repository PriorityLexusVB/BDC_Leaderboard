import React, { Suspense, Component } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AdminRules from './pages/AdminRules';
import AdminLogin from './pages/AdminLogin';
import AdminChallenges from './pages/AdminChallenges';
import { getToken, clearToken } from './lib/auth';

const qc = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

/** Class-based ErrorBoundary that catches render errors in children */
class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div style={{ color: 'red', padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Something went wrong.</h3>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{error.message}</div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 12,
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>{this.props.children}</Suspense>;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Router>
        <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
          <header
            style={{
              padding: '12px 16px',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, flex: 1 }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Priority Gamify
              </Link>
            </h1>
            <nav style={{ display: 'flex', gap: 12 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>Dashboard</Link>
              <Link to="/admin/challenges" style={{ textDecoration: 'none' }}>Admin</Link>
              <Link to="/admin/rules" style={{ textDecoration: 'none' }}>Rules</Link>
              <button
                onClick={() => {
                  clearToken();
                  window.location.hash = '#/admin/login';
                }}
                style={{
                  border: '1px solid #ddd',
                  background: '#fff',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </nav>
          </header>

          <main style={{ padding: 16 }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/challenges"
                  element={
                    <ProtectedRoute>
                      <AdminChallenges />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/rules"
                  element={
                    <ProtectedRoute>
                      <AdminRules />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
