# /research-updates

OpenClawおよび依存パッケージのバージョンアップデート・セキュリティ修正を調査するコマンド。

## 使い方

```bash
/research-updates [対象] [オプション]
```

### 対象

| 対象 | 説明 |
|------|------|
| openclaw | OpenClaw本体のアップデート |
| dependencies | 依存パッケージのアップデート |
| runtime | Node.jsランタイムのアップデート |
| all | 全て |

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| --version | 特定バージョンを調査 | latest |
| --security-only | セキュリティ関連のみ | false |
| --period | 調査期間（1w/1m/3m） | 1m |

### 使用例

```bash
# OpenClawの最新アップデートを確認
/research-updates openclaw

# セキュリティ修正のみを調査
/research-updates all --security-only

# 特定バージョンの変更を確認
/research-updates openclaw --version v2026.2.26
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、アップデート情報を調査します。

## 引数解析

1. 対象を特定（デフォルト: all）
2. オプションを解析

## Phase 1: 調査実行

`update_watch` スキルに従って調査を実行。

対象ごとにTask subagentを起動：

```
prompt: |
  以下の対象についてアップデート情報を調査してください。

  対象: [対象]
  期間: [--period の値]
  セキュリティのみ: [--security-only の値]

  .claude/skills/update_watch/skill.md に従って調査し、
  セキュリティ関連の変更をまとめてください。

subagent_type: Explore
```

## Phase 2: 結果の整理

1. 緊急度で並べ替え
2. `.claude/skills/common/output_format.md` に従って構造化

## Phase 3: ファイル保存

1. `knowledge/updates/{YYYY-MM-DD}-{target}.md` に保存
2. `knowledge/index.md` にインデックスを追記

## Phase 4: ユーザーへの提示

1. アップデートサマリーを表示
2. セキュリティ修正をハイライト
3. 推奨アクションを提示

## 使用するスキル

| スキル | 用途 |
|--------|------|
| update_watch | メインの調査ロジック |
| web_search | Web検索の実行 |
| common/security_rules | 共通ルールの適用 |
| common/output_format | 出力フォーマットの統一 |
