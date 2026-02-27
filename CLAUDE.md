# OpenClaw Security

OpenClawのセキュリティ改善のためのリポジトリ。攻撃テストケースの作成・実行とセキュリティナレッジの蓄積を行う。

## プロジェクト構成

```
openclaw-security/
├── .claude/commands/    # スラッシュコマンド
├── .claude/skills/      # スキル定義
├── docs/                # GitBook公開用ドキュメント（SUMMARY.mdで目次管理）
│   ├── vulnerabilities/ # 脆弱性事例
│   ├── updates/         # アップデート情報
│   ├── best-practices/  # ベストプラクティス
│   ├── test-cases/      # テストケース結果
│   └── reports/         # レポート
├── knowledge/           # 内部ナレッジ（調査の生データ）
├── tests/               # 攻撃テストケース（カテゴリ別）
├── reports/             # 検証レポート
├── scripts/             # ユーティリティスクリプト
└── book.json            # GitBook設定
```

## GitBook公開

- `docs/` ディレクトリがGitBookのルート
- `docs/SUMMARY.md` で目次構成を管理
- 調査結果は `knowledge/` に保存 → 整理して `docs/` に公開用ドキュメントとして反映
- GitBookで公開: https://gitbook.io で連携

## スラッシュコマンド一覧

### 調査系
| コマンド | 説明 |
|---------|------|
| `/research-vuln [カテゴリ]` | 脆弱性事例を調査（CVE、GitHub Advisory等） |
| `/research-updates [対象]` | バージョンアップデート・セキュリティ修正を調査 |
| `/research-bestpractice [トピック]` | OWASP等のベストプラクティスを調査 |

### テスト系
| コマンド | 説明 |
|---------|------|
| `/create-testcase [カテゴリ]` | 攻撃テストケースを設計・作成 |
| `/run-test [パス or カテゴリ]` | テストケースを実行 |
| `/generate-report [種別]` | 検証レポートを生成 |

## 攻撃カテゴリ

| カテゴリ | 説明 |
|---------|------|
| `prompt-injection` | プロンプトインジェクション攻撃 |
| `sandbox-escape` | サンドボックスエスケープ |
| `skill-abuse` | スキルシステムの悪用 |
| `channel-spoofing` | チャンネルなりすまし |
| `secret-leakage` | シークレット漏洩 |
| `agent-hijack` | Agent通信の乗っ取り |

## スキル体系

```
Level 1: 基本スキル
  └── web_search        # Web検索（Brave Search API）

Level 2: 調査スキル
  ├── vuln_research     # 脆弱性事例調査
  ├── update_watch      # アップデート監視
  └── bestpractice_research # ベストプラクティス調査

Level 3: テストスキル
  └── attack_test       # 攻撃テスト設計

共通:
  ├── security_rules    # セキュリティ調査の共通ルール
  └── output_format     # 出力フォーマット統一ルール
```

## ナレッジの保存ルール

- ファイル名: `{YYYY-MM-DD}-{slug}.md`
- Frontmatter必須（date, category, severity, source等）
- `knowledge/index.md` にインデックスを追記
- 英語ソースの場合は日本語で要約を付ける

## 対象プロジェクト

- **OpenClaw**: https://github.com/openclaw/openclaw
- **技術スタック**: TypeScript, Node.js >= 22
- **最新バージョン**: v2026.2.26
