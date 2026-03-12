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

---

## Phase 6: セキュリティナレッジ最新化（2026-03-11 Deep Research結果に基づく）

> 根拠: research.md セクション7「Deep Research: 最新セキュリティ状況と不足分析」
> 目的: 2週間分のギャップ（35件の新アドバイザリ + 4リリース）を埋め、未着手カテゴリを整備

### 6-1. vulnerability-db.json 更新 [Critical]

- [x] metadata 更新
  - `lastUpdated`: "2026-03-03" → "2026-03-11"
  - `entryCount`: 30 → 65
  - `latestOpenClawVersion`: "2026.2.26" → "2026.3.8"
- [x] 35件の新アドバイザリを `vulnerabilities` 配列に追加
  - High 8件: GHSA-rchv, GHSA-6mgf, GHSA-8mvx, GHSA-474h, GHSA-jr6x, GHSA-q399, GHSA-p7gr, GHSA-6f6j
  - Medium 27件: 全件追加
- [x] 新カテゴリの導入
  - "TOCTOU" (3件: GHSA-7xmq, GHSA-x82f, GHSA-r54r)
  - "DoS" (4件: GHSA-6rmx, GHSA-wr6m, GHSA-x4vp, GHSA-77hf)
  - "Privilege Escalation" (2件: GHSA-jr6x, GHSA-hfpr)
  - "ACP Sandbox Bypass" (2件: GHSA-474h, GHSA-9q36)
- [x] 新ランタイムチェック5件追加 (RC-015 ~ RC-019)
  - RC-015: ACP dispatch設定の安全性
  - RC-016: system.run承認バインディング堅牢性
  - RC-017: DNS pinning有効性（プロキシ環境）
  - RC-018: Gateway認証情報UI漏洩（localStorage/URL）
  - RC-019: sessions_spawnサンドボックス継承
- [x] 新 permanentWarning 追加
  - PW-006: system.run承認バイパスが最大の攻撃面（累計28件以上）
  - PW-007: TOCTOU攻撃によるサンドボックスバイパスリスク

### 6-2. ナレッジ記事作成 [Critical → High]

#### Critical（即時）

- [x] `knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md`
  - system.run / exec allowlist バイパス手法の体系的分類（累計28件以上）
  - 攻撃カテゴリ: 承認バインディング不備、ラッパー深度スキップ、PowerShellエンコード、env override、PATHトークン差し替え、allow-always永続化
  - 対応する全GHSAのマッピング
- [x] `knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md`
  - TOCTOU (Time-of-Check to Time-of-Use) による新しいサンドボックスバイパスパターン
  - シンボリックリンクレース（GHSA-7xmq, GHSA-x82f）
  - ZIP展開レース（GHSA-r54r）
  - writeFileWithinRoot のレースコンディション

#### High（1週間以内）

- [x] `knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md`
  - ACP sessions_spawn のサンドボックス継承不備
  - マルチエージェント環境における新たな攻撃面
  - GHSA-474h, GHSA-p7gr, GHSA-9q36 の分析
- [x] `knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md`
  - チャンネル別認証バイパスの体系化
  - MS Teams, Discord, Slack, browser control等の共通パターン
- [x] `knowledge/best-practices/2026-03-12-owasp-llm-top10-mapping.md`
  - OWASP LLM Top 10 (2025版) と AuditClaw のカバレッジマッピング
  - 各項目の対応状況と推奨アクション

### 6-3. テストスイート作成 [High → Medium]

各テストスイートは `tests/prompt-injection/README.md` の3部構成（ベクター → テクニック → CI/CD）を踏襲。

#### High（1週間以内）

- [x] **sandbox-escape テストスイート** (12件) ✅ 完了
  - [x] `tests/sandbox-escape/README.md` 作成
  - [x] Part 1 ベクター別 (4件): シンボリックリンク, ハードリンク, Docker bind mount, ACP継承
  - [x] Part 2 テクニック別 (6件): TOCTOU, /proc/sys リーク, 環境変数上書き, tmpdir脱出, chroot回避, FDリーク
  - [x] Part 3 CI/CD連携 (2件): CI環境サンドボックス無効化, プラグインインストール時パストラバーサル
- [x] **agent-hijack テストスイート** (12件) ✅ 完了
  - [x] `tests/agent-hijack/README.md` 作成
  - [x] Part 1 ベクター別 (5件): WebSocket RCE, gatewayUrl token窃取, heredoc injection, systemd newline injection, Gateway Node Invoke bypass
  - [x] Part 2 テクニック別 (5件): Docker PATH injection, sshNodeCommand injection, macOS Keychain injection, SSRF IPv6, CWD prompt injection
  - [x] Part 3 マルチエージェント (2件): ACP resource_link PI, agent間なりすまし

#### Medium（2週間以内）

- [x] **skill-abuse テストスイート** (10件)
  - [x] `tests/skill-abuse/README.md` 作成
  - [ ] exec allowlist バイパス系 (4件): GNU long option, env -S, PowerShell encoded, wrapper depth
  - [ ] スキルサプライチェーン系 (4件): Unicode隠蔽, SKILL.md改竄, 外部URL取得, 権限昇格チェーン
  - [ ] 承認バインディング系 (2件): system.run ID mismatch, PATH token rebind
- [x] **channel-spoofing テストスイート** (12件)
  - [x] `tests/channel-spoofing/README.md` 作成
  - [ ] webhook/token系 (3件): Telegram secret未検証, webhook署名偽装, Gateway認証なし接続
  - [ ] 認証バイパス系 (5件): Canvas, browser bridge, Slack callback, voice-call allowlist, CSRF loopback
  - [ ] allowlist/ポリシー系 (4件): DM brute-force, Node metadata spoofing, sender check skip, 入力サニタイズ
- [x] **secret-leakage テストスイート** (10件)
  - [x] `tests/secret-leakage/README.md` 作成
  - [ ] ファイル読み取り系 (4件): browser upload path traversal, Zip Slip, $include directive, plugin install path traversal
  - [ ] 情報漏洩系 (4件): 環境変数漏洩, ログ混入, API応答漏洩, Gateway UI localStorage漏洩
  - [ ] サイドチャネル系 (2件): DNS exfiltration, 設定ファイル平文保存

### 6-4. ドキュメント拡充 [Medium]

- [ ] **脆弱性ドキュメント** (docs/en/ + docs/ja/)
  - `vulnerabilities/rce.md` — RCE脆弱性まとめ (5+1件)
  - `vulnerabilities/command-injection.md` — コマンドインジェクション (4件)
  - `vulnerabilities/exec-bypass.md` — exec allowlistバイパス (28件以上)
  - `vulnerabilities/ssrf.md` — SSRF (4件)
  - `vulnerabilities/path-traversal.md` — パストラバーサル (7件)
  - `vulnerabilities/toctou.md` — TOCTOU攻撃 (3件, 新カテゴリ)
  - `vulnerabilities/dos.md` — DoS攻撃 (3件, 新カテゴリ)
  - `vulnerabilities/acp-security.md` — ACPセキュリティ (新カテゴリ)
- [ ] **ベストプラクティス** (docs/en/ + docs/ja/)
  - `best-practices/hardening-guide.md` — OpenClawハードニングガイド
  - `best-practices/owasp-llm-mapping.md` — OWASP LLM Top 10対応マッピング
  - `best-practices/channel-security.md` — チャンネル別セキュリティ設定ガイド
- [ ] **テストガイド** (docs/en/ + docs/ja/)
  - `test-cases/sandbox-escape-guide.md`
  - `test-cases/agent-hijack-guide.md`
  - `test-cases/skill-abuse-guide.md`
  - `test-cases/channel-spoofing-guide.md`
  - `test-cases/secret-leakage-guide.md`
- [ ] **アップデート情報**
  - `updates/v2026.3.x-changelog.md` — v2026.3.1~3.8の変更点まとめ
  - `updates/breaking-changes-guide.md` — BREAKING CHANGESガイド

### 6-5. バージョンマップ更新 [Low]

- [ ] `knowledge/updates/version-vulnerability-map.md` 更新
  - v2026.3.1 ~ v2026.3.8 セクション追加
  - 危険度マトリクス更新
  - 未修正アドバイザリリストの更新
- [ ] `knowledge/index.md` 更新
  - 新規ナレッジ記事のインデックス追加

### 6-6. SUMMARY.md 更新 [Low]

- [ ] `docs/en/SUMMARY.md` — 新ページのリンク追加
- [ ] `docs/ja/SUMMARY.md` — 新ページのリンク追加

---

## 工数見積もり

| Phase | タスク数 | 推定規模 |
|-------|---------|---------|
| 6-1 | 4タスク | DB更新（機械的だが量が多い） |
| 6-2 | 5記事 | ナレッジ記事（調査済みデータの整形） |
| 6-3 | 5スイート / 56テストケース | テスト設計（最大の作業量） |
| 6-4 | 18ドキュメント(EN+JA) | ドキュメント作成 |
| 6-5 | 2ファイル | マップ更新 |
| 6-6 | 2ファイル | SUMMARY更新 |

---

## 実行順序の推奨

```
6-1 (vuln-db更新) ←── 他の全タスクの基盤
  ↓
6-2 (ナレッジ記事) ←── テスト設計の知識基盤
  ↓
6-3 (テストスイート) ←── ナレッジを踏まえた設計
  ↓
6-4 (ドキュメント) ←── テスト・ナレッジの公開版
  ↓
6-5, 6-6 (マップ・SUMMARY更新) ←── 最終整理
```

**6-1 → 6-2 は直列**（DBが最新でないとナレッジ記事の正確性が担保できない）
**6-3 の5スイートは並列実行可能**（各カテゴリは独立）
**6-4 は 6-2, 6-3 の完了後**（内容を踏まえたドキュメント化）
