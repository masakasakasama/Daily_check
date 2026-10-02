export function validateFunnel(funnel, rawCandidates) {
  const fail = message => { throw new Error(`${funnel.name}: ${message}`); };
  if (funnel.pendingCount !== undefined && funnel.pendingCount !== 0) fail("pending candidates");
  // Current audits persist terminal decisions rather than the older pendingCount field.
  if (funnel.pendingCount === undefined) {
    if (!Array.isArray(rawCandidates)) fail("raw candidate evidence required when pendingCount is absent");
    const candidates = rawCandidates.filter(item => item.funnel === funnel.name);
    if (!Number.isInteger(funnel.candidateCount) || candidates.length !== funnel.candidateCount) fail("candidate count does not match raw evidence");
    const terminal = new Set(["adopted-important", "adopted-reference", "excluded", "duplicate"]);
    if (candidates.some(item => !terminal.has(item.decision))) fail("candidate decision is unresolved");
    const counts = {
      adoptedCount: candidates.filter(item => item.decision.startsWith("adopted-")).length,
      excludedCount: candidates.filter(item => item.decision === "excluded").length,
      duplicateCount: candidates.filter(item => item.decision === "duplicate").length,
    };
    for (const [key, value] of Object.entries(counts)) {
      if (funnel[key] !== value) fail(`${key} does not match raw evidence`);
    }
  }
}
