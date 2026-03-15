# 破壊的変更ガイド - v2026.3.x

## 概要

OpenClaw v2026.3.xシリーズは、重大なセキュリティ脆弱性に対処するため、いくつかの**破壊的変更**を導入しています。このガイドは、新しい動作を理解し、移行するのに役立ちます。

**対象読者**: システム管理者、DevOpsエンジニア、セキュリティチーム

**アップグレードパス**: v2026.2.x → v2026.3.8（最新）

## 破壊的変更のサマリー

| 変更 | 影響 | 移行難易度 |
|--------|--------|---------------------|
| サンドボックス継承の強制 | 高 | 中 |
| Exec承認バインディング | 中 | 低 |
| 空Allowlistの失敗クローズ | 高 | 低 |
| Gateway認証情報ストレージ | 低 | 低 |

---

## 1. サンドボックス継承の強制

### 変更内容

**v2026.3.1以前**: サンドボックスモードで`sessions_spawn(runtime="acp")`がホストACPセッションを初期化でき、サンドボックスをバイパス可能でした。

**v2026.3.2以降**: サンドボックス化されたエージェントからの全`sessions_spawn`呼び出しは、サンドボックス設定を**継承しなければなりません**。ホストACP初期化はブロックされます。

### 変更理由

**セキュリティ問題**: GHSA-474h-prjg-mmw3, GHSA-p7gr-f84w-hqg5, GHSA-9q36-67vc-rrwg

サンドボックス化されたエージェントが、サンドボックス化されていないACPセッションをスポーンすることで隔離をエスケープし、無制限のホストアクセスを獲得できました。

### デプロイメントへの影響

以下の場合、**高い影響**があります:
- `sessions_spawn`でマルチエージェント調整を使用
- スポーンされたエージェントが異なるサンドボックス設定を持つことに依存
- スポーンされたエージェントがホストで実行されることを期待する自動化がある

**動作しなくなるコードの例**:
```javascript
// サンドボックス化されたエージェント内（OPENCLAW_SANDBOX=all）
const childSession = await sessions_spawn({
  runtime: "acp",
  prompt: "このファイルを分析"
});
// 以前: childSessionはホストで実行（サンドボックスなし）❌
// 以降: childSessionはサンドボックスを継承 ✅
```

### 移行手順

#### ステップ1: sessions_spawn呼び出しを監査

```bash
# 全sessions_spawn使用を検索
grep -r "sessions_spawn" --include="*.js" --include="*.ts"

# サンドボックス化されていないスポーンに依存しているか確認
```

#### ステップ2: スポーン設定を更新

特定のスポーンされたセッションにホストアクセスが必要な場合:

```javascript
// オプションA: 親エージェントをサンドボックスなしで実行
// 特定のワークフローにOPENCLAW_SANDBOX=non-mainまたはoffを設定

// オプションB: 明示的な権限を使用
const childSession = await sessions_spawn({
  runtime: "acp",
  prompt: "ホストアクセスが必要なタスク",
  // ホストアクセスが必要な理由を文書化
  // セキュリティへの影響を考慮
});
```

#### ステップ3: マルチエージェントワークフローをテスト

```bash
# OPENCLAW_SANDBOX=allでステージングでテスト
export OPENCLAW_SANDBOX=all
openclaw run your-multi-agent-workflow.js

# スポーンされたエージェントがサンドボックスを尊重することを確認
```

---

## 2. Exec承認バインディング

### 変更内容

**v2026.3.1以前**: `system.run`承認が以下をバインドしませんでした:
- PATH解決された実行可能ファイルのID
- スクリプトファイルのコンテンツ（可変スクリプトの場合）

攻撃者が承認後・実行前にPATHまたはスクリプトコンテンツを変更可能でした。

**v2026.3.1以降**: 承認が以下をバインド:
- 完全な実行可能ファイルパス（コマンド名だけでなく）
- スクリプトコンテンツハッシュ（ファイルベーススクリプトの場合）

### 変更理由

**セキュリティ問題**: GHSA-q399-23r3-hfx4, GHSA-8g75-q649-6pv6

### デプロイメントへの影響

以下の場合、**中程度の影響**があります:
- 承認ワークフローで`system.run`を使用
- 承認と実行の間でPATHを動的に変更
- 承認後にスクリプトを編集

**動作しなくなる挙動の例**:
```javascript
// 1. ユーザーが承認: system.run("node", ["script.js"])
// 承認がバインド: /usr/bin/node + hash(script.js)

// 2. 攻撃者がscript.jsを変更
// 以前: 変更されたスクリプトを実行 ❌
// 以降: 承認が拒否される - コンテンツハッシュ不一致 ✅

// 3. 攻撃者が悪意のある'node'を含むようにPATHを変更
// 以前: /tmp/evil/nodeを実行 ❌
// 以降: 承認が拒否される - パス不一致 ✅
```

### 移行手順

#### ステップ1: ほとんどの場合、対応不要

承認と実行の間でPATHやスクリプトを変更しない場合、**変更不要**です。

#### ステップ2: スクリプトを変更するワークフローを更新

承認と実行の間で正当にスクリプトを編集する場合:

```javascript
// ❌ 古いパターン（現在は失敗）
// 1. 承認をリクエスト
const approval = await requestApproval("node", ["script.js"]);

// 2. スクリプトを変更（例: ログ追加）
fs.writeFileSync("script.js", updatedContent);

// 3. 実行（失敗 - コンテンツハッシュ不一致）
await system.run("node", ["script.js"], { approval });

// ✅ 新しいパターン
// スクリプトを確定した後に承認をリクエスト
const updatedContent = addLogging(originalContent);
fs.writeFileSync("script.js", updatedContent);

const approval = await requestApproval("node", ["script.js"]);
await system.run("node", ["script.js"], { approval });
```

#### ステップ3: PATH操作を避ける

```javascript
// ❌ これをしないで
process.env.PATH = "/custom/bin:" + process.env.PATH;
await system.run("mycommand"); // 承認が失敗する可能性

// ✅ 絶対パスを使用
await system.run("/usr/local/bin/mycommand");
```

---

## 3. 空Allowlistの失敗クローズ

### 変更内容

**v2026.3.2以前**: 空の`allowFrom`または`allowedUserIds`配列が「全員許可」として解釈されることがありました。

**v2026.3.8以降**: 空のallowlistは**常に**アクセスを拒否します（失敗クローズ）。

### 変更理由

**セキュリティ問題**: GHSA-g7cr-9h7q-4qxq, GHSA-gw85-xp4q-5gp9

空のallowlistが未認証ユーザーに意図しないアクセスを作成しました。

### デプロイメントへの影響

以下の場合、**高い影響**があります:
- 空の`allowFrom`または`allowedUserIds`を持つチャンネルがある
- 「全員許可」の動作に空リストを使用していた
- 送信者レベルのallowlistなしでルートレベルのallowlistを使用

**動作しなくなる設定の例**:
```yaml
# 以前: 空のallowlistが全送信者を許可 ❌
channels:
  teams:
    allowFrom: []  # 「全員許可」として解釈されていた

# 以降: 空のallowlistが全員を拒否 ✅
# allowlistを明示的に設定する必要がある
channels:
  teams:
    allowFrom:
      - sender: "alice@example.com"
      - sender: "bob@example.com"
```

### 移行手順

#### ステップ1: 全チャンネル設定を監査

```bash
# 空のallowlistを持つチャンネルを検索
openclaw channels list --show-allowlists | grep -A 5 "allowFrom: \[\]"
```

#### ステップ2: 明示的なAllowlistを追加

```yaml
# ❌ 動作しなくなる設定
channels:
  discord:
    allowFrom: []

# ✅ 修正済み設定（オプション1: 特定ユーザー）
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"
      - user_id: "987654321098765432"

# ✅ 修正済み設定（オプション2: ペアリング経由でDMを開放）
channels:
  discord:
    dmPolicy: paired  # DMにペアリングを要求
    # グループチャンネルはまだallowFromが必要
```

#### ステップ3: アクセス制御をテスト

```bash
# 未認可アカウントでテスト
# アップグレード後は拒否されるべき

# 認可されたアカウントでテスト
# まだ動作するべき
```

---

## 4. Gateway認証情報ストレージ

### 変更内容

**v2026.3.7以前**: ダッシュボードがgateway認証トークンをブラウザの`localStorage`とURLクエリパラメータに保存していました。

**v2026.3.7以降**: 認証情報がブラウザストレージとURLから削除されました（安全なHTTP-onlyクッキーまたはサーバー側セッションに保存）。

### 変更理由

**セキュリティ問題**: GHSA-rchv-x836-w7xp

ブラウザストレージの認証トークンはXSS攻撃とブラウザ拡張機能に対して脆弱です。

### デプロイメントへの影響

**低い影響**: アップグレード後の最初のダッシュボードアクセス時に自動移行。

### 移行手順

#### ステップ1: ブラウザストレージをクリア（オプション）

```javascript
// ブラウザから古い認証トークンをクリア
localStorage.removeItem('gateway_auth_token');
sessionStorage.removeItem('gateway_auth_token');
```

#### ステップ2: カスタムダッシュボード統合を更新

gateway認証にアクセスするカスタムコードがある場合:

```javascript
// ❌ 古いコード（もう動作しない）
const token = localStorage.getItem('gateway_auth_token');

// ✅ 新しいコード（トークンはサーバーで処理）
// クライアント側のトークンアクセスは不要
// 認証はHTTP-onlyクッキー経由で自動的にリクエストに含まれる
```

---

## 検証チェックリスト

v2026.3.8にアップグレードした後、以下を確認してください:

### サンドボックス設定

```bash
# ✅ サンドボックスが有効であることを確認
export OPENCLAW_SANDBOX=all
openclaw --version

# ✅ sessions_spawnがサンドボックスを継承することをテスト
# 子セッションをスポーンするテストスクリプトを作成
# 子がホストファイルにアクセスできないことを確認
```

### Exec承認

```bash
# ✅ 承認バインディングをテスト
# 1. コマンドの承認をリクエスト
# 2. PATHを変更を試行
# 3. コマンドを実行 - "approval invalid"で失敗すべき

# ✅ スクリプトハッシュバインディングをテスト
# 1. スクリプトの承認をリクエスト
# 2. スクリプトコンテンツを変更
# 3. 実行 - "content mismatch"で失敗すべき
```

### Allowlist設定

```bash
# ✅ 全チャンネルを監査
openclaw channels audit --check empty-allowlist

# ✅ 未認可アクセスをテスト
# リストにない送信者からのアクセスを試行 - 拒否されるべき

# ✅ 認可されたアクセスをテスト
# allowlistにある送信者からのアクセスを試行 - 動作すべき
```

### Gateway認証

```bash
# ✅ ダッシュボードログイン
# まだダッシュボードにログインできることを確認
# ブラウザdevtoolsをチェック - localStorageに認証トークンがない

# ✅ Gateway API呼び出し
# API呼び出しがまだ認証されていることを確認
# 認証はHTTP-onlyクッキー経由であるべき
```

---

## ロールバック手順（緊急時のみ）

重大な問題が発生しロールバックが必要な場合:

```bash
# ⚠️ 警告: ロールバックはセキュリティ脆弱性を露出します
# 絶対に必要な場合のみロールバック

# 1. v2026.2.xにダウングレード
npm install -g openclaw@2026.2.26

# 2. OpenClawを再起動
systemctl restart openclaw

# 3. ログを監視
tail -f /var/log/openclaw/openclaw.log

# 4. 適切な設定で即座の再アップグレードを計画
```

**v2026.2.xに留まらないでください** - 重大な脆弱性が含まれています。

---

## サポートリソース

- **移行問題**: https://github.com/openclaw/openclaw/issues でissueを開く
- **セキュリティに関する質問**: security@openclaw.aiに連絡
- **関連ガイド**:
  - [ハードニングガイド](./hardening-guide.md)
  - [チャンネルセキュリティ](./channel-security.md)
  - [v2026.3.x変更ログ](../updates/v2026.3.x-changelog.md)

## 参考資料

- **GHSA-474h-prjg-mmw3**: サンドボックス継承バイパス
- **GHSA-q399-23r3-hfx4**: Exec承認PATHバインディング
- **GHSA-g7cr-9h7q-4qxq**: 空allowlistの失敗オープン
- **GHSA-rchv-x836-w7xp**: Gateway認証情報漏洩
