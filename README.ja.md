[English](README.md) | **日本語**

# OpenClaw Security

OpenClawのセキュリティを改善するためのリポジトリです。

## なぜ必要か

[OpenClaw](https://github.com/openclaw/openclaw)（23万スター超のオープンソースAIアシスタント）は強力ですが、セキュリティリスクも大きいです。

- 160件以上のセキュリティアドバイザリが公開済み
- サンドボックスがデフォルトで無効
- プロンプトインジェクション対策が未実装
- 15以上のメッセージングプラットフォーム対応による広大な攻撃面

## やること

```mermaid
graph LR
    A["調べる"] --> B["試す"] --> C["守る"]
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

### バージョン診断する
```bash
/check-version 2026.2.10             # 使用中のバージョンの脆弱性を診断

# スクリプトで直接実行も可能
npx tsx scripts/version-check.ts 2026.2.10
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

## クイックスキャン

```bash
curl -sL https://raw.githubusercontent.com/natsuki/openclaw-security/main/skill-dist/openclaw-security-scan/scan.sh | bash
```

これだけ。OpenClawのバージョンを自動検出してMarkdownセキュリティレポートを出力します。特定バージョンを指定する場合:

```bash
curl -sL https://raw.githubusercontent.com/natsuki/openclaw-security/main/skill-dist/openclaw-security-scan/scan.sh | bash -s 2026.2.10
```

## OpenClawスキル統合

OpenClawに組み込めるセキュリティ自己診断スキルです。チャットで「セキュリティスキャン」と言うだけで実行されます。

詳細: [スキル使い方ガイド](docs/ja/skill/README.md)

## FAQ

**このスキルは自分のコードやシークレットにアクセスする？**
いいえ。自身の `vulnerability-db.json` とOpenClawのバージョン/設定出力のみを読みます。あなたのファイルには触れません。[詳細](docs/ja/best-practices/setup-guide.md#このスキルはどんなデータにアクセスする)

**OpenClawは親ディレクトリや兄弟ディレクトリにアクセスできる？**
サンドボックスが無効（デフォルト）の場合、できます。これはこのスキル固有のリスクではなく、OpenClaw自体のリスクです。`openclaw config set sandbox all` で対策してください。[詳細](docs/ja/best-practices/setup-guide.md#openclawは親ディレクトリや兄弟ディレクトリにアクセスできる)

**どこにセットアップすべき？**
専用の隔離ディレクトリを使ってください。機密ファイルはOpenClawワークスペースの外に置いてください。[推奨ディレクトリ構成](docs/ja/best-practices/setup-guide.md#ディレクトリ構造-安全-vs-危険)

**セキュリティ的にベストなセットアップは？**
サンドボックス有効化、exec許可リスト制限、Webhookシークレット設定、自動アップデート有効化。[完全セットアップガイド](docs/ja/best-practices/setup-guide.md#堅牢構成本番環境推奨)

**スキルとして組み込まず、一時的に実行したい場合は？**
curlワンライナーなら何もインストールされません。実行後に残るのは `/tmp/openclaw-vuln-db.json`（一時ファイル）だけです。上の「クイックスキャン」を使ってください。

## 免責事項

本ツールは情報提供および防御的セキュリティ目的でのみ提供されています。インストールおよび利用は自己責任でお願いします。本ツールの使用により生じたいかなる損害についても、作者は一切の責任を負いません。結果は必ず[OpenClaw公式セキュリティアドバイザリ](https://github.com/openclaw/openclaw/security/advisories)と照合してください。

## ナレッジベース（GitBook）

調査結果は `docs/` に整理し、GitBookで公開しています。

## ディレクトリ構成

```
data/             # 正規データソース（vulnerability-db.json）
docs/             # GitBook公開用ドキュメント（en/ + ja/）
i18n/             # 多言語翻訳オーバーレイ
knowledge/        # 調査の生データ（ナレッジベース）
skill-dist/       # 配布用スキル（セキュリティセルフスキャン）
tests/            # 攻撃テストケース
reports/          # 検証レポート
scripts/          # ユーティリティスクリプト
.claude/skills/   # 調査・テストの自動化スキル
.claude/commands/ # スラッシュコマンド定義
```
