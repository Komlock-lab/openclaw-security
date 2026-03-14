# Phase 6-4: ドキュメント拡充 — 実装計画

## 計画日
2026-03-13

## 前提
- **Research完了**: `phase6-4-research.md` に詳細な調査結果を記載
- **対象**: 36ファイル（英語版18 + 日本語版18）のドキュメント作成
- **推定工数**: 37時間（Critical-Highのみで20時間）

---

## 実装戦略

### アプローチ
1. **優先度順に実装**: Critical → High → Medium → Low
2. **英語版を先行**: 各ドキュメントの英語版を先に作成し、承認後に日本語版を翻訳
3. **グループ単位で進行**: 独立したタスクをまとめて並行実行
4. **テンプレート検証**: 最初のドキュメント（exec-bypass.md）でテンプレートを確定
5. **都度検証**: 各ドキュメント完成後に内部・外部リンクをチェック

---

## タスクリスト

### Wave 1: Critical（即時着手） — 4ファイル

#### Task 1.1: exec-bypass.md (EN)
- **優先度**: Critical
- **工数**: 2時間
- **データソース**:
  - `knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md`
  - `data/vulnerability-db.json` (Exec Allowlist Bypass 28件+)
- **作業内容**:
  1. knowledgeナレッジ記事を公開向けに整形
  2. vulnerability-db.jsonから全28件のGHSAを抽出してリスト化
  3. テンプレートに従って構造化
  4. 内部リンク・外部リンクの追加
  5. **重要**: このドキュメントがテンプレート検証の基準となる
- **検証項目**:
  - [ ] 全28件のGHSAが記載されているか
  - [ ] 各GHSAのリンクが有効か
  - [ ] テストガイドへのリンクが設定されているか
  - [ ] ナレッジ記事へのリンクが設定されているか

#### Task 1.2: exec-bypass.md (JA)
- **優先度**: Critical
- **工数**: 1時間
- **データソース**: `docs/en/vulnerabilities/exec-bypass.md`
- **作業内容**: 英語版を日本語に翻訳
- **検証項目**:
  - [ ] リンクが日本語版に対応しているか（存在する場合）

#### Task 1.3: hardening-guide.md (EN)
- **優先度**: Critical
- **工数**: 2時間
- **データソース**: `data/vulnerability-db.json` (`runtimeChecks`セクション RC-001 ~ RC-019)
- **作業内容**:
  1. 19件のランタイムチェックをカテゴリ別に整理
  2. 各チェックの実行方法を記載
  3. Quick Startセクションで最小限の設定を提示
  4. Verification（検証方法）を追加
- **検証項目**:
  - [ ] 全19件のランタイムチェックが記載されているか
  - [ ] 実行コマンドが正確か
  - [ ] 推奨設定が明確か

#### Task 1.4: hardening-guide.md (JA)
- **優先度**: Critical
- **工数**: 1時間
- **データソース**: `docs/en/best-practices/hardening-guide.md`
- **作業内容**: 英語版を日本語に翻訳

**Wave 1 合計**: 4ファイル、6時間

---

### Wave 2: High（1週間以内） — 12ファイル

#### Task 2.1: toctou.md (EN)
- **優先度**: High
- **工数**: 1時間
- **データソース**:
  - `knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md`
  - `data/vulnerability-db.json` (TOCTOU 3件)

#### Task 2.2: toctou.md (JA)
- **優先度**: High
- **工数**: 1時間

#### Task 2.3: acp-security.md (EN)
- **優先度**: High
- **工数**: 1時間
- **データソース**:
  - `knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md`
  - `data/vulnerability-db.json` (ACP関連 4件)

#### Task 2.4: acp-security.md (JA)
- **優先度**: High
- **工数**: 1時間

#### Task 2.5: rce.md (EN)
- **優先度**: High
- **工数**: 1.5時間
- **データソース**: `data/vulnerability-db.json` (RCE 7件)

#### Task 2.6: rce.md (JA)
- **優先度**: High
- **工数**: 1時間

#### Task 2.7: path-traversal.md (EN)
- **優先度**: High
- **工数**: 1.5時間
- **データソース**: `data/vulnerability-db.json` (Path Traversal 6件)

#### Task 2.8: path-traversal.md (JA)
- **優先度**: High
- **工数**: 1時間

#### Task 2.9: owasp-llm-mapping.md (EN)
- **優先度**: High
- **工数**: 1時間
- **データソース**: `knowledge/best-practices/2026-03-12-owasp-llm-top10-mapping.md`

#### Task 2.10: owasp-llm-mapping.md (JA)
- **優先度**: High
- **工数**: 1時間

#### Task 2.11: channel-security.md (EN)
- **優先度**: High
- **工数**: 2時間
- **データソース**: `knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md`
- **特記事項**: 攻撃パターン記事を防御策ガイドに変換

#### Task 2.12: channel-security.md (JA)
- **優先度**: High
- **工数**: 1時間

**Wave 2 合計**: 12ファイル、13時間

---

### Wave 3: High（テストガイド） — 4ファイル

#### Task 3.1: sandbox-escape-guide.md (EN)
- **優先度**: High
- **工数**: 0.5時間
- **データソース**: `tests/sandbox-escape/README.md`
- **作業内容**: テストREADMEをGitBookフォーマットに調整してコピー

#### Task 3.2: sandbox-escape-guide.md (JA)
- **優先度**: High
- **工数**: 0.5時間

#### Task 3.3: agent-hijack-guide.md (EN)
- **優先度**: High
- **工数**: 0.5時間
- **データソース**: `tests/agent-hijack/README.md`

#### Task 3.4: agent-hijack-guide.md (JA)
- **優先度**: High
- **工数**: 0.5時間

**Wave 3 合計**: 4ファイル、2時間

**Wave 1-3 合計 (Critical-High)**: 20ファイル、21時間

---

### Wave 4: Medium（2週間以内） — 12ファイル

#### Task 4.1: command-injection.md (EN)
- **優先度**: Medium
- **工数**: 1時間
- **データソース**: `data/vulnerability-db.json` (Command Injection 3件)

#### Task 4.2: command-injection.md (JA)
- **優先度**: Medium
- **工数**: 0.5時間

#### Task 4.3: ssrf.md (EN)
- **優先度**: Medium
- **工数**: 1.5時間
- **データソース**: `data/vulnerability-db.json` (SSRF 5件)

#### Task 4.4: ssrf.md (JA)
- **優先度**: Medium
- **工数**: 1時間

#### Task 4.5: v2026.3.x-changelog.md (EN)
- **優先度**: Medium
- **工数**: 2時間
- **データソース**: `data/vulnerability-db.json` (`fixedIn: "2026.3.*"`)
- **作業内容**: v2026.3.1~3.8の全35件のアドバイザリをバージョン別にリスト化

#### Task 4.6: v2026.3.x-changelog.md (JA)
- **優先度**: Medium
- **工数**: 1時間

#### Task 4.7: breaking-changes-guide.md (EN)
- **優先度**: Medium
- **工数**: 1時間
- **データソース**: vulnerability-db.json + knowledge記事
- **作業内容**: 承認バインディング、サンドボックス継承等の後方互換性のない変更を解説

#### Task 4.8: breaking-changes-guide.md (JA)
- **優先度**: Medium
- **工数**: 1時間

#### Task 4.9: skill-abuse-guide.md (EN)
- **優先度**: Medium
- **工数**: 0.5時間
- **データソース**: `tests/skill-abuse/README.md`

#### Task 4.10: skill-abuse-guide.md (JA)
- **優先度**: Medium
- **工数**: 0.5時間

#### Task 4.11: channel-spoofing-guide.md (EN)
- **優先度**: Medium
- **工数**: 0.5時間
- **データソース**: `tests/channel-spoofing/README.md`

#### Task 4.12: channel-spoofing-guide.md (JA)
- **優先度**: Medium
- **工数**: 0.5時間

#### Task 4.13: secret-leakage-guide.md (EN)
- **優先度**: Medium
- **工数**: 0.5時間
- **データソース**: `tests/secret-leakage/README.md`

#### Task 4.14: secret-leakage-guide.md (JA)
- **優先度**: Medium
- **工数**: 0.5時間

**Wave 4 合計**: 14ファイル、12時間

---

### Wave 5: Low（余力があれば） — 2ファイル

#### Task 5.1: dos.md (EN)
- **優先度**: Low
- **工数**: 1時間
- **データソース**: `data/vulnerability-db.json` (DoS 4件)

#### Task 5.2: dos.md (JA)
- **優先度**: Low
- **工数**: 0.5時間

**Wave 5 合計**: 2ファイル、1.5時間

---

### Wave 6: SUMMARY.md更新（最後） — 2ファイル

#### Task 6.1: docs/en/SUMMARY.md 更新
- **優先度**: Must（最後）
- **工数**: 0.5時間
- **作業内容**:
  1. 新規追加した全ページのリンクを追加
  2. カテゴリ順に整理
  3. リンク切れチェック

#### Task 6.2: docs/ja/SUMMARY.md 更新
- **優先度**: Must（最後）
- **工数**: 0.5時間
- **作業内容**: 英語版と同様

**Wave 6 合計**: 2ファイル、1時間

---

## 工数サマリー

| Wave | 優先度 | ファイル数 | 工数 | 累計工数 |
|------|--------|----------|------|---------|
| Wave 1 | Critical | 4 | 6h | 6h |
| Wave 2 | High | 12 | 13h | 19h |
| Wave 3 | High (テスト) | 4 | 2h | 21h |
| Wave 4 | Medium | 14 | 12h | 33h |
| Wave 5 | Low | 2 | 1.5h | 34.5h |
| Wave 6 | Must (最後) | 2 | 1h | 35.5h |
| **合計** | — | **38** | **35.5h** | — |

**推奨スコープ**: Wave 1-3（Critical-High）= 20ファイル、21時間

---

## 実装チェックリスト

### 各ドキュメント完成時の検証項目

#### 脆弱性ドキュメント
- [ ] vulnerability-db.jsonから全該当GHSAを抽出済み
- [ ] 各GHSAのリンクが有効
- [ ] 攻撃シナリオが記載されている
- [ ] 緩和策が記載されている
- [ ] 関連リソース（テストガイド、ナレッジ記事）へのリンクが設定されている

#### ベストプラクティス
- [ ] Quick Startセクションがある
- [ ] 実行コマンドが正確
- [ ] 検証方法が記載されている
- [ ] 関連する脆弱性ドキュメントへのリンクが設定されている

#### テストガイド
- [ ] テストREADMEの内容が反映されている
- [ ] GitBookフォーマットに調整済み
- [ ] 関連する脆弱性ドキュメントへのリンクが設定されている

#### アップデート情報
- [ ] バージョン別に整理されている
- [ ] 後方互換性のない変更が明記されている
- [ ] 関連GHSAへのリンクが設定されている

### SUMMARY.md更新時の検証項目
- [ ] 全新規ページがリンクされている
- [ ] リンクパスが正確（相対パス）
- [ ] カテゴリ順に整理されている
- [ ] 英語版・日本語版が同期している
- [ ] GitBookでビルドエラーがない

---

## 実装ルール

### ファイル命名規則
- ファイル名は小文字、ハイフン区切り（例: `exec-bypass.md`）
- 日本語版も同じファイル名（ディレクトリで区別: `docs/ja/vulnerabilities/exec-bypass.md`）

### マークダウン記法
- GitBook準拠
- 見出しは `#`, `##`, `###` を使用（`####` まで）
- コードブロックは言語指定（```bash, ```json 等）
- リンクは相対パス（例: `../test-cases/sandbox-escape-guide.md`）

### Frontmatter（不要）
- docsディレクトリ配下のファイルにはFrontmatterを付けない
- knowledgeディレクトリとの差別化

### リンク戦略
- 脆弱性ドキュメント → テストガイド: 各GHSAに対応するテストケースをリンク
- 脆弱性ドキュメント → ベストプラクティス: 緩和策セクションでリンク
- テストガイド → 脆弱性ドキュメント: 各テストの参照GHSAをリンク
- ベストプラクティス → 脆弱性ドキュメント: 関連リスクをリンク

---

## リスク管理

### リスク1: テンプレートの不備
**トリガー**: Wave 1（exec-bypass.md）作成時に発覚
**対応**: exec-bypass.md完成後にレビューし、テンプレートを修正してから次のWaveに進む

### リスク2: データソース不足
**トリガー**: vulnerability-db.jsonに該当データがない
**対応**: knowledgeディレクトリから追加情報を収集、または「調査中」として記載

### リスク3: GitBookビルドエラー
**トリガー**: SUMMARY.md更新後のビルド失敗
**対応**: ローカルでGitBookビルドを実行し、エラーを修正

### リスク4: リンク切れ
**トリガー**: 内部リンク先のファイルが存在しない
**対応**: Wave完了ごとにリンクチェックスクリプトを実行

---

## 成功基準

### Wave 1-3完了時（Critical-High）
- [ ] 20ファイル完成
- [ ] exec-bypass.md, hardening-guide.md, toctou.md, acp-security.md が公開可能な品質
- [ ] テストガイド2件（sandbox-escape, agent-hijack）が公開可能
- [ ] 内部リンク・外部リンクがすべて有効
- [ ] GitBookでビルドエラーなし

### 全Wave完了時
- [ ] 38ファイル完成
- [ ] SUMMARY.md更新完了
- [ ] GitBookで公開可能な状態
- [ ] リンク切れゼロ

---

## 次のステップ

### このPlan完成後
1. **natsukiに提示**: `phase6-4-research.md` と `phase6-4-plan.md` を確認してもらう
2. **Annotateフェーズ**: natsukiがplan.mdに注釈・修正を追加
3. **Plan承認**: natsukiの「OK」を待つ
4. **Implementフェーズ**: Wave 1から実装開始

### 実装開始時の最初のアクション
1. Task 1.1（exec-bypass.md EN）を作成
2. natsukiにレビュー依頼
3. テンプレート確定
4. 残りのWaveに進む

---

*Phase 6-4 Plan 完了: 2026-03-13*
