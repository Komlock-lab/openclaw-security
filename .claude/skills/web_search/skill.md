---
name: web_search
description: セキュリティ情報のWeb検索。脆弱性DB、セキュリティアドバイザリ、技術ブログ等から情報を収集する。
---

# Web Search Skill

セキュリティ関連の情報をWeb検索で収集するための基本スキルです。
他の調査スキルから呼び出されます。

## 検索方法

### WebSearch ツール（推奨）
Claude Codeの組み込みWebSearchツールを使用。

### Brave Search API（詳細検索が必要な場合）
```bash
curl -s "https://api.search.brave.com/res/v1/web/search" \
  -H "Accept: application/json" \
  -H "X-Subscription-Token: ${BRAVE_SEARCH_API_KEY}" \
  -G \
  --data-urlencode "q=検索クエリ" \
  --data-urlencode "count=10" \
  --data-urlencode "freshness=pm"
```

## セキュリティ特化の検索パターン

### CVE/脆弱性検索
```
"CVE-YYYY-XXXXX"                    # 特定CVEの詳細
"[software] CVE 2025 2026"          # ソフトウェア別の最新CVE
"site:nvd.nist.gov [software]"      # NVDでの検索
"site:github.com/advisories [topic]" # GitHub Advisory
```

### セキュリティニュース
```
"[topic] security vulnerability latest"
"[topic] セキュリティ 脆弱性 最新"
freshness: pd (24時間以内) / pw (1週間以内)
```

### ベストプラクティス
```
"OWASP [topic] 2025 2026"
"[topic] security hardening"
"[topic] security checklist best practices"
```

### OpenClaw固有
```
"openclaw security"
"site:github.com/openclaw/openclaw security"
"openclaw vulnerability"
"openclaw prompt injection"
```

## 検索結果の処理

1. **タイトルとURLを記録**: 全ての検索結果のタイトルとURLを保持
2. **信頼度評価**: 公式ソース > セキュリティ研究者 > 一般ブログ
3. **WebFetchで詳細取得**: 重要なページはWebFetchで全文取得
4. **日付の確認**: 古い情報は「発行日: YYYY-MM-DD」と明記
