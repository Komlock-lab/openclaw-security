# チャンネルセキュリティベストプラクティス

## 概要

OpenClawは15以上のメッセージングプラットフォーム（WhatsApp、Telegram、Discord、Slack、LINE、Signal、iMessage、MS Teams、Zalo、Matrix、Nextcloud Talk、Twitch、Feishu、Synology Chat等）をサポートしています。各チャンネルは独自の認証・認可メカニズムを持ち、これまでに**25件以上の認証バイパス脆弱性**が発見されています。

本ガイドでは、複数のメッセージングチャンネル全体でOpenClawデプロイメントを保護するためのベストプラクティスを提供し、認証バイパス、送信者なりすまし、不正アクセスの防止に焦点を当てます。

**主要リスク**:
- **DMペアリング脆弱性**: レート制限のギャップ、pairing-storeスコープ問題
- **Allowlistバイパス**: プラットフォーム間の送信者識別の不一致
- **OAuth/認証失敗**: ブートストラップ失敗、トークン検証順序の問題

**最終更新**: 2026-03-12

## 認証メカニズム

### 1. DMペアリング

**仕組み**: ユーザーがボットにDMを送信すると、8文字の英数字ペアリングコード（40ビットエントロピー）を受け取ります。ペアリングコードは1時間以内に入力する必要があります。

**セキュリティ上の考慮事項**:
- **ブルートフォースリスク**: ペアリングコード試行にレート制限がない（Issue #16458、未解決）
- **分散インフラ**: 十分なリソースがあれば、攻撃者は1時間以内にコードをブルートフォース可能
- **クロスアカウントスコープ**: ペアリングコードが誤ったスコープで保存され、意図しないアクセスを許可

**安全な設定**:
```yaml
channels:
  discord:
    dmPolicy: paired  # デフォルト、ペアリングが必要
    # 避ける: dmPolicy: open (任意のDM送信者を許可)
```

### 2. Allowlistベースの認可

**仕組み**: 管理者が送信者allowlist（`allowFrom`、`allowedUserIds`）を設定し、ボットと対話できるユーザーを制限します。

**セキュリティ上の考慮事項**:
- **送信者識別の違い**: 各プラットフォームは異なる識別子（ユーザーID、表示名、ユーザー名）を使用
- **表示名衝突**: 4つのプラットフォームで表示名/ユーザー名なりすましの脆弱性（Feishu、Telegram、Nextcloud Talk、Matrix）
- **失敗オープンのデフォルト**: 空のallowlistが「全員拒否」ではなく「全員許可」として解釈されることがある

**安全な設定**:
```yaml
channels:
  slack:
    allowFrom:
      - user_id: U012345  # 表示名ではなくユーザーIDを使用
      - user_id: U067890

  telegram:
    allowedUserIds:
      - 123456789  # @usernameではなく数値ユーザーIDを使用
```

### 3. OAuth/トークンベース認証

**仕組み**: 特定の統合（macOSオンボーディング、Canvas、Tailscale）はOAuthフローまたはトークンベース認証を使用します。

**セキュリティ上の考慮事項**:
- **予測可能なState**: OAuthステートパラメータがタイムスタンプベース（Issue #12551）
- **PKCE Verifier漏洩**: PKCE code verifierがOAuthステートで漏洩（GHSA-6g25-pc82-vfwp）
- **ブートストラップ失敗**: ブートストラップ失敗後もブラウザ認証が認証なしで継続（GHSA-vpj2-69hf-rppw）

**安全な設定**:
- 暗号論的にランダムなOAuthステートパラメータを使用
- 続行前にOAuthコールバックを検証
- 認証ブートストラップ失敗時に失敗クローズ

## 一般的な脆弱性

### パターン1: DMペアリング脆弱性（7件以上）

**根本原因**: DMペアリング実装の構造的弱点。

**既知の問題**:
- **ブルートフォース**（Issue #16458、OPEN）: レート制限なし、40ビットエントロピー
- **Pairing-Storeスコープ**（7件のアドバイザリ）: クロスアカウント、クロスチャンネルスコープ漏洩

**影響チャンネル**:
- BlueBubbles (GHSA-25pw-4h6w-qwvm)
- Signal (GHSA-wm8r-w8pf-2v6w)
- LINE (GHSA-gp3q-wpq4-5c5h) - 高深刻度
- iMessage (CVE-2026-26328)
- クロスアカウント全般 (GHSA-vjp8-wprm-2jw9, GHSA-jv6r-27ww-4gw4)

**緩和策**:
```yaml
channels:
  all:
    dmPolicy: paired  # DMにペアリングを要求
    # 高セキュリティデプロイメントでは、DMアクセス自体の制限を検討
```

### パターン2: Allowlistバイパス（10件以上）

**根本原因**: プラットフォームごとに送信者識別方法が異なり、なりすましが可能。

**バイパス手法**:
| 手法 | 件数 | 影響チャンネル |
|------|------|---------------|
| 表示名/ユーザー名衝突 | 4件 | Feishu、Telegram、Nextcloud Talk、Matrix |
| Allowlist未強制/スキップ | 3件 | Slack、Twitch、Synology Chat |
| ID衝突/スラグ衝突 | 2件 | Discord、Slack |
| 空リストの失敗オープン | 1件 | Synology Chat |

**緩和策**:
```yaml
# ✅ 良い: プラットフォーム固有のユーザーIDを使用
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"

  matrix:
    allowFrom:
      - user_id: "@alice:matrix.org"  # 表示名ではなく完全なMXID

# ❌ 悪い: 表示名やユーザー名を使用
channels:
  telegram:
    allowFrom:
      - username: "@alice"  # ユーザー名は変更可能
```

**具体的なアドバイザリ**:
- **GHSA-x2ff-j5c2-ggpr** (Slack): インタラクティブコールバックの送信者チェックスキップ
- **GHSA-r5h9-vjqc-hq3r** (Nextcloud Talk): 表示名なりすまし
- **GHSA-33rq-m5x2-fvgf** (Twitch): allowFromが強制されない
- **GHSA-gw85-xp4q-5gp9** (Synology Chat): 空のallowedUserIdsが失敗オープン

### パターン3: OAuth/認証失敗（5件）

**既知の問題**:
- **GHSA-rv39-79c4-7459**: auth.token検証前にデバイスIDチェックがスキップされる
- **GHSA-hff7-ccv5-52f8**: Tailscaleトークンなし認証がHTTPルートに適用
- **GHSA-vvjh-f6p9-5vcf**（高）: Canvas UI認証バイパス（ZDI-CAN-29311）
- **GHSA-vpj2-69hf-rppw**: ブートストラップ失敗後もブラウザ認証が継続

**緩和策**:
- 全OAuth関連修正のためv2026.3.1以降にアップデート
- ランタイムチェックRC-003（auth-bootstrap-validation）を有効化

### パターン4: v2026.3.x系の新規バイパス（6件）

**最近の発見**（全てv2026.3.8で修正済み）:
- **GHSA-g7cr-9h7q-4qxq**: MS Teams送信者allowlistバイパス（ルートallowlist設定時+送信者allowlist空）
- **GHSA-pjvx-rx66-r3fg**: `/allowlist --store`のアカウントスコーピング不備によるクロスアカウント認可
- **GHSA-wpg9-4g4v-f9rc**: Discord音声トランスクリプトのオーナーフラグ欠落
- **GHSA-v865-p3gq-hw6m**: エンコードパスでプラグイン`/api/channels`ルート分類を回避
- **GHSA-vpj2-69hf-rppw**: ブートストラップ失敗後もブラウザ認証が認証なしで継続
- **GHSA-8m9v-xpgf-g99m**: stopトリガーと`/models`コマンドの認証なし送信者バイパス

**緩和策**: **v2026.3.8以降**に即座にアップグレード。

## 個別チャンネルの保護

### WhatsApp、Telegram、LINE

**リスク**: ユーザー名/表示名衝突。

**安全な設定**:
```yaml
channels:
  telegram:
    allowedUserIds:
      - 123456789  # 数値ユーザーID（不変）
      # 避ける: @username（変更可能）

  line:
    allowedUserIds:
      - "U1234567890abcdef"  # LINE ユーザーID（不変）
      # 避ける: displayName（変更可能）
```

### Discord、Slack、MS Teams

**リスク**: ID衝突、空の送信者リストによるallowlistバイパス。

**安全な設定**:
```yaml
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"  # Discord snowflake ID

  slack:
    allowFrom:
      - user_id: "U012345"  # Slack ユーザーID
      # 避ける: display_name

  teams:
    allowFrom:
      - sender: "alice@example.com"
    # 送信者allowlistは常に明示的に設定（空にしない）
```

### Matrix、Nextcloud Talk

**リスク**: クロスホームサーバーなりすまし、表示名衝突。

**安全な設定**:
```yaml
channels:
  matrix:
    allowFrom:
      - user_id: "@alice:matrix.org"  # ホームサーバーを含む完全なMXID
      # ホームサーバー部分が検証されることを確認

  nextcloud_talk:
    allowFrom:
      - user_id: "alice"  # Nextcloud ユーザーID
      # 避ける: displayName
```

### Synology Chat、Feishu、Zalo

**リスク**: 空allowlistの失敗オープン、グループ送信者バイパス。

**安全な設定**:
```yaml
channels:
  synology_chat:
    allowedUserIds:
      - "user1"
      - "user2"
    # 空にしない（失敗オープンリスク）

  feishu:
    allowFrom:
      - user_id: "ou_xxxxx"  # Feishu open_id
      # 避ける: displayName（衝突リスク）

  zalo:
    allowFrom:
      - user_id: "123456789"
    # グループ送信者allowlistは別途設定
```

## 設定ベストプラクティス

### 1. 常に最新バージョンへアップグレード

**重要**: 全ての認証バイパス修正を受け取るため、**v2026.3.8以降**にアップグレードしてください。

```bash
# 現在のバージョンを確認
openclaw --version

# アップグレード（npmの例）
npm install -g openclaw@latest
```

### 2. 明示的なAllowlist設定

**原則**: デフォルトに依存しない。常に送信者allowlistを明示的に設定する。

```yaml
# ✅ 良い: 明示的なallowlist
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"

# ❌ 悪い: 空のallowlist（失敗オープンリスク）
channels:
  discord:
    allowFrom: []
```

### 3. 不変の識別子を使用

**原則**: ユーザー名や表示名よりもプラットフォーム固有のユーザーIDを優先する。

| プラットフォーム | 使用する | 避ける |
|----------|-----|-------|
| Telegram | 数値ユーザーID | @username |
| Discord | Snowflake ID | username#discriminator |
| LINE | ユーザーID | displayName |
| Matrix | 完全なMXID | 表示名 |

### 4. DMアクセスを制限

**原則**: `dmPolicy: open`ではなく`dmPolicy: paired`（デフォルト）を使用する。

```yaml
channels:
  all:
    dmPolicy: paired  # DMにペアリングを要求

# dmPolicy: openは低セキュリティテスト環境でのみ使用
```

### 5. ランタイムチェックを有効化

**原則**: OpenClawランタイムチェックを使用して設定ミスを検出する。

```bash
# DMペアリングレート制限チェックを有効化（提案中、未実装）
openclaw --runtime-check dm-pairing-rate-limit

# Allowlist厳密性チェックを有効化（提案中）
openclaw --runtime-check allowlist-strictness

# 認証ブートストラップ検証を有効化
openclaw --runtime-check auth-bootstrap-validation
```

包括的なランタイムチェック設定は [ハードニングガイド](./hardening-guide.md) を参照してください。

### 6. チャンネル設定を定期的に監査

**原則**: 全アクティブチャンネルのallowlist設定を定期的にレビューする。

```bash
# 全チャンネル設定をリスト
openclaw channels list --show-allowlists

# 空のallowlistを監査
openclaw channels audit --check empty-allowlist
```

## 攻撃チェーンの例

### 例1: 表示名なりすまし（Nextcloud Talk）

```
1. 攻撃者が正規ユーザーと一致する表示名を設定（例: "Alice"）
2. OpenClawのallowFromが表示名でマッチング
3. 攻撃者が"Alice"として認証される
4. 攻撃者がオーナー限定ツールにアクセス
```

**防御**: Nextcloudユーザーネームの代わりにユーザーIDを使用する。

### 例2: 空Allowlistの失敗オープン（MS Teams）

```
1. 管理者がルートallowlistを設定（例: /models）
2. 送信者allowlistが空のまま（意図しない）
3. 空のallowlistが「全員許可」として解釈される
4. 認証されていないユーザーがボットにアクセス
```

**防御**: 送信者allowlistを常に明示的に設定（空にしない）。

### 例3: DMペアリングのブルートフォース

```
1. 攻撃者がボットにDMを送信
2. ボットがペアリングコードリクエストで応答
3. 攻撃者がブルートフォースを試行（レート制限なし）
4. 分散インフラで1時間以内に成功
5. 攻撃者がボットへの完全なアクセスを獲得
```

**防御**: Issue #16458のレート制限実装を監視する。高セキュリティデプロイメントでは、DMアクセス自体を無効化することを検討。

## 検証

### Allowlist設定のテスト

```bash
# 送信者認証をテスト（攻撃者として）
# 1. 正規ユーザーと一致する表示名でテストアカウントを作成
# 2. ボットにメッセージを送信
# 3. ボットがメッセージを拒否することを確認（認証失敗すべき）

# 空allowlistのテスト（管理者として）
# 1. 空のallowedUserIdsでチャンネルを設定
# 2. 未認可アカウントからアクセスを試行
# 3. ボットがアクセスを拒否することを確認（失敗オープンしないこと）
```

### 監査ログのレビュー

```bash
# 認証失敗をレビュー
grep "auth failed" /var/log/openclaw/auth.log

# ペアリングコード試行をチェック
grep "pairing code" /var/log/openclaw/auth.log | wc -l
```

## 関連リソース

- **ランタイムチェック**: [ハードニングガイド - ランタイムチェック](./hardening-guide.md)
- **テスト**: `tests/channel-spoofing/` ディレクトリにテストケースがあります
- **脆弱性データベース**: `data/vulnerability-db.json`（25件以上の認証バイパスエントリ）
- **関連ガイド**:
  - [OWASP LLM Top 10マッピング](./owasp-llm-mapping.md)
  - [シークレット漏洩の防止](../vulnerabilities/secret-leakage.md)

## 参考資料

- **OpenClaw Security Advisories**: https://github.com/openclaw/openclaw/security/advisories
- **送信者識別パターン**: ナレッジ記事 `2026-03-12-channel-auth-bypass-patterns.md`
- **DMペアリングブルートフォース**: Issue #16458（OPEN、stale）
- **CWE-287**: Improper Authentication
- **CWE-290**: Authentication Bypass by Spoofing
