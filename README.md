# Daily Check

毎日の監視結果を1ページで確認するダッシュボード

固定URL:
https://raw.githack.com/masakasakasama/Daily_check/main/index.html

## 更新方針

- 公開URLは変更しない
- 「今日 / 7日」は同一ページ内で切り替える
- 親スケジュールタスクが `data/days/`、`data/audits/`、`data/weeks/`、`data/index.json` を更新する
- サイトはGitHub上の最新JSONを表示時に取得するため、日次データ更新でURL変更は不要

## 更新の監視

- 主タスクは毎日07:00 JSTに日別・監査・週次・manifestを保存する
- 07:30 JSTの回復タスクは2026-10-02のAutomation読取では確認できない。作成・有効化済みとは扱わない
- 07:45 JSTのGitHub Actionsが保存済みデータの鮮度、6系統の完了、重複、pending状態を検証する
- 検証は `node scripts/verify-daily-data.mjs` でローカルからも実行できる。保存日を指定する場合は `DAILY_CHECK_DATE=YYYY-MM-DD` を設定する
- `node --test scripts/*.test.mjs` は監査件数、discoveredLate混入、過去eventKey再掲載、週次D-6〜Dの和集合・件数不一致を検証する
- validatorは当日掲載と週次整合を確認する。過去日の修復は収集証跡を確認してから行い、本文・完了証跡を推測で補わない

`node scripts/verify-publication-history.mjs` は保存済み全19日を読み取り専用で照合する。
2026-10-02に9/25・9/26・9/27・10/01の9件を監査候補と照合して掲載修復した。
元記事・元check・元採用判断をauditのpublicationCorrectionsとrawCandidatesに保持し、関連8週を再生成した。
`node scripts/repair-late-publication.mjs` は検証のみ、`--write` は全候補証跡と和集合を確認してから保存する。
