# Phase 6-4: ドキュメント拡充 — Research

## 調査日
2026-03-13

## 目的
Phase 6-3（テストスイート全56件）完了後、既存のナレッジ・テストを公開用ドキュメントとして整備する。docs/en/ と docs/ja/ に体系的なドキュメントセットを作成し、GitBookで公開する。

---

## 1. 現在の状況

### 完了済み作業
- **Phase 6-1**: vulnerability-db.json 更新（65件の脆弱性、19件のランタイムチェック）
- **Phase 6-2**: ナレッジ記事5件作成
  - `knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md` (28件+のバイパス手法)
  - `knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md` (TOCTOU 3件)
  - `knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md` (ACP 4件)
  - `knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md` (チャンネル認証 25件+)
  - `knowledge/best-practices/2026-03-12-owasp-llm-top10-mapping.md` (OWASP LLM Top 10)
- **Phase 6-3**: テストスイート全56件作成
  - sandbox-escape (12件)
  - agent-hijack (12件)
  - skill-abuse (10件)
  - channel-spoofing (12件)
  - secret-leakage (10件)

### 既存のドキュメント構造

**docs/en/SUMMARY.md** (英語版GitBook目次):
```
## Research - Vulnerability Cases
* Overview, Prompt Injection, Sandbox Escape, Dependency, Auth Bypass, Data Leakage, CI/CD Supply Chain

## Research - Update Information
* Overview

## Defend - Best Practices
* Overview, Security Setup Guide

## Test - Test Cases
* Overview, Prompt Injection Testing Guide

## Skills
* Security Self-Scan, Tool Comparison

## Reports
* Overview
```

**docs/ja/SUMMARY.md** (日本語版GitBook目次):
```
## 調べる - 脆弱性事例
* 概要, プロンプトインジェクション, サンドボックスエスケープ, 依存関係, 認証バイパス, データ漏洩, CI/CDサプライチェーン

## 調べる - アップデート情報
* 概要

## 守る - ベストプラクティス
* 概要, セキュリティセットアップガイド

## 試す - テストケース
* 概要, プロンプトインジェクション テストガイド

## スキル
* セキュリティセルフスキャン, ツール比較

## レポート
* 概要
```

---

## 2. vulnerability-db.json の分析

### カテゴリ別脆弱性数（全65件）

| カテゴリ | 件数 | Severity分布 | 代表的GHSA |
|----------|------|------------|-----------|
| **RCE** | 7件 | Critical 1, High 6 | GHSA-gv46, GHSA-g55j, GHSA-g8p2, GHSA-65rx, GHSA-vffc, GHSA-hwpq, GHSA-6f6j |
| **Exec Allowlist Bypass** | 28件+ | High 3, Medium 25+ | GHSA-3c6h, GHSA-796m, GHSA-q399, GHSA-8g75, GHSA-j425, GHSA-9q2p, GHSA-r6qf, GHSA-3h2q, GHSA-h3rm 等 |
| **Authentication Bypass** | 12件 | Critical 1, High 4, Medium 7 | GHSA-4rj2, GHSA-mp5h, GHSA-vvjh, GHSA-mwxv, GHSA-h9g4, GHSA-x2ff, GHSA-v865, GHSA-g7cr, GHSA-pjvx, GHSA-wpg9, GHSA-vpj2, GHSA-8m9v |
| **Sandbox Escape** | 7件 | High 5, Medium 2 | GHSA-qcc4, GHSA-mgrq, GHSA-3jx4, GHSA-474h, GHSA-p7gr, GHSA-w235, GHSA-9q36 |
| **SSRF** | 5件 | High 5 | GHSA-jrvc, GHSA-6mgf, GHSA-8mvx, GHSA-2858, GHSA-g99v |
| **Path Traversal** | 6件 | Critical 1, High 2, Medium 3 | GHSA-qrq5, GHSA-cv7m, GHSA-p25h, GHSA-cfvj, GHSA-vhwf, GHSA-3pxq |
| **TOCTOU** | 3件 | Medium 3 | GHSA-7xmq, GHSA-x82f, GHSA-r54r |
| **DoS** | 4件 | Medium 4 | GHSA-6rmx, GHSA-wr6m, GHSA-x4vp, GHSA-77hf |
| **Command Injection** | 3件 | High 3 | GHSA-mc68, GHSA-q284, GHSA-4564 |
| **Secret Leakage** | 1件 | High 1 | GHSA-rchv |
| **Arbitrary File Read** | 1件 | High 1 | GHSA-56pc |
| **CSRF** | 1件 | High 1 | GHSA-3fqr |
| **Prompt Injection** | 1件 | High 1 | GHSA-2qj5 |
| **Policy Bypass** | 2件 | High 1, Medium 1 | GHSA-r65x, GHSA-392f |
| **Privilege Escalation** | 2件 | High 1, Medium 1 | GHSA-jr6x, GHSA-hfpr |

**重要な観察**:
- Exec Allowlist Bypassが圧倒的に多い（全体の約43%）
- Authentication Bypassも多数（18%）
- TOCTOU、DoSは新カテゴリ（v2026.3.x系で追加）

---

## 3. 作成すべきドキュメント一覧

### 3-1. 脆弱性ドキュメント（8ページ × 2言語 = 16ファイル）

| # | ページ | 対象件数 | Severity | 参照元ナレッジ | 優先度 |
|---|--------|----------|----------|--------------|--------|
| 1 | `vulnerabilities/rce.md` | 7件 | Critical-High | — | **High** |
| 2 | `vulnerabilities/command-injection.md` | 3件 | High | — | Medium |
| 3 | `vulnerabilities/exec-bypass.md` | 28件+ | High-Medium | `knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md` | **Critical** |
| 4 | `vulnerabilities/ssrf.md` | 5件 | High | — | Medium |
| 5 | `vulnerabilities/path-traversal.md` | 6件 | Critical-Medium | — | High |
| 6 | `vulnerabilities/toctou.md` | 3件 | Medium | `knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md` | **High** |
| 7 | `vulnerabilities/dos.md` | 4件 | Medium | — | Low |
| 8 | `vulnerabilities/acp-security.md` | 4件 | High | `knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md` | **High** |

**作成方針**:
- vulnerability-db.json から該当カテゴリの全GHSAを抽出
- 既存のknowledge記事がある場合は、それをベースに公開向けに整形
- 各脆弱性の概要、影響バージョン、修正バージョン、攻撃シナリオ、対策を記載
- 英語版（docs/en/）を先に作成し、日本語版（docs/ja/）は翻訳

### 3-2. ベストプラクティス（3ページ × 2言語 = 6ファイル）

| # | ページ | 内容 | 参照元ナレッジ | 優先度 |
|---|--------|------|--------------|--------|
| 1 | `best-practices/hardening-guide.md` | OpenClawハードニングガイド（19件のランタイムチェック + 推奨設定） | vulnerability-db.json `runtimeChecks` セクション | **Critical** |
| 2 | `best-practices/owasp-llm-mapping.md` | OWASP LLM Top 10対応マッピング | `knowledge/best-practices/2026-03-12-owasp-llm-top10-mapping.md` | **High** |
| 3 | `best-practices/channel-security.md` | チャンネル別セキュリティ設定ガイド | `knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md` | **High** |

**作成方針**:
- hardening-guide.md: RC-001 ~ RC-019の全ランタイムチェックを実行可能な形で提示
- owasp-llm-mapping.md: 既存ナレッジ記事を公開向けに整形
- channel-security.md: Telegram, Slack, webhook等のチャンネル別認証設定ガイド

### 3-3. テストガイド（5ページ × 2言語 = 10ファイル）

| # | ページ | 内容 | 参照元テスト | 優先度 |
|---|--------|------|------------|--------|
| 1 | `test-cases/sandbox-escape-guide.md` | サンドボックスエスケープテストガイド（12件） | `tests/sandbox-escape/README.md` | **High** |
| 2 | `test-cases/agent-hijack-guide.md` | エージェント乗っ取りテストガイド（12件） | `tests/agent-hijack/README.md` | **High** |
| 3 | `test-cases/skill-abuse-guide.md` | スキル悪用テストガイド（10件） | `tests/skill-abuse/README.md` | Medium |
| 4 | `test-cases/channel-spoofing-guide.md` | チャンネルなりすましテストガイド（12件） | `tests/channel-spoofing/README.md` | Medium |
| 5 | `test-cases/secret-leakage-guide.md` | シークレット漏洩テストガイド（10件） | `tests/secret-leakage/README.md` | Medium |

**作成方針**:
- tests/*/README.md は既に詳細なテストガイドとして機能している
- これをdocs/配下にコピーし、GitBook用にフォーマット調整
- 各テストの実行方法、期待結果、判定基準を明記

### 3-4. アップデート情報（2ページ × 2言語 = 4ファイル）

| # | ページ | 内容 | 参照元 | 優先度 |
|---|--------|------|--------|--------|
| 1 | `updates/v2026.3.x-changelog.md` | v2026.3.1~3.8の変更点まとめ（35件の新アドバイザリ） | vulnerability-db.json | Medium |
| 2 | `updates/breaking-changes-guide.md` | BREAKING CHANGESガイド（承認バインディング、サンドボックス継承等） | vulnerability-db.json + knowledge記事 | Medium |

**作成方針**:
- v2026.3.x-changelog.md: vulnerability-db.jsonの`fixedIn: "2026.3.*"`を抽出してリスト化
- breaking-changes-guide.md: 後方互換性のない変更（approval binding、sandbox inheritance等）を解説

---

## 4. ドキュメント構造の設計

### 4-1. ディレクトリ構造

```
docs/
├── en/
│   ├── vulnerabilities/
│   │   ├── README.md (既存)
│   │   ├── rce.md (新規)
│   │   ├── command-injection.md (新規)
│   │   ├── exec-bypass.md (新規)
│   │   ├── ssrf.md (新規)
│   │   ├── path-traversal.md (新規)
│   │   ├── toctou.md (新規)
│   │   ├── dos.md (新規)
│   │   └── acp-security.md (新規)
│   ├── best-practices/
│   │   ├── README.md (既存)
│   │   ├── hardening-guide.md (新規)
│   │   ├── owasp-llm-mapping.md (新規)
│   │   └── channel-security.md (新規)
│   ├── test-cases/
│   │   ├── README.md (既存)
│   │   ├── sandbox-escape-guide.md (新規)
│   │   ├── agent-hijack-guide.md (新規)
│   │   ├── skill-abuse-guide.md (新規)
│   │   ├── channel-spoofing-guide.md (新規)
│   │   └── secret-leakage-guide.md (新規)
│   ├── updates/
│   │   ├── README.md (既存)
│   │   ├── v2026.3.x-changelog.md (新規)
│   │   └── breaking-changes-guide.md (新規)
│   └── SUMMARY.md (更新)
└── ja/
    └── (同じ構造)
```

### 4-2. SUMMARY.md への追加項目

**docs/en/SUMMARY.md** に追加:
```markdown
## Research - Vulnerability Cases
* [Overview](vulnerabilities/README.md)
* [Prompt Injection](vulnerabilities/prompt-injection.md)
* [Sandbox Escape](vulnerabilities/sandbox-escape.md)
* [RCE (Remote Code Execution)](vulnerabilities/rce.md) ← 新規
* [Command Injection](vulnerabilities/command-injection.md) ← 新規
* [Exec Allowlist Bypass](vulnerabilities/exec-bypass.md) ← 新規
* [SSRF](vulnerabilities/ssrf.md) ← 新規
* [Path Traversal](vulnerabilities/path-traversal.md) ← 新規
* [TOCTOU](vulnerabilities/toctou.md) ← 新規
* [DoS](vulnerabilities/dos.md) ← 新規
* [ACP Security](vulnerabilities/acp-security.md) ← 新規
* [Dependency Vulnerabilities](vulnerabilities/dependency.md)
* [Authentication Bypass](vulnerabilities/auth-bypass.md)
* [Data Leakage](vulnerabilities/data-leakage.md)
* [CI/CD Supply Chain](vulnerabilities/cicd-supply-chain.md)

## Research - Update Information
* [Overview](updates/README.md)
* [v2026.3.x Changelog](updates/v2026.3.x-changelog.md) ← 新規
* [Breaking Changes Guide](updates/breaking-changes-guide.md) ← 新規

## Defend - Best Practices
* [Overview](best-practices/README.md)
* [Security Setup Guide](best-practices/setup-guide.md)
* [Hardening Guide](best-practices/hardening-guide.md) ← 新規
* [OWASP LLM Top 10 Mapping](best-practices/owasp-llm-mapping.md) ← 新規
* [Channel Security Guide](best-practices/channel-security.md) ← 新規

## Test - Test Cases
* [Overview](test-cases/README.md)
* [Prompt Injection Testing Guide](test-cases/prompt-injection-guide.md)
* [Sandbox Escape Testing Guide](test-cases/sandbox-escape-guide.md) ← 新規
* [Agent Hijack Testing Guide](test-cases/agent-hijack-guide.md) ← 新規
* [Skill Abuse Testing Guide](test-cases/skill-abuse-guide.md) ← 新規
* [Channel Spoofing Testing Guide](test-cases/channel-spoofing-guide.md) ← 新規
* [Secret Leakage Testing Guide](test-cases/secret-leakage-guide.md) ← 新規
```

**docs/ja/SUMMARY.md** にも同様の追加（日本語タイトル）

---

## 5. データソースのマッピング

### 5-1. vulnerability-db.json → ドキュメントページ

| vulnerability-db.json カテゴリ | ドキュメントページ | 件数 |
|-------------------------------|------------------|------|
| `"category": "RCE"` | `vulnerabilities/rce.md` | 7 |
| `"category": "Command Injection"` | `vulnerabilities/command-injection.md` | 3 |
| `"category": "Exec Allowlist Bypass"` | `vulnerabilities/exec-bypass.md` | 28+ |
| `"category": "SSRF"` | `vulnerabilities/ssrf.md` | 5 |
| `"category": "Path Traversal"` | `vulnerabilities/path-traversal.md` | 6 |
| `"category": "TOCTOU"` | `vulnerabilities/toctou.md` | 3 |
| `"category": "DoS"` | `vulnerabilities/dos.md` | 4 |
| `"category": "Sandbox Escape"` (ACP関連) | `vulnerabilities/acp-security.md` | 4+ |

### 5-2. knowledge記事 → ドキュメントページ

| knowledge記事 | ドキュメントページ | 変換方法 |
|--------------|------------------|---------|
| `knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md` | `docs/en/vulnerabilities/exec-bypass.md` | 公開向けに整形（内部調査メモを削除、構造化） |
| `knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md` | `docs/en/vulnerabilities/toctou.md` | 同上 |
| `knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md` | `docs/en/vulnerabilities/acp-security.md` | 同上 |
| `knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md` | `docs/en/best-practices/channel-security.md` | 攻撃パターン → 防御策に変換 |
| `knowledge/best-practices/2026-03-12-owasp-llm-top10-mapping.md` | `docs/en/best-practices/owasp-llm-mapping.md` | 同上 |

### 5-3. tests/README.md → ドキュメントページ

| テストREADME | ドキュメントページ | 変換方法 |
|-------------|------------------|---------|
| `tests/sandbox-escape/README.md` | `docs/en/test-cases/sandbox-escape-guide.md` | ほぼそのまま使用（GitBookフォーマット調整） |
| `tests/agent-hijack/README.md` | `docs/en/test-cases/agent-hijack-guide.md` | 同上 |
| `tests/skill-abuse/README.md` | `docs/en/test-cases/skill-abuse-guide.md` | 同上 |
| `tests/channel-spoofing/README.md` | `docs/en/test-cases/channel-spoofing-guide.md` | 同上 |
| `tests/secret-leakage/README.md` | `docs/en/test-cases/secret-leakage-guide.md` | 同上 |

---

## 6. 推奨実装順序

### 優先度1: Critical（即時着手）
1. **exec-bypass.md** (EN + JA) — 最大の攻撃面、28件以上のバイパス手法
2. **hardening-guide.md** (EN + JA) — 19件のランタイムチェック、実用性が最も高い

### 優先度2: High（1週間以内）
3. **toctou.md** (EN + JA) — 新しい攻撃パターン、3件のTOCTOU
4. **acp-security.md** (EN + JA) — マルチエージェント環境の新脅威
5. **rce.md** (EN + JA) — Critical severity 7件
6. **path-traversal.md** (EN + JA) — Critical含む6件
7. **owasp-llm-mapping.md** (EN + JA) — 既存ナレッジあり
8. **channel-security.md** (EN + JA) — 既存ナレッジあり
9. **sandbox-escape-guide.md** (EN + JA) — テストREADME流用可能
10. **agent-hijack-guide.md** (EN + JA) — テストREADME流用可能

### 優先度3: Medium（2週間以内）
11. **command-injection.md** (EN + JA) — 3件
12. **ssrf.md** (EN + JA) — 5件
13. **v2026.3.x-changelog.md** (EN + JA) — 35件の新アドバイザリ
14. **breaking-changes-guide.md** (EN + JA) — 後方互換性情報
15. **skill-abuse-guide.md** (EN + JA) — テストREADME流用
16. **channel-spoofing-guide.md** (EN + JA) — テストREADME流用
17. **secret-leakage-guide.md** (EN + JA) — テストREADME流用

### 優先度4: Low（余力があれば）
18. **dos.md** (EN + JA) — 4件、Medium severity

---

## 7. ドキュメントテンプレート

### 7-1. 脆弱性ドキュメントのテンプレート

```markdown
# [カテゴリ名] Vulnerabilities

## Overview

[カテゴリの概要説明]

## Statistics

| Metric | Value |
|--------|-------|
| Total Vulnerabilities | X件 |
| Severity Distribution | Critical: X, High: Y, Medium: Z |
| Affected Versions | vX.X.X ~ vY.Y.Y |
| Latest Fix Version | >= vZ.Z.Z |

## Vulnerability List

### [GHSA-xxxx]: [脆弱性タイトル]

| Property | Value |
|----------|-------|
| Severity | High |
| CVE | CVE-2026-XXXXX (if applicable) |
| Fixed In | >= 2026.X.X |
| Category | [Category] |

**Description**:
[脆弱性の説明]

**Impact**:
- [影響1]
- [影響2]

**Attack Scenario**:
```
[攻撃シナリオの具体例]
```

**Mitigation**:
- Update to >= 2026.X.X
- [追加の緩和策]

**References**:
- [GHSA-xxxx](URL)
- [Related Test Case](../test-cases/xxx-guide.md#test-N)

---

[次の脆弱性...]

## Defense Strategy

[このカテゴリの脆弱性に対する包括的防御戦略]

## Related Resources

- [ナレッジ記事へのリンク]
- [テストガイドへのリンク]
- [ベストプラクティスへのリンク]
```

### 7-2. ベストプラクティスのテンプレート

```markdown
# [プラクティス名]

## Overview

[ベストプラクティスの概要]

## Quick Start

[最小限の設定で始める方法]

## Detailed Configuration

### [セクション1]

[詳細な設定手順]

### [セクション2]

[詳細な設定手順]

## Verification

[設定が正しく機能しているか検証する方法]

## Troubleshooting

[よくある問題と解決策]

## Related Resources

- [関連する脆弱性ドキュメント]
- [関連するテストガイド]
```

### 7-3. テストガイドのテンプレート

```markdown
# [カテゴリ名] Testing Guide

## Overview

[テストカテゴリの概要]

## Test Index

| # | Test Name | Difficulty | Target | GHSA Reference |
|---|-----------|------------|--------|----------------|
| 1 | [テスト名] | [難易度] | [対象] | [GHSA-xxxx](URL) |

## Test Details

### Test 1: [テスト名]

**Objective**: [テストの目的]

**Prerequisites**:
- [前提条件1]
- [前提条件2]

**Steps**:
1. [手順1]
2. [手順2]

**Expected Result**:
- [期待される結果]

**Actual Result** (記録用):
- [ ] Pass
- [ ] Fail
- [ ] N/A

**Remediation**:
- [修正方法]

---

[次のテスト...]

## Related Resources

- [関連する脆弱性ドキュメント]
- [関連するベストプラクティス]
```

---

## 8. 実装アプローチ

### 8-1. 並列実行可能なタスク
各ドキュメントは独立して作成可能。以下のグループに分けて並列実行できる：

**グループA: 既存ナレッジベース（3ファイル × 2言語 = 6ファイル）**
- exec-bypass.md
- toctou.md
- acp-security.md

**グループB: vulnerability-db.json抽出（5ファイル × 2言語 = 10ファイル）**
- rce.md
- command-injection.md
- ssrf.md
- path-traversal.md
- dos.md

**グループC: ベストプラクティス（3ファイル × 2言語 = 6ファイル）**
- hardening-guide.md
- owasp-llm-mapping.md
- channel-security.md

**グループD: テストガイド（5ファイル × 2言語 = 10ファイル）**
- sandbox-escape-guide.md
- agent-hijack-guide.md
- skill-abuse-guide.md
- channel-spoofing-guide.md
- secret-leakage-guide.md

**グループE: アップデート情報（2ファイル × 2言語 = 4ファイル）**
- v2026.3.x-changelog.md
- breaking-changes-guide.md

### 8-2. 依存関係
- SUMMARY.md更新は全ドキュメント作成後
- 日本語版は英語版完成後

### 8-3. 検証方法
各ドキュメント作成後：
1. 内部リンクチェック（ローカルファイル存在確認）
2. 外部リンクチェック（GHSA URL等の有効性確認）
3. GitBookビルド確認（エラーなく生成されるか）
4. SUMMARY.mdのリンク整合性チェック

---

## 9. 見積もり

| タスクカテゴリ | ファイル数 | 推定工数 | 根拠 |
|-------------|----------|---------|------|
| 脆弱性ドキュメント（EN） | 8ファイル | 12時間 | 既存ナレッジあり3件（各1h）+ DB抽出5件（各1.5h） |
| 脆弱性ドキュメント（JA） | 8ファイル | 8時間 | 翻訳（各1h） |
| ベストプラクティス（EN） | 3ファイル | 4時間 | 既存ナレッジあり2件（各1h）+ 新規1件（2h） |
| ベストプラクティス（JA） | 3ファイル | 3時間 | 翻訳（各1h） |
| テストガイド（EN） | 5ファイル | 2時間 | README流用（各0.4h） |
| テストガイド（JA） | 5ファイル | 2時間 | 翻訳（各0.4h） |
| アップデート情報（EN） | 2ファイル | 3時間 | changelog（2h）+ breaking changes（1h） |
| アップデート情報（JA） | 2ファイル | 2時間 | 翻訳（各1h） |
| SUMMARY.md更新 | 2ファイル | 1時間 | 機械的作業 |
| **合計** | **36ファイル** | **37時間** | — |

**Critical-High優先度のみ（18ファイル）**: 約20時間

---

## 10. リスクと対策

### リスク1: ドキュメント量が多すぎる
**影響**: 作業が長期化し、モチベーション低下
**対策**: 優先度1-2（Critical-High）に集中。18ファイル（半分）で価値提供可能

### リスク2: vulnerability-db.jsonとの同期
**影響**: ドキュメントが古くなり、信頼性低下
**対策**: ドキュメントに「最終更新日」と「参照DBバージョン」を明記

### リスク3: GitBookビルドエラー
**影響**: 公開できない
**対策**: SUMMARY.mdのリンクを慎重にチェック、ローカルでGitBookビルド確認

### リスク4: 英語版の品質
**影響**: 海外ユーザーに伝わらない
**対策**: 既存のdocs/en/内のドキュメントのトーンとスタイルを参考にする

### リスク5: テンプレートの不備
**影響**: 一貫性のないドキュメント
**対策**: 最初の1件（exec-bypass.md）をレビューし、テンプレートを確定してから残りを作成

---

## 11. 次のステップ（plan.md更新へ）

この調査結果を踏まえて、`plan.md`のPhase 6-4セクションを以下のように更新する：

### Phase 6-4 実装計画の詳細化
- [ ] タスク分割（優先度別・グループ別）
- [ ] 各ドキュメントのデータソース明記
- [ ] 英語版 → 日本語版の変換フロー
- [ ] SUMMARY.md更新のチェックリスト
- [ ] 検証方法（リンク切れチェック、GitBookビルド確認）

### 実装時の注意点
1. **最初にexec-bypass.mdを作成**: テンプレート検証とレビュー
2. **グループ単位で進める**: 並列実行可能なタスクをまとめる
3. **検証を都度実行**: ドキュメント作成後すぐにリンクチェック
4. **SUMMARY.mdは最後**: 全ドキュメント完成後に一括更新

---

## 12. 結論

Phase 6-4は36ファイルの大規模ドキュメント作成タスクだが、以下の要因で実行可能：

### 実行可能性の根拠
1. **既存ナレッジの活用**: Phase 6-2の5記事が参照元として利用可能
2. **テストREADMEの流用**: Phase 6-3の5つのREADMEがそのまま使える（フォーマット調整のみ）
3. **vulnerability-db.jsonの充実**: 全データソースが揃っている
4. **優先順位の明確化**: Critical-Highに集中すれば18ファイル（半分）で価値提供可能

### 期待される成果
- GitBookで公開可能な体系的なセキュリティドキュメント
- OpenClawユーザーが参照できる実践的なガイド
- Phase 6-1~6-3の成果物の集大成

### 次のアクション
この調査結果をnatsukiに提示し、`plan.md`を更新して実装計画の承認を得る。

---

*Phase 6-4 Research 完了: 2026-03-13*
