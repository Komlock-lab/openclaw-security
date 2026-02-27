# /create-testcase

OpenClawに対する攻撃テストケースを設計・作成するコマンド。

## 使い方

```bash
/create-testcase [カテゴリ] [オプション]
```

### カテゴリ

| カテゴリ | 説明 |
|---------|------|
| prompt-injection | プロンプトインジェクションテスト |
| sandbox-escape | サンドボックスエスケープテスト |
| skill-abuse | スキルシステム悪用テスト |
| channel-spoofing | チャンネルなりすましテスト |
| secret-leakage | シークレット漏洩テスト |
| agent-hijack | Agent通信乗っ取りテスト |

### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| --severity | 重要度（critical/high/medium/low） | high |
| --ref | 参考となる脆弱性事例のパス | - |
| --technique | 特定の攻撃手法を指定 | - |

### 使用例

```bash
# プロンプトインジェクションのテストケースを作成
/create-testcase prompt-injection

# 特定の手法でテストケースを作成
/create-testcase prompt-injection --technique indirect-injection

# 参考事例を基にテストケースを作成
/create-testcase sandbox-escape --ref knowledge/vulnerabilities/sandbox-escape/2026-02-27-docker-escape.md
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、テストケースを作成します。

## 引数解析

1. カテゴリを特定（必須）
2. オプションを解析
3. `--ref` が指定されている場合は参考事例を読み込む

## Phase 1: リサーチ

`attack_test` スキルの Phase 1 に従い、攻撃手法をリサーチ。

既存のナレッジベースも確認：
- `knowledge/vulnerabilities/{subcategory}/` 内の関連事例
- `knowledge/best-practices/` 内の関連ベストプラクティス

## Phase 2: テストケース設計

`attack_test` スキルの Phase 2 に従い、テストケースを設計。

1. テスト目的の明確化
2. 攻撃シナリオの設計（複数パターン）
3. 判定基準の策定

## Phase 3: テストケースファイル生成

`tests/templates/test-template.md` をベースに、テストケースファイルを生成。

テストIDの命名規則:
```
TC-[カテゴリ略称]-[3桁連番]

カテゴリ略称:
  PI = prompt-injection
  SE = sandbox-escape
  SA = skill-abuse
  CS = channel-spoofing
  SL = secret-leakage
  AH = agent-hijack
```

## Phase 4: 保存

1. `tests/{category}/{YYYY-MM-DD}-{slug}.md` に保存
2. 作成したテストケースの概要を表示

## 使用するスキル

| スキル | 用途 |
|--------|------|
| attack_test | メインのテスト設計ロジック |
| web_search | 攻撃手法のリサーチ |
| common/security_rules | 共通ルールの適用 |
| common/output_format | 出力フォーマットの統一 |
