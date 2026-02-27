# セキュリティ調査 共通ルール

全てのセキュリティ調査スキル・コマンドに適用される共通ルールです。

## 調査の基本方針

1. **一次情報を優先**: 公式CVE、GitHub Advisory、NVD、ベンダーのセキュリティアドバイザリを最優先で参照
2. **日本語+英語で調査**: 英語ソースを優先しつつ、日本語での要約を必ず付ける
3. **調査日を必ず記録**: セキュリティ情報は鮮度が命。Frontmatterにdateを必須記載
4. **未確認情報の明記**: 噂・推測・未検証情報には「未確認」と明記する
5. **影響度の評価**: OpenClawへの具体的な影響を必ず分析する

## 信頼できる情報源（優先順）

| 優先度 | 情報源 | URL例 |
|--------|--------|-------|
| 1 | NVD（National Vulnerability Database） | https://nvd.nist.gov/ |
| 2 | GitHub Security Advisories | https://github.com/advisories |
| 3 | OWASP | https://owasp.org/ |
| 4 | ベンダー公式ブログ・リリースノート | 各社公式 |
| 5 | セキュリティ研究者のブログ・論文 | - |
| 6 | Hacker News / Reddit /r/netsec | - |
| 7 | 日本語技術ブログ（Zenn, Qiita等） | - |

## 検索クエリのパターン

### 脆弱性調査
```
"[ソフトウェア名] vulnerability CVE 2025 2026"
"[ソフトウェア名] security advisory"
"[ソフトウェア名] exploit proof of concept"
"[攻撃手法] [ソフトウェア名] attack"
```

### ベストプラクティス
```
"OWASP [トピック] best practices 2025 2026"
"[トピック] security hardening guide"
"[トピック] security checklist"
```

### アップデート情報
```
"[ソフトウェア名] release notes security fix"
"[ソフトウェア名] changelog security"
"[ソフトウェア名] npm audit vulnerability"
```

## 重要度（Severity）の定義

| レベル | 定義 | CVSS |
|--------|------|------|
| Critical | リモートコード実行、認証バイパス等。即座に対応必要 | 9.0-10.0 |
| High | 重要な情報漏洩、権限昇格等 | 7.0-8.9 |
| Medium | 限定的な影響の脆弱性 | 4.0-6.9 |
| Low | 情報漏洩リスクが低い、攻撃条件が厳しい | 0.1-3.9 |

## OpenClawの攻撃面（Attack Surface）

調査時に常に以下の攻撃面を意識すること：

| 攻撃面 | コンポーネント | リスク |
|--------|---------------|--------|
| メッセージ入力 | WhatsApp, Telegram, Discord, Slack等 | プロンプトインジェクション |
| コード実行 | サンドボックス、スキル実行 | サンドボックスエスケープ |
| 外部連携 | Webhook, API, Agent通信 | なりすまし、改ざん |
| データ保存 | 会話履歴、設定、シークレット | 情報漏洩 |
| 依存関係 | npm パッケージ | サプライチェーン攻撃 |
| 認証 | DMペアリング、OAuth | 認証バイパス |

## 禁止事項

- 実際の攻撃コードを公開環境にそのまま記載しない（概念実証のみ）
- 他者のシステムに対する無許可のテストを推奨しない
- ゼロデイ脆弱性の詳細を公開前に記載しない
