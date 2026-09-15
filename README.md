# Daily Check

毎日の監視結果を「重要更新」「参考情報」「監視状況」に分けて表示するモバイル向けダッシュボード

公開URL: https://daily-check-ui-masakasakasamas-projects.vercel.app/

## データ更新

毎日8:00の親スケジュールが `data/daily-checks.json` を更新します

- `alerts`: 通知条件を満たす重要更新
- `references`: 通知未満だが新規性のある参考情報
- `checks`: 監視ごとの実行結果

サイト本体はGitHub上の最新JSONを表示時に取得するため、日次データ更新で再デプロイは不要です
