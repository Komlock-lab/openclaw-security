---
date: 2026-02-28
category: tool-analysis
severity: info
source: https://github.com/adversa-ai/secureclaw
tags: [secureclaw, adversa-ai, security-plugin, openclaw]
---

# SecureClaw 徹底分析レポート

## 基本情報

- **リポジトリ**: https://github.com/adversa-ai/secureclaw
- **バージョン**: v2.2.0
- **開発元**: Adversa AI (https://adversa.ai)
- **ライセンス**: MIT
- **対象**: OpenClaw AIエージェントのセキュリティプラットフォーム
- **npm パッケージ名**: `@adversa/secureclaw`

## ディレクトリ構成

```
secureclaw/                          # メインパッケージ（npmパブリッシュ対象）
├── package.json                     # @adversa/secureclaw v2.2.0
├── tsconfig.json
├── vitest.config.ts
├── openclaw.plugin.json             # OpenClawプラグイン定義
├── SKILL.md                         # スキル定義（トップレベル）
├── tools.md
├── demo.ts
├── LICENSE
├── README.md
├── ioc/
│   └── indicators.json              # IOC（侵害指標）データベース
├── templates/
│   └── secure-baseline.json         # セキュアベースラインテンプレート
├── skill/                           # スキルパッケージ
│   ├── SKILL.md                     # 15ルール定義（~1,230トークン）
│   ├── skill.json                   # スキルメタデータ
│   ├── README.md
│   ├── checksums.json
│   ├── configs/                     # パターンデータベース（4つ）
│   │   ├── injection-patterns.json
│   │   ├── dangerous-commands.json
│   │   ├── privacy-rules.json
│   │   └── supply-chain-ioc.json
│   └── scripts/                     # Bashスクリプト（9つ）
│       ├── install.sh
│       ├── uninstall.sh
│       ├── quick-audit.sh
│       ├── quick-harden.sh
│       ├── check-integrity.sh
│       ├── check-privacy.sh
│       ├── check-advisories.sh
│       ├── scan-skills.sh
│       └── emergency-response.sh
├── src/                             # TypeScriptソースコード
│   ├── types.ts                     # 型定義
│   ├── index.ts                     # プラグインエントリポイント + CLI
│   ├── auditor.ts                   # 56の監査チェック（メインエンジン）
│   ├── hardener.ts                  # ハードニングオーケストレーター
│   ├── hardening/                   # ハードニングモジュール（5つ）
│   │   ├── gateway-hardening.ts
│   │   ├── credential-hardening.ts
│   │   ├── config-hardening.ts
│   │   ├── docker-hardening.ts
│   │   └── network-hardening.ts
│   ├── monitors/                    # バックグラウンドモニター（4つ）
│   │   ├── credential-monitor.ts
│   │   ├── memory-integrity.ts
│   │   ├── cost-monitor.ts
│   │   └── skill-scanner.ts
│   ├── reporters/                   # レポーター
│   │   ├── console-reporter.ts
│   │   └── json-reporter.ts
│   └── utils/                       # ユーティリティ
│       ├── crypto.ts                # AES-256-GCM暗号化
│       ├── hash.ts                  # SHA-256ハッシュ
│       └── ioc-db.ts                # IOCデータベースローダー
└── docs/                            # ドキュメント（ルートレベル）
    ├── openclaw-threat-model.md
    ├── openclaw-attack-examples.md
    └── openclaw-maestro-nist-mapping.md
```

---

## アーキテクチャ概要

### 3層防御アーキテクチャ

SecureClawは「Plugin + Skill」の二重レイヤー構造:

1. **Plugin層（コードとして実行）**: TypeScriptプラグインとして動作。ゲートウェイ起動時に自動監査、ハードニング、リアルタイムモニタリング
2. **Skill層（LLMディレクティブとして実行）**: 15のルール + 9つのBashスクリプト。LLMのコンテキストに注入され、エージェントの行動を制御
3. **Scripts層（検出ロジック）**: パターンマッチングや整合性チェックはBashスクリプトで実行。LLMトークンを消費しない

### フレームワークカバレッジ（7つ）

| フレームワーク | カバレッジ |
|--------------|-----------|
| OWASP ASI Top 10 | 10/10 |
| MITRE ATLAS Agentic | 10/14 |
| MITRE ATLAS OpenClaw | 4/4 ケーススタディ |
| CoSAI Principles | 13/18 |
| CSA Singapore | 8/11 |
| CSA MAESTRO | 6/7レイヤー |
| NIST AI 100-2 E2025 | 4/4 GenAI攻撃タイプ |

---

## 56の監査チェック詳細

### カテゴリ1: Gateway (SC-GW-001〜010)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-GW-001 | CRITICAL | ゲートウェイが0.0.0.0にバインドされていないか |
| SC-GW-002 | CRITICAL | ゲートウェイ認証が有効か |
| SC-GW-003 | MEDIUM | 認証トークンの強度（32文字以上か） |
| SC-GW-004 | CRITICAL | レガシーauthToken形式の検出 |
| SC-GW-005 | HIGH | TLSが有効か |
| SC-GW-006 | HIGH | ブラウザリレーポート18790の検出 |
| SC-GW-007 | MEDIUM | mDNSがfullモードでないか |
| SC-GW-008 | HIGH | リバースプロキシ+認証なしの組み合わせ |
| SC-GW-009 | CRITICAL | dangerouslyDisableDeviceAuth検出 |
| SC-GW-010 | MEDIUM | allowInsecureAuth検出 |

### カテゴリ2: Credentials (SC-CRED-001〜008)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-CRED-001 | HIGH | ステートディレクトリのパーミッション |
| SC-CRED-002 | HIGH | .envファイルのパーミッション |
| SC-CRED-003 | HIGH | .envファイル内のAPIキー平文検出 |
| SC-CRED-004 | CRITICAL | メモリファイル内のAPIキー漏洩 |
| SC-CRED-005 | HIGH | 設定ファイルのパーミッション |
| SC-CRED-006 | MEDIUM | 認証プロファイルのパーミッション |
| SC-CRED-007 | HIGH | 認証プロファイル内の平文トークン |
| SC-CRED-008 | HIGH | .envファイル外へのキー漏洩 |

### カテゴリ3: Execution (SC-EXEC-001〜007)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-EXEC-001 | CRITICAL | exec.approvalsがoffでないか |
| SC-EXEC-002 | HIGH | autoApproveリストに危険なパターンがないか |
| SC-EXEC-003 | MEDIUM | サンドボックスモードが"all"か |
| SC-EXEC-004 | MEDIUM | Docker: read-only設定 |
| SC-EXEC-005 | MEDIUM | Docker: cap_drop設定 |
| SC-EXEC-006 | MEDIUM | Docker: リソースリミット |
| SC-EXEC-007 | HIGH | Docker: ホストネットワークモード |

### カテゴリ4: Access Control (SC-AC-001〜005)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-AC-001 | HIGH | DMポリシーが"open"でないか |
| SC-AC-002 | HIGH | グループポリシーのチェック |
| SC-AC-003 | MEDIUM | チャネルアローリスト設定 |
| SC-AC-004 | MEDIUM | DMスコープ分離 |
| SC-AC-005 | MEDIUM | セッション分離設定 |

### カテゴリ5: Supply Chain (SC-SKILL-001〜006)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-SKILL-001 | CRITICAL | 危険なスキルパターン（eval, exec, child_process等） |
| SC-SKILL-002 | HIGH | スキル内のクレデンシャルアクセス |
| SC-SKILL-003 | HIGH | 難読化コードの検出 |
| SC-SKILL-004 | CRITICAL | IOCハッシュマッチ |
| SC-SKILL-005 | HIGH | タイポスクワッティング検出 |
| SC-SKILL-006 | MEDIUM | 新しいGitHubアカウントからのスキル |

### カテゴリ6: Memory (SC-MEM-001〜005)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-MEM-001 | CRITICAL | 認知ファイル内のプロンプトインジェクションパターン |
| SC-MEM-002 | HIGH | Base64ブロックの検出（隠蔽された指示） |
| SC-MEM-003 | MEDIUM | 認知ファイルの過剰パーミッション |
| SC-MEM-004 | HIGH | メモリファイル内のAPIキー |
| SC-MEM-005 | MEDIUM | ベースラインの存在チェック |

### カテゴリ7: Cost (SC-COST-001〜004)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-COST-001 | MEDIUM | コスト制限が設定されているか |
| SC-COST-002 | HIGH | 時間あたりの支出制限 |
| SC-COST-003 | MEDIUM | 日次/月次予算の設定 |
| SC-COST-004 | HIGH | コストスパイク検出（通常の3倍超） |

### カテゴリ8: IOC (SC-IOC-001〜005)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-IOC-001 | CRITICAL | 既知のC2サーバーIPアドレスの接続 |
| SC-IOC-002 | CRITICAL | 悪意あるドメインの接続 |
| SC-IOC-003 | CRITICAL | 悪意あるスキルハッシュの一致 |
| SC-IOC-004 | HIGH | タイポスクワッティングパターン |
| SC-IOC-005 | HIGH | 危険な前提条件パターン |

### カテゴリ9: その他 (SC-TRUST, SC-CTRL, SC-KILL, SC-DEGRAD, SC-CROSS)

| ID | 重大度 | チェック内容 |
|----|--------|-------------|
| SC-TRUST-001 | CRITICAL | ワークスペース認知ファイル内のインジェクション検出 |
| SC-CTRL-001 | MEDIUM | コントロールトークンのカスタマイズ |
| SC-KILL-001 | INFO | キルスイッチの存在チェック |
| SC-DEGRAD-001 | MEDIUM | failureModeの設定 |
| SC-CROSS-001 | HIGH | クロスレイヤーリスク（3+レイヤーに所見） |

---

## 15の行動ルール

| # | カテゴリ | 内容 | MAESTRO | NIST |
|---|---------|------|---------|------|
| 1 | インジェクション防御 | すべての外部コンテンツを敵対的として扱う | L3 | Evasion |
| 2 | コマンド承認 | 破壊的/機密コマンド実行前に人間の承認を得る | L3 | Misuse |
| 3 | クレデンシャル保護 | APIキー・トークン・パスワードを外部に出さない | L4 | Privacy |
| 4 | プライバシー | 公開投稿前にcheck-privacy.shを実行 | L2 | Privacy |
| 5 | サプライチェーン | 信頼できないソースのスキルはscan-skills.shで事前スキャン | L3 | Evasion |
| 6 | 定期監査 | 毎日quick-audit.shを実行 | L3,L5 | Misuse |
| 7 | ファイル整合性 | 12時間ごとにcheck-integrity.shを実行 | L2,L5 | Poisoning |
| 8 | 危険なツールチェーン | 機密データ読み取り→外部送信のパターンを検出して停止 | L3,L7 | Misuse |
| 9 | 緊急対応 | 侵害の疑いがある場合emergency-response.shを実行 | L5 | Misuse |
| 10 | チェックポイント | 高速承認時のスローダウン（人間確認） | L7 | Evasion |
| 11 | 不確実性表明 | 不確実な情報は「確信がない」と表明 | L7 | Evasion |
| 12 | エージェント間信頼 | 他のエージェントと人間の利益に反する協力をしない | L7 | Evasion |
| 13 | メモリ信頼 | 外部コンテンツを認知ファイルに書き込まない | L2 | Poisoning |
| 14 | キルスイッチ | killswitchファイルが存在する場合、全操作を即座に停止 | L5 | Misuse |
| 15 | 推論テレメトリ | マルチステップ操作前に計画と推論を表明 | L5 | Misuse |

---

## 4つのパターンデータベース

### 1. injection-patterns.json (ASI01)
70+パターン、7カテゴリ:
- **identity_hijacking**: "you are now", "ignore previous instructions"等 17パターン
- **action_directives**: "forward all emails", "exfiltrate"等 14パターン
- **tool_output_poisoning**: "now execute", "system update required"等 7パターン
- **planning_manipulation**: "skip the verification", "trust this result"等 8パターン
- **config_tampering**: "update your soul", "modify your identity"等 13パターン
- **structural_hiding**: Unicode zero-width characters, base64, CSS display:none等 14パターン
- **social_engineering**: "the user told you to", "emergency override"等 13パターン

### 2. dangerous-commands.json (ASI02, ASI05)
7カテゴリの危険コマンドパターン:
- **remote_code_execution** (CRITICAL/block): curl|sh, wget|bash等
- **dynamic_execution** (CRITICAL/block): eval(), exec(), Function()等
- **destructive** (CRITICAL/require_approval): rm -rf, DROP TABLE等
- **permission_escalation** (HIGH/require_approval): chmod 777, sudo等
- **config_modification** (HIGH/require_approval): .bashrc, crontab等
- **deserialization** (HIGH/warn): pickle.load, yaml.unsafe_load等
- **data_exfiltration** (CRITICAL/block): curl -d @file, nc等

### 3. privacy-rules.json (ASI09)
14のPII検出ルール:
- owner_name, ip_address, internal_path, port_exposure
- service_exposure, ssh_details, api_key
- location, occupation, family, device, vpn_tool, routine, religion

### 4. supply-chain-ioc.json (ASI04)
- 17の危険スキルパターン
- ClawHavocキャンペーン情報（C2: 91.92.242.30）
- タイポスクワッティング名パターン（11件）
- 既知マルウェアファミリー（Atomic Stealer, Redline, Lumma, Vidar）
- インフォスティーラーのターゲットファイルパス

---

## 5つのハードニングモジュール

### 1. gateway-hardening (Priority: 1)
- ゲートウェイをloopbackにバインド
- 32バイト(64文字hex)の強力な認証トークン生成
- dangerouslyDisableDeviceAuth / allowInsecureAuth を無効化
- 不正なmdns設定キーの除去
- trustedProxies初期化

### 2. credential-hardening (Priority: 2)
- ステートディレクトリを chmod 700
- 設定ファイルを chmod 600
- クレデンシャルファイルの権限ロック
- auth-profiles.jsonの権限ロック
- .envファイルのAES-256-GCM暗号化
- メモリファイル内のAPIキー自動リダクション

### 3. config-hardening (Priority: 3)
- tools.exec.hostを"sandbox"に設定
- session.dmScopeを"per-channel-peer"に設定
- logging.redactSensitiveを"tools"に設定
- 無効なスキーマキー(exec, sandbox)の除去
- exec.approvalsやsandbox.modeは手動修正として報告

### 4. docker-hardening (Priority: 4)
- read_only: true の強制
- cap_drop: ALL
- security_opt: no-new-privileges:true
- ネットワーク分離(restricted-net)
- リソースリミット(memory: 2G, cpus: 2.0)
- docker-compose.secureclaw.ymlオーバーライド生成

### 5. network-hardening (Priority: 5)
- iptables(Linux)またはpf(macOS)のegressルール生成
- C2 IPブロックリスト
- エグレスアローリスト(Anthropic, OpenAI, Google AI等)
- ルールは生成のみ（自動適用しない）

---

## 4つのバックグラウンドモニター

### 1. credential-monitor
- chokidarによるリアルタイムファイルシステム監視
- credentials/ディレクトリと.envファイルを監視
- 新規ファイル追加、パーミッション変更、削除を検出

### 2. memory-integrity
- 認知ファイル（SOUL.md, IDENTITY.md等）のリアルタイム監視
- SHA-256ベースラインとの比較
- プロンプトインジェクションパターンの検出
- 新規メモリファイル作成の検出

### 3. cost-monitor
- JSONLセッションログの解析
- 時間/日次/月次コスト追跡
- Claude Opus 4/Sonnet/Haiku, GPT-4/4oのトークンコスト計算
- サーキットブレーカー（時間あたりリミット超過で自動停止）
- スパイク検出（通常の3倍超で警告）

### 4. skill-scanner
- 18の危険パターンでスキルファイルをスキャン
- IOCデータベースとのハッシュ照合
- タイポスクワッティング検出
- child_process, eval, exec, spawn, Function, webhook.site等の検出

---

## CLIインターフェース

```bash
npx openclaw secureclaw audit [--json] [--deep] [--fix]  # 監査実行
npx openclaw secureclaw harden [--full] [--rollback]      # ハードニング
npx openclaw secureclaw status                            # ステータス表示
npx openclaw secureclaw scan-skill <name>                 # スキルスキャン
npx openclaw secureclaw cost-report                       # コストレポート
npx openclaw secureclaw kill [--reason <reason>]          # キルスイッチ有効化
npx openclaw secureclaw resume                            # キルスイッチ解除
npx openclaw secureclaw baseline [--window <minutes>]     # 行動ベースライン
npx openclaw secureclaw skill install                     # スキルインストール
npx openclaw secureclaw skill audit                       # スキル監査
npx openclaw secureclaw skill update                      # スキルアップデート
npx openclaw secureclaw skill uninstall                   # スキルアンインストール
```

---

## インストールプロセス

### スキル単体インストール
```bash
bash skill/scripts/install.sh
```
処理内容:
1. OpenClawインストールディレクトリを検出（~/.openclaw, ~/.moltbot等）
2. 既存インストールのバックアップ
3. skill/以下をskills/secureclawにコピー
4. スクリプトに実行権限付与
5. ワークスペースにもインストール（存在する場合）
6. TOOLS.mdとAGENTS.mdにSecureClawを登録

### プラグインインストール
```bash
openclaw plugins install secureclaw
```
npm経由で@adversa/secureclawをインストール。Plugin SDKを通じて登録。

---

## 暗号化モジュール

- **アルゴリズム**: AES-256-GCM
- **鍵導出**: PBKDF2-SHA512 (100,000イテレーション)
- **マシンID**: /etc/machine-id (Linux) / IOPlatformUUID (macOS)
- **鍵マテリアル**: machineId + stateDirパス
- **フォーマット**: salt(32) + iv(16) + authTag(16) + ciphertext
- .envファイルの暗号化に使用

---

## 良い点の分析

1. **フレームワーク網羅性**: 7つのセキュリティフレームワークへの明示的マッピングは非常に包括的
2. **二重レイヤー設計**: Plugin(コード)とSkill(LLMルール)の独立した防御層は優れた設計思想
3. **超軽量スキル**: ~1,230トークンでLLMコンテキストへの影響を最小化
4. **自動修復+ロールバック**: ハードニングはバックアップ付きで安全に適用可能
5. **IOCデータベース**: 実在のClawHavocキャンペーンのC2 IP、マルウェアハッシュを含む
6. **テスト充実**: vitest による包括的なユニットテストと統合テスト
7. **依存関係最小**: chokidar + node-forgeのみ
8. **CLIの使い勝手**: コマンド体系が整理されている
9. **誠実な制限の表明**: プロンプトインジェクションは「軽減であって排除ではない」と明言
10. **CVE対応**: CVE-2026-25253（1-click RCE）の具体的な検出ロジック

## 改善可能な点の分析

1. **Bashスクリプトの脆弱性**: quick-audit.shはgrepベースのJSON解析で、ネストされたJSONを正しく扱えない場合がある
2. **IOCデータベースの更新**: indicators.jsonは静的ファイルで、動的更新メカニズムがない（check-advisories.shはフィードURL依存だが実際のフィードがない）
3. **injection-patterns.jsonの限界**: 正規表現ベースのパターンマッチングは、高度なインジェクション（意味的操作）を見逃す
4. **Docker硬化の実装**: JSON形式のオーバーライドを生成するが、実際のYAML docker-compose形式ではない
5. **ネットワーク硬化**: ルール生成のみで自動適用しない。エグレスアローリストのドメイン解決は動的IPに対応していない
6. **コストモニターの精度**: トークンコスト表はハードコードされており、モデル価格変更に追従しない
7. **credential-monitorの依存**: chokidarが未インストールの場合は無効化される（graceful degradationだが監視なしになる）
8. **キルスイッチの限界**: ドキュメントで認めている通り、完全に侵害されたエージェントはファイルチェックを無視できる
9. **OpenClaw固有**: OpenClaw以外のAIエージェントプラットフォームには適用できない
10. **プライバシーチェッカーの偽陽性**: 正規表現ベースのPII検出は文脈を考慮しないため、偽陽性が多い可能性がある
11. **auditor.tsの巨大さ**: 1ファイル61KBは保守性に課題。カテゴリごとの分割が望ましい
12. **ログ形式依存**: コストモニターはJSONLセッションログ形式に依存しており、形式変更で壊れる

---

## OpenClaw-Securityプロジェクトへの示唆

SecureClawの分析から、我々のauditclawプロジェクトで参考にすべき点:

1. **攻撃テストケース設計**: SecureClawが検出する56のチェックそれぞれに対するバイパステストケースを作成できる
2. **injection-patterns.jsonの回避テスト**: 70+パターンを回避するインジェクション手法のテスト
3. **Bashスクリプトの脆弱性テスト**: JSON解析の不備を突くテストケース
4. **キルスイッチバイパス**: ファイルチェックを回避するシナリオ
5. **IOCデータベースの拡張**: SecureClawのIOCに含まれない脅威パターンの調査
6. **コストモニターの突破**: サーキットブレーカーを回避するAPI呼び出しパターン
