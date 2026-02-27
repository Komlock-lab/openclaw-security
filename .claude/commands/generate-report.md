# /generate-report

セキュリティ検証のレポートを生成するコマンド。

## 使い方

```bash
/generate-report [種別] [オプション]
```

### 種別

| 種別 | 説明 |
|------|------|
| vulnerability-summary | 脆弱性調査のサマリーレポート |
| test-results | テスト実行結果レポート |
| security-posture | セキュリティ体制の総合評価レポート |
| update-digest | アップデート情報のダイジェスト |

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| --period | 対象期間（1w/1m/3m/all） | 1m |
| --format | 出力形式（md/gitbook） | md |

### 使用例

```bash
# 脆弱性サマリーレポートを生成
/generate-report vulnerability-summary

# 過去1週間のテスト結果レポート
/generate-report test-results --period 1w

# セキュリティ体制の総合評価
/generate-report security-posture

# GitBook用に出力
/generate-report vulnerability-summary --format gitbook
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、レポートを生成します。

## 引数解析

1. 種別を特定（必須）
2. オプションを解析

## Phase 1: データ収集

種別に応じて関連データを収集：

### vulnerability-summary
- `knowledge/vulnerabilities/` 内の全ファイルを読み込み
- 期間でフィルタリング

### test-results
- `tests/` 内のテストケースファイルを読み込み
- status が executed/passed/failed のものを抽出

### security-posture
- 全カテゴリのデータを横断的に収集
- ベストプラクティスの対応状況も含む

### update-digest
- `knowledge/updates/` 内の全ファイルを読み込み

## Phase 2: 分析・集計

1. カテゴリ別の集計
2. 重要度別の分布
3. トレンド分析（前回との比較）

## Phase 3: レポート生成

### vulnerability-summary

```markdown
# 脆弱性調査サマリーレポート

期間: YYYY-MM-DD 〜 YYYY-MM-DD

## 概要統計

| 重要度 | 件数 |
|--------|------|
| Critical | X件 |
| High | X件 |
| Medium | X件 |
| Low | X件 |

## カテゴリ別

| カテゴリ | 件数 | 最重要 |
|---------|------|--------|
| [カテゴリ] | X件 | [重要度] |

## 重要な発見事項

1. [発見事項]
2. [発見事項]

## 推奨アクション

1. [アクション]
2. [アクション]
```

### test-results

```markdown
# テスト結果レポート

## 結果サマリー

| 結果 | 件数 |
|------|------|
| PASS | X件 |
| FAIL | X件 |
| 未実行 | X件 |

## FAIL したテスト

| テストID | カテゴリ | 重要度 | 概要 |
|---------|---------|--------|------|
| [ID] | [カテゴリ] | [重要度] | [概要] |
```

## Phase 4: ファイル保存

1. `reports/{YYYY-MM-DD}-{type}.md` に保存
2. `--format gitbook` の場合は `docs/reports/` にも保存し、`docs/SUMMARY.md` を更新

## Phase 5: ユーザーへの提示

1. レポートのサマリーを表示
2. ファイルパスを表示
3. GitBook公開の提案
