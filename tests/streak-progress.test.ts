import assert from "node:assert/strict";
import { test } from "node:test";
import { computeStreaks } from "../lib/utils/streak";

test("a missed day keeps earned progress and remains a calendar gap", () => {
  const history = {
    "2026-11-01": { completed: true },
    "2026-11-02": { completed: true },
    "2026-11-03": { completed: false },
  };
  const beforeReturn = computeStreaks(history, [], "2026-11-10");
  assert.equal(beforeReturn.currentStreak, 2);
  const afterReturn = computeStreaks({ ...history, "2026-11-10": { completed: true } }, [], "2026-11-10");
  assert.equal(afterReturn.currentStreak, 3);
  assert.equal(afterReturn.bestStreak, 3);
  assert.deepEqual(afterReturn.completedDates, ["2026-11-01", "2026-11-02", "2026-11-10"]);
  assert.equal(history["2026-11-03"].completed, false);
});

test("merges legacy completions once and ignores future dates", () => {
  const result = computeStreaks({ "2026-11-01": { completed: true } }, ["2026-11-01", "2026-11-05", "2026-12-01"], "2026-11-15");
  assert.equal(result.currentStreak, 2);
  assert.deepEqual(result.completedDates, ["2026-11-01", "2026-11-05"]);
  assert.equal(computeStreaks(null, [], "2026-11-15").currentStreak, 0);
});
