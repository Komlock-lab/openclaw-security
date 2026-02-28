/**
 * OpenClaw Security Scan Skill Build Script
 *
 * Copies data/vulnerability-db.json to skill-dist/openclaw-security-scan/
 * and runs integrity checks.
 *
 * Usage:
 *   npx tsx scripts/build-skill.ts
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SOURCE_DB = resolve(ROOT, "data/vulnerability-db.json");
const DEST_DB = resolve(ROOT, "skill-dist/openclaw-security-scan/vulnerability-db.json");
const SKILL_DIR = resolve(ROOT, "skill-dist/openclaw-security-scan");

function main() {
  console.log("=== OpenClaw Security Scan Skill Build ===\n");

  // 1. Check source DB exists
  if (!existsSync(SOURCE_DB)) {
    console.error("Error: data/vulnerability-db.json not found");
    process.exit(1);
  }

  // 2. JSON integrity check
  console.log("[1/4] JSON integrity check...");
  let db: any;
  try {
    const raw = readFileSync(SOURCE_DB, "utf-8");
    db = JSON.parse(raw);
  } catch (e) {
    console.error(`Error: Failed to parse JSON: ${e}`);
    process.exit(1);
  }

  // 3. Required field validation
  console.log("[2/4] Required field validation...");
  const errors: string[] = [];

  if (!db.metadata) errors.push("metadata not found");
  if (!db.metadata?.lastUpdated) errors.push("metadata.lastUpdated not found");
  if (!db.metadata?.latestOpenClawVersion) errors.push("metadata.latestOpenClawVersion not found");
  if (!Array.isArray(db.vulnerabilities)) errors.push("vulnerabilities is not an array");
  if (!Array.isArray(db.runtimeChecks)) errors.push("runtimeChecks is not an array");
  if (!Array.isArray(db.permanentWarnings)) errors.push("permanentWarnings is not an array");

  for (const [i, v] of db.vulnerabilities.entries()) {
    if (!v.id) errors.push(`vulnerabilities[${i}]: id not found`);
    if (!v.severity) errors.push(`vulnerabilities[${i}]: severity not found`);
    if (!v.summary) errors.push(`vulnerabilities[${i}]: summary not found`);
    if (!v.fixedIn) errors.push(`vulnerabilities[${i}]: fixedIn not found`);
    if (!v.url) errors.push(`vulnerabilities[${i}]: url not found`);
    if (!["critical", "high", "medium", "low"].includes(v.severity)) {
      errors.push(`vulnerabilities[${i}]: severity "${v.severity}" is invalid`);
    }
  }

  if (errors.length > 0) {
    console.error("Validation errors:");
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  // Auto-update entryCount
  const actualCount = db.vulnerabilities.length;
  if (db.metadata.entryCount !== actualCount) {
    console.log(`  Updating metadata.entryCount: ${db.metadata.entryCount} -> ${actualCount}`);
    db.metadata.entryCount = actualCount;
    writeFileSync(SOURCE_DB, JSON.stringify(db, null, 2) + "\n", "utf-8");
  }

  console.log(`  Vulnerability entries: ${actualCount}`);
  console.log(`  Runtime checks: ${db.runtimeChecks.length}`);
  console.log(`  Permanent warnings: ${db.permanentWarnings.length}`);

  // 4. Copy to skill-dist
  console.log("[3/4] Copying to skill-dist/...");
  if (!existsSync(SKILL_DIR)) {
    console.error(`Error: ${SKILL_DIR} not found`);
    process.exit(1);
  }
  copyFileSync(SOURCE_DB, DEST_DB);
  console.log(`  ${SOURCE_DB} -> ${DEST_DB}`);

  // 5. Post-copy integrity verification
  console.log("[4/4] Post-copy integrity verification...");
  const sourceContent = readFileSync(SOURCE_DB, "utf-8");
  const destContent = readFileSync(DEST_DB, "utf-8");
  if (sourceContent !== destContent) {
    console.error("Error: File contents do not match after copy");
    process.exit(1);
  }

  const bySeverity = {
    critical: db.vulnerabilities.filter((v: any) => v.severity === "critical").length,
    high: db.vulnerabilities.filter((v: any) => v.severity === "high").length,
    medium: db.vulnerabilities.filter((v: any) => v.severity === "medium").length,
    low: db.vulnerabilities.filter((v: any) => v.severity === "low").length,
  };

  console.log("\n=== Build Complete ===");
  console.log(`DB updated: ${db.metadata.lastUpdated}`);
  console.log(`Latest OpenClaw version: ${db.metadata.latestOpenClawVersion}`);
  console.log(`Vulnerabilities: Critical ${bySeverity.critical} / High ${bySeverity.high} / Medium ${bySeverity.medium} / Low ${bySeverity.low}`);
  console.log(`Output: skill-dist/openclaw-security-scan/vulnerability-db.json`);
}

main();
