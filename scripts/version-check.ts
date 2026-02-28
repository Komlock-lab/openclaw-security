/**
 * OpenClaw バージョン脆弱性チェッカー
 *
 * 指定されたOpenClawバージョンに存在する既知の脆弱性を一覧表示する。
 *
 * 使い方:
 *   npx tsx scripts/version-check.ts 2026.2.10
 *   npx tsx scripts/version-check.ts 2026.1.29
 */

// --- 脆弱性データベース ---

interface Vulnerability {
  id: string;
  cve?: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  summary: string;
  fixedIn: string; // 修正されたバージョン
  url: string;
}

const VULNERABILITIES: Vulnerability[] = [
  // Critical
  {
    id: "GHSA-gv46-4xfq-jv58",
    severity: "critical",
    category: "RCE",
    summary: "Gateway Node Invoke承認バイパスによるリモートコード実行",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58",
  },
  {
    id: "GHSA-4rj2-gpmh-qq5x",
    severity: "critical",
    category: "認証バイパス",
    summary: "voice-call拡張の受信許可リストバイパス（空の発信者ID + サフィックスマッチ）",
    fixedIn: "2026.2.2",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-4rj2-gpmh-qq5x",
  },
  {
    id: "GHSA-qrq5-wjgg-rvqw",
    severity: "critical",
    category: "パストラバーサル",
    summary: "プラグインインストール時のパストラバーサル",
    fixedIn: "2026.2.1",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw",
  },

  // High - RCE
  {
    id: "GHSA-g55j-c2v4-pjcg",
    cve: "CVE-2026-25593",
    severity: "high",
    category: "RCE",
    summary: "認証なしローカルRCE via WebSocket config.apply",
    fixedIn: "2026.1.20",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg",
  },
  {
    id: "GHSA-g8p2-7wf7-98mq",
    severity: "high",
    category: "RCE",
    summary: "gatewayUrl経由の認証トークン窃取によるワンクリックRCE",
    fixedIn: "2026.1.29",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq",
  },
  {
    id: "GHSA-65rx-fvh6-r4h2",
    cve: "CVE-2026-27209",
    severity: "high",
    category: "RCE",
    summary: "exec allowlistのheredoc展開によるシェルコマンドインジェクション",
    fixedIn: "2026.2.21",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-65rx-fvh6-r4h2",
  },
  {
    id: "GHSA-vffc-f7r7-rx2w",
    severity: "high",
    category: "RCE",
    summary: "systemdユニット生成の改行インジェクションでローカルコマンド実行（Linux）",
    fixedIn: "2026.2.21",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-vffc-f7r7-rx2w",
  },
  {
    id: "GHSA-hwpq-rrpf-pgcq",
    severity: "high",
    category: "RCE",
    summary: "system.run承認IDミスマッチで表示と異なるバイナリが実行される",
    fixedIn: "2026.2.25",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-hwpq-rrpf-pgcq",
  },

  // High - 認証バイパス
  {
    id: "GHSA-mp5h-m6qj-6292",
    cve: "CVE-2026-25474",
    severity: "high",
    category: "認証バイパス",
    summary: "Telegram webhookのsecretトークン検証欠落",
    fixedIn: "2026.2.1",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-mp5h-m6qj-6292",
  },
  {
    id: "GHSA-vvjh-f6p9-5vcf",
    severity: "high",
    category: "認証バイパス",
    summary: "Canvas認証バイパス（ZDI-CAN-29311）",
    fixedIn: "2026.2.19",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-vvjh-f6p9-5vcf",
  },
  {
    id: "GHSA-mwxv-35wr-4vvj",
    severity: "high",
    category: "認証バイパス",
    summary: "Gateway pluginのdot-segmentトラバーサルで/api/channels認証バイパス",
    fixedIn: "2026.2.26",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-mwxv-35wr-4vvj",
  },
  {
    id: "GHSA-h9g4-589h-68xv",
    severity: "high",
    category: "認証バイパス",
    summary: "サンドボックスブラウザブリッジサーバーの認証バイパス",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-h9g4-589h-68xv",
  },
  {
    id: "GHSA-x2ff-j5c2-ggpr",
    severity: "high",
    category: "認証バイパス",
    summary: "Slackインタラクティブコールバックの送信者チェックスキップ",
    fixedIn: "2026.2.25",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-x2ff-j5c2-ggpr",
  },

  // High - サンドボックスエスケープ
  {
    id: "GHSA-qcc4-p59m-p54m",
    severity: "high",
    category: "サンドボックスエスケープ",
    summary: "ダングリングシンボリックリンクでworkspace-only書き込み境界バイパス",
    fixedIn: "2026.2.26",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-qcc4-p59m-p54m",
  },
  {
    id: "GHSA-mgrq-9f93-wpp5",
    severity: "high",
    category: "サンドボックスエスケープ",
    summary: "存在しないシンボリックリンクリーフでワークスペースパスガードバイパス",
    fixedIn: "2026.2.26",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-mgrq-9f93-wpp5",
  },
  {
    id: "GHSA-3jx4-q2m7-r496",
    severity: "high",
    category: "サンドボックスエスケープ",
    summary: "ハードリンクエイリアスでworkspace-onlyファイル境界バイパス",
    fixedIn: "2026.2.25",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-3jx4-q2m7-r496",
  },

  // High - SSRF
  {
    id: "GHSA-jrvc-8ff5-2f9f",
    cve: "CVE-2026-26324",
    severity: "high",
    category: "SSRF",
    summary: "IPv4-mapped IPv6によるSSRFガードバイパス",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-jrvc-8ff5-2f9f",
  },

  // High - パストラバーサル
  {
    id: "GHSA-cv7m-c9jx-vg7q",
    cve: "CVE-2026-26329",
    severity: "high",
    category: "パストラバーサル",
    summary: "ブラウザアップロードのパストラバーサルでローカルファイル読み取り",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-cv7m-c9jx-vg7q",
  },
  {
    id: "GHSA-p25h-9q54-ffvw",
    severity: "high",
    category: "パストラバーサル",
    summary: "tar展開時のZip Slipパストラバーサル",
    fixedIn: "2026.2.22",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw",
  },
  {
    id: "GHSA-56pc-6hvp-4gv4",
    severity: "high",
    category: "任意ファイル読み取り",
    summary: "$includeディレクティブ経由の任意ファイル読み取り",
    fixedIn: "2026.2.17",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-56pc-6hvp-4gv4",
  },

  // High - exec allowlistバイパス
  {
    id: "GHSA-3c6h-g97w-fg78",
    severity: "high",
    category: "exec allowlistバイパス",
    summary: "GNUロングオプション省略によるexec allowlistバイパス",
    fixedIn: "2026.2.23",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-3c6h-g97w-fg78",
  },
  {
    id: "GHSA-796m-2973-wc5q",
    severity: "high",
    category: "exec allowlistバイパス",
    summary: "env -SラッパーによるsafeBinsバイパス",
    fixedIn: "2026.2.23",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-796m-2973-wc5q",
  },

  // High - その他
  {
    id: "GHSA-mc68-q9jw-2h3v",
    cve: "CVE-2026-24763",
    severity: "high",
    category: "コマンドインジェクション",
    summary: "Docker実行時のPATH環境変数経由コマンドインジェクション",
    fixedIn: "2026.1.29",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-mc68-q9jw-2h3v",
  },
  {
    id: "GHSA-q284-4pvr-m585",
    cve: "CVE-2026-25157",
    severity: "high",
    category: "コマンドインジェクション",
    summary: "sshNodeCommandのOSコマンドインジェクション",
    fixedIn: "2026.1.29",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-q284-4pvr-m585",
  },
  {
    id: "GHSA-3fqr-4cg8-h96q",
    cve: "CVE-2026-26317",
    severity: "high",
    category: "CSRF",
    summary: "ループバックブラウザエンドポイント経由のCSRF",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-3fqr-4cg8-h96q",
  },
  {
    id: "GHSA-4564-pvr2-qq4h",
    cve: "CVE-2026-27487",
    severity: "high",
    category: "コマンドインジェクション",
    summary: "macOSキーチェーンクレデンシャル書き込み時のシェルインジェクション",
    fixedIn: "2026.2.14",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-4564-pvr2-qq4h",
  },
  {
    id: "GHSA-2qj5-gwg2-xwc4",
    cve: "CVE-2026-27001",
    severity: "high",
    category: "プロンプトインジェクション",
    summary: "未サニタイズCWDパスのLLMプロンプトインジェクション",
    fixedIn: "2026.2.15",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-2qj5-gwg2-xwc4",
  },
  {
    id: "GHSA-r65x-2hqr-j5hf",
    severity: "high",
    category: "ポリシーバイパス",
    summary: "Node再接続メタデータスプーフィングでプラットフォームベースのコマンドポリシーバイパス",
    fixedIn: "2026.2.26",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-r65x-2hqr-j5hf",
  },

  // Medium - 代表的なもの
  {
    id: "GHSA-w235-x559-36mg",
    cve: "CVE-2026-27002",
    severity: "medium",
    category: "サンドボックスエスケープ",
    summary: "未検証バインドマウント設定インジェクションによるDockerコンテナエスケープ",
    fixedIn: "2026.2.15",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-w235-x559-36mg",
  },
  {
    id: "GHSA-74xj-763f-264w",
    cve: "CVE-2026-27165",
    severity: "medium",
    category: "プロンプトインジェクション",
    summary: "ACP resource_linkメタデータのプロンプトインジェクション",
    fixedIn: "2026.2.15",
    url: "https://github.com/openclaw/openclaw/security/advisories/GHSA-74xj-763f-264w",
  },
];

// --- バージョン比較ロジック ---

function parseVersion(version: string): number[] {
  const cleaned = version.replace(/^v/, "").split("-")[0];
  return cleaned.split(".").map(Number);
}

function isVersionLessThan(version: string, target: string): boolean {
  const v = parseVersion(version);
  const t = parseVersion(target);
  for (let i = 0; i < Math.max(v.length, t.length); i++) {
    const a = v[i] ?? 0;
    const b = t[i] ?? 0;
    if (a < b) return true;
    if (a > b) return false;
  }
  return false;
}

function getVulnerabilitiesForVersion(version: string): Vulnerability[] {
  return VULNERABILITIES.filter((vuln) =>
    isVersionLessThan(version, vuln.fixedIn)
  );
}

// --- メイン ---

function main() {
  const version = process.argv[2];

  if (!version) {
    console.log("OpenClaw バージョン脆弱性チェッカー");
    console.log("使い方: npx tsx scripts/version-check.ts <バージョン>");
    console.log("例:     npx tsx scripts/version-check.ts 2026.2.10");
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`  OpenClaw セキュリティ診断`);
  console.log(`  対象バージョン: ${version}`);
  console.log(`  最新バージョン: 2026.2.26`);
  console.log(`========================================\n`);

  const vulns = getVulnerabilitiesForVersion(version);

  if (vulns.length === 0) {
    console.log("このバージョンには登録済みの既知の脆弱性はありません。");
    console.log("（ただしプロンプトインジェクションの体系的防御は全バージョンで未実装です）");
    return;
  }

  // 深刻度別に集計
  const bySeverity = {
    critical: vulns.filter((v) => v.severity === "critical"),
    high: vulns.filter((v) => v.severity === "high"),
    medium: vulns.filter((v) => v.severity === "medium"),
    low: vulns.filter((v) => v.severity === "low"),
  };

  console.log(`【結果】${vulns.length}件の既知の脆弱性が見つかりました\n`);
  console.log(
    `  Critical: ${bySeverity.critical.length}件  High: ${bySeverity.high.length}件  Medium: ${bySeverity.medium.length}件  Low: ${bySeverity.low.length}件\n`
  );

  if (bySeverity.critical.length > 0) {
    console.log("!!! 緊急: Criticalの脆弱性があります。今すぐアップデートしてください !!!\n");
  }

  // カテゴリ別に表示
  const byCategory = new Map<string, Vulnerability[]>();
  for (const v of vulns) {
    const list = byCategory.get(v.category) || [];
    list.push(v);
    byCategory.set(v.category, list);
  }

  for (const [category, categoryVulns] of byCategory) {
    console.log(`--- ${category} (${categoryVulns.length}件) ---`);
    for (const v of categoryVulns) {
      const severityIcon =
        v.severity === "critical"
          ? "[!!!]"
          : v.severity === "high"
            ? "[!! ]"
            : v.severity === "medium"
              ? "[!  ]"
              : "[   ]";
      const cveStr = v.cve ? ` (${v.cve})` : "";
      console.log(`  ${severityIcon} ${v.id}${cveStr}`);
      console.log(`        ${v.summary}`);
      console.log(`        修正バージョン: >= ${v.fixedIn}`);
    }
    console.log();
  }

  // 推奨アクション
  console.log("========================================");
  console.log("  推奨アクション");
  console.log("========================================\n");

  if (isVersionLessThan(version, "2026.2.14")) {
    console.log("  [緊急] v2026.2.14以上にアップデートしてください");
    console.log("         Critical RCEを含む39件の脆弱性が修正されています\n");
  } else if (isVersionLessThan(version, "2026.2.26")) {
    console.log("  [推奨] 最新版 v2026.2.26 にアップデートしてください\n");
  }

  console.log("  [常に] サンドボックスを有効化してください（デフォルトはoff）");
  console.log("  [常に] プロンプトインジェクション対策は全バージョンで未実装のため注意");
  console.log("  [常に] DMペアリングのブルートフォースにレート制限がありません\n");
}

main();
