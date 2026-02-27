# /research-bestpractice

OWASP、NIST等のセキュリティベストプラクティスを調査するコマンド。

## 使い方

```bash
/research-bestpractice [トピック] [オプション]
```

### トピック

| トピック | 説明 |
|---------|------|
| llm-security | LLMアプリ固有のセキュリティ |
| api-security | API認証・認可・レート制限 |
| auth | 認証・セッション管理 |
| sandbox | コンテナ・サンドボックス |
| secrets | シークレット管理 |
| supply-chain | 依存関係・サプライチェーン |
| logging | セキュリティログ・監査 |
| all | 全トピック |

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| --framework | フレームワーク指定（owasp/nist/cis） | owasp |
| --compare | OpenClawの現状と比較 | true |
| --deep | 詳細調査モード | false |

### 使用例

```bash
# LLMセキュリティのベストプラクティスを調査
/research-bestpractice llm-security

# NIST基準でサンドボックスのベストプラクティスを調査
/research-bestpractice sandbox --framework nist

# 全トピックを詳細調査
/research-bestpractice all --deep
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、ベストプラクティス調査を実行します。

## 引数解析

1. トピックを特定（デフォルト: llm-security）
2. オプションを解析

## Phase 1: 調査実行

`bestpractice_research` スキルに従って調査を実行。

```
prompt: |
  以下のトピックについてベストプラクティスを調査してください。

  トピック: [トピック]
  フレームワーク: [--framework の値]
  OpenClawとの比較: [--compare の値]

  .claude/skills/bestpractice_research/skill.md に従って調査し、
  推奨事項を含むレポートを生成してください。

subagent_type: Explore
```

## Phase 2: 結果の整理

1. 推奨事項を優先度で並べ替え
2. OpenClawの対応状況を整理

## Phase 3: ファイル保存

1. `knowledge/best-practices/{YYYY-MM-DD}-{topic}.md` に保存
2. `knowledge/index.md` にインデックスを追記

## Phase 4: ユーザーへの提示

1. ベストプラクティスのサマリーを表示
2. 未対応の重要項目をハイライト
3. 具体的なアクションプランを提示

## 使用するスキル

| スキル | 用途 |
|--------|------|
| bestpractice_research | メインの調査ロジック |
| web_search | Web検索の実行 |
| common/security_rules | 共通ルールの適用 |
| common/output_format | 出力フォーマットの統一 |
