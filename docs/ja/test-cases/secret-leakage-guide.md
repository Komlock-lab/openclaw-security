# シークレット漏洩テストガイド

## 概要

シークレット漏洩攻撃は、機密認証情報、APIキー、認証トークンの不適切な取り扱いを悪用します。このテストスイートは、Gateway認証漏洩、botトークン露出、スキルシークレット開示をカバーします。

**テストカバレッジ**: 5件以上のシークレット漏洩脆弱性をカバーする10件のテストケース

## テストカテゴリ

### Part 1: Gateway認証漏洩（3件）
- ダッシュボードlocalStorage漏洩
- URLクエリパラメータ露出
- ブラウザ履歴リーク

### Part 2: Botトークン露出（3件）
- Telegramトークンログ漏洩
- skills.statusシークレット開示
- 環境変数リーク

### Part 3: クロスエージェント漏洩（4件）
- ACPリソース共有シークレット露出
- sessions_spawn認証情報継承
- スキル間シークレットアクセス
- プラグイン隔離バイパス

## テストの実行

```bash
cd openclaw-security/tests/secret-leakage
./run-all.sh
```

## 関連リソース

- **脆弱性**: [シークレット漏洩](../vulnerabilities/secret-leakage.md)
- **ベストプラクティス**: [ハードニングガイド](../best-practices/hardening-guide.md)
- **テストケース**: `tests/secret-leakage/`ディレクトリ
