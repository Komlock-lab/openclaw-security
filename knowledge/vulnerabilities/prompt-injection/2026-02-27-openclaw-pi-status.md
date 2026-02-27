---
date: 2026-02-27
category: vulnerabilities
subcategory: prompt-injection
severity: high
source: https://github.com/openclaw/openclaw
affects: openclaw
tags: [openclaw, prompt-injection, open-issues, WORKFLOW_AUTO]
---

# OpenClaw プロンプトインジェクション対策の現状

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-02-27 |
| 重要度 | High |
| OpenClawバージョン | v2026.2.26時点 |

## 概要

OpenClawの公式スタンスでは、プロンプトインジェクション単体はセキュリティスコープ外（境界突破を伴わない場合）。しかし実際には複数の攻撃事例がOPENステータスで残っている。

## 確認された未修正の事例

### 1. URLリンクプレビューメタデータ経由（Issue #22060）- OPEN
- チャンネル: Telegram
- Open Graphメタデータに偽`[System Message]`を埋め込み
- `WORKFLOW_AUTO.md`読み取り指示のペイロード

### 2. コンテキスト圧縮時の偽システムメッセージ（Issue #26851）- OPEN
- チャンネル: Discord
- compaction境界で偽`[System Message]`が注入

### 3. Telegramパイプラインへのコンテンツ混入（Issue #25423）- OPEN
- 同一パターンの`WORKFLOW_AUTO.md`ペイロード

### 修正済みの事例
- CVE-2026-27165: ACP resource_linkメタデータ経由
- CVE-2026-27001: CWDパスのLLMプロンプトインジェクション
- GHSA-g27f-9qjv-22pm: ログポイズニング

## 提案されているが未実装の対策
- Echo Guard（Issue #14710）
- Content Trust Gateway（Issue #18906）
- プロンプトインジェクションスキャン設定（Issue #7705）
- Shield.md（Issue #12385）

## 評価

- 体系的な防御メカニズムは**未実装**
- 複数の注入経路が**OPENのまま**
- 対策は主にモデルの頑健性に依存
- `WORKFLOW_AUTO.md`ペイロードが複数チャンネルで繰り返し観測（標的型攻撃キャンペーンの可能性）
