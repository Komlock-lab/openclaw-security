---
date: 2026-03-12
category: best-practices
subcategory: owasp
severity: info
source: https://owasp.org/www-project-top-10-for-large-language-model-applications/
affects: openclaw
tags: [OWASP, LLM-Top-10, coverage-mapping, gap-analysis, best-practices]
---

# OWASP LLM Top 10 (2025版) と AuditClaw のカバレッジマッピング

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-03-12 |
| カテゴリ | best-practices |
| 参照規格 | OWASP Top 10 for LLM Applications 2025 |
| カバレッジ | 3/7 対象項目（対象外3項目を除く） |
| 優先対応 | LLM02, LLM04, LLM06, LLM07 |

## 概要

OWASP Top 10 for LLM Applications (2025版) は、LLMアプリケーションに固有のセキュリティリスクを体系化したフレームワークである。本記事では、OpenClawの脆弱性状況とAuditClawのテスト・ナレッジカバレッジを、OWASPの各項目にマッピングし、ギャップを特定する。

## カバレッジマッピング

### LLM01: Prompt Injection

| 項目 | 内容 |
|------|------|
| リスク概要 | 悪意あるプロンプトによるLLMの挙動改変 |
| OpenClaw固有の状況 | 15+チャンネルからの入力、URLプレビュー経由、コンテキスト圧縮境界での注入 |
| OpenClawの公式スタンス | プロンプトインジェクション単体はスコープ外（ポリシー/認証/サンドボックス境界突破を伴う場合のみ） |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 29件（tests/prompt-injection/） |
| ナレッジ記事 | 4件（PI調査、PI対策現状、テクニック分類、hackerbot-claw） |
| vulnerability-db | 2件 |
| 評価 | **充実** - 最も網羅的にカバーされたカテゴリ |

**ギャップ**:
- コンテキスト圧縮境界でのインジェクション（Issue #26851）に対するテストが未作成
- マルチモーダル（画像/音声）経由のインジェクションテストが未作成

---

### LLM02: Insecure Output Handling

| 項目 | 内容 |
|------|------|
| リスク概要 | LLM出力の不適切な処理（コマンド実行、ファイル操作等） |
| OpenClaw固有の状況 | system.run経由のコマンド実行、ファイル書き込み、スキル呼び出し |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 0件（直接対応するカテゴリなし） |
| ナレッジ記事 | 1件（exec-bypass記事で間接カバー） |
| vulnerability-db | 28件+（system.run/exec bypass） |
| 評価 | **部分対応** - DBは充実しているがテスト・ナレッジが不足 |

**ギャップ**:
- LLM出力がsystem.runに渡される際のサニタイズ検証テストが必要
- XSS/HTMLインジェクション（Control UI Stored XSS等）のテストが未作成

**推奨アクション**:
- exec-bypassテストスイートの作成（Phase 6-3で対応予定）
- LLM出力 → system.run の経路に特化したテストの設計

---

### LLM03: Training Data Poisoning

| 項目 | 内容 |
|------|------|
| リスク概要 | 訓練データの汚染によるモデルの挙動改変 |
| OpenClaw固有の状況 | **対象外** - OpenClawはモデルのファインチューニングを行わない |

**評価**: 対象外。OpenClawはサードパーティLLM（Claude, GPT等）をAPI経由で利用するアーキテクチャであり、訓練データの制御は行わない。

---

### LLM04: Model Denial of Service

| 項目 | 内容 |
|------|------|
| リスク概要 | LLMへの大量リクエストやリソース消費攻撃 |
| OpenClaw固有の状況 | webhook DoS、メモリ増大DoS、tar展開DoS、未制限URL-backedメディアフェッチ |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 0件 |
| ナレッジ記事 | 0件 |
| vulnerability-db | 4件（DoSカテゴリ） |
| 評価 | **未対応** - v2026.3.x系で新たに3件のDoS脆弱性が発見 |

**関連アドバイザリ**:
| GHSA ID | 概要 |
|---------|------|
| GHSA-6rmx-gvvg-vh6j | hookが非POSTリクエストを認証ロックアウトカウントに加算 |
| GHSA-x4vp-4235-65hg | 事前認証webhookボディパースで認証なし低速リクエストDoS |
| GHSA-77hf-7fqf-f227 | tar.bz2展開がアーカイブ安全性パリティチェックをバイパス |
| GHSA-wr6m-jg37-68xh | Zalo webhookのクエリストリングキーチャーンによるメモリ増大DoS |

**推奨アクション**:
- DoSカテゴリのナレッジ記事作成
- webhook/メディアフェッチのレート制限テストの設計

---

### LLM05: Supply Chain Vulnerabilities

| 項目 | 内容 |
|------|------|
| リスク概要 | サプライチェーン攻撃（依存関係、プラグイン、モデル提供元） |
| OpenClaw固有の状況 | ClawHubスキル、31プラグイン（単一プロセス共有）、npm依存関係 |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 2件（PI test 28-29でスキルサプライチェーンを部分カバー） |
| ナレッジ記事 | 1件（hackerbot-claw GHA攻撃キャンペーン） |
| vulnerability-db | 3件（skills-install-download等） |
| 評価 | **部分対応** - GHAキャンペーンはカバーしたがスキルサプライチェーンの深掘りが必要 |

**ギャップ**:
- ClawHubスキルのサプライチェーン検証テスト
- プラグインの隔離不備（CVSS 9.8, Issue #12517）に対するテスト
- npm依存関係のセキュリティ監査

**推奨アクション**:
- skill-abuseテストスイートの作成（Phase 6-3で対応予定）
- プラグインサンドボックス（WASM, BoxLite）の実装状況追跡

---

### LLM06: Sensitive Information Disclosure

| 項目 | 内容 |
|------|------|
| リスク概要 | LLMを通じた機密情報の漏洩 |
| OpenClaw固有の状況 | シークレット管理、Gateway認証情報UI漏洩、botトークンのログ漏洩 |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 0件 |
| ナレッジ記事 | 0件 |
| vulnerability-db | 5件+（secret-leakage, Gateway auth漏洩） |
| 評価 | **未対応** - DBのみで、テスト・ナレッジが完全に欠如 |

**関連アドバイザリ**:
| GHSA ID | 概要 |
|---------|------|
| GHSA-rchv-x836-w7xp | ダッシュボードがGateway認証情報をブラウザURL/localStorageに漏洩 |
| CVE-2026-27003 | Telegram botトークンのログ漏洩 |
| CVE-2026-26326 | skills.statusのシークレット漏洩 |

**推奨アクション**:
- secret-leakageテストスイートの作成
- Gateway認証情報の安全な取り扱いに関するナレッジ記事
- ランタイムチェックRC-018（Gateway認証情報のUI漏洩チェック）の実装

---

### LLM07: Insecure Plugin Design

| 項目 | 内容 |
|------|------|
| リスク概要 | プラグインの設計不備による攻撃 |
| OpenClaw固有の状況 | 31プラグインが単一Node.jsプロセスを共有（CVSS 9.8）、jitiダイナミックローダー |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 0件 |
| ナレッジ記事 | 0件 |
| vulnerability-db | 2件（skill-abuse） |
| 評価 | **未対応** - OpenClawの最も深刻な設計上の問題に対するカバレッジなし |

**重要な問題**:
- **プラグイン隔離なし**: jitiダイナミックローダーがサンドボックス・能力制限・リソース分離を一切提供しない（Issue #12517）
- **影響**: 1つのプラグインの脆弱性で全プラグインの資格情報・データストア・ランタイムAPIにフルアクセス
- **提案中**: WASMベースプラグインサンドボックス（Issue #26980）、BoxLiteバックエンド（Issue #27342）

**推奨アクション**:
- skill-abuseテストスイートの作成（最優先）
- プラグイン間の情報漏洩テストの設計
- WASMサンドボックスの実装追跡

---

### LLM08: Excessive Agency

| 項目 | 内容 |
|------|------|
| リスク概要 | LLMに過度な権限・自律性を付与 |
| OpenClaw固有の状況 | system.run（コマンド実行）、ファイルI/O、ブラウザ操作、ACP |

**AuditClawカバレッジ**:

| 対応 | 詳細 |
|------|------|
| テストケース | 部分カバー（PIテストの一部がエージェンシー制御を検証） |
| ナレッジ記事 | 2件（exec-bypass, ACP継承で間接カバー） |
| vulnerability-db | 28件+（system.run関連） |
| 評価 | **部分対応** - system.run承認強化と関連するが、直接的なテストは不足 |

**ギャップ**:
- ツールポリシー（tools.profile）の効果検証テスト
- ACP dispatchの権限制御テスト
- agent-hijackテストスイート

**推奨アクション**:
- agent-hijackテストスイートの作成（Phase 6-3で対応予定）
- ツールポリシーのバイパステスト設計

---

### LLM09: Overreliance

| 項目 | 内容 |
|------|------|
| リスク概要 | LLM出力への過度な依存 |
| OpenClaw固有の状況 | **対象外** - 利用者側の問題であり、プラットフォームのセキュリティスコープ外 |

**評価**: 対象外。

---

### LLM10: Model Theft

| 項目 | 内容 |
|------|------|
| リスク概要 | モデルの窃取 |
| OpenClaw固有の状況 | **対象外** - OpenClawはモデルをホストしない（API経由で利用） |

**評価**: 対象外。

---

## カバレッジサマリー

| # | OWASP LLM Risk | 対象 | テスト | ナレッジ | DB | 総合評価 |
|---|---------------|------|--------|---------|-----|---------|
| LLM01 | Prompt Injection | YES | 29件 | 4件 | 2件 | **充実** |
| LLM02 | Insecure Output Handling | YES | 0件 | 1件 | 28件+ | **部分対応** |
| LLM03 | Training Data Poisoning | NO | - | - | - | 対象外 |
| LLM04 | Model Denial of Service | YES | 0件 | 0件 | 4件 | **未対応** |
| LLM05 | Supply Chain Vulnerabilities | YES | 2件 | 1件 | 3件 | **部分対応** |
| LLM06 | Sensitive Information Disclosure | YES | 0件 | 0件 | 5件+ | **未対応** |
| LLM07 | Insecure Plugin Design | YES | 0件 | 0件 | 2件 | **未対応** |
| LLM08 | Excessive Agency | YES | 部分 | 2件 | 28件+ | **部分対応** |
| LLM09 | Overreliance | NO | - | - | - | 対象外 |
| LLM10 | Model Theft | NO | - | - | - | 対象外 |

## 優先対応マトリクス

| 優先度 | OWASP項目 | 理由 | 推奨アクション |
|--------|----------|------|--------------|
| **Critical** | LLM07 (Plugin) | CVSS 9.8の設計欠陥、カバレッジ0 | skill-abuseテスト + ナレッジ記事 |
| **High** | LLM02 (Output) | 28件+のexec bypassに対するテスト欠如 | exec-bypassテストスイート |
| **High** | LLM06 (Disclosure) | Gateway auth漏洩等の新脆弱性 | secret-leakageテスト + ナレッジ記事 |
| **Medium** | LLM04 (DoS) | 新たに3件のDoS脆弱性 | DoSナレッジ記事 + テスト |
| **Medium** | LLM05 (Supply Chain) | GHAカバー済み、深掘り必要 | スキルサプライチェーンテスト |
| **Low** | LLM08 (Agency) | 部分カバー済み | agent-hijackテスト拡充 |

## 参考情報

- OWASP Top 10 for LLM Applications 2025: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- research.md セクション7.5
- vulnerability-db.json: 65件のエントリ
