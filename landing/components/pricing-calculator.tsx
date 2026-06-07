"use client";

import { useMemo, useState } from "react";
import {
  estimateMonthlyAud,
  GLASSES_RETAIL,
  HARDWARE_OPTIONS,
  type DeviceMode,
  type PricingTierId,
  type UsageInputs,
} from "@/lib/pricing";

const TIERS: { id: PricingTierId; label: string }[] = [
  { id: "pilot", label: "Pilot" },
  { id: "field", label: "Field" },
  { id: "crew", label: "Crew" },
];

const DEFAULT_USAGE: UsageInputs = {
  jobsPerMonth: 80,
  avgFramesPerJob: 60,
  transcriptionMinutes: 180,
  extraModules: 2,
  storageGb: 25,
  videoIngest: 2,
};

export function PricingCalculator() {
  const [tier, setTier] = useState<PricingTierId>("field");
  const [seats, setSeats] = useState(6);
  const [device, setDevice] = useState<DeviceMode>("phone");
  const [prescription, setPrescription] = useState(false);
  const [usage, setUsage] = useState<UsageInputs>(DEFAULT_USAGE);

  const estimate = useMemo(
    () => estimateMonthlyAud(tier, seats, usage, device, prescription),
    [tier, seats, usage, device, prescription],
  );

  const showHardware = device !== "phone" && device !== "byod_glasses";

  const patchUsage = (patch: Partial<UsageInputs>) => {
    setUsage((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="lp-pricing-calc">
      <h3 className="lp-pricing-calc-title">Estimate your monthly bill</h3>
      <p className="lp-pricing-calc-lede">
        Fixed platform seats + variable usage · ex GST · illustrative
      </p>

      <fieldset className="lp-pricing-calc-fieldset">
        <legend>Fixed monthly</legend>
        <div className="lp-pricing-calc-grid">
          <label>
            Plan
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as PricingTierId)}
            >
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Active field techs
            <input
              type="number"
              min={1}
              max={200}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            Capture device
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value as DeviceMode)}
            >
              {HARDWARE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          {(device === "glasses_lease" || device === "glasses_buy") && (
            <label>
              Lens type
              <select
                value={prescription ? "rx" : "standard"}
                onChange={(e) => setPrescription(e.target.value === "rx")}
              >
                <option value="standard">Standard (sun/clear)</option>
                <option value="rx">Prescription</option>
              </select>
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="lp-pricing-calc-fieldset">
        <legend>Variable usage (monthly)</legend>
        <div className="lp-pricing-calc-grid">
          <label>
            Completed jobs
            <input
              type="number"
              min={0}
              max={5000}
              value={usage.jobsPerMonth}
              onChange={(e) =>
                patchUsage({ jobsPerMonth: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Avg coaching frames / job
            <input
              type="number"
              min={0}
              max={500}
              value={usage.avgFramesPerJob}
              onChange={(e) =>
                patchUsage({ avgFramesPerJob: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Transcription minutes
            <input
              type="number"
              min={0}
              max={10000}
              value={usage.transcriptionMinutes}
              onChange={(e) =>
                patchUsage({ transcriptionMinutes: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Training modules (total)
            <input
              type="number"
              min={0}
              max={200}
              value={usage.extraModules}
              onChange={(e) =>
                patchUsage({ extraModules: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Storage (GB)
            <input
              type="number"
              min={0}
              max={5000}
              value={usage.storageGb}
              onChange={(e) => patchUsage({ storageGb: Number(e.target.value) || 0 })}
            />
          </label>
          <label>
            Video ingests
            <input
              type="number"
              min={0}
              max={500}
              value={usage.videoIngest}
              onChange={(e) => patchUsage({ videoIngest: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      </fieldset>

      <dl className="lp-pricing-calc-results">
        <div>
          <dt>Platform seats</dt>
          <dd>${estimate.subtotalFixed.toLocaleString("en-AU")} / mo</dd>
        </div>
        {estimate.subtotalHardware > 0 && (
          <div>
            <dt>Glasses lease</dt>
            <dd>${estimate.subtotalHardware.toLocaleString("en-AU")} / mo</dd>
          </div>
        )}
        <div>
          <dt>Usage (variable)</dt>
          <dd>${estimate.usage.total.toLocaleString("en-AU")} / mo</dd>
        </div>
        {estimate.upfrontHardware > 0 && (
          <div>
            <dt>Hardware upfront</dt>
            <dd>${estimate.upfrontHardware.toLocaleString("en-AU")} one-off</dd>
          </div>
        )}
        <div className="lp-pricing-calc-total">
          <dt>Estimated monthly</dt>
          <dd>${estimate.total.toLocaleString("en-AU")} / mo</dd>
        </div>
        {showHardware && (
          <div className="lp-pricing-calc-tco">
            <dt>24-mo TCO / seat</dt>
            <dd>~${estimate.tcoPerSeat24Mo.toLocaleString("en-AU")}</dd>
          </div>
        )}
      </dl>

      {estimate.usage.lines.length > 0 && (
        <ul className="lp-pricing-calc-usage">
          {estimate.usage.lines.map((line) => (
            <li key={line.id}>
              {line.label}: {line.quantity} {line.unit} × ${line.rate} = $
              {line.amount.toLocaleString("en-AU")}
            </li>
          ))}
        </ul>
      )}

      <p className="lp-pricing-calc-footnote">
        Bundled allowances are included in the platform seat fee. Usage lines above
        only apply beyond those pools. {GLASSES_RETAIL.model} lease optional from $
        {estimate.perSeatHardware || 29}/seat/mo.
      </p>
    </div>
  );
}
