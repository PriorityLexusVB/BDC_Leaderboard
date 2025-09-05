import React from "react";
import { HashRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";

// pages
import Dashboard from "./pages/Dashboard";
import AdminRules from "./pages/AdminRules";
import AdminLogin from "./pages/AdminLogin";
import AdminChallenges from "./pages/AdminChallenges";
import AdminTeams from "./pages/AdminTeams";

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: "100vh", background: "#f7f7f7" }}>
        <header
          style={{
            padding: "12px 16px",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, flex: 1 }}>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
              Priority Gamify
            </Link>
          </h1>

          <nav style={{ display: "flex", gap: 12 }}>
            <Link to="/" style={{ textDecoration: "none" }}>Dashboard</Link>
            <Link to="/admin/rules" style={{ textDecoration: "none" }}>Rules</Link>
            <Link to="/admin/challenges" style={{ textDecoration: "none" }}>Challenges</Link>
            <Link to="/admin/teams" style={{ textDecoration: "none" }}>Teams</Link>
            <Link to="/admin/login" style={{ textDecoration: "none" }}>Login</Link>
          </nav>
        </header>

        <main style={{ padding: 16 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin/rules" element={<AdminRules />} />
            <Route path="/admin/challenges" element={<AdminChallenges />} />
            <Route path="/admin/teams" element={<AdminTeams />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
