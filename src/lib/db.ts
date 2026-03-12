/**
 * Vulnerability Database Loader and Version Comparison
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface Vulnerability {
  id: string;
  cve: string | null;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  summary: string;
  fixedIn: string;
  url: string;
}

export interface RuntimeCheck {
  id: string;
  name: string;
  severity: string;
  description: string;
  checkCommand: string;
  expectedValue: string;
  recommendation: string;
}

export interface PermanentWarning {
  id: string;
  severity: string;
  description: string;
  recommendation: string;
  references?: string[];
}

export interface VulnerabilityDB {
  metadata: {
    lastUpdated: string;
    entryCount: number;
    latestOpenClawVersion: string;
    source: string;
  };
  vulnerabilities: Vulnerability[];
  runtimeChecks: RuntimeCheck[];
  permanentWarnings: PermanentWarning[];
}

/**
 * Load vulnerability database from data/vulnerability-db.json
 */
export function loadVulnerabilityDB(): VulnerabilityDB {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbPath = resolve(__dirname, "../../data/vulnerability-db.json");
  const raw = readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as VulnerabilityDB;
}

/**
 * Parse version string (CalVer format: 2026.2.10)
 */
export function parseVersion(version: string): number[] {
  const cleaned = version.replace(/^v/, "").split("-")[0];
  return cleaned.split(".").map(Number);
}

/**
 * Check if version is less than target
 */
export function isVersionLessThan(version: string, target: string): boolean {
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

/**
 * Get vulnerabilities affecting the specified version
 */
export function getVulnerabilitiesForVersion(
  version: string,
  vulnerabilities: Vulnerability[]
): Vulnerability[] {
  return vulnerabilities.filter((vuln) =>
    isVersionLessThan(version, vuln.fixedIn)
  );
}

/**
 * Group vulnerabilities by severity
 */
export function groupBySeverity(vulnerabilities: Vulnerability[]) {
  return {
    critical: vulnerabilities.filter((v) => v.severity === "critical"),
    high: vulnerabilities.filter((v) => v.severity === "high"),
    medium: vulnerabilities.filter((v) => v.severity === "medium"),
    low: vulnerabilities.filter((v) => v.severity === "low"),
  };
}

/**
 * Group vulnerabilities by category
 */
export function groupByCategory(
  vulnerabilities: Vulnerability[]
): Map<string, Vulnerability[]> {
  const map = new Map<string, Vulnerability[]>();
  for (const v of vulnerabilities) {
    const list = map.get(v.category) || [];
    list.push(v);
    map.set(v.category, list);
  }
  return map;
}
