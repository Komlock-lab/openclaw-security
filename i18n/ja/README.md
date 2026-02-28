# 日本語翻訳

このディレクトリには、openclaw-security の日本語翻訳オーバーレイが含まれています。

## ファイル構成

| ファイル | 説明 |
|---------|------|
| `vulnerability-db.json` | 脆弱性DBの日本語翻訳（summary, category, description, recommendation） |
| `messages.json` | UIメッセージの日本語翻訳（スキャン出力、バージョンチェック出力等） |

## 使い方

英語のマスターデータ（`data/vulnerability-db.json`）の `id` フィールドをキーとして、日本語テキストをオーバーレイします。

```typescript
// 例: 日本語翻訳の適用
import masterDb from '../../data/vulnerability-db.json';
import jaOverlay from './vulnerability-db.json';

for (const vuln of masterDb.vulnerabilities) {
  const ja = jaOverlay.vulnerabilities[vuln.id];
  if (ja) {
    vuln.summary = ja.summary;
    vuln.category = ja.category;
  }
}
```
