# AuditClaw - 実装計画

## 概要

OpenClawのセキュリティ改善のためのリポジトリ。
claude-article-generatorのスキル体系を参考に、以下の2軸で構築する：

1. **攻撃テスト**: OpenClawボットに対する仮想攻撃テストケースの作成・実行
2. **ナレッジ蓄積**: 脆弱性事例・セキュリティベストプラクティスの調査・整理

---

## ディレクトリ構成

```
auditclaw/
├── .claude/
│   ├── commands/                    # スラッシュコマンド
│   │   ├── research-vuln.md         # 脆弱性事例の調査
│   │   ├── research-updates.md      # バージョンアップデート情報調査
│   │   ├── research-bestpractice.md # ベストプラクティス調査
│   │   ├── create-testcase.md       # 攻撃テストケース作成
│   │   ├── run-test.md              # テストケース実行
│   │   └── generate-report.md       # レポート生成
│   ├── skills/
│   │   ├── common/
│   │   │   ├── security_rules.md    # セキュリティ調査の共通ルール
│   │   │   └── output_format.md     # 出力フォーマット統一ルール
│   │   ├── vuln_research/
│   │   │   └── skill.md             # 脆弱性事例調査スキル
│   │   ├── update_watch/
│   │   │   └── skill.md             # バージョンアップデート監視スキル
│   │   ├── bestpractice_research/
│   │   │   └── skill.md             # ベストプラクティス調査スキル
│   │   ├── attack_test/
│   │   │   └── skill.md             # 攻撃テスト設計スキル
│   │   └── web_search/
│   │       └── skill.md             # Web検索スキル（Brave Search）
│   └── settings.local.json
├── knowledge/                        # ナレッジベース（調査結果の蓄積）
│   ├── vulnerabilities/              # 脆弱性事例
│   │   ├── prompt-injection/         # プロンプトインジェクション関連
│   │   ├── sandbox-escape/           # サンドボックスエスケープ
│   │   ├── dependency/               # 依存関係の脆弱性
│   │   ├── auth-bypass/              # 認証バイパス
│   │   └── data-leakage/             # データ漏洩
│   ├── updates/                      # バージョンアップデート情報
│   ├── best-practices/               # ベストプラクティス
│   └── index.md                      # ナレッジインデックス
├── tests/                            # 攻撃テストケース
│   ├── prompt-injection/             # プロンプトインジェクションテスト
│   ├── sandbox-escape/               # サンドボックスエスケープテスト
│   ├── skill-abuse/                  # スキルシステム悪用テスト
│   ├── channel-spoofing/             # チャンネルなりすましテスト
│   ├── secret-leakage/               # シークレット漏洩テスト
│   ├── agent-hijack/                 # Agent通信乗っ取りテスト
│   └── templates/                    # テストケーステンプレート
│       └── test-template.md
├── reports/                          # 検証レポート
├── scripts/                          # ユーティリティスクリプト
├── CLAUDE.md                         # プロジェクト規約
├── research.md                       # 調査結果
├── plan.md                           # 実装計画（本ファイル）
├── package.json
├── .env                              # APIキー（.gitignore対象）
├── .gitignore
└── README.md
```

---

## 実装ステップ

### Phase 1: プロジェクト基盤（今回実装）

- [x] Git初期化 & .gitignore作成
- [x] package.json作成
- [x] CLAUDE.md作成（プロジェクト規約・コマンド一覧）
- [x] ディレクトリ構成の作成
- [x] GitBook構成（book.json, docs/, SUMMARY.md）

### Phase 2: 調査スキル構築

- [x] common/security_rules.md - セキュリティ調査の共通ルール
- [x] common/output_format.md - 出力フォーマット統一ルール
- [x] web_search/skill.md - Web検索スキル
- [x] vuln_research/skill.md - 脆弱性事例調査スキル
- [x] update_watch/skill.md - バージョンアップデート監視スキル
- [x] bestpractice_research/skill.md - ベストプラクティス調査スキル

### Phase 3: 攻撃テストスキル構築

- [x] attack_test/skill.md - 攻撃テスト設計スキル
- [x] tests/templates/test-template.md - テストケーステンプレート

### Phase 4: コマンド構築

- [x] /research-vuln - 脆弱性事例調査コマンド
- [x] /research-updates - アップデート情報調査コマンド
- [x] /research-bestpractice - ベストプラクティス調査コマンド
- [x] /create-testcase - 攻撃テストケース作成コマンド
- [x] /run-test - テスト実行コマンド
- [x] /generate-report - レポート生成コマンド

### Phase 5: ナレッジベース初期構築

- [x] knowledge/index.md - ナレッジインデックス
- [x] 初回の脆弱性調査を実行してサンプルナレッジを蓄積

---

## スキル設計の詳細

### vuln_research/skill.md（脆弱性事例調査）

```
Phase 1: キーワード検索（CVE、GitHub Advisory、NVD、OWASP）
Phase 2: 公式情報の確認（WebFetchでソース取得）
Phase 3: OpenClawへの影響度分析
Phase 4: 構造化レポート生成
Phase 5: knowledge/ に保存
```

### update_watch/skill.md（バージョンアップデート監視）

```
Phase 1: OpenClaw公式リリースノート確認
Phase 2: 依存パッケージのセキュリティアドバイザリ確認
Phase 3: Breaking Changesとセキュリティ修正の抽出
Phase 4: 影響度評価レポート生成
Phase 5: knowledge/updates/ に保存
```

### bestpractice_research/skill.md（ベストプラクティス調査）

```
Phase 1: OWASP、NIST、CIS等の最新ガイドライン検索
Phase 2: LLM/AIアプリ特有のセキュリティガイドライン検索
Phase 3: OpenClawの現状との比較分析
Phase 4: 推奨事項レポート生成
Phase 5: knowledge/best-practices/ に保存
```

### attack_test/skill.md（攻撃テスト設計）

```
Phase 1: 攻撃カテゴリ選択 & 既知手法のリサーチ
Phase 2: OpenClawの該当コード/設定の確認
Phase 3: テストケース設計（入力・期待結果・判定基準）
Phase 4: テストケースファイル生成
Phase 5: tests/{category}/ に保存
```

---

## コマンド設計の詳細

### /research-vuln

```
引数: [カテゴリ] [オプション]
  カテゴリ: prompt-injection | sandbox-escape | dependency | auth-bypass | data-leakage | all
  --deep: 詳細調査モード（subagentで並列実行）
  --period: 調査期間（1w/1m/3m/1y）
  --source: 情報源指定（cve/github/owasp/all）

出力: knowledge/vulnerabilities/{category}/{YYYY-MM-DD}-{slug}.md
```

### /research-updates

```
引数: [対象] [オプション]
  対象: openclaw | dependencies | all
  --version: 特定バージョン指定
  --security-only: セキュリティ関連のみ

出力: knowledge/updates/{YYYY-MM-DD}-{target}.md
```

### /research-bestpractice

```
引数: [トピック] [オプション]
  トピック: llm-security | api-security | auth | sandbox | secrets | all
  --framework: フレームワーク指定（owasp/nist/cis）
  --compare: OpenClawの現状と比較

出力: knowledge/best-practices/{YYYY-MM-DD}-{topic}.md
```

### /create-testcase

```
引数: [攻撃カテゴリ] [オプション]
  カテゴリ: prompt-injection | sandbox-escape | skill-abuse | channel-spoofing | secret-leakage | agent-hijack
  --severity: 重要度（critical/high/medium/low）
  --ref: 参考となる脆弱性事例のパス

出力: tests/{category}/{YYYY-MM-DD}-{slug}.md
```

### /run-test

```
引数: [テストケースパス or カテゴリ]
  --dry-run: 実行せずに手順だけ表示
  --target: テスト対象の環境指定

出力: reports/{YYYY-MM-DD}-{test-name}.md
```

### /generate-report

```
引数: [レポート種別]
  種別: vulnerability-summary | test-results | security-posture
  --period: 対象期間
  --format: md | html

出力: reports/{YYYY-MM-DD}-{type}.md
```

---

## natsukiへの質問・確認事項

1. この構成で方向性は合っていますか？
2. 優先度が高い攻撃カテゴリはどれですか？（プロンプトインジェクションが最優先？）
3. OpenClawの本体リポジトリをクローンしてコード解析も行いますか？
4. Brave Search API等のAPIキーは既に準備済みですか？
