# エージェントハイジャックテストガイド

## 概要

エージェントハイジャックは、エージェント間通信、リモート実行、ゲートウェイインフラストラクチャの整合性とセキュリティを侵害する攻撃を表します。サンドボックスエスケープ（ファイルシステム境界に焦点）とは異なり、エージェントハイジャック攻撃は以下を標的とします:

- **リモートコード実行（RCE）** — 攻撃者制御のコードを直接実行
- **Gateway/WebSocket通信** — エージェントメッセージの傍受または操作
- **クロスエージェントスポーン** — マルチエージェント調整メカニズムの悪用
- **コマンドインジェクション** — システムコマンドへの悪意のあるペイロード注入
- **SSRF（Server-Side Request Forgery）** — エージェントのネットワーク機能の悪用

このテストスイートは3つの次元をカバーします:
- **Part 1（テスト1-5）**: 攻撃**ベクター** — RCEとハイジャックのエントリポイント
- **Part 2（テスト6-10）**: 攻撃**手法** — 特定のコマンドインジェクションとSSRF手法
- **Part 3（テスト11-12）**: **マルチエージェント** — エージェント間通信の悪用

## テストインデックス

### Part 1: ベクターベーステスト

| # | テスト | 難易度 | ターゲット | GHSAリファレンス |
|---|------|------------|--------|----------------|
| 1 | config.apply経由WebSocket RCE | 上級 | 認証なしWebSocket | [GHSA-g55j-c2v4-pjcg](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg) |
| 2 | gatewayUrlトークン窃取 | 上級 | 認証トークン経由ワンクリックRCE | [GHSA-g8p2-7wf7-98mq](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq) |
| 3 | Heredoc展開インジェクション | 上級 | execホワイトリストheredoc | [GHSA-65rx-fvh6-r4h2](https://github.com/openclaw/openclaw/security/advisories/GHSA-65rx-fvh6-r4h2) |
| 4 | Systemd改行インジェクション（Linux） | 上級 | systemdユニット生成 | [GHSA-vffc-f7r7-rx2w](https://github.com/openclaw/openclaw/security/advisories/GHSA-vffc-f7r7-rx2w) |
| 5 | Gateway Node Invokeバイパス | Critical | リモートNode Invoke承認 | [GHSA-gv46-4xfq-jv58](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58) |

### Part 2: 手法ベーステスト

| # | テスト | 難易度 | 手法カテゴリ | GHSAリファレンス |
|---|------|------------|-------------------|----------------|
| 6 | Docker PATHインジェクション | 中級 | 環境変数操作 | [GHSA-mc68-q9jw-2h3v](https://github.com/openclaw/openclaw/security/advisories/GHSA-mc68-q9jw-2h3v) |
| 7 | sshNodeCommandインジェクション | 上級 | OSコマンドインジェクション | [GHSA-q284-4pvr-m585](https://github.com/openclaw/openclaw/security/advisories/GHSA-q284-4pvr-m585) |
| 8 | macOS Keychainインジェクション | 上級 | シェルインジェクション（macOS） | [GHSA-4564-pvr2-qq4h](https://github.com/openclaw/openclaw/security/advisories/GHSA-4564-pvr2-qq4h) |
| 9 | IPv4マップIPv6経由SSRF | 中級 | SSRFガードバイパス | [GHSA-jrvc-8ff5-2f9f](https://github.com/openclaw/openclaw/security/advisories/GHSA-jrvc-8ff5-2f9f) |
| 10 | ACPX CWDプロンプトインジェクション | 上級 | 作業ディレクトリ操作 | [GHSA-6f6j-wx9w-ff4j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6f6j-wx9w-ff4j) |

### Part 3: マルチエージェントテスト

| # | テスト | 難易度 | ターゲット | リファレンス |
|---|------|------------|--------|-----------|
| 11 | ACPリソースリンクプロンプトインジェクション | 上級 | クロスエージェントリソース共有 | ACPセキュリティパターンに関連 |
| 12 | エージェントIDなりすまし | 上級 | エージェント間認証 | sessions_spawnとクロスエージェント通信に関連 |

## テストカバレッジマトリクス

| 手法カテゴリ | テスト | 件数 |
|-------------------|-------|-------|
| リモートコード実行 | 1, 2, 3, 4, 5 | 5 |
| コマンドインジェクション | 6, 7, 8, 10 | 4 |
| SSRF | 9 | 1 |
| マルチエージェント通信 | 11, 12 | 2 |

## 脆弱性統計

vulnerability-db.json に基づく（2026-03-12時点）:

| カテゴリ | 件数 | 最高深刻度 |
|----------|-------|------------------|
| RCE | 7件 | Critical |
| コマンドインジェクション | 3件 | High |
| SSRF | 5件 | High |
| 認証バイパス（Gateway） | 3件以上 | Critical |

**合計カバレッジ**: 12件のテストケースで18件以上の既知RCE/ハイジャック脆弱性をカバー。

## 攻撃パターンの進化

```
Phase 1: Gateway/WebSocket攻撃 (v2026.1.x)
├── 認証なしWebSocket RCE (GHSA-g55j)
├── gatewayUrlトークン窃取 (GHSA-g8p2)
└── Gateway Node Invokeバイパス (GHSA-gv46)

Phase 2: コマンドインジェクション変種 (v2026.2.x)
├── Heredoc展開 (GHSA-65rx)
├── Systemd改行インジェクション (GHSA-vffc)
├── Docker PATHインジェクション (GHSA-mc68)
├── sshNodeCommandインジェクション (GHSA-q284)
└── macOS Keychainインジェクション (GHSA-4564)

Phase 3: SSRFとネットワークバイパス (v2026.3.x)
├── IPv4マップIPv6バイパス (GHSA-jrvc)
├── Authorizationヘッダー転送 (GHSA-6mgf)
├── プロキシ経由DNS pinning喪失 (GHSA-8mvx)
├── NodeカメラURLバイパス (GHSA-2858)
└── web_search引用SSRF (GHSA-g99v)

Phase 4: マルチエージェントセキュリティ (v2026.3.x)
├── ACPサンドボックス継承バイパス (GHSA-474h, GHSA-p7gr)
├── sessions_spawn強制 (GHSA-9q36)
└── エージェントIDと認可パターン
```

## Gatewayアーキテクチャ

OpenClawのゲートウェイは、エージェント通信の中心ハブとして機能します:

```
┌─────────────────┐
│  外部ユーザー   │ (WhatsApp, Telegram, Discord, Slack等)
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────────────┐
│               Gateway (WebSocket/HTTP)              │
│  - 認証と認可                                       │
│  - メッセージルーティングと変換                      │
│  - Node Invoke（リモートコマンド実行）               │
└────────┬────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────┐
│             OpenClaw Agent (LLM)                    │
│  - ツール実行（system.run、ファイルシステム等）      │
│  - スキル呼び出し                                    │
│  - マルチエージェント調整（ACP sessions_spawn）     │
└─────────────────────────────────────────────────────┘
```

**攻撃面**:
1. **Gateway → Agent**: WebSocket/HTTP経由の悪意あるコマンド
2. **Agent → Gateway**: ゲートウェイフェッチ経由のSSRF攻撃
3. **Agent → Host**: system.runとexecホワイトリストバイパス経由のRCE
4. **Agent → Agent**: クロスエージェントプロンプトインジェクションとリソース操作

## 認証と認可レベル

| レベル | 説明 | バイパスパターン |
|-------|-------------|-----------------|
| Gateway認証 | トークン/シークレット検証 | GHSA-mp5h（Telegramシークレット）、GHSA-gv46（Node Invoke） |
| チャンネル認可 | チャンネルごとのアクセス制御 | 様々なチャンネル固有のバイパス |
| ツール認可 | system.run承認ワークフロー | GHSA-hwpq（承認ID不一致） |
| エージェント間 | クロスエージェントスポーン権限 | GHSA-474h（ACP継承バイパス） |

## テスト前提条件

エージェントハイジャックテストを実行する前に:

1. **Gateway設定**: ゲートウェイを有効にしてOpenClawを設定
2. **ネットワーク隔離**: 隔離されたネットワーク環境を使用
3. **複数ノード**: 一部のテストはマルチエージェント設定が必要
4. **Root/sudo**: 一部のテスト（systemd、Keychain）は昇格権限が必要
5. **プラットフォーム固有**: テスト4（Linux）および8（macOS）はOS固有
6. **監視**: WebSocketトラフィックキャプチャとシステム監査ログを有効化

⚠️ **警告**: これらのテストは実際のRCE攻撃を実行します。適切な隔離を備えた制御された環境でのみ実行してください。

## テスト実行のベストプラクティス

1. **隔離VM/コンテナ**: 本番環境や共有システムでは決して実行しない
2. **ネットワーク監視**: 全てのWebSocketとHTTPトラフィックをキャプチャ
3. **プロセス監視**: `auditd`（Linux）または`dtrace`（macOS）を使用してexec呼び出しを追跡
4. **一度に1つのテスト**: RCEテストは永続的なバックドアを残す可能性がある
5. **クリーンアップ**: 各テスト後、全ての生成されたプロセスと接続を終了
6. **ゲートウェイ状態を記録**: テスト前後のゲートウェイ設定を記録

## 成功基準

テストが**PASS（安全）**の場合:
- RCE試行がブロックされる
- Gateway認証が強制される
- コマンドインジェクションがエスケープ/サニタイズされる
- SSRFがfetch-guardによってブロックされる
- 未認可のエージェント通信が拒否される

テストが**FAIL（脆弱）**の場合:
- 任意のコード実行が成功する
- Gatewayが認証なしリクエストを受け入れる
- シェルメタキャラクタが実行される
- SSRFが内部/プライベートネットワークリソースに到達する
- エージェント間境界が認可なしで越えられる

## 緩和策

テストが脆弱性を明らかにした場合:

1. **即座にアップグレード**: 最新のOpenClawバージョン（v2026.3.8以降）に更新
2. **Gateway認証を有効化**: 全チャンネルでシークレットトークンを使用することを確認
3. **Node Invokeを制限**: Node Invokeを無効化するか手動承認を要求
4. **全てをサンドボックス化**: `OPENCLAW_SANDBOX=all`を設定
5. **ネットワークセグメンテーション**: エージェントプロセスを本番ネットワークから隔離
6. **execログを監視**: 予期しないsystem.run実行に対してアラート
7. **OpenClawに報告**: 発見事項をsecurity@openclaw.aiに提出

## 主要な未解決問題

| 問題パターン | 説明 | ステータス |
|--------------|-------------|--------|
| Gateway承認ワークフロー | system.runとNode Invoke承認がID不一致経由でバイパス可能 | v2026.2.25以降で修正済みだが複雑なUXフローは残る |
| SSRF基礎 | エージェントはネットワークアクセスが必要だがSSRFを回避する必要がある — 継続的なバランス | 部分的な緩和（DNSピンニング、fetch-guard） |
| コマンドインジェクション面 | execホワイトリストバイパスが次々と発生 — シェルメタキャラクタ処理は難しい | 9つの異なるバイパスパターンを修正 |
| マルチエージェント信頼モデル | エージェント間通信は信頼できるピアを前提 — 相互認証なし | レビュー中 |

## 他のテストスイートとの関係

- **prompt-injection**: 多くのエージェントハイジャック攻撃はプロンプトインジェクション経由で配信される
- **sandbox-escape**: RCE達成後、攻撃者はしばしばサンドボックスエスケープを試みる
- **skill-abuse**: execホワイトリストバイパスはコマンドインジェクション技術と重複
- **channel-spoofing**: Gateway認証バイパスは多くのRCE攻撃の前提条件
- **secret-leakage**: 成功したRCEはしばしばシークレット流出につながる

**組み合わせ攻撃チェーン**:
```
プロンプトインジェクション → ツール悪用 → コマンドインジェクション（RCE） → サンドボックスエスケープ → シークレット漏洩
```

実環境の攻撃のほとんどは、テストスイート全体にわたる複数の技術を組み合わせています。

## 関連リソース

- **脆弱性ドキュメント**:
  - [RCE脆弱性](../vulnerabilities/rce.md)
  - [コマンドインジェクション](../vulnerabilities/command-injection.md)
  - [SSRF脆弱性](../vulnerabilities/ssrf.md)
  - [Execバイパス](../vulnerabilities/exec-bypass.md)
- **ベストプラクティス**:
  - [チャンネルセキュリティ](../best-practices/channel-security.md)
  - [ハードニングガイド - Gatewayセキュリティ](../best-practices/hardening-guide.md#gateway-security)
- **テストケース**: リポジトリ`tests/agent-hijack/`ディレクトリで利用可能
- **公式ドキュメント**: [OpenClaw Gatewayセキュリティ](https://openclaw.ai/docs/gateway)

## テストの実行

### テストリポジトリのクローン

```bash
git clone https://github.com/yourusername/openclaw-security.git
cd openclaw-security/tests/agent-hijack
```

### 個別テストの実行

```bash
# 例: Test 1（WebSocket RCE）を実行
cd test-01-websocket-rce
./run.sh

# 結果を確認
echo $?  # 0 = 安全（RCEブロック済み）, 1 = 脆弱
```

### 完全テストスイートの実行

```bash
# 全12テストを実行
./run-all.sh

# レポートを生成
./run-all.sh --report
```

### 結果の検証

```bash
# WebSocketトラフィックを確認
tcpdump -i lo -w capture.pcap port 8080

# 監査ログをレビュー
sudo ausearch -k openclaw-rce

# 生成されたプロセスを確認
ps aux | grep openclaw
```

## 脆弱性の報告

テストが新しい脆弱性を発見した場合:

1. **公開しない**: security@openclaw.aiに非公開で連絡
2. **詳細を提供**:
   - OpenClawバージョン
   - 成功したテストケース
   - 使用した攻撃ペイロード
   - 影響評価（RCE深刻度）
3. **修正時間を確保**: 責任ある開示に従う（90日間）
4. **CVEを調整**: CVE割り当てについてOpenClawセキュリティチームと協力

## 参考資料

- **CWE-78**: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **CWE-918**: Server-Side Request Forgery (SSRF)
- **CWE-94**: Improper Control of Generation of Code ('Code Injection')
- **CWE-284**: Improper Access Control
- **OWASP Top 10**: A01:2021 – Broken Access Control, A03:2021 – Injection
