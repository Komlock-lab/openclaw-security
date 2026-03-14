# OpenClaw ハードニングガイド

## 概要

このガイドでは、既知のセキュリティ脅威に対してOpenClawインストールを強化するための実践的な手順を提供します。本番のセキュリティアドバイザリから抽出した19件のランタイムセキュリティチェック（RC-001 ~ RC-019）を、優先度とカテゴリ別に整理しています。

**対象読者**: OpenClawオペレーター、セキュリティチーム、本番環境や高信頼環境でOpenClawを運用するすべての方。

**前提条件**:
- OpenClaw >= v2026.3.8（推奨）
- OpenClawインスタンスへのコマンドラインアクセス
- `openclaw` CLIツールがインストール済み

---

## クイックスタート

即座にセキュリティを向上させるには、以下の3つのコマンドを実行してください：

```bash
# 1. サンドボックスモードを有効化（コマンド実行を隔離）
openclaw config set sandbox all

# 2. 機密操作にhuman-in-the-loop承認を有効化
openclaw config set approvalMode always

# 3. 現在のバージョンが最新であることを確認
openclaw --version
# 期待値: >= v2026.3.8
```

バージョンが古い場合は、すぐにアップデートしてください：

```bash
openclaw update
```

---

## クリティカルセキュリティチェック（High深刻度）

### RC-001: サンドボックス有効化

**チェック**:
```bash
openclaw config get sandbox
```

**期待値**: `all`

**重要な理由**: サンドボックスモードはコマンド実行をDockerコンテナ内に隔離し、悪意あるコードがホストのファイルシステムやネットワークにアクセスするのを防ぎます。

**修正方法**:
```bash
openclaw config set sandbox all
```

**検証**:
```bash
# 有効化後、サンドボックスがアクティブであることを確認
openclaw config get sandbox
# 出力: all
```

---

### RC-002: Gateway認証

**チェック**:
```bash
openclaw config get gateway.auth
```

**期待値**: `true`

**重要な理由**: 認証されていないGateway接続は、ネットワーク上の誰でもOpenClawインスタンスを制御できる状態になります。

**修正方法**:
```bash
# 安全なトークンを生成
TOKEN=$(openssl rand -hex 32)
openclaw config set gateway.auth "$TOKEN"

# クライアント接続のためにトークンを安全に保存
echo "Gateway Token: $TOKEN" >> ~/.openclaw/gateway-token.txt
chmod 600 ~/.openclaw/gateway-token.txt
```

---

### RC-004: Exec Allowlistの制限

**チェック**:
```bash
openclaw config get exec.allowlist
```

**期待値**: 必要最小限のコマンドのみ

**重要な理由**: 過度に緩いallowlistは、28件以上の既知のバイパス手法を有効にします（[Exec Bypassの脆弱性](../vulnerabilities/exec-bypass.md)を参照）。

**修正方法**:
```bash
# 例: 必須コマンドのみに制限
openclaw config set exec.allowlist "git,npm,python3,node"

# より良い方法: 不要ならsystem.runを完全に無効化
openclaw config set tools.deny "system.run,exec"
```

---

### RC-005: Webhook秘密検証

**チェック**:
```bash
openclaw config get webhook.secret
```

**期待値**: 秘密トークンが設定されている

**重要な理由**: 検証されていないwebhookは、攻撃者がリクエストを偽造してコマンドを実行することを可能にします。

**修正方法**:
```bash
# すべてのwebhookエンドポイントに秘密を設定
WEBHOOK_SECRET=$(openssl rand -hex 32)
openclaw config set webhook.secret "$WEBHOOK_SECRET"

# webhookプロバイダー（Telegram、Slackなど）をこの秘密で更新
```

---

### RC-007: プロンプトインジェクション攻撃面

**チェック**:
```bash
# サンドボックスがOFF かつ Webツールが有効（危険な組み合わせ）
openclaw config get sandbox
openclaw config get tools.web
```

**期待値**: `sandbox=all` または `tools.web=disabled`

**重要な理由**: 無効なサンドボックス + 有効なWebツール = 最大のプロンプトインジェクション攻撃面

**修正方法**:
```bash
# オプション1: サンドボックスを有効化（推奨）
openclaw config set sandbox all

# オプション2: Web対応ツールを無効化
openclaw config set tools.web false
```

---

### RC-010: Human-in-the-Loop承認

**チェック**:
```bash
openclaw config get approvalMode
```

**期待値**: `always` または `selective`

**重要な理由**: 機密操作（ファイル書き込み、コマンド実行）の自動承認は、サイレント攻撃を可能にします。

**修正方法**:
```bash
# すべての機密操作に承認を要求
openclaw config set approvalMode always

# または: 特定の操作のみ選択的承認
openclaw config set approvalMode selective
```

---

### RC-011: GatewayをLoopbackのみにバインド

**チェック**:
```bash
openclaw config get gateway.bind
```

**期待値**: `127.0.0.1` または `::1`

**重要な理由**: `0.0.0.0`にバインドすると、Gatewayがネットワーク全体に公開され、リモート攻撃が可能になります。

**修正方法**:
```bash
# loopbackのみにバインド（ローカル接続のみ）
openclaw config set gateway.bind 127.0.0.1
```

---

### RC-013: CLAUDE.md整合性（CI/CD）

**チェック**:
```bash
# 最近のコミットでCLAUDE.mdや.claude/が変更されていないか確認
git diff --name-only HEAD~1 | grep -c 'CLAUDE.md\|.claude/'
```

**期待値**: `0`（命令ファイルへの信頼されない変更がない）

**重要な理由**: 悪意あるPRがCLAUDE.mdを変更してAIエージェントの動作を乗っ取ることができます（[hackerbot-clawキャンペーン](../vulnerabilities/cicd-supply-chain.md)）。

**修正方法**:
```bash
# CLAUDE.mdをCODEOWNERSに追加（GitHubが必要）
echo "CLAUDE.md @your-security-team" >> .github/CODEOWNERS
echo ".claude/ @your-security-team" >> .github/CODEOWNERS

# GitHubリポジトリ設定で「Require review from Code Owners」を有効化
```

---

### RC-014: GitHub Actionsワークフローの安全性

**チェック**:
```bash
# 危険なpull_request_targetパターンをチェック
grep -r 'pull_request_target' .github/workflows/
grep -r 'ref.*head' .github/workflows/
```

**期待値**: PR headチェックアウトを伴う`pull_request_target`がない

**重要な理由**: `pull_request_target` + 信頼されないコードチェックアウト = 書き込みトークンの露出（[GHSA-gv46、hackerbot-claw](../vulnerabilities/cicd-supply-chain.md)）。

**修正方法**:
```yaml
# BEFORE（危険）:
on:
  pull_request_target:  # 信頼されないチェックアウトと一緒に使用しない
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # 危険

# AFTER（安全）:
on:
  pull_request:  # pull_requestを使用
jobs:
  test:
    permissions:
      contents: read  # トークンスコープを制限
    steps:
      - uses: actions/checkout@v4  # 安全: 読み取り専用トークンでPRコードをチェックアウト
```

---

### RC-015: ACPディスパッチのサンドボックス継承

**チェック**:
```bash
openclaw config get acp.dispatch
openclaw --version
```

**期待値**: `enabled with sandbox inheritance` かつ `>= 2026.3.1`

**重要な理由**: サンドボックス継承がないと、サンドボックス化されたエージェントが非サンドボックス化された子エージェントを生成できます（[GHSA-474h、GHSA-p7gr](../vulnerabilities/acp-security.md)）。

**修正方法**:
```bash
# 1. >= 2026.3.1にアップデート（サンドボックス継承を強制）
openclaw update

# 2. ACPディスパッチ設定を確認
openclaw config get acp.dispatch
# 表示されるべき内容: enabled=true, sandboxInheritance=true
```

---

### RC-016: system.run承認バインディング

**チェック**:
```bash
openclaw --version
```

**期待値**: `>= 2026.3.8`

**重要な理由**: 以前のバージョンでは、承認と実行の間で実行ファイルやスクリプトオペランドが置き換えられるTOCTOU攻撃を許可します（[GHSA-q399、GHSA-8g75](../vulnerabilities/exec-bypass.md)）。

**修正方法**:
```bash
# >= 2026.3.8にアップデート
openclaw update
```

---

### RC-018: Gateway UI認証漏洩

**チェック**:
```bash
openclaw --version
```

**期待値**: `>= 2026.3.7`

**重要な理由**: 以前のバージョンでは、ブラウザURLとlocalStorage経由でGateway認証トークンが漏洩します（[GHSA-rchv](https://github.com/openclaw/openclaw/security/advisories/GHSA-rchv-x836-w7xp)）。

**修正方法**:
```bash
# >= 2026.3.7にアップデート
openclaw update
```

---

### RC-019: sessions_spawnサンドボックス継承

**チェック**:
```bash
openclaw --version
```

**期待値**: `>= 2026.3.2`

**重要な理由**: 以前のバージョンでは、`runtime='acp'`を使った`sessions_spawn`経由でサンドボックスバイパスが可能です（[GHSA-474h](../vulnerabilities/acp-security.md)）。

**修正方法**:
```bash
# >= 2026.3.2にアップデート
openclaw update
```

---

## 中優先度チェック

### RC-003: DMペアリングレート制限

**チェック**:
```bash
openclaw config get dm.rateLimit
```

**期待値**: `true`

**修正方法**:
```bash
# DMペアリングのレート制限を有効化（ブルートフォース防止）
openclaw config set dm.rateLimit true
openclaw config set dm.rateLimit.maxAttempts 5
openclaw config set dm.rateLimit.window 3600  # 1時間
```

---

### RC-006: 自動アップデート有効化

**チェック**:
```bash
openclaw config get autoUpdate
```

**期待値**: `true`

**修正方法**:
```bash
# 迅速なセキュリティ修正のために自動アップデートを有効化
openclaw config set autoUpdate true
```

---

### RC-008: スキル外部URL監査

**チェック**:
```bash
# インストールされたスキルの外部URLフェッチを監査
grep -r 'WebFetch\|fetch(' ~/.openclaw/skills/
```

**期待値**: 外部URLフェッチなし（またはすべてレビュー済みで信頼されている）

**重要な理由**: 外部URLを取得するスキルは、プロンプトインジェクションのベクトルになる可能性があります。

**修正方法**:
```bash
# URLを取得する各スキルをレビュー
# オプション1: 信頼されないスキルを削除
openclaw skills uninstall <skill-name>

# オプション2: 信頼されたスキルを監査してallowlist
openclaw config set skills.urlFetchAllowlist "skill-name-1,skill-name-2"
```

---

### RC-009: ツール拒否リスト

**チェック**:
```bash
openclaw config get tools.deny
```

**期待値**: 危険なツールがブロックされている（例: `system.run`, `exec`）

**修正方法**:
```bash
# 危険なツールをブロック
openclaw config set tools.deny "system.run,exec,eval"
```

---

### RC-012: 信頼されない入力チャンネル

**チェック**:
```bash
openclaw config get channels
```

**期待値**: 信頼されないチャンネルなし または すべて秘密検証済み

**修正方法**:
```bash
# 各外部チャンネル（Telegram、Slack、webhooks）に対して:
# 1. 秘密検証を設定
openclaw config set channels.telegram.secret "$TELEGRAM_SECRET"
openclaw config set channels.slack.secret "$SLACK_SECRET"

# 2. 送信者allowlistを有効化
openclaw config set channels.telegram.allowlist "user1,user2"
```

---

### RC-017: プロキシ使用時のDNSピンニング

**チェック**:
```bash
openclaw config get proxy
openclaw --version
```

**期待値**: `>= 2026.3.2` または プロキシ未設定

**重要な理由**: 以前のバージョンでは、HTTPプロキシ設定時にDNSピンニングが失われ、DNSリバインディング経由でSSRFが可能になります（[GHSA-8mvx](https://github.com/openclaw/openclaw/security/advisories/GHSA-8mvx-p2r9-r375)）。

**修正方法**:
```bash
# プロキシを使用している場合は>= 2026.3.2にアップデート
openclaw update
```

---

## 包括的検証

上記のハードニング手順を適用した後、包括的監査を実行します：

```bash
# フルセキュリティ監査（>= v2026.3.0が必要）
openclaw security audit --deep

# 期待される出力:
# ✓ Sandbox: enabled (all)
# ✓ Gateway auth: configured
# ✓ Webhook secrets: configured
# ✓ Exec allowlist: restricted
# ✓ Approval mode: always
# ✓ Version: 2026.3.8 (up-to-date)
# ⚠ 2 medium-priority warnings (see details below)
```

---

## トラブルシューティング

### "openclaw security audit"コマンドが見つからない

**原因**: OpenClaw < v2026.3.0を実行中

**解決策**:
```bash
openclaw update
```

---

### サンドボックスモードがワークフローを壊す

**原因**: サンドボックスモードはファイルシステムとネットワークアクセスを制限します

**解決策**:
```bash
# オプション1: 選択的サンドボックスモードを使用
openclaw config set sandbox selective
openclaw config set sandbox.allowCommands "git,npm"

# オプション2: 特定のディレクトリをサンドボックスにマウント
openclaw config set sandbox.mounts "/path/to/project:/workspace"
```

---

### Gateway認証が正当なクライアントをブロックする

**原因**: クライアントが認証トークンで設定されていない

**解決策**:
```bash
# クライアント側で、トークンをエクスポート
export OPENCLAW_GATEWAY_TOKEN="your-token-here"

# または: CLI経由で渡す
openclaw-client --token "your-token-here"
```

---

## ハードニングチェックリスト

このチェックリストをコピーして、各ステップを完了したらチェックしてください：

```markdown
## クリティカル（High深刻度）
- [ ] RC-001: サンドボックス有効化（mode=all）
- [ ] RC-002: Gateway認証設定済み
- [ ] RC-004: Exec allowlist最小化済み
- [ ] RC-005: Webhook秘密検証有効化済み
- [ ] RC-007: プロンプトインジェクション攻撃面削減済み
- [ ] RC-010: Human-in-the-loop承認有効化済み
- [ ] RC-011: GatewayをLoopbackのみにバインド済み
- [ ] RC-013: CLAUDE.mdをCODEOWNERSで保護済み
- [ ] RC-014: GitHub Actionsワークフロー安全（pull_request_targetなし）
- [ ] RC-015: ACPディスパッチサンドボックス継承（>= 2026.3.1）
- [ ] RC-016: system.run承認バインディング（>= 2026.3.8）
- [ ] RC-018: Gateway UI認証漏洩修正済み（>= 2026.3.7）
- [ ] RC-019: sessions_spawnサンドボックス継承（>= 2026.3.2）

## 中優先度
- [ ] RC-003: DMペアリングレート制限有効化済み
- [ ] RC-006: 自動アップデート有効化済み
- [ ] RC-008: スキル外部URL監査済み
- [ ] RC-009: 危険なツール拒否済み
- [ ] RC-012: 信頼されないチャンネル認証済み
- [ ] RC-017: DNSピンニングがプロキシで維持（>= 2026.3.2）

## 検証
- [ ] 実行: openclaw security audit --deep
- [ ] すべてのチェックが成功、または警告が文書化されている
- [ ] セキュリティ設定がプロジェクトREADMEに文書化されている
```

---

## 関連リソース

- [Exec Allowlist バイパス脆弱性](../vulnerabilities/exec-bypass.md)
- [ACP セキュリティ脆弱性](../vulnerabilities/acp-security.md)
- [CI/CD サプライチェーン脆弱性](../vulnerabilities/cicd-supply-chain.md)
- [OWASP LLM Top 10 マッピング](owasp-llm-mapping.md)
- [チャンネルセキュリティガイド](channel-security.md)

---

**最終更新**: 2026-03-14
**データベースバージョン**: vulnerability-db.json (2026-03-11、19件のランタイムチェック)
