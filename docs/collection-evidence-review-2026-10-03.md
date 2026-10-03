# Collection evidence review — 2026-10-03

Reviewed saved audits for 2026-09-25 through 2026-09-29. No search, source-page
retrieval, completion timestamp, candidate decision or completeness flag was
fabricated or replaced.

| Date | Deterministic repair | Remaining blocker |
| --- | --- | --- |
| 09-25 | Six omitted duplicateCount fields set to 0 from saved terminal rawCandidates | Legacy queryEvidence has query strings, URL lists and observed hits, but no per-query retrievalStatus in the current queries schema. deepScanPerformed is true without separate additional-query evidence. Do not infer missing statuses or distinguish first/second passes retroactively. |
| 09-26 | Six omitted duplicateCount fields set to 0 for the saved candidate set | collectionComplete=false, anomaly=true. sourcesChecked/searchesUsed contain generic labels instead of individual search observations. Additional Deep Scan evidence is absent. |
| 09-27 | Six omitted duplicateCount fields set to 0 for the saved candidate set | collectionComplete=false, anomaly=true. Generic source/search labels and missing additional Deep Scan observations cannot certify completion. |
| 09-28 | No count changes needed | A RegSecurity query is partial; the funnel is complete-with-fallback. Twelve additional queries are strings without per-query URL/hit/status observations. |
| 09-29 | No count changes needed | Legacy complete-with-fallback retrieval labels are not accepted by the current validator. Sixteen additional query objects omit observed rawHitCount. This is not proof retrieval failed; the evidence contract cannot certify it. |

The repair is restricted to duplicate counters in the three named audits. Saved
candidate identities must be unique, assigned to one of six funnels, and terminal.
candidateCount/adoptedCount/excludedCount must already reconcile; otherwise repair
refuses. All plans are checked before any write. Existing values or field absence
are retained in countCorrections with a hash of unchanged rawCandidates. The scope
is saved candidates, not the completeness of collection.

`node scripts/repair-audit-counts.mjs` plans; `--write` persists. First run repaired
18 fields. Repeating repaired 0 fields and added no correction entries. 14 tests,
the 2026-10-03 daily validator and 20-day publication history pass. Collection
history returns exit 1: 9 modern audits checked, 5 not certified; legacy summaries
remain skipped, not certified.

Next requires actual missing observations from the collection owner or an
explicitly reviewed legacy-evidence adapter where existing facts suffice. The
controller does not invent past search counts or create a separate recovery
automation. The 07:30 recovery task remains unconfirmed. Remaining work is blocked,
not completed.
