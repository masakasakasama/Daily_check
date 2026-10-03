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

- collectionComplete/anomalyと6 funnelの検索・取得・候補decision/理由/件数を照合するvalidatorを日次CIに接続。明示pendingCount=0でも証跡省略を拒否。
- 候補8件未満、ゼロfunnel4以上、連続2暦日のSDV掲載ゼロを検出。実施済みDeep Scanは初回と重複しない追加12検索・URL/family/観測hit/取得成功を必須にした。
- 10/3のlate-audit-only候補をverified/discoveredLateと専用件数で検証。週次から欠けた10/3 AI参考記事1件を保存済み日別から補い、週次件数を整合。
- 読み取り専用collection履歴CLIを追加。現代形式9日中5日の未完了・件数不一致・証跡不足を検出、旧summaryは未認証のままスキップ。

## Current
- 10/3最新日次と週次検証は成功。過去収集の証跡を推測で補完していない。

## Next
- collection履歴の5日(9/25〜9/29)を分類し、保存rawCandidatesから確定できる件数だけ修復する。検索hit等の実証跡欠如・collection未完了は収集担当待ちとして記録する。
- 07:30 recovery task不足は既存収集担当の運用で解決が必要。司令塔Automation以外のtaskは変更しない。

## Blockers
- 過去Web本文と検索結果を再取得していない。9/26・9/27未完了、9/28検索証跡不足、9/29取得不完了、9/25件数不一致を完了扱いにしない。
- 07:30 recovery taskは未確認。追加の収集Automationは作成していない。

## Verification
- node --test scripts/*.test.mjs: 12/12 passed
- DAILY_CHECK_DATE=2026-10-03 node scripts/verify-daily-data.mjs: passed (6/6 funnels)
- node scripts/verify-publication-history.mjs: 20 saved days / 0 failures
- node scripts/verify-collection-history.mjs: expected exit 1; 9 modern audits / 5 evidence failures; legacy skipped, not certified
- git diff --check passed; no build/lint scripts in repository

Updated at: 2026-10-03T01:28:34.478137+00:00
