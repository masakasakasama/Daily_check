# CODEX_STATE

Status: recovery validated locally; publication verification pending
Goal: ユーザー指定の固定URLで表示・欠落収集・履歴不整合を解決する。

2026-10-10 recovery:
- Oct 8–10: official body-verified articles restored (4+5, 2+2, 0+1 important/reference). GitHub CLI UTC timestamps classified by JST day.
- Sep 25–29: actual retrospective 18 first-pass and 12 Deep Scan searches; old evidence preserved in data/recovery, two omitted body-verified SDV references recovered.
- Oct 6–7: strict nested source/body-verification schema adapter; counters reconciled against terminal candidates with original values preserved.
- All 27 daily publications and affected weekly unions validate; all 16 modern collection audits validate. Legacy summary audits are explicitly not certified.
- UI: recovered observation timestamp visible, selected-day weekly summary corrected, missing-day notices cleared. Independent error handler plus push CI syntax check protects against the earlier parse failure.
- Existing 07:00 JST daily Automation re-registered and prompt updated with gap detection and verification requirements; no duplicate daily task created. Future execution not yet observable.

Verification:
- node --test scripts/*.test.mjs: 18/18 passed
- node scripts/verify-ui.mjs: pass (rerun after independent guard addition)
- DAILY_CHECK_DATE=2026-10-10 node scripts/verify-daily-data.mjs: pass (rerun after four-monitor requirement addition)
- node scripts/verify-publication-history.mjs: 27 days / 0 failures
- node scripts/verify-collection-history.mjs: 16 modern audits / 0 failures
- git diff --check: passed

Next: publish atomically, re-fetch exact GitHub content, purge fixed HTML CDN, verify real production day/week navigation and CI. Record results before reporting completion.
