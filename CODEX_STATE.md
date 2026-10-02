# CODEX_STATE

Status: in_progress
Goal: 固定URLとsplit-daily-v1を維持し、日別・SDV監査・週次の保存結果を正しく検証する。

## Done
- 最新mainのREADME、当日manifest/day/audit/week/stateと検証スクリプトを確認。
- 現行SDV監査のpendingCount省略を旧validatorが未完了と誤判定する問題を修正。
- 省略時はrawCandidatesの終端decision、candidate/adopted/excluded/duplicate件数を必須で照合する。明示pendingは従来どおり拒否。
- 6 funnelの名前重複を拒否。回帰2テストを作成し定期検証workflowへ追加。
- 2026-10-02 Tier1Semi duplicateCountをrawCandidatesの実際の0件へ整合 (他funnelの重複は変更なし)。

## Current
- 当日データ検証は重要1件/参考5件/6 funnelで成功。
- 日次収集は既存Daily Checkタスクの担当。司令塔用Automation以外のtaskは作成・変更していない。

## Next
- 日別へのdiscoveredLate混入、過去掲載eventKeyの再掲載、週次とD-6〜Dの日別和集合の不一致を検出する回帰検証を追加する。
- READMEの07:30 recovery taskが実際に存在するか、読取で確認して記述を整える。既存タスクは許可なく変更しない。
- collectionComplete/anomalyの条件を生候補・deep scan証跡と照合する。ニュース本文確認は既存収集タスクの証跡を使い捏造しない。

## Blockers
- 過去記事の本文・検索証跡は今回再収集していない。検証結果は保存データの構造と整合性の範囲。
- Git transport pushは401。GitHub REST非強制commit/ref更新でcheckpointを保存。

## Verification
- node --test scripts/audit-validation.test.mjs: 2/2 passed
- node scripts/verify-daily-data.mjs: Daily Check 2026-10-02 OK
- git diff --check: passed

Updated at: 2026-10-02T10:36:30.316500+00:00
