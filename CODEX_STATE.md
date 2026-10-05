# CODEX_STATE

Status: blocked
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

- 9/25〜9/29を分類。9/25旧queryEvidenceには具体検索/URL/hitがあるがquery単位status/追加passが不明、9/26・9/27は未完了、9/28・9/29はDeep Scan観測hit等の証跡不足を記録。
- 9/25〜9/27の省略duplicateCount18項目だけを保存terminal rawCandidatesから0へ補完。元の省略状態と候補hashをcountCorrectionsへ保持し、complete/anomaly/時刻/検索/採用/掲載は不変更。
- 曖昧ID/非終端/未知funnel/候補・採用・除外件数不一致で拒否する修復CLIと回帰を追加。全3日を検証後のみ保存し、再実行0変更。

- Brainの変更検知で最新a275469を再取得。10/4保存監査の除外件数2項目をraw/一覧/総数から修復し旧値・hashを保持。週次から欠けた10/3 AI参考1件を保存日別から補完。
- 実収集形式deepScan.queriesを既存と同じ厳格条件で検証し、競合schema・hit欠如・未成功・重複・12件不足を拒否する回帰を追加。

- 10/5週次の参考記事欠落1件を保存済み10/3日別記事と完全一致で補完。記事本文/日別/監査/完了フラグ/収集時刻は変更していない。

## Current
- 2026-10-05の外部日次更新ba75f45を確認。週次から欠けた10/3 AI参考1件を保存日別からそのまま補完しreference件数26→27へ整合。当日validator成功、全22日publication検証正常。
- collection履歴は11近代監査中、従来の9/25〜9/29の5件のみ証跡不足。07:30 recoveryは最新Automation読取でも見つからず、既存07:00 Daily Checkと司令塔1個は有効。Automation変更なし。
- 最新dc12d8aはindex.htmlの不正なリテラル改行の修正だけ。inline JS 1件の構文検証に合格。監査証跡への変更はなく、07:30 recoveryも現在のAutomation読取では確認できない。
- 10/4の最新収集形式・確定counter・週次欠落を修復し当日validatorが正常。残る9/25〜9/29の5監査と07:30 recovery確認は外部証跡待ち。

## Next
- 収集担当が実際の追加検索URL・観測hit・検索単位取得statusを保存し、9/26・9/27の未完了を解決したらcollection validatorを再実行する。既存旧証跡のadapterは契約を確認してから実装し、欠如した観測を推測しない。
- 既存収集担当が07:30 recovery taskの有効な設定を確認する。司令塔以外のAutomationは追加しない。

## Blockers
- 過去Web/検索結果の実観測が不足。9/25旧queryEvidenceから不足status/追加passを断定できず、9/28・9/29のDeep Scan観測hit等もない。legacy fallbackラベルを取得失敗とは断定しない。
- 9/26・9/27はcollectionComplete=false/anomaly=trueのまま。07:30 recovery taskは未確認。完了扱いにしない。

## Verification
- DAILY_CHECK_DATE=2026-10-05 daily validator passed; publication history22 days/0 failures
- collection history11 modern audits/5 historical evidence failures; 10/5 passed, missing past observations not invented
- read-only Automation probe: enabled07:00 Daily Check; 07:30 recovery not found; controller Automation count1; no task edits
- git diff --check passed; data-only weekly correction, no app/validator changes or redundant unit/build reruns
- Latest dc12d8a: index.html-only diff; inline JavaScript node --check 1/1 passed. Collection code/data unchanged; existing test results retained without rerun.
- node --test scripts/*.test.mjs: 16/16 passed
- DAILY_CHECK_DATE=2026-10-04 daily validator passed; publication history 21 days / 0 failures
- collection history: 10 modern audits / 5 historical evidence failures (expected exit 1); 10/4 now passed
- Saved raw candidates/decisions/queries/collection flags/timestamps unchanged; two prior counters retained in countCorrections
- Latest worker head checked before publication; controller GitHub lease acquired
- git diff --check passed; no build/lint scripts

Updated at: 2026-10-05T01:15:47.932376+00:00
