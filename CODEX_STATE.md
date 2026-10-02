# CODEX_STATE

Status: in_progress
Goal: 固定URLとsplit-daily-v1を維持し、日別・SDV監査・週次の保存結果を正しく検証する。

## Done
- 最新mainのREADME、当日manifest/day/audit/week/stateと検証スクリプトを確認。
- 現行SDV監査のpendingCount省略を旧validatorが未完了と誤判定する問題を修正。
- 省略時はrawCandidatesの終端decision、candidate/adopted/excluded/duplicate件数を必須で照合する。明示pendingは従来どおり拒否。
- 6 funnelの名前重複を拒否。回帰2テストを作成し定期検証workflowへ追加。
- 2026-10-02 Tier1Semi duplicateCountをrawCandidatesの実際の0件へ整合 (他funnelの重複は変更なし)。

- 日別discoveredLate混入・過去eventKey再掲載・同日重複、週次D-6〜Dの完全和集合と件数を検証する回帰を追加。CIへ接続。
- Automation読取で07:00 Daily Checkを確認、07:30 recoveryは確認できずREADMEとworkflow注釈を修正。既存taskは変更していない。
- 読み取り専用履歴validatorで19日中4日にlate混入を検出。ニュースデータや収集証跡を推測で書き換えていない。

- 過去4日9件のdiscoveredLateをverifiedなrawCandidatesと一対一照合。元記事・元checkをaudit.publicationCorrectionsへ退避し日別掲載から除外、関連8週を日別から再生成。元採用判断・collectionComplete・収集時刻は保持。
- 修復は全候補証跡・全日別/週次検証後のみ保存するCLIと拒否/idempotency回帰を追加。全19日履歴validatorが正常になった。

## Current
- 9/25・9/26・9/27・10/01の日別/監査と関連8週を修復。本文再収集なし、元証跡保持。

## Next
- collectionComplete/anomalyとDeep Scanの必須条件・追加12検索の実証跡を照合するvalidatorを追加する。
- 07:30 recovery task不足は既存収集担当の運用で解決が必要。司令塔Automation以外のtaskは変更しない。

## Blockers
- ニュース本文を再取得していないため、検証は保存されたverified/late候補・掲載構造の整合性に限定。
- 07:30 recovery taskは未確認。Deep Scan必須条件のvalidatorは未完了。

## Verification
- node --test scripts/*.test.mjs: 6/6 passed
- repair CLI: 9 articles / 4 days / 16 data files validated, original evidence preserved
- publication history: 19 days / 0 failures
- DAILY_CHECK_DATE=2026-10-02 daily validator passed; git diff --check passed

Updated at: 2026-10-02T18:42:03.662439+00:00
