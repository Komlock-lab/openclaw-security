---
date: 2026-03-12
category: vulnerabilities
subcategory: auth-bypass
severity: high
source: https://github.com/openclaw/openclaw/security/advisories
affects: openclaw
tags: [auth-bypass, channel-spoofing, DM-pairing, allowlist, sender-verification, multi-channel]
---

# チャンネル別認証バイパスの体系的分類

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-03-12 |
| カテゴリ | auth-bypass |
| 重要度 | High |
| 累計バイパス件数 | 25件以上（DM pairing 7件 + allowlistバイパス 10件 + OAuth/認証 5件 + 新規v2026.3.x 5件） |
| 影響チャンネル | 15以上のメッセージングプラットフォーム |
| OpenClawへの影響 | 認証の根本的な弱点がパターン化 |

## 概要

OpenClawは15以上のメッセージングプラットフォーム（WhatsApp, Telegram, Discord, Slack, LINE, Signal, iMessage, MS Teams, Zalo, Matrix, Nextcloud Talk, Twitch, Feishu, Synology Chat等）に対応しているが、各チャンネルの認証・認可メカニズムで**繰り返しバイパスが発見**されている。

これらのバイパスは以下の3つの根本原因に起因する:
1. **DMペアリングの設計上の弱点**: レート制限欠如、pairing-storeのスコープ問題
2. **allowlist実装の不一致**: 各チャンネルで「送信者識別」の方法が異なり、統一的な防御が困難
3. **認証状態の検証不足**: ブートストラップ失敗後の継続、認証なし送信者の通過

## バイパスパターンの分類

### パターン1: DMペアリングの脆弱性（7件 + ブルートフォース）

DMペアリングはOpenClawの基本認証メカニズムだが、複数の構造的問題がある。

#### ブルートフォース攻撃（未修正）

| 項目 | 内容 |
|------|------|
| Issue | #16458 |
| ステータス | OPEN（staleラベル付き） |

- ペアリングコード: 8文字、32文字アルファベット（エントロピー約40ビット）
- TTL: 1時間、同時ペンディング最大3
- **レート制限なし**: 分散インフラで1時間以内にブルートフォース可能

#### pairing-storeスコープ問題（修正済み、パターン化）

| GHSA ID | 深刻度 | 影響チャンネル | 概要 |
|---------|--------|---------------|------|
| GHSA-vjp8-wprm-2jw9 | Low | クロスアカウント全般 | pairing-storeのクロスアカウントスコープ |
| GHSA-25pw-4h6w-qwvm | Low | BlueBubbles | チャンネル固有のスコープ問題 |
| GHSA-jv6r-27ww-4gw4 | Medium | 全般 | グループallowlist認可の拡張 |
| GHSA-wm8r-w8pf-2v6w | Low | Signal | Signalチャンネル固有のスコープ |
| GHSA-gp3q-wpq4-5c5h | High | LINE | LINEチャンネルの深刻なスコープ問題 |
| GHSA-553v-f69r-656j | Medium | 全般 | 未ペアリングデバイスの自己割り当て |
| GHSA-g34w-4xqq-h79m (CVE-2026-26328) | Medium | iMessage | iMessage固有のスコープ問題 |

**共通パターン**: DMペアリングストアに保存されたIDが、意図しないグループ/チャンネルのallowlist認可を満たしてしまう。

### パターン2: チャンネル別allowlistバイパス（10件）

各チャンネルの送信者識別方法の違いを悪用するバイパス群。**10以上のプラットフォームで発見**されており、設計レベルの問題を示唆。

| GHSA ID | 深刻度 | チャンネル | バイパス手法 |
|---------|--------|-----------|-------------|
| GHSA-x2ff-j5c2-ggpr | High | Slack | インタラクティブコールバック送信者チェックスキップ |
| GHSA-4cqv-h74h-93j4 | Medium | Discord | `allowFrom` スラグ衝突 |
| GHSA-j4xf-96qf-rx69 | Medium | Feishu | 表示名衝突 |
| GHSA-mj5r-hh7j-4gxf | Medium | Telegram | 可変ユーザー名の受け入れ |
| GHSA-r5h9-vjqc-hq3r | High | Nextcloud Talk | 表示名なりすまし |
| GHSA-rmxw-jxxx-4cpc | Medium | Matrix | displayName + クロスホームサーバーlocalpart |
| GHSA-33rq-m5x2-fvgf | High | Twitch | allowFromの未強制 |
| GHSA-v773-r54f-q32w | Medium | Slack | dmPolicy=openで任意DM送信者が特権コマンド実行可 |
| GHSA-534w-2vm4-89xr | Medium | Zalo | グループ送信者allowlistバイパス |
| GHSA-gw85-xp4q-5gp9 | Medium | Synology Chat | 空allowedUserIdsでdmPolicyが失敗オープン |

#### バイパス手法の分析

| 手法 | 件数 | 影響チャンネル |
|------|------|---------------|
| 表示名/ユーザー名衝突 | 4件 | Feishu, Telegram, Nextcloud Talk, Matrix |
| allowlist未強制/スキップ | 3件 | Slack, Twitch, Synology Chat |
| ID衝突/スラグ衝突 | 2件 | Discord, Slack |
| 空リストの失敗オープン | 1件 | Synology Chat |

### パターン3: OAuth/認証の根本的問題（5件）

| GHSA ID / Issue | 深刻度 | 問題 | 概要 |
|-----------------|--------|------|------|
| Issue #12551 | Medium | OAuth state予測可能 | タイムスタンプベースのstateパラメータ |
| GHSA-6g25-pc82-vfwp | Medium | PKCEバリファイア漏洩 | macOSベータオンボーディングでOAuth stateに漏洩 |
| GHSA-rv39-79c4-7459 | Medium | デバイスIDチェックスキップ | auth.token検証前にデバイスIDチェックが省略 |
| GHSA-hff7-ccv5-52f8 | Medium | Tailscale auth bypass | tokenless Tailscale authがHTTPルートに適用 |
| GHSA-vvjh-f6p9-5vcf | High | Canvas認証バイパス | ZDI-CAN-29311: Canvas UIの認証バイパス |

### パターン4: v2026.3.x系で新たに発見された認証バイパス（5件）

| GHSA ID | 修正バージョン | 問題 | 概要 |
|---------|--------------|------|------|
| GHSA-g7cr-9h7q-4qxq | >= 2026.3.8 | MS Teams allowlist | ルートallowlist設定時+空送信者allowlistでバイパス |
| GHSA-pjvx-rx66-r3fg | >= 2026.3.7 | クロスアカウント認可 | /allowlist --storeのアカウントスコーピング不備 |
| GHSA-wpg9-4g4v-f9rc | >= 2026.3.2 | Discord owner flag | 音声トランスクリプトのオーナーフラグ欠落 |
| GHSA-v865-p3gq-hw6m | >= 2026.3.2 | API path bypass | エンコードパスでプラグインルート分類を回避 |
| GHSA-vpj2-69hf-rppw | >= 2026.3.1 | ブラウザ認証 | 認証ブートストラップ失敗後も認証なしで継続 |
| GHSA-8m9v-xpgf-g99m | >= 2026.3.1 | 認証なし送信者 | stopトリガーと/modelsコマンドの認可バイパス |

## 深刻度分析

| 深刻度 | 件数 | 主な問題 |
|--------|------|---------|
| High | 6件 | Slack, LINE, Nextcloud Talk, Twitch, Canvas |
| Medium | 16件 | 多数のチャンネルでのallowlistバイパス、OAuth問題 |
| Low | 3件 | pairing-storeスコープ（限定的影響） |

## 根本原因の分析

### 1. 送信者識別の非統一性

各メッセージングプラットフォームが異なるIDスキーマ（ユーザーID、表示名、スラグ、メールアドレス等）を使用しており、OpenClawが統一的に「誰が送信したか」を判定することが困難。

```
Slack:      user_id (U012345) + display_name + workspace
Discord:    user_id (123456789) + username#discriminator
Telegram:   user_id + @username (変更可能)
Matrix:     @user:homeserver.org (クロスホームサーバー)
LINE:       userId (不可逆) + displayName (変更可能)
```

### 2. 失敗オープンのデフォルト

複数のチャンネルで、allowlistが空の場合やconfigが未設定の場合に**アクセスを拒否するのではなく許可する**（fail-open）設計になっている。

### 3. 認証状態の暗黙的信頼

認証ブートストラップの失敗、トークン検証の順序不一致など、**認証プロセスの中間状態を安全に処理できていない**ケースが複数存在。

## 攻撃チェーンの例

```
パターンA: 表示名なりすまし
  1. 攻撃者が正規ユーザーと同じ表示名を設定（例: Nextcloud Talk）
  2. allowFromが表示名ベースで判定
  3. 正規ユーザーとして認証される
  4. owner-onlyツールにアクセス可能

パターンB: 空allowlist + 失敗オープン
  1. 管理者がルートallowlistを設定（例: MS Teams）
  2. 送信者allowlistは未設定（空）
  3. 空allowlistが「全員許可」として解釈される
  4. 未認証ユーザーがボットにアクセス可能

パターンC: DMブルートフォース
  1. 攻撃者がボットにDMを送信
  2. ペアリングコード要求を受ける
  3. レート制限なしで大量の候補コードを試行
  4. 分散環境で1時間以内にブルートフォース成功
  5. ボットとのペアリング完了、全機能にアクセス
```

## 防御推奨事項

### 即時対応
1. **v2026.3.8以降へのアップデート**: 既知の認証バイパスがすべて修正済み
2. **allowlistの明示的設定**: 全チャンネルで送信者allowlistを明示的に設定（空にしない）
3. **dmPolicyの確認**: `dmPolicy: paired`（デフォルト）を確認、`open` は使用しない

### 中期対応
4. **チャンネル別セキュリティ監査**: 各チャンネルのallowlist設定を個別にレビュー
5. **表示名ベースの認証を避ける**: 可能な限りユーザーIDベースのallowlistを使用
6. **DMペアリングの強化**: 外部からのDM要求を制限、ペアリングコードの長さ増加を検討

### 長期対応
7. **統一認証レイヤーの設計**: チャンネル非依存の認証メカニズムの実装
8. **失敗クローズの原則**: allowlist未設定時はアクセス拒否をデフォルトに
9. **多要素認証の検討**: 高リスク操作に対する追加認証ステップ

## AuditClawでの対応状況

| 対応項目 | ステータス |
|---------|-----------|
| vulnerability-db.json登録 | 部分完了（新規5件は登録済み、旧来分は未統合） |
| テストケース | 未作成（channel-spoofingカテゴリ、優先度High） |
| ランタイムチェック | RC-004（dm-pairing-rate-limit）、RC-005（allowlist-strictness） |
| ドキュメント | 本記事が初回 |

## 参考情報

- OpenClaw Security Advisories: https://github.com/openclaw/openclaw/security/advisories
- research.md セクション5.5, 7.2
- vulnerability-db.json: Auth Bypass / Channel Spoofing カテゴリ
