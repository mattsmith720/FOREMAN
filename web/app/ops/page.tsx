"use client";

import { useCallback, useEffect, useState } from "react";

interface OpsSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  worker: string | null;
  job_type: string | null;
  consent_at: string | null;
  frame_count: number;
  transcript_count?: number;
  est_cost_usd?: number;
  summary_snippet: string | null;
  stuck: boolean;
}

interface OpsTotals {
  frames: number;
  transcripts: number;
  est_cost_usd: number;
}

interface OpsLatencySlice {
  sampleCount: number;
  p50Ms: number;
  p95Ms: number;
}

interface OpsLatency {
  analyse: OpsLatencySlice;
  cueE2e: OpsLatencySlice;
}

interface OpsCostModel {
  analyse_usd: number;
  transcribe_usd: number;
}

interface OpsVideo {
  id: string;
  status?: string;
  file_name?: string | null;
  worker?: string | null;
  frames_extracted?: number;
  error_message?: string | null;
}

const PW_KEY = "foreman_ops_pw";
const SUPABASE_SESSIONS_URL =
  "https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/editor";

export default function OpsPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [sessions, setSessions] = useState<OpsSession[]>([]);
  const [totals, setTotals] = useState<OpsTotals | null>(null);
  const [latency, setLatency] = useState<OpsLatency | null>(null);
  const [costModel, setCostModel] = useState<OpsCostModel | null>(null);
  const [videos, setVideos] = useState<OpsVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = pw ? { "x-ops-password": pw } : undefined;
      const [sessionsRes, ingestRes] = await Promise.all([
        fetch("/api/ops/sessions", { headers, cache: "no-store" }),
        fetch("/api/ops/ingest", { headers, cache: "no-store" }),
      ]);
      if (sessionsRes.status === 401 || ingestRes.status === 401) {
        setAuthed(false);
        window.sessionStorage.removeItem(PW_KEY);
        setError("Wrong ops password.");
        return;
      }
      if (!sessionsRes.ok) {
        throw new Error(`sessions ${sessionsRes.status}`);
      }
      const sessionsBody = (await sessionsRes.json()) as {
        sessions: OpsSession[];
        totals?: OpsTotals;
        latency?: OpsLatency;
        costModel?: OpsCostModel;
      };
      const ingestBody = ingestRes.ok
        ? ((await ingestRes.json()) as { videos: OpsVideo[] })
        : { videos: [] };
      setSessions(sessionsBody.sessions ?? []);
      setTotals(sessionsBody.totals ?? null);
      setLatency(sessionsBody.latency ?? null);
      setCostModel(sessionsBody.costModel ?? null);
      setVideos(ingestBody.videos ?? []);
      setAuthed(true);
      window.sessionStorage.setItem(PW_KEY, pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ops data");
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

  const exportSession = async (id: string) => {
    const pw = window.sessionStorage.getItem(PW_KEY) ?? "";
    const res = await fetch(`/api/ops/sessions/${id}/export`, {
      headers: pw ? { "x-ops-password": pw } : undefined,
      cache: "no-store",
    });
    if (!res.ok) {
      setError(`Export failed (${res.status})`);
      return;
    }
    const text = await res.text();
    const blob = new Blob([text], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `session-${id}.jsonl`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!authed) {
    return (
      <main className="ops-page">
        <h1>Foreman ops</h1>
        <p>Internal dashboard — enter the ops password.</p>
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
          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? "Checking…" : "Open"}
          </button>
        </form>
        {error && <p className="ops-error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="ops-page">
      <header className="ops-header">
        <h1>Foreman ops</h1>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => void load(window.sessionStorage.getItem(PW_KEY) ?? "")}
        >
          Refresh
        </button>
      </header>
      {error && <p className="ops-error">{error}</p>}

      <h2>Recent jobs ({sessions.length})</h2>
      <p className="ops-metrics">
        {totals
          ? `Est. spend $${totals.est_cost_usd.toFixed(2)} · ${totals.frames} frames · ${totals.transcripts} voice chunks`
          : "Spend —"}
        {latency?.analyse?.sampleCount
          ? ` · analyse p50 ${latency.analyse.p50Ms}ms / p95 ${latency.analyse.p95Ms}ms`
          : ""}
        {latency?.cueE2e?.sampleCount
          ? ` · cue→attempt p50 ${latency.cueE2e.p50Ms}ms / p95 ${latency.cueE2e.p95Ms}ms`
          : ""}
        {costModel
          ? ` · model $${costModel.analyse_usd}/frame · $${costModel.transcribe_usd}/chunk`
          : ""}
      </p>
      <a
        className="ops-link"
        href={SUPABASE_SESSIONS_URL}
        target="_blank"
        rel="noreferrer"
      >
        Open sessions in Supabase ↗
      </a>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Worker</th>
            <th>Phase</th>
            <th>Frames</th>
            <th>Chunks</th>
            <th>Est $</th>
            <th>Consent</th>
            <th>Summary</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className={session.stuck ? "ops-stuck" : ""}>
              <td>{session.worker ?? "—"}</td>
              <td>{session.job_type ?? "—"}</td>
              <td>{session.frame_count}</td>
              <td>{session.transcript_count ?? 0}</td>
              <td>${(session.est_cost_usd ?? 0).toFixed(3)}</td>
              <td>{session.consent_at ? "✓" : "—"}</td>
              <td className="ops-summary">
                {session.stuck
                  ? "⚠ summary stuck"
                  : (session.summary_snippet ?? "—")}
              </td>
              <td>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void exportSession(session.id)}
                >
                  Export
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Ingest queue ({videos.length})</h2>
      {videos.length === 0 ? (
        <p>No site videos queued.</p>
      ) : (
        <table className="ops-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Worker</th>
              <th>Status</th>
              <th>Frames</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr
                key={video.id}
                className={video.status === "failed" ? "ops-stuck" : ""}
              >
                <td>{video.file_name ?? "—"}</td>
                <td>{video.worker ?? "—"}</td>
                <td>{video.status ?? "—"}</td>
                <td>{video.frames_extracted ?? 0}</td>
                <td className="ops-summary">{video.error_message ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
