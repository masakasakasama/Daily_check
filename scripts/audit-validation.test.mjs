import test from "node:test";
import assert from "node:assert/strict";
import { validateFunnel } from "./audit-validation.mjs";
const funnel = { name: "OEM", candidateCount: 1, adoptedCount: 1, excludedCount: 0, duplicateCount: 0 };
const raw = [{ funnel: "OEM", decision: "adopted-reference" }];
test("current audit accepts missing pendingCount only with complete raw decisions", () => {
  assert.doesNotThrow(() => validateFunnel(funnel, raw));
  assert.throws(() => validateFunnel(funnel), /raw candidate evidence/);
  assert.throws(() => validateFunnel(funnel, [{ funnel: "OEM", decision: "pending" }]), /unresolved/);
  assert.throws(() => validateFunnel(funnel, []), /candidate count/);
});
test("summary drift and explicit pending work fail verification", () => {
  assert.throws(() => validateFunnel({ ...funnel, duplicateCount: 1 }, raw), /duplicateCount/);
  assert.throws(() => validateFunnel({ ...funnel, pendingCount: 1 }, raw), /pending candidates/);
  assert.doesNotThrow(() => validateFunnel({ name: "OEM", pendingCount: 0 }));
});
