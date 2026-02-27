# 出力フォーマット統一ルール

全てのスキル・コマンドの出力に適用される統一フォーマットです。

## Frontmatter（必須）

全ての調査結果・テストケースファイルには以下のFrontmatterを含める：

```yaml
---
date: YYYY-MM-DD
category: vulnerabilities | updates | best-practices | test-cases
subcategory: prompt-injection | sandbox-escape | dependency | auth-bypass | data-leakage | skill-abuse | channel-spoofing | secret-leakage | agent-hijack
severity: critical | high | medium | low | info
source: CVE-ID | GitHub Advisory URL | その他のソースURL
affects: openclaw | dependency-name | general
tags: [タグ1, タグ2, ...]
---
```

## ファイル名規則

```
{YYYY-MM-DD}-{slug}.md
```

例:
- `2026-02-27-prompt-injection-via-whatsapp-media.md`
- `2026-02-27-openclaw-v2026-2-26-security-fixes.md`
- `2026-02-27-owasp-llm-top10-overview.md`

## 保存先

| カテゴリ | knowledge/ (内部データ) | docs/ (GitBook公開用) |
|---------|----------------------|---------------------|
| 脆弱性事例 | `knowledge/vulnerabilities/{subcategory}/` | `docs/vulnerabilities/` |
| アップデート | `knowledge/updates/` | `docs/updates/` |
| ベストプラクティス | `knowledge/best-practices/` | `docs/best-practices/` |
| テストケース | `tests/{subcategory}/` | `docs/test-cases/` |
| レポート | `reports/` | `docs/reports/` |

## 保存後のアクション

1. `knowledge/index.md` にインデックスを追記
2. 公開に適した内容であれば `docs/` にも反映
3. `docs/SUMMARY.md` を更新

## 日本語要約ルール

英語ソースの場合は必ず以下を含める：
- 日本語での要約（3-5文）
- 原文の重要な引用（英語のまま）
- OpenClawへの影響の分析（日本語）
