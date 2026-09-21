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
- 07:30 JSTの回復タスクが当日分を再検証し、欠損時は復旧する
- 07:45 JSTのGitHub Actionsが保存済みデータの鮮度、6系統の完了、重複、pending状態を検証する
- 検証は `node scripts/verify-daily-data.mjs` でローカルからも実行できる
