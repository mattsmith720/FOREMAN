import assert from "node:assert/strict";
import { test } from "node:test";
import type { CoachingResponse } from "@foreman/shared";
import { RUBRICS, aggregate, scoreScenario } from "./rubrics.js";

function coaching(partial: Partial<CoachingResponse>): CoachingResponse {
  return {
    observations: [],
    installQualityFlags: [],
    salesPitchFeedback: [],
    timeOnTaskNote: "",
    nextSteps: ["Continue the task and verify one detail."],
    visualCallouts: [],
    ...partial,
  };
}

function rubric(key: string) {
  const r = RUBRICS.find((x) => x.key === key);
  if (!r) throw new Error(`no rubric ${key}`);
  return r;
}

test("brevity: short spoken line passes, long fails, no cue is N/A", () => {
  const short = rubric("brevity").score(
    coaching({ spokenCue: { say: "Clip your harness on now.", severity: "critical", speak: true } }),
    {},
  );
  assert.equal(short?.pass, true);

  const long = rubric("brevity").score(
    coaching({
      spokenCue: {
        say: "You should really consider clipping your harness on before you move any further up the roof because it is unsafe",
        severity: "critical",
        speak: true,
      },
    }),
    {},
  );
  assert.equal(long?.pass, false);

  assert.equal(rubric("brevity").score(coaching({}), {}), null);
});

test("action_verb: imperative lead passes, passive fails, unspoken is N/A", () => {
  assert.equal(
    rubric("action_verb").score(
      coaching({ spokenCue: { say: "Secure that loose DC cable.", severity: "warning", speak: true } }),
      {},
    )?.pass,
    true,
  );
  assert.equal(
    rubric("action_verb").score(
      coaching({ spokenCue: { say: "There is a loose DC cable.", severity: "warning", speak: true } }),
      {},
    )?.pass,
    false,
  );
  // speak:false lines are not judged for phrasing
  assert.equal(
    rubric("action_verb").score(
      coaching({ spokenCue: { say: "There is a loose cable.", severity: "info", speak: false } }),
      {},
    ),
    null,
  );
});

test("australian_english: US spelling fails, AU passes", () => {
  assert.equal(
    rubric("australian_english").score(
      coaching({ nextSteps: ["Check the cable color."] }),
      {},
    )?.pass,
    false,
  );
  assert.equal(
    rubric("australian_english").score(
      coaching({ nextSteps: ["Check the cable colour."] }),
      {},
    )?.pass,
    true,
  );
});

test("no_firehose: speak gate must match expectation", () => {
  assert.equal(
    rubric("no_firehose").score(
      coaching({ spokenCue: { say: "Keep going.", severity: "info", speak: true } }),
      { speak: false },
    )?.pass,
    false,
  );
  assert.equal(
    rubric("no_firehose").score(coaching({}), { speak: false })?.pass,
    true,
  );
  assert.equal(rubric("no_firehose").score(coaching({}), {}), null);
});

test("safety_first: a critical flag must be the spoken line", () => {
  const buried = rubric("safety_first").score(
    coaching({
      installQualityFlags: [{ message: "Worker near edge with no harness", severity: "critical" }],
      spokenCue: { say: "Tidy the cables.", severity: "info", speak: true },
    }),
    { criticalSafety: true },
  );
  assert.equal(buried?.pass, false);

  const led = rubric("safety_first").score(
    coaching({
      installQualityFlags: [{ message: "Worker near edge with no harness", severity: "critical" }],
      spokenCue: { say: "Clip your harness on before moving.", severity: "critical", speak: true },
    }),
    { criticalSafety: true },
  );
  assert.equal(led?.pass, true);

  // no critical anywhere and none expected -> N/A
  assert.equal(rubric("safety_first").score(coaching({}), {}), null);
});

test("specificity: must name the issue, not generic filler", () => {
  assert.equal(
    rubric("specificity").score(
      coaching({ salesPitchFeedback: [{ message: "Lead with the savings on their bill.", severity: "info" }] }),
      { mustMention: ["savings", "bill"] },
    )?.pass,
    true,
  );
  // keyword present elsewhere but the spoken line is generic filler -> fail
  assert.equal(
    rubric("specificity").score(
      coaching({
        salesPitchFeedback: [{ message: "Mention savings.", severity: "info" }],
        spokenCue: { say: "Looks good, keep going.", severity: "info", speak: true },
      }),
      { mustMention: ["savings"] },
    )?.pass,
    false,
  );
  assert.equal(rubric("specificity").score(coaching({}), {}), null);
});

test("pitch_critique: feedback required when a conversation occurs", () => {
  assert.equal(
    rubric("pitch_critique").score(coaching({}), { pitchFeedback: true })?.pass,
    false,
  );
  assert.equal(
    rubric("pitch_critique").score(
      coaching({ salesPitchFeedback: [{ message: "Ask an open question.", severity: "info" }] }),
      { pitchFeedback: true },
    )?.pass,
    true,
  );
});

test("aggregate: computes per-rubric and overall rates", () => {
  const s1 = scoreScenario(
    "a",
    coaching({ spokenCue: { say: "Clip your harness on.", severity: "critical", speak: true } }),
    { speak: true },
  );
  const s2 = scoreScenario(
    "b",
    coaching({ spokenCue: { say: "There is a cable.", severity: "info", speak: true } }),
    { speak: true },
  );
  const { perRubric, overall } = aggregate([s1, s2]);
  const av = perRubric.find((r) => r.key === "action_verb");
  assert.equal(av?.applicable, 2);
  assert.equal(av?.passed, 1);
  assert.ok(overall.applicable > 0);
});
