"use client";

import { useState } from "react";
import { BOOKING_URL } from "@/lib/config";

interface BookDemoProps {
  className?: string;
  label?: string;
  primary?: boolean;
}

export function BookDemo({
  className = "",
  label = "Book a demo",
  primary = true,
}: BookDemoProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (BOOKING_URL) {
    return (
      <a
        href={BOOKING_URL}
        className={`lp-btn ${primary ? "lp-btn--primary" : "lp-btn--secondary"} ${className}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      crewSize: String(data.get("crewSize") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <>
      <button
        type="button"
        className={`lp-btn ${primary ? "lp-btn--primary" : "lp-btn--secondary"} ${className}`}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-demo-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgb(15 15 16 / 0.45)",
            display: "grid",
            placeItems: "center",
            padding: "1rem",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="lp-card"
            style={{ width: "min(100%, 28rem)", padding: "1.5rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="book-demo-title" style={{ margin: "0 0 0.5rem" }}>
              Book a demo
            </h3>
            <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Tell us about your crew — we&apos;ll get you running on a pilot job.
            </p>
            {status === "success" ? (
              <p className="lp-form-success" role="status">
                Thanks — we&apos;ll be in touch shortly.
              </p>
            ) : (
              <form className="lp-form" onSubmit={submit}>
                <label>
                  Name
                  <input name="name" required autoComplete="name" />
                </label>
                <label>
                  Company
                  <input name="company" required autoComplete="organization" />
                </label>
                <label>
                  Crew size
                  <input name="crewSize" required placeholder="e.g. 6 installers" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required autoComplete="email" />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" autoComplete="tel" />
                </label>
                {error && (
                  <p role="alert" style={{ color: "var(--pain)", margin: 0, fontSize: "0.85rem" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="lp-btn lp-btn--primary"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending…" : "Request demo"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
