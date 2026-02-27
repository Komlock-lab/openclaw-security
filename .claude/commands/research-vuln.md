# /research-vuln

脆弱性事例を調査し、OpenClawへの影響を分析するコマンド。

## 使い方

```bash
/research-vuln [カテゴリ] [オプション]
```

### カテゴリ

| カテゴリ | 説明 |
|---------|------|
| prompt-injection | プロンプトインジェクション |
| sandbox-escape | サンドボックスエスケープ |
| dependency | 依存関係の脆弱性 |
| auth-bypass | 認証バイパス |
| data-leakage | データ漏洩 |
| skill-abuse | スキルシステム悪用 |
| channel-spoofing | チャンネルなりすまし |
| agent-hijack | Agent通信乗っ取り |
| all | 全カテゴリ |

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| --deep | 詳細調査モード（subagentで並列実行） | false |
| --period | 調査期間（1w/1m/3m/1y） | 3m |
| --source | 情報源（cve/github/owasp/all） | all |
| --cve | 特定CVE番号を調査 | - |

### 使用例

```bash
# プロンプトインジェクションの最新脆弱性を調査
/research-vuln prompt-injection

# 全カテゴリを詳細調査
/research-vuln all --deep

# 特定CVEを調査
/research-vuln --cve CVE-2025-12345

# 過去1週間の依存関係脆弱性を調査
/research-vuln dependency --period 1w
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、脆弱性調査を実行します。

## 引数解析

1. カテゴリを特定（デフォルト: all）
2. オプションを解析
3. `--cve` が指定されている場合は特定CVE調査モード

## Phase 1: 調査実行

### 通常モード
`vuln_research` スキルに従って調査を実行。

### --deep モード
カテゴリごとにTaskツール（subagent）を起動して並列調査：

```
各カテゴリについて Task subagent を起動:

prompt: |
  以下のカテゴリについて脆弱性調査を行ってください。

  カテゴリ: [カテゴリ]
  調査期間: [--period の値]
  情報源: [--source の値]

  .claude/skills/vuln_research/skill.md に従って調査し、
  構造化された結果を返してください。

  .claude/skills/common/security_rules.md の共通ルールに従ってください。

subagent_type: Explore
```

### 特定CVEモード
指定されたCVE番号について詳細調査を実行。

## Phase 2: 結果の整理

1. 調査結果を `.claude/skills/common/output_format.md` に従って構造化
2. 重要度で並べ替え（Critical > High > Medium > Low）

## Phase 3: ファイル保存

1. `knowledge/vulnerabilities/{subcategory}/{YYYY-MM-DD}-{slug}.md` に保存
2. `knowledge/index.md` にインデックスを追記

## Phase 4: ユーザーへの提示

1. 調査結果のサマリーを表示
2. 重要な発見事項をハイライト
3. GitBook公開への反映を提案

## 使用するスキル

| スキル | 用途 |
|--------|------|
| vuln_research | メインの調査ロジック |
| web_search | Web検索の実行 |
| common/security_rules | 共通ルールの適用 |
| common/output_format | 出力フォーマットの統一 |
