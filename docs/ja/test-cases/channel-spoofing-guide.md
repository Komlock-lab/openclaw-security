# チャンネルなりすましテストガイド

## 概要

チャンネルなりすまし攻撃は、OpenClawの15以上のメッセージングプラットフォーム統合における認証・認可の弱点を悪用します。このテストスイートは、DMペアリング脆弱性、allowlistバイパス、送信者検証問題をカバーします。

**テストカバレッジ**: 25件以上の認証バイパス脆弱性をカバーする12件のテストケース

## テストカテゴリ

### Part 1: DMペアリング攻撃（4件）
- ペアリングコードのブルートフォース
- pairing-storeクロスアカウントスコープ
- レート制限バイパス
- ペアリングリプレイ攻撃

### Part 2: Allowlistバイパス（4件）
- 表示名衝突
- ユーザー名なりすまし
- 空Allowlistの失敗オープン
- Allowlistスラグ衝突

### Part 3: チャンネル固有バイパス（4件）
- MS Teams送信者バイパス
- Discordオーナーフラグ省略
- Slackインタラクティブコールバックスキップ
- Matrixクロスホームサーバーなりすまし

## テストの実行

```bash
cd openclaw-security/tests/channel-spoofing
./run-all.sh
```

## 関連リソース

- **脆弱性**: [認証バイパス](../vulnerabilities/auth-bypass.md)
- **ベストプラクティス**: [チャンネルセキュリティ](../best-practices/channel-security.md)
- **テストケース**: `tests/channel-spoofing/`ディレクトリ
