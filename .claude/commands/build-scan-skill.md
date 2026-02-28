# /build-scan-skill - セキュリティスキャンスキルのビルド

data/vulnerability-db.json を検証し、skill-dist/auditclaw-scan/ にコピーするビルドコマンド。

## 実行手順

1. ビルドスクリプトを実行してください:

```bash
npx tsx scripts/build-skill.ts
```

2. ビルドが成功したことを確認してください:
   - JSONの整合性チェックが通ること
   - 必須フィールドが全て存在すること
   - entryCountが実際の脆弱性数と一致すること
   - skill-dist/auditclaw-scan/vulnerability-db.json にコピーされること

3. スキャンの動作テストを実行してください:

```bash
bash skill-dist/auditclaw-scan/scan.sh 2026.2.10
```

4. 結果をユーザーに報告してください:
   - ビルド成功/失敗
   - 脆弱性エントリ数
   - ランタイムチェック数
   - スキャンテスト結果のサマリー
