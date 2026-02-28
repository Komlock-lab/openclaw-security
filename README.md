# OpenClaw Security

OpenClawのセキュリティを改善するためのリポジトリです。

## なぜ必要か

[OpenClaw](https://github.com/openclaw/openclaw)（23万スター超のオープンソースAIアシスタント）は強力ですが、セキュリティリスクも大きいです。

- 160件以上のセキュリティアドバイザリが公開済み
- サンドボックスがデフォルトで無効
- プロンプトインジェクション対策が未実装
- 15以上のメッセージングプラットフォーム対応による広大な攻撃面

## やること

```
調べる → 試す → 守る
```

1. **調べる**: 海外の脆弱性事例・CVE・アップデート情報を収集
2. **試す**: 攻撃テストケースを作ってボットに仮想攻撃し弱点を検証
3. **守る**: ベストプラクティスを整理してセキュリティガイドを作成

## 使い方（Claude Code スラッシュコマンド）

### 調査する
```bash
/research-vuln prompt-injection       # 脆弱性事例を調査
/research-updates openclaw            # アップデート情報を調査
/research-bestpractice llm-security   # ベストプラクティスを調査
```

### テストする
```bash
/create-testcase prompt-injection     # 攻撃テストケースを作成
/run-test prompt-injection            # テストを実行
```

### レポートする
```bash
/generate-report security-posture     # セキュリティ総合評価レポート
```

## ナレッジベース（GitBook）

調査結果は `docs/` に整理し、GitBookで公開しています。

## ディレクトリ構成

```
docs/           # GitBook公開用ドキュメント
knowledge/      # 調査の生データ（ナレッジベース）
tests/          # 攻撃テストケース
reports/        # 検証レポート
.claude/skills/ # 調査・テストの自動化スキル
.claude/commands/ # スラッシュコマンド定義
```
