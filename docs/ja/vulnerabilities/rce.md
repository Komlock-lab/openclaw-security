# リモートコード実行（RCE）脆弱性

## 概要

リモートコード実行（RCE）脆弱性は、攻撃者が対象システム上で任意のコードを実行できるようにします。OpenClawには、Gateway認証バイパス、WebSocket設定インジェクション、シェルコマンドインジェクション、承認メカニズムバイパスなど、複数の攻撃ベクトルにわたる7件のRCE脆弱性がありました。

## 統計情報

| 項目 | 値 |
|------|-----|
| 脆弱性総数 | 7件のRCE脆弱性 |
| 深刻度分布 | Critical: 1件、High: 6件 |
| 影響バージョン | v2026.1.20 ~ v2026.3.0 |
| 最新修正バージョン | >= v2026.3.1 |
| 影響 | システム全体の侵害 |

---

## Critical深刻度

### GHSA-gv46-4xfq-jv58: Gateway Node Invoke承認バイパスRCE

| 項目 | 値 |
|------|-----|
| 深刻度 | **Critical** |
| 修正バージョン | >= 2026.2.14 |
| 攻撃ベクトル | Gateway Node Invoke |

**影響**: Gateway Node Invoke承認バイパス経由のリモートコード実行

**緩和策**: v2026.2.14以降へアップデート + Gateway認証を設定

**参考情報**: [GHSA-gv46](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58)

---

## High深刻度

### GHSA-g55j-c2v4-pjcg: 未認証WebSocket config.apply RCE

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| CVE | CVE-2026-25593 |
| 修正バージョン | >= 2026.1.20 |

**影響**: WebSocket `config.apply`メソッド経由の未認証ローカルRCE

**緩和策**: v2026.1.20以降へアップデート

**参考情報**: [GHSA-g55j](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg)

---

### GHSA-g8p2-7wf7-98mq: 認証トークン窃取によるワンクリックRCE

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| 修正バージョン | >= 2026.1.29 |

**影響**: `gatewayUrl`操作による認証トークン窃取経由のワンクリックRCE

**緩和策**: v2026.1.29以降へアップデート

**参考情報**: [GHSA-g8p2](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq)

---

### GHSA-65rx-fvh6-r4h2: heredoc展開シェルインジェクション

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| CVE | CVE-2026-27209 |
| 修正バージョン | >= 2026.2.21 |

**影響**: exec allowlistのheredoc展開経由のシェルコマンドインジェクション

**緩和策**: v2026.2.21以降へアップデート

**参考情報**:
- [GHSA-65rx](https://github.com/openclaw/openclaw/security/advisories/GHSA-65rx-fvh6-r4h2)
- [Exec Bypass脆弱性](exec-bypass.md)

---

### GHSA-vffc-f7r7-rx2w: systemdユニット改行インジェクション（Linux）

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| 修正バージョン | >= 2026.2.21 |
| プラットフォーム | Linuxのみ |

**影響**: systemdユニット生成での改行インジェクション経由のローカルコマンド実行

**緩和策**: v2026.2.21以降へアップデート（Linuxユーザー）

**参考情報**: [GHSA-vffc](https://github.com/openclaw/openclaw/security/advisories/GHSA-vffc-f7r7-rx2w)

---

### GHSA-hwpq-rrpf-pgcq: system.run承認ID不一致

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| 修正バージョン | >= 2026.2.25 |

**影響**: system.run承認ID不一致により、表示されたバイナリと異なるバイナリを実行

**緩和策**: v2026.2.25以降へアップデート

**参考情報**:
- [GHSA-hwpq](https://github.com/openclaw/openclaw/security/advisories/GHSA-hwpq-rrpf-pgcq)
- [Exec Bypass脆弱性](exec-bypass.md)

---

### GHSA-6f6j-wx9w-ff4j: ACPX Windows cwdインジェクション

| 項目 | 値 |
|------|-----|
| 深刻度 | High |
| 修正バージョン | >= 2026.3.1 |
| プラットフォーム | Windowsのみ |

**影響**: ACPX Windowsラッパーシェルフォールバックがcwdインジェクションを許可

**緩和策**: v2026.3.1以降へアップデート（Windowsユーザー）

**参考情報**:
- [GHSA-6f6j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6f6j-wx9w-ff4j)
- [ACPセキュリティ](acp-security.md)

---

## 防御戦略

### 即時対応
1. **v2026.3.1以降へアップデート**: すべてのRCE脆弱性が修正済み
2. **Gateway認証を設定**: `openclaw config set gateway.auth true`
3. **サンドボックスを有効化**: `openclaw config set sandbox all`

### 関連リソース
- [Exec Bypass脆弱性](exec-bypass.md)
- [ACPセキュリティ](acp-security.md)
- [ハードニングガイド](../best-practices/hardening-guide.md)

---

**最終更新**: 2026-03-15
**データベースバージョン**: vulnerability-db.json (2026-03-11、7件のRCEエントリ)
