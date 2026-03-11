---
date: 2026-03-12
category: vulnerabilities
subcategory: exec-bypass
severity: critical
source: https://github.com/openclaw/openclaw/security/advisories
affects: openclaw
tags: [system.run, exec-allowlist, safeBins, command-injection, shell-bypass, approval-bypass]
---

# system.run / exec allowlist バイパス手法の体系的分類

## 調査サマリー

| 項目 | 内容 |
|------|------|
| 調査日 | 2026-03-12 |
| カテゴリ | exec-bypass |
| 重要度 | Critical |
| 累計バイパス件数 | 28件以上 |
| 影響バージョン | v2026.1.x ~ v2026.3.7 |
| OpenClawへの影響 | 最大の攻撃面（全セキュリティアドバイザリの約17%） |

## 概要

OpenClawの `system.run` コマンド実行機構および `exec allowlist`（`safeBins`）は、ユーザーが許可したコマンドのみを実行させるための中核的セキュリティ機能である。しかし、v2026.1.x以降の累計で **28件以上の固有なバイパス手法** が発見されており、OpenClawにおける最も活発で深刻な攻撃面となっている。

### 根本原因

シェルの複雑さ（bash/sh/zsh/cmd.exe/PowerShell/busybox等の多様性）に対して、**文字列ベースのパターンマッチングでの防御には根本的限界がある**。コマンドの同一性を静的に判定することは、チューリング完全なシェル言語に対しては原理的に困難。

## バイパス手法の分類体系

### カテゴリ1: シェル構文バイパス（8件）

シェルの構文解析の複雑さを利用して、allowlistを迂回する手法群。

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 1 | GHSA-3c6h-g97w-fg78 | High | GNUロングオプション省略 | `--he` を `--help` と解釈するGNU getopt仕様の悪用 |
| 2 | GHSA-3hcm-ggvf-rch5 | High | コマンド置換/バッククォート | ダブルクォート内の `$(...)` や `` `...` `` でコマンド実行 |
| 3 | GHSA-9868-vxmx-w862 | Medium | 行継続コマンド置換 | バックスラッシュ行継続とコマンド置換の組み合わせ |
| 4 | GHSA-9p38-94jf-hgjj | Medium | macOS引用符コマンド置換 | macOS固有の引用符処理の差異を悪用 |
| 5 | GHSA-6rcp-vxwf-3mfp | Medium | 位置引数キャリア | シェルラッパーの位置引数に隠しコマンドを埋め込み |
| 6 | GHSA-65rx-fvh6-r4h2 (CVE-2026-27209) | High | heredoc展開 | 引用符なしheredocでのシェル展開バイパス |
| 7 | GHSA-qj77-c3c8-9c3q | High | Windows cmd.exeパース | Windows固有のコマンドパーサーの差異を悪用 |
| 8 | GHSA-3h2q-j2v4-6w5r | Medium | PowerShellエンコードコマンド | `-EncodedCommand` ラッパーをパーサーが見逃し |

### カテゴリ2: 環境変数・PATHインジェクション（8件）

環境変数やPATH設定を操作してコマンド実行を乗っ取る手法群。

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 9 | GHSA-g75x-8qqm-2vxp | Medium | PATHハイジャック | PATH環境変数の操作で偽バイナリを実行 |
| 10 | GHSA-qhrr-grqp-6x2g | Medium | バイナリシャドウイング | 信頼されたPATHディレクトリ内に同名バイナリを配置 |
| 11 | GHSA-2fgq-7j6h-9rm4 | Medium | SHELLOPTS/PS4インジェクション | シェルデバッグ環境変数を悪用してコード実行 |
| 12 | GHSA-w9cg-v44m-4qv8 | Medium | BASH_ENV/ENVインジェクション | シェルスタートアップファイルの自動読み込みを悪用 |
| 13 | GHSA-xgf2-vxv2-rrmg | Medium | スタートアップenvインジェクション（RCE） | シェルスタートアップ環境変数でRCEを実現 |
| 14 | GHSA-5h2c-8v84-qpvr | Medium | ログインシェルパス | 信頼されたスタートアップenvの攻撃者影響ログインシェルパス |
| 15 | GHSA-f8mp-vj46-cq8v | Medium | SHELLパスフォールバック | 未検証SHELLパスのシェルenvフォールバック |
| 16 | GHSA-p4wh-cr8m-gm6c | Medium | $SHELLフォールバック悪用 | $SHELLフォールバックの攻撃者制御バイナリ実行 |

### カテゴリ3: ラッパー・ディスパッチチェーンバイパス（4件）

コマンド実行のラッパーやディスパッチチェーンの検証不足を悪用する手法群。

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 17 | GHSA-48wf-g7cp-gr3m | Medium | env -Sラッパー | `env -S` でコマンドを間接実行 |
| 18 | GHSA-796m-2973-wc5q | High | env -Sラッパー解釈 | env -S ラッパーの解釈差異を悪用 |
| 19 | GHSA-gwqp-86q6-w47g | Medium | busybox/toybox sh -c | 軽量シェルの `sh -c` 経由の間接実行 |
| 20 | GHSA-jj82-76v6-933r | Medium | ディスパッチチェーンのアンラップ不足 | env/shellディスパッチチェーンの展開が不十分 |

### カテゴリ4: 承認メカニズムバイパス（5件）

system.runの承認（approval）メカニズム自体を迂回する手法群。v2026.3.x系で集中的に発見。

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 21 | GHSA-hwpq-rrpf-pgcq | High | 承認ID不一致 | 表示されたコマンドと実際に実行されるバイナリが異なる |
| 22 | GHSA-q399-23r3-hfx4 | High | PATHトークン未バインド | 承認後に実行ファイルを差し替え可能（TOCTOU的） |
| 23 | GHSA-8g75-q649-6pv6 | Medium | スクリプトオペランド未バインド | 可変スクリプトオペランドが承認/実行間でバインドされず |
| 24 | GHSA-9q2p-vc84-2rwm | Medium | allow-always永続化の汚染 | シェルコメントペイロード末尾がallow-alwaysに永続化 |
| 25 | GHSA-r6qf-8968-wj9q | Medium | ラッパー深度境界スキップ | ラッパー深度制限がシェル承認ゲーティングをスキップ可能 |

### カテゴリ5: その他のバイパス（3件+）

上記に分類されないバイパス手法。

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 26 | GHSA-ccg8-46r6-9qgj | Medium | ディスパッチ深度キャップ不一致 | ディスパッチラッパー深度キャップの不一致 |
| 27 | GHSA-5gj7-jf77-q2q2 | Medium | 書き込み可能ディレクトリのバイナリハイジャック | jq等のバイナリハイジャック |
| 28 | GHSA-j425-whc4-4jgc | Medium | env overrideピボット | env overrideフィルタリングが危険なヘルパーコマンドピボットを許可 |

### カテゴリ6: 関連する承認ハードニング不備（1件）

| # | GHSA ID | 深刻度 | 手法 | 概要 |
|---|---------|--------|------|------|
| 29 | GHSA-h3rm-6x7g-882f | Medium | セマンティックドリフト | Node system.run承認ハードニングラッパーのセマンティックドリフトで意図しないスクリプト実行 |

## 攻撃パターンの進化タイムライン

```
v2026.1.x ~ v2026.2.26 (Phase 1-4: 初期発見)
├── シェル構文バイパス（GNUオプション、コマンド置換、heredoc等）
├── 環境変数インジェクション（PATH, BASH_ENV, SHELLOPTS等）
├── ラッパーチェーン迂回（env -S, busybox, ディスパッチ）
└── 既知の承認ID不一致

v2026.3.1 (Phase 5: 承認バインディング強化)
├── PATHトークン実行ファイルIDバインドの追加
└── 承認メカニズム自体への攻撃が本格化

v2026.3.2 (承認ハードニング)
└── セマンティックドリフトによるハードニング迂回の発見

v2026.3.7 (Phase 6: 多角的バイパス)
├── env overrideピボット
├── allow-always永続化の汚染
├── ラッパー深度境界スキップ
└── PowerShellエンコードコマンドバイパス

v2026.3.8 (最新)
└── スクリプトオペランド未バインドの修正
```

## 深刻度分析

| 深刻度 | 件数 | 割合 |
|--------|------|------|
| High | 8件 | 28% |
| Medium | 21件 | 72% |

High脆弱性はシェル構文バイパスと承認メカニズムバイパスに集中している。

## 攻撃ベクトルの影響評価

### 前提条件
- LLMエージェントが攻撃者の制御下にある（プロンプトインジェクション成功後）
- または、悪意あるスキル/プラグインがインストールされている

### 影響
- **任意コマンド実行**: exec allowlistを迂回し、許可されていないコマンドを実行
- **データ漏洩**: ファイルシステムアクセスによる機密情報の窃取
- **永続化**: allow-always機能を汚染し、以降の実行で承認なしにコマンド実行
- **横展開**: system.runから他のシステムコンポーネントへの攻撃ピボット

### 攻撃チェーンの例

```
プロンプトインジェクション
  └→ LLMがsystem.runを呼び出し
      └→ exec allowlistバイパス（例: env -S, heredoc展開）
          └→ 任意コマンド実行
              ├→ curl で外部C2にデータ送信
              ├→ ファイル読み取り（シークレット窃取）
              └→ allow-always汚染（永続化）
```

## 防御推奨事項

### 即時対応
1. **最新バージョンへのアップデート**: v2026.3.8以降にアップデートし、既知のバイパスの修正を適用
2. **exec allowlistの最小化**: 必要最小限のコマンドのみをallowlistに含める
3. **サンドボックスの有効化**: `sandbox.mode: all` を設定し、コマンド実行をコンテナ内に隔離

### 中期対応
4. **ランタイムチェックの実施**: `openclaw security audit --deep` でsystem.run設定を定期確認
5. **環境変数のサニタイズ**: BASH_ENV, SHELLOPTS, PATH等の危険な環境変数を制限
6. **allow-alwaysの定期監査**: 永続化された承認リストの内容を定期的にレビュー

### 根本対策
7. **設計の見直し**: 文字列パターンマッチングから、実行バイナリのハッシュ検証・署名ベースの承認への移行
8. **サンドボックスファーストの実行モデル**: 全コマンド実行をデフォルトでサンドボックス内に限定

## AuditClawでの対応状況

| 対応項目 | ステータス |
|---------|-----------|
| vulnerability-db.json登録 | 完了（28件+） |
| テストケース | 未作成（優先度Critical） |
| ランタイムチェック | RC-006（exec-allowlist）、RC-016（承認バインディング） |
| ドキュメント | 本記事が初回 |

## 参考情報

- OpenClaw Security Advisories: https://github.com/openclaw/openclaw/security/advisories
- vulnerability-db.json: 65件中 28件以上がsystem.run/exec関連
- research.md セクション5.6, 7.2, 7.3
