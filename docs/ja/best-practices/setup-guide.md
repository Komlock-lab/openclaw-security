# セキュリティセットアップガイド

OpenClaw Security Scanスキルを安全にセットアップ・利用するためのベストプラクティスです。

## ディレクトリ配置のリスク

### OpenClawは親ディレクトリや兄弟ディレクトリにアクセスできる？

**サンドボックスが無効（デフォルト）の場合、アクセスできます。**

`sandbox.mode` が `off`（デフォルト）のとき、OpenClawはツール（`exec`、ブラウザ操作、ファイル読み取り等）を通じてファイルシステム全体にアクセスできます:

```
~/projects/
├── openclaw/                  # OpenClawインストール先
├── openclaw-security-scan/    # このスキル（兄弟）
├── my-secret-project/         # ← OpenClawはアクセス可能
└── .env                       # ← OpenClawはアクセス可能
```

子ディレクトリに配置した場合でも:

```
~/projects/openclaw/
├── skills/
│   └── openclaw-security-scan/   # このスキル
├── config.json
└── ../../my-secret-project/      # ← OpenClawは上に遡れる
```

**重要**: リスクの原因はこのスキルではありません。`scan.sh` は自身の `vulnerability-db.json` を読んでレポートを出力するだけです。リスクはOpenClaw本体が制限なくファイルシステムにアクセスできることにあります。

### このスキルはどんなデータにアクセスする？

このスキルがアクセスするのは**以下のみ**:
1. `vulnerability-db.json`（同梱版またはGitHubから取得）
2. `openclaw --version` の出力（バージョン自動検出）
3. `openclaw config get` の出力（ランタイム設定チェック）

あなたのコード、シークレット、会話履歴、その他のファイルは**一切読み取りません**。

## 推奨セットアップ

### 最小構成（curlクイックスキャン）

インストール不要。一時的なDBファイル（`/tmp/openclaw-vuln-db.json`）以外、システムに何も残りません。

```bash
curl -sL https://raw.githubusercontent.com/natsuki/openclaw-security/main/skill-dist/openclaw-security-scan/scan.sh | bash
```

### 標準構成（スキルインストール）

OpenClawのスキルディレクトリにコピー:

```bash
cp -r openclaw-security-scan /path/to/openclaw/skills/
```

### 堅牢構成（本番環境推奨）

1. **サンドボックスを有効化**—最も重要な一手:
   ```bash
   openclaw config set sandbox all
   ```

2. **スキルディレクトリを隔離**: 機密プロジェクトと同じ場所ではなく、OpenClawのスキルディレクトリ内に配置。

3. **exec許可リストを制限**: ワークフローに必要なコマンドだけ許可:
   ```bash
   openclaw config set exec.allowlist '["node","bash"]'
   ```

4. **Gateway認証を有効化**（リモート接続を使う場合）:
   ```bash
   openclaw config set gateway.auth true
   ```

5. **Webhookシークレットを設定**:
   ```bash
   openclaw config set webhook.secret '<your-secret>'
   ```

6. **自動アップデートを有効化**:
   ```bash
   openclaw config set autoUpdate true
   ```

## ディレクトリ構造: 安全 vs 危険

### 危険（避けるべき）

```
~/
├── .env                          # APIキー
├── .ssh/                         # SSH鍵
├── openclaw/
│   └── skills/
│       └── openclaw-security-scan/
└── client-projects/
    ├── project-a/                # クライアントのコード
    └── project-b/                # クライアントのコード
```

サンドボックスがオフだと、OpenClawは `~/.env`、`~/.ssh/`、全クライアントプロジェクトにアクセスできます。

### 安全（推奨）

```
~/openclaw-workspace/             # 専用の隔離ディレクトリ
├── openclaw/
│   ├── config.json               # sandbox: all
│   └── skills/
│       └── openclaw-security-scan/
└── workspace/                    # OpenClawがアクセスすべきファイルのみ
```

機密ファイル（`~/.env`、`~/.ssh/`、クライアントプロジェクト）はワークスペースの**外**に配置。サンドボックスを有効化すると、OpenClawはワークスペースディレクトリに閉じ込められます。

## サンドボックスモード

| モード | ファイルアクセス | 推奨 |
|--------|----------------|------|
| `off`（デフォルト） | **ファイルシステム全体** | 本番では使わない |
| `workspace` | ワークスペースに制限 | 本番の最低ライン |
| `all` | 完全サンドボックス（Docker） | **推奨** |

```bash
# 現在の設定を確認
openclaw config get sandbox

# 完全サンドボックスを有効化
openclaw config set sandbox all
```

## ネットワークセキュリティ

- このスキルが行う通信は `raw.githubusercontent.com` への**1回のHTTPSリクエスト**（最新DB取得）のみ
- エアギャップ環境では同梱版DBにフォールバック（ネットワーク不要）
- あなたのシステムから外部サービスへのデータ送信は**一切ありません**

## セットアップ後の確認チェックリスト

- [ ] `openclaw config get sandbox` が `all` または `workspace` を返す
- [ ] `openclaw config get gateway.auth` が `true` を返す
- [ ] `openclaw config get webhook.secret` が設定済み
- [ ] `openclaw config get exec.allowlist` が制限済み
- [ ] `openclaw config get autoUpdate` が `true` を返す
- [ ] 機密ファイルがOpenClawワークスペースの外にある
- [ ] `curl -sL .../scan.sh | bash` を実行してCritical 0件を確認
