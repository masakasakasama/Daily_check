# Daily Check

毎日の監視結果とローリング7日サマリーを1ページで確認するモバイル向けダッシュボード

公開URL:
https://raw.githack.com/masakasakasama/Daily_check/7a6061c88c499e8387bb2cf6dfdee7b2d7a04ecc/index.html

7日サマリー:
https://raw.githack.com/masakasakasama/Daily_check/7a6061c88c499e8387bb2cf6dfdee7b2d7a04ecc/index.html?view=week

## 更新方法

親スケジュールタスクが `data/daily-checks.json` を更新します
日次は `days`、ローリング7日サマリーは `weeks` に保持します
サイト本体は固定し、表示時にGitHub上の最新JSONを取得します
