/**
 * OpenClaw Version Vulnerability Checker
 *
 * Lists known vulnerabilities affecting a specified OpenClaw version.
 * Vulnerability data is loaded from data/vulnerability-db.json.
 *
 * Usage:
 *   npx tsx scripts/version-check.ts 2026.2.10
 *   npx tsx scripts/version-check.ts 2026.1.29
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface Vulnerability {
  id: string;
  cve: string | null;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  summary: string;
  fixedIn: string;
  url: string;
}

interface VulnerabilityDB {
  metadata: {
    lastUpdated: string;
    entryCount: number;
    latestOpenClawVersion: string;
    source: string;
  };
  vulnerabilities: Vulnerability[];
  runtimeChecks: Array<{
    id: string;
    name: string;
    severity: string;
    description: string;
    checkCommand: string;
    expectedValue: string;
    recommendation: string;
  }>;
  permanentWarnings: Array<{
    id: string;
    severity: string;
    description: string;
    recommendation: string;
    references?: string[];
  }>;
}

function loadVulnerabilityDB(): VulnerabilityDB {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbPath = resolve(__dirname, "../data/vulnerability-db.json");
  const raw = readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as VulnerabilityDB;
}

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

function getVulnerabilitiesForVersion(
  version: string,
  vulnerabilities: Vulnerability[]
): Vulnerability[] {
  return vulnerabilities.filter((vuln) =>
    isVersionLessThan(version, vuln.fixedIn)
  );
}

function main() {
  const version = process.argv[2];

  if (!version) {
    console.log("OpenClaw Version Vulnerability Checker");
    console.log("Usage: npx tsx scripts/version-check.ts <version>");
    console.log("Example: npx tsx scripts/version-check.ts 2026.2.10");
    process.exit(1);
  }

  const db = loadVulnerabilityDB();

  console.log(`\n========================================`);
  console.log(`  OpenClaw Security Scan`);
  console.log(`  Target version: ${version}`);
  console.log(`  Latest version: ${db.metadata.latestOpenClawVersion}`);
  console.log(`  DB updated: ${db.metadata.lastUpdated}`);
  console.log(`========================================\n`);

  const vulns = getVulnerabilitiesForVersion(version, db.vulnerabilities);

  if (vulns.length === 0) {
    console.log("No known registered vulnerabilities found for this version.");
  } else {
    const bySeverity = {
      critical: vulns.filter((v) => v.severity === "critical"),
      high: vulns.filter((v) => v.severity === "high"),
      medium: vulns.filter((v) => v.severity === "medium"),
      low: vulns.filter((v) => v.severity === "low"),
    };

    console.log(`[Result] ${vulns.length} known vulnerabilities found\n`);
    console.log(
      `  Critical: ${bySeverity.critical.length}  High: ${bySeverity.high.length}  Medium: ${bySeverity.medium.length}  Low: ${bySeverity.low.length}\n`
    );

    if (bySeverity.critical.length > 0) {
      console.log(
        "!!! URGENT: Critical vulnerabilities found. Update immediately !!!\n"
      );
    }

    const byCategory = new Map<string, Vulnerability[]>();
    for (const v of vulns) {
      const list = byCategory.get(v.category) || [];
      list.push(v);
      byCategory.set(v.category, list);
    }

    for (const [category, categoryVulns] of byCategory) {
      console.log(`--- ${category} (${categoryVulns.length}) ---`);
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
        console.log(`        Fixed in: >= ${v.fixedIn}`);
      }
      console.log();
    }
  }

  if (db.permanentWarnings.length > 0) {
    console.log("--- Permanent Warnings ---");
    for (const w of db.permanentWarnings) {
      const icon =
        w.severity === "high"
          ? "[!! ]"
          : w.severity === "medium"
            ? "[!  ]"
            : "[   ]";
      console.log(`  ${icon} ${w.description}`);
      console.log(`        Recommendation: ${w.recommendation}`);
    }
    console.log();
  }

  console.log("========================================");
  console.log("  Recommended Actions");
  console.log("========================================\n");

  if (isVersionLessThan(version, "2026.2.14")) {
    console.log("  [URGENT] Update to v2026.2.14 or later");
    console.log(
      "           Multiple vulnerabilities including Critical RCE have been fixed\n"
    );
  } else if (
    isVersionLessThan(version, db.metadata.latestOpenClawVersion)
  ) {
    console.log(
      `  [Recommended] Update to latest v${db.metadata.latestOpenClawVersion}\n`
    );
  }

  console.log("  [Always] Enable sandbox (disabled by default)");
  console.log(
    "  [Always] No systematic prompt injection defense in any version"
  );
  console.log(
    "  [Always] No rate limiting for DM pairing brute-force\n"
  );
}

main();
