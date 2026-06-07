"use client";

import { useMemo, useState } from "react";

const FOREMAN_SEAT_MONTHLY_AUD = 149;

export function RoiCalculator() {
  const [jobsPerWeek, setJobsPerWeek] = useState(12);
  const [rebateAtRisk, setRebateAtRisk] = useState(4200);
  const [failureRatePct, setFailureRatePct] = useState(8);
  const [callbackCost, setCallbackCost] = useState(650);

  const model = useMemo(() => {
    const jobsPerYear = jobsPerWeek * 52;
    const failedJobs = jobsPerYear * (failureRatePct / 100);
    const annualExposure =
      failedJobs * (rebateAtRisk + callbackCost);
    const foremanAnnual = FOREMAN_SEAT_MONTHLY_AUD * 12;
    const netBenefit = annualExposure - foremanAnnual;
    return {
      jobsPerYear,
      failedJobs: Math.round(failedJobs),
      annualExposure: Math.round(annualExposure),
      foremanAnnual,
      netBenefit: Math.round(netBenefit),
    };
  }, [callbackCost, failureRatePct, jobsPerWeek, rebateAtRisk]);

  return (
    <section className="roi-calculator" aria-labelledby="roi-title">
      <h2 id="roi-title" className="marketing-section-title">
        What failed compliance costs
      </h2>
      <p className="roi-intro">
        Tune the inputs for your crew. Numbers are illustrative — adjust rebate-at-risk and
        callback cost to match your retailer contract.
      </p>
      <div className="roi-grid">
        <label className="roi-field">
          <span>Jobs per week</span>
          <input
            type="number"
            min={1}
            max={200}
            value={jobsPerWeek}
            onChange={(e) => setJobsPerWeek(Number(e.target.value) || 1)}
          />
        </label>
        <label className="roi-field">
          <span>STC rebate at risk per failed job (AUD)</span>
          <input
            type="number"
            min={0}
            step={100}
            value={rebateAtRisk}
            onChange={(e) => setRebateAtRisk(Number(e.target.value) || 0)}
          />
        </label>
        <label className="roi-field">
          <span>Failure / rework rate (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={failureRatePct}
            onChange={(e) => setFailureRatePct(Number(e.target.value) || 0)}
          />
        </label>
        <label className="roi-field">
          <span>Average callback cost (AUD)</span>
          <input
            type="number"
            min={0}
            step={50}
            value={callbackCost}
            onChange={(e) => setCallbackCost(Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <dl className="roi-results">
        <div>
          <dt>Estimated annual exposure</dt>
          <dd>${model.annualExposure.toLocaleString("en-AU")}</dd>
        </div>
        <div>
          <dt>Foreman per-seat (illustrative)</dt>
          <dd>${model.foremanAnnual.toLocaleString("en-AU")}/yr</dd>
        </div>
        <div className="roi-highlight">
          <dt>Net upside vs one seat</dt>
          <dd>${model.netBenefit.toLocaleString("en-AU")}/yr</dd>
        </div>
      </dl>
      <p className="roi-footnote">
        Assumes ~{model.failedJobs} jobs/year need rework at your failure rate. Pilot pricing
        not final — book a demo to model your fleet.
      </p>
    </section>
  );
}
