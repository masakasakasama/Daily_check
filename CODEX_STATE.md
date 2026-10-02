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

## Current
- 当日2026-10-02と週次の和集合検証は成功。履歴9/25・9/26・9/27・10/01はlate混入で不合格。

## Next
- 過去4日の日別discoveredLate混入を監査証跡と照合し、収集担当と競合しない状態で日別・関連週次を修復する。
- collectionComplete/anomalyとDeep Scanの必須条件・追加12検索の実証跡を照合するvalidatorを追加する。

## Blockers
- 履歴4日のlate混入が未修復。元の本文や収集証跡を今回再取得していないため、削除や記事内容の変更を推測で行わない。
- 07:30 recovery taskは現在のAutomation読取では存在を確認できない。自動復旧済みと扱わない。

## Verification
- node --test scripts/*.test.mjs: 4/4 passed
- DAILY_CHECK_DATE=2026-10-02 node scripts/verify-daily-data.mjs: passed, 6/6 funnels and exact weekly union
- node scripts/verify-publication-history.mjs: expected failure; 4/19 days require evidence review
- Automation read-only: confirmed 07:00 primary, no confirmed recovery; git diff --check passed

Updated at: 2026-10-02T18:05:03.732596+00:00
