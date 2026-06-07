"use client";

import { useMemo, useState } from "react";
import {
  estimateMonthlyAud,
  type PricingTierId,
} from "@/lib/pricing";

const TIERS: { id: PricingTierId; label: string }[] = [
  { id: "pilot", label: "Pilot" },
  { id: "field", label: "Field" },
  { id: "crew", label: "Crew" },
];

export function PricingCalculator() {
  const [tier, setTier] = useState<PricingTierId>("field");
  const [seats, setSeats] = useState(6);
  const [extraModules, setExtraModules] = useState(0);

  const estimate = useMemo(
    () => estimateMonthlyAud(tier, seats, extraModules),
    [tier, seats, extraModules],
  );

  return (
    <div className="lp-pricing-calc">
      <h3 className="lp-pricing-calc-title">Estimate your monthly cost</h3>
      <p className="lp-pricing-calc-lede">Ex GST · illustrative · adjusts on demo call</p>

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
          Extra training modules / month
          <input
            type="number"
            min={0}
            max={50}
            value={extraModules}
            onChange={(e) => setExtraModules(Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <dl className="lp-pricing-calc-results">
        <div>
          <dt>Per seat</dt>
          <dd>${estimate.perSeat} / mo</dd>
        </div>
        <div>
          <dt>Seats subtotal</dt>
          <dd>${estimate.subtotal.toLocaleString("en-AU")} / mo</dd>
        </div>
        {estimate.modules > 0 && (
          <div>
            <dt>Extra modules</dt>
            <dd>${estimate.modules.toLocaleString("en-AU")} / mo</dd>
          </div>
        )}
        <div className="lp-pricing-calc-total">
          <dt>Estimated total</dt>
          <dd>${estimate.total.toLocaleString("en-AU")} / mo</dd>
        </div>
      </dl>
    </div>
  );
}
