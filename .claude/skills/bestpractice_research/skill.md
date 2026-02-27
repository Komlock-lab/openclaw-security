---
name: bestpractice_research
description: OWASP、NIST等のセキュリティベストプラクティスを調査し、OpenClawへの適用を分析するスキル。
---

# Best Practice Research Skill

セキュリティベストプラクティスを調査し、OpenClawへの適用可能性を分析するスキルです。
**Taskツール（subagent）での実行を想定**しています。

## 用途

| 用途 | 説明 |
|------|------|
| フレームワーク調査 | OWASP Top 10 for LLM等の最新ガイドラインを確認 |
| 比較分析 | OpenClawの現状とベストプラクティスを比較 |
| 推奨事項作成 | 具体的なセキュリティ改善提案を策定 |

## 調査対象フレームワーク

| フレームワーク | 対象領域 | URL |
|---------------|---------|-----|
| OWASP Top 10 for LLM Applications | LLMアプリ全般 | https://owasp.org/www-project-top-10-for-large-language-model-applications/ |
| OWASP API Security Top 10 | API セキュリティ | https://owasp.org/API-Security/ |
| OWASP Top 10 | Webアプリ全般 | https://owasp.org/www-project-top-10/ |
| NIST AI RMF | AIリスク管理 | https://www.nist.gov/artificial-intelligence |
| CIS Benchmarks | インフラ | https://www.cisecurity.org/cis-benchmarks |

## トピック

| トピック | 内容 |
|---------|------|
| llm-security | LLMアプリ固有のセキュリティ（プロンプトインジェクション対策等） |
| api-security | API認証・認可・レート制限等 |
| auth | 認証・セッション管理のベストプラクティス |
| sandbox | コンテナ・サンドボックスのセキュリティ |
| secrets | シークレット管理のベストプラクティス |
| supply-chain | 依存関係・サプライチェーンセキュリティ |
| logging | セキュリティログ・監査のベストプラクティス |

## 調査プロセス

### Phase 1: ガイドライン検索（3-5回）

```
1. 公式フレームワークの検索
   - "OWASP Top 10 LLM 2025 2026"
   - "OWASP [トピック] cheat sheet"
   - "NIST [トピック] guidelines"

2. 実装ガイドの検索
   - "[トピック] security best practices implementation"
   - "[トピック] hardening guide Node.js"

3. 事例の検索
   - "[トピック] security implementation case study"
```

### Phase 2: 公式ドキュメントの取得（WebFetch）

```
1. OWASPチートシートの取得
2. フレームワークの最新版ドキュメントの取得
3. 実装ガイドの取得
```

### Phase 3: OpenClawとの比較分析

```
1. OpenClawの現状を確認
   - 既存のセキュリティ機能・設定
   - ドキュメントに記載されている対策

2. ギャップ分析
   - ベストプラクティスとの差分
   - 未対応の項目

3. 優先順位付け
   - 影響度 × 実装難易度で優先順位を決定
```

### Phase 4: 推奨事項レポート生成

## 出力フォーマット

````markdown
---
date: YYYY-MM-DD
category: best-practices
subcategory: [トピック]
severity: info
source: [フレームワークURL]
affects: openclaw
tags: [タグ1, タグ2]
---

# [ベストプラクティスタイトル]

## サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | YYYY-MM-DD |
| トピック | [トピック] |
| 参照フレームワーク | OWASP / NIST / CIS |
| OpenClaw適用度 | 高/中/低 |

## ベストプラクティス概要

[ガイドラインの概要を日本語で説明]

## 推奨事項一覧

| # | 推奨事項 | 優先度 | OpenClaw対応状況 |
|---|---------|--------|-----------------|
| 1 | [推奨事項] | High | 対応済/未対応/一部対応 |
| 2 | [推奨事項] | Medium | 対応済/未対応/一部対応 |

## 詳細

### 1. [推奨事項1]

**ベストプラクティス**: [ガイドラインの内容]

**OpenClawの現状**: [現在の実装状態]

**推奨アクション**: [具体的な改善提案]

### 2. [推奨事項2]
...

## ギャップ分析

### 対応済み

- [対応済みの項目]

### 未対応（要対応）

- [未対応の項目と推奨アクション]

## 参考資料

| # | タイトル | URL | 種類 |
|---|---------|-----|------|
| 1 | [タイトル] | [URL] | 公式/ガイド |
````

## 使用方法

```
prompt: |
  以下のトピックについてベストプラクティスを調査してください。

  トピック: llm-security
  フレームワーク: OWASP
  比較対象: OpenClawの現状

  bestpractice_research スキルに従って調査し、
  OpenClawへの推奨事項を含むレポートを生成してください。

subagent_type: Explore
```
