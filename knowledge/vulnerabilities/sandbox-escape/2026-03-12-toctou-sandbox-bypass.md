---
date: 2026-03-12
category: vulnerabilities
subcategory: sandbox-escape
severity: critical
source: https://github.com/openclaw/openclaw/security/advisories
affects: openclaw
tags: [TOCTOU, race-condition, symlink, sandbox-escape, writeFileWithinRoot, ZIP-extraction, path-traversal]
---

# TOCTOU攻撃によるサンドボックスバイパス

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-03-12 |
| カテゴリ | sandbox-escape |
| 重要度 | Critical |
| 関連アドバイザリ | 6件（TOCTOU 3件 + シンボリックリンク系3件） |
| 影響バージョン | v2026.3.0以前 |
| 修正バージョン | v2026.3.1 ~ v2026.3.2 |
| OpenClawへの影響 | サンドボックスの根本的なバイパスが可能 |

## 概要

TOCTOU（Time-of-Check to Time-of-Use）攻撃は、パス検証（Check）とファイル操作（Use）の間のレースウィンドウにシンボリックリンクを差し替えることで、サンドボックス境界を突破する攻撃手法である。OpenClawでは v2026.3.1 で3件のTOCTOU脆弱性が発見・修正され、従来のシンボリックリンク/ハードリンクバイパスに加えて**レースコンディションという新たな攻撃パターン**が確立された。

### 攻撃の原理

```
[通常のフロー]
1. アプリケーションがパス "/sandbox/file.txt" を検証 → OK（サンドボックス内）
2. アプリケーションがパス "/sandbox/file.txt" にファイルを書き込み

[TOCTOU攻撃]
1. アプリケーションがパス "/sandbox/file.txt" を検証 → OK（サンドボックス内）
   ← 攻撃者がこの瞬間に "/sandbox/file.txt" を "/etc/passwd" へのシンボリックリンクに差し替え
2. アプリケーションがパス "/sandbox/file.txt" にファイルを書き込み → 実際には "/etc/passwd" に書き込み
```

## 脆弱性の詳細

### GHSA-7xmq-g46g-f8pv: サンドボックスメディアTOCTOU

| 項目 | 内容 |
|------|------|
| 深刻度 | Medium |
| 修正バージョン | >= 2026.3.1 |
| カテゴリ | Sandbox Escape |
| 攻撃対象 | サンドボックスメディア処理 |

**攻撃手法**:
サンドボックスメディアのファイル読み込み処理で、パス検証後にシンボリックリンクを差し替えることで、サンドボックスルート外のファイルを読み取り可能。

**影響**:
- サンドボックス外の任意ファイル読み取り
- 機密情報（設定ファイル、シークレット等）の窃取

### GHSA-x82f-27x3-q89c: writeFileWithinRootのTOCTOUシンボリックリンクレース

| 項目 | 内容 |
|------|------|
| 深刻度 | Medium |
| 修正バージョン | >= 2026.3.1 |
| カテゴリ | Sandbox Escape |
| 攻撃対象 | writeFileWithinRoot関数 |

**攻撃手法**:
`writeFileWithinRoot` はサンドボックスルート内へのファイル書き込みを保証する関数だが、パス検証とファイル書き込みの間にシンボリックリンクを差し替えることで、ルート境界外にファイルを作成または切り詰め（truncate）可能。

**影響**:
- サンドボックス外への任意ファイル作成
- 既存ファイルの切り詰め（0バイト化によるサービス妨害）
- 設定ファイルの上書きによるセキュリティ設定の無効化

**攻撃コードの概念**:
```bash
# 攻撃スクリプト（概念実証）
# 1. サンドボックス内にディレクトリを作成
mkdir -p /sandbox/workspace/target_dir

# 2. 検証が通った直後のタイミングで、ディレクトリをシンボリックリンクに差し替え
# （レースウィンドウは数ミリ秒）
while true; do
  rm -rf /sandbox/workspace/target_dir
  ln -s /host/sensitive/path /sandbox/workspace/target_dir
  mkdir -p /sandbox/workspace/target_dir
done &

# 3. writeFileWithinRootが "/sandbox/workspace/target_dir/file" に書き込み
# → 一定確率で "/host/sensitive/path/file" に書き込まれる
```

### GHSA-r54r-wmmq-mh84: ZIP展開レースによるシンボリックリンク再バインド

| 項目 | 内容 |
|------|------|
| 深刻度 | Medium |
| 修正バージョン | >= 2026.3.2 |
| カテゴリ | Path Traversal |
| 攻撃対象 | ZIP/アーカイブ展開処理 |

**攻撃手法**:
ZIPアーカイブの展開処理中に、展開先の親ディレクトリのシンボリックリンクを差し替えることで、意図しないディレクトリへの書き込みを実現。

**影響**:
- 宛先外ディレクトリへのファイル書き込み
- スキルインストール処理の悪用によるサンドボックス外への書き込み

## 関連するシンボリックリンク系バイパス

TOCTOU攻撃と密接に関連する、シンボリックリンクを利用した従来型のバイパスも合わせて整理する。

### 静的シンボリックリンクバイパス（修正済み）

| GHSA ID | 深刻度 | 手法 | 概要 |
|---------|--------|------|------|
| GHSA-qcc4-p59m-p54m | High | ダングリングシンボリックリンク | workspace-only書き込み境界バイパス |
| GHSA-mgrq-9f93-wpp5 | High | out-of-rootシンボリックリンクリーフ | 存在しないパスでのパスガードバイパス |
| GHSA-m8v2-6wwh-r4gc | Medium | シンボリックリンク親パス | サンドボックスバインド検証のバイパス |
| GHSA-xmv6-r34m-62p4 | Medium | tmpシンボリックリンクエイリアス | サンドボックスメディアフォールバックのバイパス |
| GHSA-cfvj-7rx7-fc7c | Medium | stageSandboxMedia | シンボリックリンクトラバーサルでサンドボックス外ファイル上書き |
| GHSA-3jx4-q2m7-r496 | High | ハードリンクエイリアス | workspace-onlyファイル境界バイパス |

### パストラバーサル系

| GHSA ID | 深刻度 | 手法 | 概要 |
|---------|--------|------|------|
| GHSA-xw4p-pw82-hqr7 | High | スキルミラーリング | サンドボックスskillミラーリングのパストラバーサル |
| GHSA-27cr-4p5m-74rj | Medium | @プレフィックス絶対パス | Workspace-onlyサンドボックスガードの不一致 |

## 攻撃パターンの進化

```
Phase 1: 静的シンボリックリンクバイパス (v2026.1.x ~ v2026.2.x)
├── ダングリングシンボリックリンク
├── out-of-rootシンボリックリンクリーフ
├── ハードリンクエイリアス
└── パストラバーサル（../を含むパス）

Phase 2: 動的TOCTOU攻撃 (v2026.3.1で発見・修正)
├── サンドボックスメディアTOCTOU
├── writeFileWithinRoot シンボリックリンクレース
└── ZIP展開レース（v2026.3.2で修正）

Phase 3: ACP継承バイパス (v2026.3.1-3.2で発見・修正)
├── sessions_spawn サンドボックス継承バイパス
└── ホストACPセッション初期化バイパス
```

## 防御メカニズムと限界

### 現行の防御
1. **パス正規化（realpath）**: シンボリックリンクを解決してから検証
2. **O_NOFOLLOW フラグ**: シンボリックリンクを追従しないファイルオープン
3. **openat() + ディレクトリFD**: ディレクトリファイルディスクリプタを使った安全なファイル操作

### TOCTOU攻撃への根本対策
- **アトミック操作**: 検証と操作を不可分に実行（renameat2, linkat等）
- **ディレクトリFDベースの操作**: openat() でディレクトリFDを保持し、そのFDに対してfstatat/renameat等を行う
- **tmpdir + rename**: 一時ファイルに書き込み後、rename()でアトミックに配置
- **Capsicum/Landlock**: OSレベルのケイパビリティベースのアクセス制御

### OpenClawでの修正アプローチ（推定）
v2026.3.1-3.2の修正では、以下のアプローチが適用されたと推定:
- writeFileWithinRootのアトミック化（tmpfile + rename）
- メディア処理のパス検証とオープンの統合
- ZIP展開時の親ディレクトリの再検証

## 深刻度分析

### 単体での深刻度
Medium（レースウィンドウの成功確率に依存、リモートからの直接悪用は困難）

### 攻撃チェーンでの深刻度
Critical（プロンプトインジェクション → スキル実行 → TOCTOU攻撃の連鎖が可能）

```
プロンプトインジェクション
  └→ LLMがファイル操作ツールを呼び出し
      └→ サンドボックス内での操作（検証通過）
          └→ TOCTOU（シンボリックリンク差し替え）
              └→ サンドボックス外への書き込み/読み取り
                  ├→ 設定ファイル改ざん（サンドボックス無効化）
                  ├→ シークレットファイル読み取り
                  └→ 永続化（cronジョブ等の配置）
```

## AuditClawでの対応状況

| 対応項目 | ステータス |
|---------|-----------|
| vulnerability-db.json登録 | 完了（TOCTOU 3件 + 関連6件） |
| テストケース | 未作成（優先度Critical） |
| ランタイムチェック | RC-003（sandbox-enabled）、RC-019（sessions_spawn継承） |
| ドキュメント | 本記事が初回 |

## テストケース設計案

TOCTOU攻撃のテストケースは以下の方針で設計する:

1. **シンボリックリンクレースの検出テスト**: writeFileWithinRoot相当の処理でレースウィンドウが存在するかの検証
2. **ZIP展開のアトミック性テスト**: 展開中にシンボリックリンク操作が割り込めないことの検証
3. **メディア処理のパス固定テスト**: メディアファイル処理でパスが検証時点で固定されることの検証
4. **サンドボックス境界の突破テスト**: 各TOCTOU手法でサンドボックス外へのアクセスが遮断されることの検証

## 参考情報

- OpenClaw Security Advisories: https://github.com/openclaw/openclaw/security/advisories
- TOCTOU Wikipedia: https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
- CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition
- vulnerability-db.json: TOCTOU 3件 + Sandbox Escape 5件 + Path Traversal 4件
- research.md セクション5.4, 7.2, 7.3
