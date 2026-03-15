# サンドボックスエスケープテストガイド

## 概要

サンドボックスエスケープは、OpenClawのセキュリティモデルにおける最も重大な脅威の1つです。サンドボックスは、信頼できないコード実行とファイルシステムアクセスを隔離し、悪意のある操作がホストシステムに影響を与えるのを防ぐように設計されています。しかし、以下のような様々なバイパス手法が発見されています。

- **シンボリックリンク/ハードリンク操作** — ファイルシステムリンクのセマンティクスを悪用
- **TOCTOU（Time-of-Check to Time-of-Use）競合状態** — 検証と使用の間のギャップを攻撃
- **コンテナ/ランタイムエスケープ** — DockerまたはACP隔離からの脱出
- **パストラバーサル** — パス境界チェックのバイパス

このテストスイートは3つの次元をカバーします:
- **Part 1（テスト1-4）**: 攻撃**ベクター** — 攻撃者がサンドボックス境界に侵入する方法
- **Part 2（テスト5-10）**: 攻撃**手法** — 特定の悪用方法
- **Part 3（テスト11-12）**: **CI/CDとサプライチェーン** — デプロイメントとインストールを通じた攻撃

## テストインデックス

### Part 1: ベクターベーステスト

| # | テスト | 難易度 | ターゲット | GHSAリファレンス |
|---|------|------------|--------|----------------|
| 1 | ダングリングシンボリックリンクバイパス | 中級 | ワークスペース書き込み境界 | [GHSA-qcc4-p59m-p54m](https://github.com/openclaw/openclaw/security/advisories/GHSA-qcc4-p59m-p54m) |
| 2 | ハードリンクエイリアスバイパス | 中級 | ワークスペースファイル境界 | [GHSA-3jx4-q2m7-r496](https://github.com/openclaw/openclaw/security/advisories/GHSA-3jx4-q2m7-r496) |
| 3 | Dockerバインドマウントインジェクション | 上級 | コンテナ設定 | [GHSA-w235-x559-36mg](https://github.com/openclaw/openclaw/security/advisories/GHSA-w235-x559-36mg) |
| 4 | ACPサンドボックス継承バイパス | 上級 | クロスエージェントsessions_spawn | [GHSA-474h](https://github.com/openclaw/openclaw/security/advisories/GHSA-474h-prjg-mmw3), [GHSA-p7gr](https://github.com/openclaw/openclaw/security/advisories/GHSA-p7gr-f84w-hqg5), [GHSA-9q36](https://github.com/openclaw/openclaw/security/advisories/GHSA-9q36-67vc-rrwg) |

### Part 2: 手法ベーステスト

| # | テスト | 難易度 | 手法カテゴリ | GHSAリファレンス |
|---|------|------------|-------------------|----------------|
| 5 | TOCTOUシンボリックリンク競合 | 上級 | 競合状態 | [GHSA-x82f](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c), [GHSA-7xmq](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv) |
| 6 | ZIP展開競合 | 上級 | 競合状態 | [GHSA-r54r](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84) |
| 7 | /proc/sys情報漏洩 | 中級 | カーネルインターフェース | (直接のGHSAなし — 一般的なLinuxコンテナエスケープ) |
| 8 | 環境変数上書き | 中級 | プロセス環境 | execホワイトリストバイパスパターンに関連 |
| 9 | Tmpdir脱出 | 中級 | 一時ディレクトリ | シンボリックリンクトラバーサルパターンに関連 |
| 10 | ファイルディスクリプタリーク | 上級 | プロセス継承 | (直接のGHSAなし — FDテーブルリークパターン) |

### Part 3: CI/CDとサプライチェーンテスト

| # | テスト | 難易度 | ターゲット | GHSAリファレンス |
|---|------|------------|--------|----------------|
| 11 | CI環境サンドボックスバイパス | 上級 | GitHub Actions / CIランナー | DockerおよびEnvironmentパターンに関連 |
| 12 | プラグインインストールパストラバーサル | 上級 | スキルインストール | [GHSA-qrq5](https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw), [GHSA-vhwf](https://github.com/openclaw/openclaw/security/advisories/GHSA-vhwf-4x96-vqx2) |

## テストカバレッジマトリクス

| 手法カテゴリ | テスト | 件数 |
|-------------------|-------|-------|
| シンボリックリンク/ハードリンク操作 | 1, 2, 5 | 3 |
| 競合状態（TOCTOU） | 5, 6 | 2 |
| コンテナエスケープ | 3, 7, 11 | 3 |
| プロセス/環境 | 8, 10 | 2 |
| パストラバーサル | 9, 12 | 2 |

## 脆弱性統計

vulnerability-db.json に基づく（2026-03-12時点）:

| カテゴリ | 件数 | 最高深刻度 |
|----------|-------|------------------|
| サンドボックスエスケープ | 7件 | High |
| TOCTOU | 3件 | Medium |
| パストラバーサル | 6件 | High |
| Docker/コンテナ | 2件以上 | Medium-High |

**合計カバレッジ**: 12件のテストケースで18件以上の既知脆弱性と一般的なバイパスパターンをカバー。

## 攻撃パターンの進化

```
Phase 1: 静的リンクバイパス (v2026.1.x ~ v2026.2.x)
├── ダングリングシンボリックリンク (GHSA-qcc4)
├── 存在しないシンボリックリンクリーフ (GHSA-mgrq)
├── ハードリンクエイリアス (GHSA-3jx4)
└── シンボリックリンク親パス (GHSA-m8v2)

Phase 2: TOCTOU競合状態 (v2026.3.1-3.2)
├── writeFileWithinRootシンボリックリンク競合 (GHSA-x82f)
├── サンドボックスメディアTOCTOU (GHSA-7xmq)
└── ZIP展開競合 (GHSA-r54r)

Phase 3: ACPマルチエージェントバイパス (v2026.3.1-3.2)
├── sessions_spawnサンドボックス継承 (GHSA-474h)
├── クロスエージェントspawn強制 (GHSA-p7gr)
└── ホストACP初期化バイパス (GHSA-9q36)

Phase 4: コンテナとサプライチェーン (継続中)
├── Dockerバインドマウントインジェクション (GHSA-w235)
├── プラグインインストールパストラバーサル (GHSA-qrq5, GHSA-vhwf)
└── CI環境サンドボックスバイパス (実環境パターン)
```

## サンドボックス設定レベル

OpenClawは3つのサンドボックスモードを提供します（`OPENCLAW_SANDBOX`環境変数で制御）:

| モード | 説明 | リスクレベル |
|------|-------------|------------|
| `off` | サンドボックスなし — 全操作がホスト上で実行 | **Critical** |
| `non-main` | ツール操作のみサンドボックス化（exec、ファイルシステム） | **High** |
| `all` | 完全サンドボックス（信頼できない環境で推奨） | **Low** |

**テスト推奨**: 全テストは`OPENCLAW_SANDBOX=all`で実行し、適切な隔離を検証してください。

## テスト前提条件

サンドボックスエスケープテストを実行する前に:

1. **隔離環境**: 専用のVMまたはコンテナを使用
2. **Root/sudoアクセス**: 一部のテストはリンク/マウントの作成に昇格権限が必要
3. **OpenClawインストール**: v2026.2.0以降を推奨
4. **バックアップ**: 一部のテストはシステムファイルに影響を与える可能性があるため、バックアップを確保
5. **監視**: ファイルシステム操作を追跡するために監査ログを有効化

⚠️ **警告**: サンドボックスエスケープテストは設計上、封じ込めを破る可能性があります。制御された環境でのみ実行してください。

## テスト実行のベストプラクティス

1. **テスト前にスナップショット**: 簡単にロールバックできるようにVM/コンテナのスナップショットを取得
2. **一度に1つのテスト**: 複数のサンドボックステストを同時に実行しない
3. **ファイルシステムを監視**: `inotify`または`auditd`を使用してファイル操作を追跡
4. **クリーンアップ**: 各テスト後、全てのシンボリックリンク、ハードリンク、テストファイルを削除
5. **結果を記録**: OpenClawのバージョンと設定で成功/失敗を記録

## 成功基準

テストが**PASS（安全）**の場合:
- サンドボックス境界が維持される
- 不正なファイルシステムアクセスがブロックされる
- 権限昇格が発生しない
- 監査ログがブロックされた試行を示す

テストが**FAIL（脆弱）**の場合:
- サンドボックス外のファイルにアクセスされる
- サンドボックスエスケープが確認される
- ホストシステムが侵害される
- エラー/警告がログに記録されない

## 緩和策

テストが脆弱性を明らかにした場合:

1. **即座にアップグレード**: 最新のOpenClawバージョンに更新
2. **完全サンドボックスを有効化**: `OPENCLAW_SANDBOX=all`を設定
3. **Dockerを制限**: `--security-opt=no-new-privileges`を使用
4. **ログを監視**: サンドボックス違反の監査ログを有効化
5. **OpenClawに報告**: 発見事項をsecurity@openclaw.aiに提出

## 主要な未解決問題

| 問題パターン | 説明 | ステータス |
|--------------|-------------|--------|
| TOCTOU基礎 | チェック-そして-使用パターンに固有の競合状態 | 部分的に緩和（アトミック操作が必要） |
| ACPクロスセッション隔離 | マルチエージェント通信のセキュリティ境界 | v2026.3.2以降で修正済みだが継続的な検証が必要 |
| コンテナブレークアウト | カーネル脆弱性経由のDocker/ランタイムエスケープ | CVEの継続的な監視 |
| FD継承 | サンドボックス境界を超えたファイルディスクリプタリーク | 既知の悪用なし、監視中 |

## 関連リソース

- **脆弱性ドキュメント**:
  - [サンドボックスエスケープ脆弱性](../vulnerabilities/sandbox-escape.md)
  - [TOCTOU脆弱性](../vulnerabilities/toctou.md)
  - [ACPセキュリティ](../vulnerabilities/acp-security.md)
  - [パストラバーサル](../vulnerabilities/path-traversal.md)
- **ベストプラクティス**:
  - [ハードニングガイド - サンドボックス設定](../best-practices/hardening-guide.md#sandbox-configuration)
- **テストケース**: リポジトリ`tests/sandbox-escape/`ディレクトリで利用可能
- **公式ドキュメント**: [OpenClawサンドボックスアーキテクチャ](https://openclaw.ai/docs/security/sandbox)

## テストの実行

### テストリポジトリのクローン

```bash
git clone https://github.com/yourusername/openclaw-security.git
cd openclaw-security/tests/sandbox-escape
```

### 個別テストの実行

```bash
# 例: Test 1（ダングリングシンボリックリンクバイパス）を実行
cd test-01-dangling-symlink
./run.sh

# 結果を確認
echo $?  # 0 = 安全（テストがバイパスに失敗）, 1 = 脆弱
```

### 完全テストスイートの実行

```bash
# 全12テストを実行
./run-all.sh

# レポートを生成
./run-all.sh --report
```

### 結果の検証

```bash
# 監査ログを確認
sudo ausearch -k openclaw-sandbox

# テスト出力をレビュー
cat results/test-summary.json
```

## 脆弱性の報告

テストが新しい脆弱性を発見した場合:

1. **公開しない**: security@openclaw.aiに非公開で連絡
2. **詳細を提供**:
   - OpenClawバージョン
   - 成功したテストケース
   - 再現手順
   - 影響評価
3. **修正時間を確保**: 責任ある開示に従う（90日間）
4. **CVEを調整**: CVE割り当てについてOpenClawセキュリティチームと協力

## 参考資料

- **CWE-367**: Time-of-check Time-of-use (TOCTOU) Race Condition
- **CWE-59**: Improper Link Resolution Before File Access ('Link Following')
- **CWE-610**: Externally Controlled Reference to a Resource in Another Sphere
- **NIST SP 800-190**: Application Container Security Guide
