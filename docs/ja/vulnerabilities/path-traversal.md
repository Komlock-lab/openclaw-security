# パストラバーサル

## 概要

パストラバーサル脆弱性により、攻撃者はファイルパスを操作して意図されたスコープ外のファイルやディレクトリにアクセスできます。OpenClawでは、プラグインインストール、ファイルアップロード、アーカイブ展開、サンドボックスメディアのステージング操作で発見されています。

**影響**: 任意のファイル読み取り、ファイル上書き、サンドボックスエスケープ、リモートコード実行の可能性。

## 脆弱性リスト

### High（高）

| アドバイザリ | CVE | 概要 | 修正バージョン |
|----------|-----|---------|----------|
| [GHSA-qrq5-wjgg-rvqw](https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw) | — | プラグインインストール時のパストラバーサル | v2026.2.1 |
| [GHSA-cv7m-c9jx-vg7q](https://github.com/openclaw/openclaw/security/advisories/GHSA-cv7m-c9jx-vg7q) | — | ブラウザアップロードでのパストラバーサルによるローカルファイル読み取り | v2026.2.14 |
| [GHSA-p25h-9q54-ffvw](https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw) | — | Tar展開時のZip Slipパストラバーサル | v2026.2.22 |

### Medium（中）

| アドバイザリ | CVE | 概要 | 修正バージョン |
|----------|-----|---------|----------|
| [GHSA-cfvj-7rx7-fc7c](https://github.com/openclaw/openclaw/security/advisories/GHSA-cfvj-7rx7-fc7c) | — | stageSandboxMediaのシンボリックリンクトラバーサルによるサンドボックス外ファイル上書き | v2026.3.2 |
| [GHSA-vhwf-4x96-vqx2](https://github.com/openclaw/openclaw/security/advisories/GHSA-vhwf-4x96-vqx2) | — | skills-install-downloadが検証済みベースパスのリバインドによりツールルート外にリダイレクト可能 | v2026.3.8 |
| [GHSA-3pxq-f3cp-jmxp](https://github.com/openclaw/openclaw/security/advisories/GHSA-3pxq-f3cp-jmxp) | — | ブラウザ出力および関連パス境界フローの統一ルートバウンド書き込みハードニング | v2026.3.2 |

**合計**: 6件のアドバイザリ（高3件、中3件）

## 攻撃シナリオ

### 1. プラグインインストールのパストラバーサル (GHSA-qrq5-wjgg-rvqw)

**攻撃ベクター**: プラグインインストール時に、攻撃者は `../` シーケンスを含むファイルパスを持つ悪意のあるプラグインパッケージを作成し、プラグインディレクトリ外にファイルを書き込むことができます。

**例**:
```
plugin-package/
  ../../../.ssh/authorized_keys  # SSH鍵を上書き
  ../../../.bashrc               # 悪意のあるコードを注入
```

**影響**: 任意のファイル書き込み、リモートコード実行につながる。

### 2. ブラウザアップロードのパストラバーサル (GHSA-cv7m-c9jx-vg7q)

**攻撃ベクター**: ブラウザベースのツール出力でファイルアップロードパスを操作し、任意のローカルファイルを読み取る。

**例**:
```json
{
  "filePath": "../../../../../etc/passwd"
}
```

**影響**: ローカルファイル読み取り、機密システム設定や認証情報の露出。

### 3. アーカイブ展開時のZip Slip (GHSA-p25h-9q54-ffvw)

**攻撃ベクター**: `../` シーケンスを含むファイルエントリを持つ悪意のあるtar/zipアーカイブを作成。展開時に、意図したディレクトリ外にファイルが書き込まれる。

**例**:
```
malicious.tar:
  ../../../../tmp/malicious.sh
  ../../../../home/user/.bashrc
```

**影響**: 任意のファイル上書き、リモートコード実行の可能性。

### 4. サンドボックスメディアでのシンボリックリンクトラバーサル (GHSA-cfvj-7rx7-fc7c)

**攻撃ベクター**: シンボリックリンクを使用して `stageSandboxMedia` 操作をリダイレクトし、サンドボックスワークスペース外にファイルを書き込む。

**例**:
```bash
ln -s /etc/passwd workspace/target
# stageSandboxMediaがシンボリックリンク経由で /etc/passwd に書き込む
```

**影響**: サンドボックスエスケープ、任意のファイル上書き。

### 5. スキルインストールダウンロードのリバインド (GHSA-vhwf-4x96-vqx2)

**攻撃ベクター**: スキルインストール中に、検証済みベースパスをリバインドしてツールルートディレクトリ外にダウンロードをリダイレクト。

**影響**: 意図しない場所への任意のファイル書き込み。

### 6. ブラウザ出力パス境界 (GHSA-3pxq-f3cp-jmxp)

**攻撃ベクター**: ブラウザ出力フローのパス境界検証の弱点を悪用し、指定されたルート外にファイルを書き込む。

**影響**: ファイルシステムの整合性侵害。

## 緩和策

### 1. パス正規化と検証

ファイルシステム操作の前に、常にファイルパスを正規化・検証する:

```javascript
const path = require('path');

function validatePath(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  const normalized = path.normalize(resolved);

  // 解決されたパスがbasePath内にあることを確認
  if (!normalized.startsWith(path.resolve(basePath))) {
    throw new Error('Path traversal detected');
  }

  return normalized;
}
```

### 2. シンボリックリンク追跡の無効化

重要な操作では、シンボリックリンクベースのトラバーサルを防ぐため、シンボリックリンク追跡を無効にする:

```javascript
const fs = require('fs');

fs.readFileSync(filePath, {
  flag: 'r',
  // statの代わりにlstatを使用してシンボリックリンクを検出
});
```

### 3. ルートバウンド書き込みAPIの使用

パス境界を強制するOpenClawのルートバウンド書き込みAPIを活用する:

```javascript
// OpenClawの安全な書き込みAPIを使用
await sandbox.writeFile(relativePath, content, {
  rootBound: true,  // ルート境界を強制
  followSymlinks: false
});
```

### 4. アーカイブ展開の検証

アーカイブを展開する際は、すべてのエントリパスを検証する:

```javascript
const tar = require('tar');

tar.extract({
  file: 'archive.tar',
  cwd: targetDir,
  filter: (path, entry) => {
    // '../'を含むパスを拒否
    if (path.includes('..')) {
      console.error(`Rejected path traversal: ${path}`);
      return false;
    }
    return true;
  }
});
```

### 5. プラグインインストールの検証

インストール前にプラグインパッケージの内容を検証する:

```javascript
function validatePluginPackage(packagePath) {
  const entries = getPackageEntries(packagePath);

  for (const entry of entries) {
    if (entry.path.includes('..') || path.isAbsolute(entry.path)) {
      throw new Error(`Invalid plugin path: ${entry.path}`);
    }
  }
}
```

### 6. ランタイムチェック

OpenClawランタイムチェックでパストラバーサル検出を有効化:

```bash
# パストラバーサル検出を有効化
openclaw --runtime-check path-boundary-validation
```

包括的なランタイムチェック設定は [ハードニングガイド](../best-practices/hardening-guide.md) を参照してください。

## 関連リソース

- **ランタイムチェック**: [ハードニングガイド - パス境界検証](../best-practices/hardening-guide.md#path-boundary-validation)
- **テスト**: `tests/sandbox-escape/` ディレクトリにテストケースがあります
- **関連脆弱性**: [サンドボックスエスケープ](./sandbox-escape.md), [RCE](./rce.md)

## 参考資料

- [CWE-22: Improper Limitation of a Pathname to a Restricted Directory](https://cwe.mitre.org/data/definitions/22.html)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Zip Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability)
