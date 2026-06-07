"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface DashboardPayload {
  jobsToday: number;
  packsReady: number;
  defectsByCategory: Record<string, number>;
  installerActivity: Array<{ worker: string; jobs: number }>;
}

interface DatasetPayload {
  sessions: number;
  labels: number;
  frames: number;
}

const PW_KEY = "foreman_ops_pw";

export default function DashboardPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [dataset, setDataset] = useState<DatasetPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = pw ? { "x-ops-password": pw } : undefined;
      const res = await fetch("/api/ops/sessions", { headers, cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        window.sessionStorage.removeItem(PW_KEY);
        setError("Wrong ops password.");
        return;
      }
      if (!res.ok) {
        throw new Error(`ops ${res.status}`);
      }
      const body = (await res.json()) as {
        dashboard?: DashboardPayload;
        dataset?: DatasetPayload;
      };
      setDashboard(body.dashboard ?? null);
      setDataset(body.dataset ?? null);
      setAuthed(true);
      window.sessionStorage.setItem(PW_KEY, pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(PW_KEY);
    if (saved !== null) {
      setPassword(saved);
      void load(saved);
    }
  }, [load]);

  if (!authed) {
    return (
      <main className="ops-page dashboard-page">
        <h1>Foreman dashboard</h1>
        <p>Buyer view — jobs, packs, and crew activity. Same password as ops.</p>
        <form
          className="ops-login"
          onSubmit={(event) => {
            event.preventDefault();
            void load(password);
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ops password"
            aria-label="Ops password"
          />
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? "Checking…" : "Open"}
          </button>
        </form>
        {error && <p className="ops-error">{error}</p>}
      </main>
    );
  }

  const defectEntries = Object.entries(dashboard?.defectsByCategory ?? {});

  return (
    <main className="ops-page dashboard-page">
      <header className="ops-header">
        <h1>Foreman dashboard</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/ops" className="button button-secondary">
            Mission control
          </Link>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void load(window.sessionStorage.getItem(PW_KEY) ?? "")}
          >
            Refresh
          </button>
        </div>
      </header>
      {error && <p className="ops-error">{error}</p>}

      <div className="ops-metrics-grid">
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{dashboard?.jobsToday ?? 0}</span>
          <span className="dashboard-stat-label">Jobs started today</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{dashboard?.packsReady ?? 0}</span>
          <span className="dashboard-stat-label">Jobs completed today</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{dataset?.sessions ?? 0}</span>
          <span className="dashboard-stat-label">Total sessions (dataset)</span>
        </div>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{dataset?.frames ?? 0}</span>
          <span className="dashboard-stat-label">Frames logged</span>
        </div>
      </div>

      <h2>Defects caught today</h2>
      {defectEntries.length === 0 ? (
        <p>No coaching events yet today.</p>
      ) : (
        <ul className="ops-trend-list">
          {defectEntries.map(([category, count]) => (
            <li key={category}>
              {category}: {count}
            </li>
          ))}
        </ul>
      )}

      <h2>Installer activity today</h2>
      {(dashboard?.installerActivity ?? []).length === 0 ? (
        <p>No jobs yet today.</p>
      ) : (
        <table className="ops-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Jobs</th>
            </tr>
          </thead>
          <tbody>
            {dashboard?.installerActivity.map((row) => (
              <tr key={row.worker}>
                <td>{row.worker}</td>
                <td>{row.jobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
