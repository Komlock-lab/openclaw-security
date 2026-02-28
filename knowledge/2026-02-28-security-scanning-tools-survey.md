---
date: 2026-02-28
category: tools-survey
severity: info
source: GitHub, npm, PyPI, Web
title: OpenClawセキュリティスキャンツール 既存ツール調査
---

# OpenClawセキュリティスキャンツール 既存ツール調査

> 調査実施日: 2026-02-28
> 目的: OpenClawのセキュリティ自己スキャン機能を構築するにあたり、既存のツール・スキル・機能を網羅的に調査する

---

## 調査結果サマリ

| カテゴリ | 発見数 | 注目度 |
|---------|--------|--------|
| OpenClaw公式セキュリティ機能 | 3件 | 高 |
| OpenClaw専用セキュリティスキル/プラグイン | 6件以上 | 非常に高 |
| 汎用LLMセキュリティスキャナー | 8件以上 | 高 |
| MCPサーバーセキュリティスキャナー | 4件 | 中 |
| LLMガードレール/ランタイム防御 | 5件 | 中 |
| AIエージェントセキュリティプラットフォーム | 3件 | 高 |

---

## 1. OpenClaw公式のセキュリティ機能

### 1.1 `openclaw security audit` コマンド

- **概要**: OpenClaw本体に組み込まれたセキュリティ監査コマンド
- **URL**: OpenClaw本体に含まれる (`openclaw security audit --deep`, `--fix`)
- **機能**:
  - インストール環境のセキュリティ設定チェック
  - `--deep`オプションで詳細スキャン
  - `--fix`オプションで自動修正
- **research.mdでの言及**: セクション5.8で確認
- **我々のツールとの比較**: OpenClaw本体の設定レベルの監査ツール。バージョン別脆弱性チェックやランタイム設定の分析は行わない。我々の`/check-version`コマンドは既知CVE/GHSAとの突合に特化しており、**補完関係**にある

### 1.2 `openclaw doctor` コマンド

- **概要**: システム診断・ヘルスチェックコマンド
- **URL**: OpenClaw本体に含まれる
- **機能**: 環境設定の健全性チェック（セキュリティ特化ではない）
- **我々のツールとの比較**: 一般的なヘルスチェック。セキュリティフォーカスではない。競合しない

### 1.3 `.detect-secrets` 統合

- **概要**: シークレット検出ツール（detect-secrets）との統合
- **設定**: `.detect-secrets.cfg` / `.secrets.baseline`
- **機能**: コードベース内の平文シークレットの検出
- **我々のツールとの比較**: シークレット漏洩の静的検出のみ。我々のスコープ外

---

## 2. OpenClaw専用セキュリティスキル/プラグイン

### 2.1 ClawSec (Prompt Security社)

- **名前**: ClawSec
- **URL**: https://github.com/prompt-security/clawsec
- **GitHub Stars**: 540
- **開発元**: Prompt Security（AIセキュリティプラットフォーム企業）
- **npm**: `clawsec` (v0.0.2)
- **機能**:
  - **clawsec-suite**: スキル群の一括インストーラー（整合性検証付き）
  - **clawsec-feed**: セキュリティアドバイザリフィードの自動監視（NVD CVEポーリング、6時間ごと更新）
  - **soul-guardian**: SOUL.md等の重要ファイルのドリフト検出・自動復元
  - **openclaw-audit-watchdog**: 日次自動監査+メール報告
  - **clawtributor**: コミュニティインシデント報告
  - **NanoClaw対応**: 9つのMCPツール、Ed25519署名検証、ファイル整合性監視
  - **SHA256チェックサム検証**: 全スキルアーティファクトの整合性確認
  - **CI/CDパイプライン**: 自動CVEポーリング、スキルリリース検証
- **対応プラットフォーム**: OpenClaw, NanoClaw
- **我々のツールとの比較**:
  - **重複する部分**: セキュリティアドバイザリの監視。ClawSecはNVD CVEフィードを自動ポーリングしている
  - **重複しない部分**: 我々のバージョン別脆弱性マップ（223件のGHSAマッピング）、ランタイム設定診断
  - **結論**: ClawSecはフィード監視とファイル整合性に強い。我々のツールは**バージョン-脆弱性の突合分析**と**設定レベルの深い診断**に特化できる。**併用が最適**

### 2.2 SecureClaw (Adversa AI社)

- **名前**: SecureClaw
- **URL**: https://github.com/adversa-ai/secureclaw
- **GitHub Stars**: 195
- **開発元**: Adversa AI（AIレッドチーミング企業）
- **npm**: `secureclaw` (v1.5.0) -- 別リポ https://github.com/buguard/secureclaw
- **機能**:
  - **56の監査チェック**: 8カテゴリにまたがる静的チェック
  - **自動ハーデニング**: 5モジュール、自動修正+バックアップ・ロールバック
  - **15の行動ルール**: LLMコンテキストに注入するランタイム保護（約1,230トークン）
  - **OWASP ASI 10/10カバレッジ**: 業界初のフル対応を謳う
  - **MITRE ATLAS 10/14**: ATLASフレームワークとのマッピング
  - **4つのパターンデータベース**: 既知攻撃パターンの検出
  - **3層防御**: Audit（静的） → Hardening（自動修正） → Behavioral Rules（ランタイム）
  - **SARIF/HTML/JSON出力**: CI/CD統合対応
- **npm版（buguard/secureclaw）との関係**:
  - npm版は33+チェック、Tier-based修正、ゼロトラストトンネル検出を含む
  - Adversa AI版はOWASP/MITREマッピングに特化
- **我々のツールとの比較**:
  - **重複する部分**: インストール環境の監査チェック、セキュリティ設定の検証
  - **重複しない部分**: 我々のバージョン別CVEマッピング（全223件GHSA）、カスタム攻撃テストケース設計
  - **SecureClawの強み**: OWASP ASIマッピング、自動ハーデニング、ランタイム行動ルール
  - **結論**: SecureClawは**最も包括的な既存ツール**。我々のツールは**脆弱性インテリジェンス（バージョン別マッピング）** と**攻撃テストケース設計**に差別化できる

### 2.3 SecureClaw npm版 (buguard)

- **名前**: secureclaw (npm)
- **URL**: https://github.com/buguard/secureclaw
- **npm**: `secureclaw` v1.5.0
- **機能**:
  - 33+チェック、18カテゴリ
  - Tier-based修正（T1-T4）
  - SARIF/HTML/JSON出力
  - ゼロトラストトンネル検出（Tailscale, Cloudflare Tunnel）
  - OpenClaw固有チェック（コマンド、サンドボックス、プラグイン、エージェント、フック）
  - ゼロnpm依存、Node >= 18
- **我々のツールとの比較**: Adversa AI版と同様だが、より実用的なCLIツールとしてパッケージング。併用可能

### 2.4 ClawReins (Pegasi AI)

- **名前**: ClawReins
- **URL**: https://github.com/pegasi-ai/clawreins
- **GitHub Stars**: 362
- **機能**:
  - OpenClawエージェントの**介入レイヤー**
  - 監査ログ
  - ブラウザ操作の認識
  - トラジェクトリ（行動軌跡）認識
  - Human-in-the-loopルーティング
- **言語**: Python
- **我々のツールとの比較**: ランタイム介入に特化。我々の静的分析・バージョンチェックとは異なるレイヤー。**補完的**

### 2.5 その他のOpenClaw専用ツール

| 名前 | URL | Stars | 概要 | 備考 |
|------|-----|-------|------|------|
| openclaw-sec | github.com/PaoloRollo/openclaw-sec | 7 | OpenClawセキュリティスキル | TypeScript、小規模 |
| openclaw-skills-security | github.com/UseAI-pro/openclaw-skills-security | 20 | セキュリティファーストなスキル集 | PI検出、サプライチェーン、認証情報漏洩 |
| clawpilot | github.com/kcchien/clawpilot | 17 | セキュリティファーストなコパイロットスキル | 14+チャットプラットフォーム対応 |
| clawguard | github.com/ramicheAi/clawguard | 0 | OpenClawセキュリティスキャナー | 新しいプロジェクト |
| flaw0-security/openclaw-flaw-scanner | GitHub | 0 | OpenClawコード・プラグイン・スキルの脆弱性スキャナー | OpenGuardrails AIモデル搭載 |

---

## 3. 汎用LLMセキュリティスキャナー

### 3.1 garak (NVIDIA)

- **名前**: garak - Generative AI Red-teaming & Assessment Kit
- **URL**: https://github.com/NVIDIA/garak
- **PyPI**: `garak` v0.14.0
- **開発元**: NVIDIA
- **機能**:
  - LLM脆弱性スキャナー（nmap/Metasploitに相当するLLM版）
  - ハルシネーション、データリーク、プロンプトインジェクション、誤情報、毒性生成、ジェイルブレイク等をプローブ
  - 静的・動的・適応的プローブの組み合わせ
  - HuggingFace Hub、Replicate、OpenAI API、AWS Bedrock、LiteLLM等を幅広くサポート
  - REST API経由で任意のLLMに対応
- **我々のツールとの比較**:
  - garakは**LLMモデル自体の脆弱性テスト**に特化。OpenClawの設定やバージョンの脆弱性チェックは範囲外
  - 我々の攻撃テストケース（`/create-testcase`）の**入力生成エンジン**としてgarakを活用できる可能性あり
  - **結論**: 直接の競合ではない。LLMレベルのプロービングツールとして**補完的に利用可能**

### 3.2 promptfoo

- **名前**: promptfoo
- **URL**: https://github.com/promptfoo/promptfoo
- **npm**: `promptfoo` v0.120.25
- **機能**:
  - LLM eval & テスティングツールキット
  - レッドチーミング機能内蔵
  - OWASP LLM Top 10テストケース
  - CI/CD統合
  - プロンプトインジェクション検出
  - 多数のLLMプロバイダー対応
- **我々のツールとの比較**:
  - promptfooは**LLMの出力品質・安全性のテスト**に特化
  - OpenClawのインフラレベルの脆弱性チェックは範囲外
  - 我々の攻撃テストケースの**評価フレームワーク**として活用可能
  - **結論**: テスト実行・評価の基盤として**併用可能**

### 3.3 PyRIT (Microsoft)

- **名前**: PyRIT - Python Risk Identification Tool for LLMs
- **URL**: https://github.com/Azure/PyRIT
- **PyPI**: `pyrit` v0.11.0
- **開発元**: Microsoft
- **機能**:
  - LLMの堅牢性を評価するフレームワーク
  - セキュリティ専門家向けのプロアクティブなリスク特定
  - 学術論文あり (arXiv:2410.02828)
- **我々のツールとの比較**: モデルレベルのリスク評価。インフラ/バージョン脆弱性とは別レイヤー。**補完的**

### 3.4 Agentic Security

- **名前**: Agentic Security
- **URL**: https://github.com/msoedov/agentic_security
- **PyPI**: `agentic_security` v0.7.4
- **GitHub Stars**: 1,790
- **機能**:
  - エージェントワークフローとLLMの脆弱性スキャナー
  - マルチモーダル攻撃（テキスト、画像、音声）
  - マルチステップジェイルブレイク
  - 包括的ファジング
  - API統合 & ストレステスト
- **我々のツールとの比較**: LLMエンドポイントに対する動的テスト。バージョン脆弱性チェックとは異なる。**テスト実行エンジンとして併用可能**

### 3.5 promptmap

- **名前**: promptmap
- **URL**: https://github.com/utkusen/promptmap
- **GitHub Stars**: 1,135
- **機能**: カスタムLLMアプリケーション向けセキュリティスキャナー
- **言語**: Python
- **我々のツールとの比較**: カスタムLLMアプリの動的テスト。併用可能

### 3.6 LLM Guard

- **名前**: LLM Guard
- **PyPI**: `llm-guard` v0.3.16
- **機能**:
  - LLMのセキュリティ強化ツール
  - 入力サニタイゼーション
  - 有害言語検出
  - データリーク防止
  - プロンプトインジェクション攻撃への耐性
- **我々のツールとの比較**: ランタイム防御レイヤー。我々の静的分析・バージョンチェックとは別レイヤー

### 3.7 NeMo Guardrails (NVIDIA)

- **名前**: NeMo Guardrails
- **PyPI**: `nemoguardrails` v0.20.0
- **開発元**: NVIDIA
- **機能**: LLMベースの会話システムにプログラマブルなガードレールを追加するツールキット
- **我々のツールとの比較**: ランタイムガードレール。設定レベルのセキュリティ診断とは異なる

### 3.8 Rebuff

- **名前**: Rebuff
- **PyPI**: `rebuff` v0.1.1
- **機能**: プロンプトインジェクション攻撃からAIアプリケーションを保護する多層防御
- **我々のツールとの比較**: PI検出に特化したランタイム防御。我々のスコープとは異なる

---

## 4. MCPサーバーセキュリティスキャナー

### 4.1 Snyk Agent Scan

- **名前**: Snyk Agent Scan
- **URL**: https://github.com/snyk/agent-scan
- **GitHub Stars**: 1,637
- **開発元**: Snyk（セキュリティ企業）
- **機能**:
  - AIエージェント、MCPサーバー、エージェントスキルのセキュリティスキャナー
  - Claude Code, Cursor, Windsurf, Gemini CLI等のエージェント設定を自動検出
  - プロンプトインジェクション検出
  - ツールポイズニング検出
  - クロスオリジンエスカレーション検出
  - MCP rug pull攻撃検出（ツールハッシュ変更検出）
  - スキル脆弱性検出（マルウェアペイロード、ハードコードシークレット）
  - 技術レポート: エージェントスキルエコシステムの新興脅威
- **インストール**: `uvx snyk-agent-scan@latest --skills`
- **我々のツールとの比較**:
  - Snyk Agent Scanは**MCP設定とスキルファイルの静的分析**に特化
  - OpenClawのバージョン別CVE/GHSAマッピングは範囲外
  - スキルのセキュリティ監査には非常に有用
  - **結論**: **併用推奨**。特にOpenClawのスキル監査にSnyk Agent Scanを使い、バージョン脆弱性分析に我々のツールを使う組み合わせが強力

### 4.2 Cisco MCP Scanner

- **名前**: MCP Scanner
- **URL**: https://github.com/cisco-ai-defense/mcp-scanner
- **GitHub Stars**: 822
- **開発元**: Cisco AI Defense
- **機能**: MCPサーバーの潜在的脅威とセキュリティ所見の検出
- **言語**: Python
- **我々のツールとの比較**: MCPサーバーの静的分析。OpenClaw固有ではないが、MCPツール利用時のセキュリティチェックに有用

### 4.3 MCP Shield

- **名前**: MCP Shield
- **URL**: https://github.com/riseandignite/mcp-shield
- **GitHub Stars**: 545
- **言語**: TypeScript
- **機能**: MCPサーバーのセキュリティスキャナー
- **我々のツールとの比較**: MCP特化。併用可能

### 4.4 Agent Security Scanner MCP (SineWave AI)

- **名前**: Agent Security Scanner MCP
- **URL**: https://github.com/sinewaveai/agent-security-scanner-mcp
- **GitHub Stars**: 66
- **機能**:
  - AIコーディングエージェント向けセキュリティスキャナー MCPサーバー
  - プロンプトインジェクションファイアウォール
  - パッケージハルシネーション検出（4.3M+パッケージ）
  - 1000+脆弱性ルール（AST & taint分析）
  - 自動修正
  - OpenClaw対応を明示
- **我々のツールとの比較**: MCPサーバーとして提供されるため、OpenClawエージェントが直接利用可能。ただしバージョン脆弱性チェックは範囲外

---

## 5. AIエージェントセキュリティプラットフォーム

### 5.1 Tencent AI-Infra-Guard (A.I.G)

- **名前**: AI-Infra-Guard (A.I.G)
- **URL**: https://github.com/Tencent/AI-Infra-Guard
- **GitHub Stars**: 3,000
- **開発元**: Tencent Zhuque Lab
- **機能**:
  - フルスタックAIレッドチーミングプラットフォーム
  - AIインフラ脆弱性スキャン
  - MCPサーバースキャン
  - エージェントスキルスキャン
  - LLMジェイルブレイク評価
  - n8n等のワークフロー自動化プラットフォーム対応
  - OpenClawスキャンを明示的にサポート（トピック: `openclaw-scan`）
  - Black Hat EU 2025で発表
- **我々のツールとの比較**:
  - A.I.Gは**エンタープライズグレードのAIセキュリティプラットフォーム**
  - OpenClawスキャンを含む広範なカバレッジ
  - ただし、我々の**バージョン別GHSA/CVEマッピング**（223件）のような詳細なOpenClaw特化インテリジェンスは持たない
  - **結論**: 大規模スキャンにはA.I.Gが有力。我々のツールはOpenClaw深掘りインテリジェンスに特化

### 5.2 Agentic Radar (SPLX AI)

- **名前**: Agentic Radar
- **URL**: https://github.com/splx-ai/agentic-radar
- **GitHub Stars**: 915
- **機能**: LLMエージェンティックワークフロー向けセキュリティスキャナー
- **言語**: Python
- **我々のツールとの比較**: エージェントワークフローの分析に特化。OpenClaw固有ではない

### 5.3 Ferret Scan

- **名前**: Ferret Scan
- **URL**: https://github.com/fubak/ferret-scan
- **GitHub Stars**: 73
- **言語**: TypeScript
- **機能**:
  - LLM CLI（Claude Code, Codex, Gemini, Droid, Opencode等）の設定・MDファイルのセキュリティスキャナー
  - プロンプトインジェクション検出
  - 認証情報リーク検出
  - 悪意あるパターン検出
- **我々のツールとの比較**: MDファイルとCLI設定の静的分析。スキルファイルのセキュリティチェックに有用

---

## 6. Aguara (スキルスキャナー)

- **名前**: Aguara
- **URL**: https://github.com/garagon/aguara
- **GitHub Stars**: 40
- **機能**:
  - AIエージェントスキル & MCPサーバーのセキュリティスキャナー
  - 153検出ルール、13カテゴリ
  - 5レジストリの日次監視
  - OpenClaw検出含む
  - APIキー不要、クラウド不要、LLM不要
  - シングルバイナリ（Go言語）
- **我々のツールとの比較**: スキルファイルの静的分析に特化。バージョン脆弱性チェックは範囲外。**スキル監査ツールとして併用可能**

---

## 7. セキュリティ強化されたOpenClaw代替

### 7.1 NanoClaw

- **URL**: https://github.com/qwibitai/nanoclaw
- **GitHub Stars**: 16,098
- **概要**: コンテナベースのOpenClaw軽量代替。セキュリティ重視
- **関連**: ClawSecがNanoClaw対応スキルを提供

### 7.2 IronClaw

- **URL**: https://github.com/nearai/ironclaw
- **GitHub Stars**: 3,805
- **概要**: Rust実装のOpenClawインスパイアプロジェクト。プライバシーとセキュリティ重視

### 7.3 Moltis

- **URL**: https://github.com/moltis-org/moltis
- **GitHub Stars**: 1,627
- **概要**: Rustネイティブのシングルバイナリ。サンドボックス、セキュリティ、監査可能性を重視

### 7.4 Clawdstrike

- **URL**: https://github.com/backbay-labs/clawdstrike
- **GitHub Stars**: 184
- **概要**: AIエージェントのランタイムセキュリティ強制。Rustで実装。Swarm Detection & Response (SDR)プラットフォーム構築用

---

## 8. 総合比較：我々のツールとの差別化

### 我々のツール（openclaw-security）のユニークな価値

| 機能 | 我々 | ClawSec | SecureClaw | A.I.G | Snyk Agent Scan | garak |
|------|------|---------|------------|-------|-----------------|-------|
| バージョン別GHSA/CVEマッピング（223件） | **Yes** | 部分的（NVD CVEフィード） | No | No | No | No |
| CalVerバージョン解析（4世代の名前変遷対応） | **Yes** | No | No | No | No | No |
| 攻撃テストケース設計（6カテゴリ） | **Yes** | No | 部分的 | 部分的 | No | **Yes** |
| ランタイム設定診断 | 計画中 | No | **Yes**（56チェック） | 部分的 | No | No |
| ファイル整合性監視 | No | **Yes** | **Yes** | No | 部分的 | No |
| NVD CVEフィード自動ポーリング | No | **Yes** | No | **Yes** | No | No |
| OWASPフレームワークマッピング | 計画中 | No | **Yes**（ASI 10/10） | **Yes** | No | No |
| スキルサプライチェーン分析 | 計画中 | 部分的 | 部分的 | **Yes** | **Yes** | No |
| MCPサーバースキャン | No | No | No | **Yes** | **Yes** | No |
| LLMモデルプロービング | No | No | No | **Yes** | No | **Yes** |

### 推奨される組み合わせ

1. **バージョン脆弱性インテリジェンス**: **我々のツール**（唯一の全223件GHSAマッピング）
2. **インストール環境監査**: **SecureClaw** (56チェック) または **openclaw security audit**
3. **ファイル整合性 & ドリフト検出**: **ClawSec** (soul-guardian)
4. **スキルサプライチェーン**: **Snyk Agent Scan** + **Aguara**
5. **MCPサーバーセキュリティ**: **Cisco MCP Scanner** または **Snyk Agent Scan**
6. **LLMレベルのプロービング**: **garak** または **promptfoo**
7. **ランタイム介入 & Human-in-the-loop**: **ClawReins**
8. **エンタープライズレッドチーミング**: **Tencent A.I.G**

---

## 9. 我々のツールの開発方針への示唆

### 既に実現している差別化要素
- **全223件のGHSAマッピング**を持つバージョン脆弱性チェッカー (`version-check.ts`)
- **4世代の名前変遷に対応したCalVerバージョン解析**
- **6カテゴリの攻撃テストケース設計**フレームワーク
- **セキュリティナレッジベース**（research.mdに1000行超の調査結果）

### 今後の自己スキャン機能で注力すべき領域
1. **ランタイム設定診断の深化**: SecureClawの56チェックを参考に、OpenClaw固有の設定項目（サンドボックスモード、DMペアリング、exec allowlist等）の診断を追加
2. **GHSAフィードの自動更新**: ClawSecのNVD CVEポーリングを参考に、GitHub Security Advisories APIからの自動更新を実装
3. **攻撃テストケースとの連動**: バージョンチェック結果から、該当する攻撃テストケースを自動提案する機能
4. **CI/CD統合**: SecureClawのSARIF出力を参考に、GitHub Actions等での自動スキャンを実装
5. **既存ツールとの統合**: Snyk Agent Scan、garak等をラッパーとして呼び出せるインターフェース

### 避けるべきこと（既存ツールと重複）
- NVD CVEフィードのポーリング（ClawSecが既に実装）
- ファイル整合性監視（ClawSecのsoul-guardianが既に実装）
- MCPサーバーのスキャン（Snyk, Cisco等が既に実装）
- 汎用的なLLMプロービング（garak, promptfooが既に実装）

---

*調査完了: 2026-02-28*
