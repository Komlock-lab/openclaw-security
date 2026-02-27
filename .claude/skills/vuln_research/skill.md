---
name: vuln_research
description: 脆弱性事例を調査し、OpenClawへの影響を分析するスキル。Taskツール（subagent）での実行を想定。
---

# Vulnerability Research Skill

LLMアプリケーション・チャットボット・OpenClawに関連する脆弱性事例を調査し、構造化された情報を返すスキルです。
**Taskツール（subagent）での実行を想定**しています。

## 用途

| 用途 | 説明 |
|------|------|
| 定期調査 | カテゴリ別の最新脆弱性情報を収集 |
| 特定CVE調査 | 特定のCVE番号に対する詳細調査 |
| 影響分析 | 発見された脆弱性のOpenClawへの影響評価 |

## 調査カテゴリ

| カテゴリ | 検索キーワード |
|---------|--------------|
| prompt-injection | LLM prompt injection, indirect prompt injection, jailbreak |
| sandbox-escape | container escape, Docker escape, sandbox bypass |
| dependency | npm vulnerability, supply chain attack, typosquatting |
| auth-bypass | authentication bypass, OAuth vulnerability, token theft |
| data-leakage | data exfiltration, information disclosure, LLM data leak |
| skill-abuse | plugin abuse, tool use vulnerability, MCP security |
| channel-spoofing | messaging API spoofing, webhook injection |
| agent-hijack | agent communication hijack, man-in-the-middle AI agent |

## 調査プロセス

### Phase 1: 広域検索（3-5回）

```
1. カテゴリ別のメイン検索
   - "[カテゴリ] vulnerability 2025 2026"
   - "[カテゴリ] CVE latest"
   - "[カテゴリ] security incident report"

2. OpenClaw固有の検索
   - "openclaw [カテゴリ] vulnerability"
   - "chatbot [カテゴリ] attack real world"

3. 日本語での検索
   - "[カテゴリ] 脆弱性 事例 2025 2026"
```

### Phase 2: 公式ソースの深堀り（2-3回のWebFetch）

```
1. NVD/CVE詳細の取得
   - 該当CVEのNVDページをWebFetchで取得
   - CVSS スコア、影響範囲を確認

2. GitHub Advisory の確認
   - 該当ライブラリのAdvisoryをWebFetchで取得
   - 修正コミット・PRを特定

3. ベンダーアドバイザリ
   - 公式のセキュリティアドバイザリを確認
```

### Phase 3: OpenClawへの影響分析

```
1. OpenClawの該当コンポーネントを特定
   - 影響を受けるコード・設定箇所
   - デフォルト設定での影響有無

2. 再現条件の整理
   - 攻撃に必要な前提条件
   - 攻撃の難易度

3. 緩和策の確認
   - 既知の対策・ワークアラウンド
   - OpenClawの既存防御機能との関係
```

### Phase 4: 構造化レポート生成

出力フォーマットに従ってレポートを生成。

## 出力フォーマット

````markdown
---
date: YYYY-MM-DD
category: vulnerabilities
subcategory: [カテゴリ]
severity: critical | high | medium | low
source: [CVE-ID or URL]
affects: openclaw | [パッケージ名] | general
tags: [タグ1, タグ2]
---

# [脆弱性タイトル]

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | YYYY-MM-DD |
| カテゴリ | [カテゴリ] |
| 重要度 | Critical/High/Medium/Low |
| CVE | CVE-YYYY-XXXXX（該当する場合） |
| 影響範囲 | [対象ソフトウェア・バージョン] |
| OpenClawへの影響 | あり/なし/要検証 |

## 概要

[脆弱性の概要を日本語で3-5文で説明]

## 技術的詳細

### 攻撃手法

[攻撃の仕組みを技術的に説明]

### 再現条件

- 前提条件1
- 前提条件2

### 概念実証（PoC）

```
[概念レベルの攻撃例。実際に悪用可能なコードは含めない]
```

## OpenClawへの影響分析

### 影響を受けるコンポーネント

| コンポーネント | 影響 | 備考 |
|---------------|------|------|
| [コンポーネント名] | あり/なし | [詳細] |

### リスク評価

[OpenClawの文脈でのリスク評価]

## 対策・緩和策

### 推奨対策

1. [対策1]
2. [対策2]

### OpenClawでの対応状況

[既に対策されているか、追加対策が必要か]

## 参考資料

| # | タイトル | URL | 種類 |
|---|---------|-----|------|
| 1 | [タイトル] | [URL] | 公式/ブログ/論文 |

## 追加調査が必要な点

- [ ] [追加調査項目1]
- [ ] [追加調査項目2]
````

## 使用方法

### Taskでの呼び出し例

```
prompt: |
  以下のカテゴリについて脆弱性調査を行ってください。

  カテゴリ: prompt-injection
  調査期間: 過去3ヶ月
  対象: LLMアプリケーション全般 + OpenClaw固有

  vuln_research スキルに従って調査し、構造化された結果を返してください。

  調査の深さ:
  - Web検索: 5回以上
  - 公式ソース（NVD, GitHub Advisory）: 必須
  - OpenClawへの影響分析: 必須

subagent_type: Explore
```

## 品質基準

| 基準 | 説明 |
|------|------|
| 正確性 | CVE番号・CVSS等の数値情報は公式ソースから取得 |
| 網羅性 | 主要な脆弱性を漏れなくカバー |
| 分析性 | OpenClawへの具体的な影響を分析 |
| 鮮度 | 最新情報を優先。調査日を必ず記録 |
| 実用性 | 対策・緩和策を具体的に提示 |
