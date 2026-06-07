"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BOOKING_URL } from "@/lib/config";

interface BookDemoProps {
  className?: string;
  label?: string;
  primary?: boolean;
}

type FieldName = "name" | "company" | "crewSize" | "email" | "phone";

type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = ["name", "company", "crewSize", "email", "phone"];

function validateField(name: FieldName, value: string): string | null {
  const trimmed = value.trim();

  switch (name) {
    case "name":
      if (!trimmed) return "Name is required.";
      if (trimmed.length > 200) return "Name must be 200 characters or fewer.";
      return null;
    case "company":
      if (!trimmed) return "Company is required.";
      if (trimmed.length > 200) return "Company must be 200 characters or fewer.";
      return null;
    case "crewSize":
      if (!trimmed) return "Crew size is required.";
      if (trimmed.length > 100) return "Crew size must be 100 characters or fewer.";
      return null;
    case "email":
      if (!trimmed) return "Email is required.";
      if (trimmed.length > 320) return "Email must be 320 characters or fewer.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return "Enter a valid email address.";
      }
      return null;
    case "phone":
      if (value.length > 40) return "Phone must be 40 characters or fewer.";
      return null;
    default:
      return null;
  }
}

function validateForm(values: Record<FieldName, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_ORDER) {
    const message = validateField(field, values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
    ),
  ).filter((el) => el.offsetParent !== null || el === document.activeElement);
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [isNarrow, setIsNarrow] = useState(false);

  const variant = primary ? "lp-btn--primary" : "lp-btn--secondary";
  const isLoading = status === "loading";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 480px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const closeModal = useCallback(() => {
    if (isLoading) return;
    setOpen(false);
    setFieldErrors({});
    setTouched({});
    setError(null);
    if (status !== "success") {
      setStatus("idle");
    }
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [isLoading, status]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusableElements(panel);
      focusable[0]?.focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeModal]);

  if (BOOKING_URL) {
    return (
      <a
        href={BOOKING_URL}
        className={`lp-btn ${variant} ${className}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>
    );
  }

  function handleFieldBlur(name: FieldName, value: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const message = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      crewSize: String(data.get("crewSize") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
    };

    const errors = validateForm(payload);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({
        name: true,
        company: true,
        crewSize: true,
        email: true,
        phone: true,
      });
      setError(null);
      setStatus("idle");

      const firstInvalid = FIELD_ORDER.find((field) => errors[field]);
      if (firstInvalid) {
        const input = form.elements.namedItem(firstInvalid);
        if (input instanceof HTMLElement) input.focus();
      }
      return;
    }

    setStatus("loading");
    setError(null);
    setFieldErrors({});

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
      setTouched({});
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function renderField(
    name: FieldName,
    labelText: string,
    options: {
      type?: string;
      autoComplete?: string;
      placeholder?: string;
      required?: boolean;
    } = {},
  ) {
    const hintId = `${name}-hint`;
    const showError = touched[name] && fieldErrors[name];

    return (
      <label>
        {labelText}
        <input
          name={name}
          type={options.type}
          required={options.required}
          autoComplete={options.autoComplete}
          placeholder={options.placeholder}
          disabled={isLoading}
          aria-invalid={showError ? true : undefined}
          aria-describedby={showError ? hintId : undefined}
          onBlur={(event) => handleFieldBlur(name, event.currentTarget.value)}
        />
        {showError ? (
          <span id={hintId} role="alert" className="lp-form-field-error">
            {fieldErrors[name]}
          </span>
        ) : null}
      </label>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`lp-btn ${variant} ${className}`}
        onClick={() => {
          setOpen(true);
          if (status === "success") {
            setStatus("idle");
          }
        }}
        aria-haspopup="dialog"
      >
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={`lp-modal-overlay${isNarrow ? " lp-modal-overlay--sheet" : ""}`}
          onClick={() => closeModal()}
        >
          <div
            ref={panelRef}
            className={`lp-modal-panel${isNarrow ? " lp-modal-panel--sheet" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lp-modal-header">
              <h3 id={titleId} className="lp-modal-title">
                Book a demo
              </h3>
              <button
                type="button"
                className="lp-btn lp-btn--secondary lp-modal-close"
                onClick={closeModal}
                disabled={isLoading}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <p id={descriptionId} className="lp-modal-desc">
              Tell us about your crew. We&apos;ll get you running on a pilot job.
            </p>
            {status === "success" ? (
              <p className="lp-form-success" role="status">
                Thanks. We&apos;ll be in touch shortly.
              </p>
            ) : (
              <form
                className="lp-form"
                onSubmit={submit}
                aria-busy={isLoading}
                noValidate
              >
                {renderField("name", "Name", { autoComplete: "name", required: true })}
                {renderField("company", "Company", {
                  autoComplete: "organization",
                  required: true,
                })}
                {renderField("crewSize", "Crew size", {
                  placeholder: "e.g. 6 field techs",
                  required: true,
                })}
                {renderField("email", "Email", {
                  type: "email",
                  autoComplete: "email",
                  required: true,
                })}
                {renderField("phone", "Phone", { type: "tel", autoComplete: "tel" })}
                {error && (
                  <p role="alert" className="lp-form-error">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="lp-btn lp-btn--primary"
                  disabled={isLoading}
                  aria-disabled={isLoading}
                  style={{ width: "100%", opacity: isLoading ? 0.85 : 1 }}
                >
                  {isLoading ? "Sending…" : "Request demo"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
