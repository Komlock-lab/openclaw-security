---
date: 2026-02-27
category: vulnerabilities
subcategory: prompt-injection
severity: critical
source: https://genai.owasp.org/llmrisk/llm01-prompt-injection/
affects: openclaw
tags: [prompt-injection, OWASP, LLM, indirect-injection, tool-abuse, MCP]
---

# プロンプトインジェクション脆弱性 総合調査（2024-2026年）

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-02-27 |
| カテゴリ | prompt-injection |
| 重要度 | Critical |
| 検索回数 | 10回以上 |
| OpenClawへの影響 | あり（最高レベル） |

## 概要

OWASP LLM Top 10 2025でもプロンプトインジェクションは第1位（LLM01）。OpenClawは「致命的な三つ組（Lethal Trifecta）」を全て備えており、最高レベルの警戒が必要。

## 主要な事例（2024-2026年）

| 事例 | CVE | 深刻度 | 年 | OpenClawへの示唆 |
|------|-----|--------|-----|-----------------|
| ChatGPT SpAIware（メモリ永続化） | - | High | 2024 | メモリ/コンテキスト永続化の保護 |
| GitHub Copilot RCE | CVE-2025-53773 | Critical | 2025 | 設定ファイルの書き込み保護 |
| Claude Code DNS Exfiltration | CVE-2025-55284 | High | 2025 | DNS経由データ流出の防止 |
| Manus AI Kill Chain | - | Critical | 2025 | ポート公開等の人間承認必須化 |
| AgentHopper AIウイルス | - | Critical | 2025 | Agent通信・スキルのコード検証 |
| Windsurf MCP YOLO Mode | - | High | 2025 | MCP/スキル呼び出しの権限制御 |
| Scary Agent Skills（不可視Unicode） | - | High | 2026 | スキルの不可視文字検出 |
| Amazon Q Developer RCE | - | Critical | 2025 | 不可視テキスト対策 |

## OpenClawへの影響分析

### 致命的な三つ組（Lethal Trifecta）

OpenClawは以下の3条件を全て満たす：
1. **プライベートデータへのアクセス**: シークレット管理、会話履歴
2. **信頼できないコンテンツの処理**: 外部メッセージ、URL、ファイル添付
3. **外部通信の能力**: マルチチャンネル通信、Webhook、ブラウザ自動操作

### 攻撃ベクター（チャットボット固有）

| ベクター | OpenClawでの該当箇所 |
|---------|-------------------|
| テキストメッセージ | 全チャンネルのメッセージ入力 |
| 画像/ファイル添付 | マルチモーダル処理 |
| URL共有 | ブラウザ自動操作、リンクプレビュー |
| グループチャット | Discord/Slack/Telegramグループ |
| Webhook/API | Webhooks機能 |
| Agent-to-Agent | マルチエージェント通信 |

## 対策・緩和策（優先度順）

### P0（最優先）
- Human-in-the-loop（高リスク操作に人間承認）
- 入力サニタイゼーション（全チャンネル）
- 最小権限の原則
- データ流出防止（URL/DNS/HTTP経由）

### P1（高）
- スキルサプライチェーンセキュリティ
- Agent間通信の認証
- 設定ファイル保護
- サンドボックス強化

### P2（中）
- 出力フィルタリング
- 監査ログ
- レート制限
- 定期的ペネトレーションテスト

## 参考資料

| # | タイトル | URL | 種類 |
|---|---------|-----|------|
| 1 | OWASP LLM01:2025 | https://genai.owasp.org/llmrisk/llm01-prompt-injection/ | 標準 |
| 2 | Greshake et al. Indirect PI | https://arxiv.org/abs/2302.12173 | 研究 |
| 3 | Lethal Trifecta | https://simonwillison.net/2025/Jun/14/the-lethal-trifecta/ | 解説 |
| 4 | Embrace The Red | https://embracethered.com/blog/ | 事例 |
| 5 | Simon Willison PI Series | https://simonwillison.net/series/prompt-injection/ | 解説 |
