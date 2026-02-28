# /check-version

指定されたOpenClawバージョンに存在する既知の脆弱性を診断するコマンド。

## 使い方

```bash
/check-version [バージョン番号]
```

### 使用例

```bash
/check-version 2026.2.10    # 特定バージョンを診断
/check-version 2026.1.29    # 古いバージョンを診断
/check-version latest       # 最新版の状態を確認
```

---

# コマンド実行

$ARGUMENTS の内容を分析し、バージョン診断を実行します。

## Phase 1: バージョン解析

1. 引数からバージョン番号を取得
2. `latest` の場合は最新バージョン（2026.2.26）を使用
3. バージョン形式を検証（YYYY.M.D形式）

## Phase 2: スクリプト実行

```bash
npx tsx scripts/version-check.ts [バージョン]
```

## Phase 3: 追加分析

スクリプトの出力に加えて、以下を分析：

1. `knowledge/updates/version-vulnerability-map.md` を参照して詳細情報を補足
2. 該当する脆弱性のテストケースが `tests/` にあるか確認
3. バージョン固有の攻撃テスト提案

## Phase 4: 推奨アクション

1. アップデート推奨（具体的なバージョンと修正内容）
2. アップデートできない場合の緩和策
3. 該当バージョンで実行すべきテストケースの提案
