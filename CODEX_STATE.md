# CODEX_STATE

Status: completed; GitHub persistence and original fixed URL verified
Goal: ユーザー指定の固定URLで表示・欠落収集・履歴不整合を解決する。

2026-10-10 recovery:
- Oct 8–10: official body-verified articles restored (4+5, 2+2, 0+1 important/reference). GitHub CLI UTC timestamps classified by JST day.
- Sep 25–29: actual retrospective 18 first-pass and 12 Deep Scan searches; old evidence preserved in data/recovery, two omitted body-verified SDV references recovered.
- Oct 6–7: strict nested source/body-verification schema adapter; counters reconciled against terminal candidates with original values preserved.
- All 27 daily publications and affected weekly unions validate; all 16 modern collection audits validate. Legacy summary audits are explicitly not certified.
- UI: recovered observation timestamp visible, selected-day weekly summary corrected, missing-day notices cleared. Independent error handler plus push CI syntax check protects against the earlier parse failure.
- Existing 07:00 JST daily Automation re-registered and prompt updated with gap detection and verification requirements; no duplicate daily task created. Future execution not yet observable.

Verification:
- node --test scripts/*.test.mjs: 19/19 passed
- node scripts/verify-ui.mjs: 2 scripts parse successfully
- DAILY_CHECK_DATE=2026-10-10 node scripts/verify-daily-data.mjs: passed with all four required monitors
- node scripts/verify-publication-history.mjs: 27 days / 0 failures
- node scripts/verify-collection-history.mjs: 16 modern audits / 0 failures
- git diff --check: passed

Publication verified at 2026-10-10T03:55:34.420765+00:00:
- Content commit 22bae74194498d389f957b60445207cf97f5dac8; 60 changed files fetched back and byte-matched.
- GitHub Actions run 38022108313: success; regressions, UI syntax, fallback equality, daily/publication/collection/weekly history passed.
- Original fixed URL serves latest code and data. Real Chromium session, no fetch mocking: Oct 8/9/10 = 4+5 / 2+2 / 0+1 articles, monitors 4/4; selected-day weeks correct.
- All 23 saved weeks load; September 25 archived week accessible. 21 complete weekly unions passed, 2 earliest partial windows not certified.
- Mobile width 390: no horizontal overflow; future missing day clearly shown and stale recovery notice hidden.
- Immutable revision loading prevents stale branch JSON mixing; data/daily-checks.json fallback is synchronized from all saved split days/weeks.
- Verification detail: data/recovery/2026-10-10-verification.json.

Next: Existing daily task performs the next scheduled run. Do not claim an unobserved future run succeeded.
