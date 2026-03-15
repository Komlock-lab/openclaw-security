# スキル悪用テストガイド

## 概要

スキル悪用攻撃は、OpenClawのスキル実行とsystem.run承認メカニズムを悪用します。このテストスイートは、execホワイトリストバイパス、スキルサプライチェーン攻撃、承認ワークフローバイパスをカバーします。

**テストカバレッジ**: 16件以上の脆弱性をカバーする10件のテストケース

## テストカテゴリ

### Part 1: Execホワイトリストバイパス（4件）
- GNUロングオプション省略形
- env -Sラッパーバイパス
- PowerShellエンコードコマンド
- ラッパー深度境界スキップ

### Part 2: スキルサプライチェーン（4件）
- SKILL.mdのUnicodeステガノグラフィ
- パストラバーサル経由のSKILL.md改竄
- 悪意のある外部URLフェッチ
- 権限昇格チェーン

### Part 3: 承認バインディングバイパス（2件）
- system.run承認ID不一致
- PATHトークン実行可能ファイルリバインド

## テストの実行

```bash
cd openclaw-security/tests/skill-abuse
./run-all.sh
```

## 関連リソース

- **脆弱性**: [Execバイパス](../vulnerabilities/exec-bypass.md)
- **テストケース**: `tests/skill-abuse/`ディレクトリ
- **ベストプラクティス**: [ハードニングガイド](../best-practices/hardening-guide.md)
