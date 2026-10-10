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

`node scripts/verify-publication-history.mjs` は保存済み全日を読み取り専用で照合する。
2026-10-02に9/25・9/26・9/27・10/01の9件を監査候補と照合して掲載修復した。
元記事・元check・元採用判断をauditのpublicationCorrectionsとrawCandidatesに保持し、関連8週を再生成した。
`node scripts/repair-late-publication.mjs` は検証のみ、`--write` は全候補証跡と和集合を確認してから保存する。


## 収集完了・Deep Scanの証跡検証

日次validatorは `collectionComplete=true` / `anomaly=false` と、6 funnelの
検索文字列・URL・sourceFamily・非負整数のrawHitCount・取得成功、raw候補の
終端decision・理由・件数を照合する。`pendingCount=0`だけでは通過しない。
`late-audit-only`はverified/discoveredLateと専用件数を必須とし、日別掲載に数えない。

候補8件未満、ゼロ候補funnelが4個以上（全6個ゼロを含む）、またはSDV掲載が
連続する2暦日ともゼロならDeep Scanを必須とする。前日のデータがなければ
判定を通さない。実施済みの場合は `deepScanQueries` に追加12件以上の検索を
オブジェクト形式で保存する。各項目は `query`, `sourceUrl`, `sourceFamily`,
`rawHitCount`, `retrievalStatus` が必要で、最初の検索・同一検索の重複は拒否する。
ゼロ候補funnelでは2系統以上の検索familyを必要とする。

`node scripts/verify-collection-history.mjs` は近代形式の保存監査を読み取り専用で
検査し、不一致があれば終了コード1を返す。旧summary形式はスキップし、検証済み
とは表示しない。2026-10-03時点では9監査中5日に不足/未完了/不一致がある。
保存証跡の構造を検証するもので、過去のWeb取得の真偽を証明するものではない。
収集時刻・完了フラグ・検索結果を推測で補完しない。


2026-10-03に9/25〜9/29の監査不足を分類した。詳細は
[collection evidence review](docs/collection-evidence-review-2026-10-03.md)。
9/25〜9/27の省略duplicateCount計18項目だけを保存済みrawCandidatesから0へ補い、
元の省略状態と候補hashをcountCorrectionsへ保存。完了フラグ・時刻・検索証跡は保持。
`node scripts/repair-audit-counts.mjs`はdry run、`--write`は明示3日分の証跡を全検証後に保存。
再実行は変更0件。当時の5日の検証不足は、下記10月10日の実再収集で解決した。元の未完了記録は保存している。

2026-10-04形式の`deepScan.queries`も、従来の`deepScanQueries`と同じ必須項目・
12追加検索・取得成功・重複禁止で検証する。両方ある場合の不一致は拒否する。
10/4監査のOEM/Platform除外件数2項目を保存raw候補・総数・除外一覧と照合して修復し、
旧値と候補hashをcountCorrectionsへ保持。週次に欠けた10/3 AI参考1件を日別から補完。


## 2026-10-10の復旧

- 10/8〜10/10の収集欠落を実検索・公式本文確認で復旧。重要6件・参考8件を日別に保存し、公開日時をJSTへ統一した。CLI 0.162.0/0.162.1はGitHub公式公開時刻から10/9・10/10へ分類。
- 9/25〜9/29の不足監査も現在の実検索18本・追加12本で再実行。Bosch/Owasysは公式9/25発表、dSPACE取材は9/26として欠落記事2件を復元。
- `data/recovery/`に元の失敗記録、検索結果のURL・実観測件数・日時、取得失敗と代替本文確認を保存。過去日の実行を成功だったと偽るものではない。`recovery`で実際の再収集日時を画面にも表示する。
- `verified-historical-recovery`の遅延記事だけは元の公開日へ復元可能。公開日・照合する本文証跡・実発見日時が不一致ならvalidatorは拒否する。通常の当日掲載では遅延混入・過去イベント再掲載を引き続き拒否。
- 10/6・10/7のsource.url/bodyVerified形式を厳格adapterで検証。相反する二重schemaは拒否する。保存された終端decisionから件数を照合し、元の不一致値をcountCorrectionsへ保持。
- 更新push時にもUI構文・回帰・日次データをActionsで検証する。7日表示は選択日で終わる保存済み週次を優先する。
- 既存07:00 JST Automationを同じ1個のまま再登録し、欠落日の回収、実検索証跡、保存後再取得、固定URLの実表示確認を追加。未来の自動実行の成功を保証したという意味ではない。
- 検証: 回帰19件成功、日次10/10正常、掲載履歴27日/0件不整合、近代監査16日/0件不整合、完全な週次21期間/0件不整合。旧summaryは過去実観測を認証しない。

- 元の固定URLで最新コードの実表示を確認済み。日付移動、全23週の集計、4/4監視、欠落日表示、スマホ390px幅を実ブラウザで確認。GitHub Actions run 38022108313成功。確認記録は `data/recovery/2026-10-10-verification.json`。
- `node scripts/sync-fallback-data.mjs`で代替JSONを同期し、`--check`でsplit記録との完全一致を確認する。毎回の保存前に実行する。画面はcommits/main APIの最新SHAを使用し、manifest・日別・週次を同一の不変版から読む。
