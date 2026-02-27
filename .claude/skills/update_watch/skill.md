---
name: update_watch
description: OpenClawおよび依存パッケージのバージョンアップデート・セキュリティ修正を監視するスキル。
---

# Update Watch Skill

OpenClawおよび関連パッケージのセキュリティアップデートを追跡するスキルです。
**Taskツール（subagent）での実行を想定**しています。

## 用途

| 用途 | 説明 |
|------|------|
| リリース追跡 | OpenClaw新バージョンのセキュリティ変更を確認 |
| 依存関係監視 | npm依存パッケージのセキュリティアドバイザリ確認 |
| Breaking Changes | セキュリティに影響するBreaking Changesの特定 |

## 監視対象

### OpenClaw本体
- リリースノート: https://github.com/openclaw/openclaw/releases
- セキュリティアドバイザリ: https://github.com/openclaw/openclaw/security/advisories
- CHANGELOG

### 主要依存パッケージ
| パッケージ | 用途 | npm |
|-----------|------|-----|
| discord.js | Discord連携 | discord.js |
| grammy | Telegram連携 | grammy |
| @whiskeysockets/baileys | WhatsApp連携 | @whiskeysockets/baileys |
| @slack/bolt | Slack連携 | @slack/bolt |

### ランタイム
- Node.js セキュリティリリース

## 調査プロセス

### Phase 1: リリース情報の収集（2-3回）

```
1. OpenClaw公式リリースの検索
   - "openclaw release notes latest"
   - WebFetch: GitHub Releases ページ

2. 依存パッケージの検索
   - "[パッケージ名] security update"
   - "npm audit [パッケージ名]"

3. Node.jsの検索
   - "Node.js security release"
```

### Phase 2: セキュリティ変更の抽出

```
1. リリースノートからセキュリティ関連の変更を抽出
   - "security", "fix", "vulnerability", "CVE" を含む項目
   - Breaking Changesのセキュリティ影響

2. npm audit情報の確認
   - 既知の脆弱性の有無
   - 修正バージョン
```

### Phase 3: 影響度評価

```
1. OpenClawの利用状況との照合
   - 該当機能を使用しているか
   - デフォルト設定で影響があるか

2. アップデートの緊急度判定
   - Critical: 即座にアップデート必要
   - High: 早期にアップデート推奨
   - Medium: 次回のメンテナンス時に対応
   - Low: 情報として記録
```

### Phase 4: レポート生成

## 出力フォーマット

````markdown
---
date: YYYY-MM-DD
category: updates
subcategory: openclaw | dependency | runtime
severity: critical | high | medium | low | info
source: [リリースURL]
affects: [対象パッケージ]
tags: [タグ1, タグ2]
---

# [アップデートタイトル]

## サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | YYYY-MM-DD |
| 対象 | [ソフトウェア名] |
| バージョン | [旧] → [新] |
| セキュリティ修正 | あり/なし |
| 緊急度 | Critical/High/Medium/Low |

## セキュリティ関連の変更

### 修正された脆弱性

| CVE | 重要度 | 概要 |
|-----|--------|------|
| CVE-YYYY-XXXXX | High | [概要] |

### セキュリティ改善

- [改善1]
- [改善2]

### Breaking Changes（セキュリティ影響あり）

- [変更点と影響]

## アップデート推奨事項

[具体的なアクション]

## 参考資料

| # | タイトル | URL |
|---|---------|-----|
| 1 | [タイトル] | [URL] |
````

## 使用方法

```
prompt: |
  OpenClawの最新アップデート情報を調査してください。

  対象: openclaw | dependencies | all
  期間: 過去1ヶ月

  update_watch スキルに従って調査し、セキュリティ関連の変更をまとめてください。

subagent_type: Explore
```
