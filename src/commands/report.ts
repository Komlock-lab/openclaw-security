/**
 * Report Command - Generate comprehensive security report
 */

import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { loadVulnerabilityDB, getVulnerabilitiesForVersion } from "../lib/db.js";
import { executeAllChecks, groupChecksByCategory } from "../lib/checker.js";

/**
 * Detect OpenClaw version
 */
function detectOpenClawVersion(): string | null {
  try {
    const output = execSync("openclaw --version", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get system information
 */
function getSystemInfo() {
  try {
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    return { nodeVersion, platform, arch };
  } catch {
    return { nodeVersion: "unknown", platform: "unknown", arch: "unknown" };
  }
}

/**
 * Execute report command
 */
export function reportCommand(): number {
  const db = loadVulnerabilityDB();
  const timestamp = new Date().toISOString().split("T")[0];
  const systemInfo = getSystemInfo();

  console.log("\n" + "=".repeat(50));
  console.log("  AuditClaw Comprehensive Report");
  console.log("=".repeat(50) + "\n");

  // Detect version
  let version = detectOpenClawVersion();
  if (!version) {
    console.log("Warning: Could not detect OpenClaw version");
    version = "unknown";
  } else {
    console.log(`Detected OpenClaw version: ${version}`);
  }

  console.log(`Generating report...\n`);

  // Scan vulnerabilities
  const vulnerabilities = version !== "unknown"
    ? getVulnerabilitiesForVersion(version, db.vulnerabilities)
    : [];

  // Execute runtime checks
  const checkResults = executeAllChecks(db.runtimeChecks);
  const checksByCategory = groupChecksByCategory(checkResults);

  // Count results
  const vulnCounts = {
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    high: vulnerabilities.filter((v) => v.severity === "high").length,
    medium: vulnerabilities.filter((v) => v.severity === "medium").length,
    low: vulnerabilities.filter((v) => v.severity === "low").length,
  };

  const checkCounts = {
    PASS: checkResults.filter((r) => r.status === "PASS").length,
    FAIL: checkResults.filter((r) => r.status === "FAIL").length,
    SKIP: checkResults.filter((r) => r.status === "SKIP").length,
  };

  // Generate markdown report
  let report = `# AuditClaw Security Report\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Environment\n\n`;
  report += `- **OpenClaw Version**: ${version}\n`;
  report += `- **Latest Version**: ${db.metadata.latestOpenClawVersion}\n`;
  report += `- **Node.js**: ${systemInfo.nodeVersion}\n`;
  report += `- **Platform**: ${systemInfo.platform} (${systemInfo.arch})\n`;
  report += `- **DB Updated**: ${db.metadata.lastUpdated}\n\n`;

  // Vulnerability scan results
  report += `## Vulnerability Scan\n\n`;
  if (vulnerabilities.length === 0) {
    report += `✅ No known vulnerabilities found for this version.\n\n`;
  } else {
    report += `⚠️  **${vulnerabilities.length} known vulnerabilities found**\n\n`;
    report += `- Critical: ${vulnCounts.critical}\n`;
    report += `- High: ${vulnCounts.high}\n`;
    report += `- Medium: ${vulnCounts.medium}\n`;
    report += `- Low: ${vulnCounts.low}\n\n`;

    if (vulnCounts.critical > 0) {
      report += `> **🚨 URGENT: Critical vulnerabilities found. Update immediately!**\n\n`;
    }

    report += `### Vulnerabilities by Severity\n\n`;
    for (const vuln of vulnerabilities) {
      const emoji = vuln.severity === "critical" ? "🔴" : vuln.severity === "high" ? "🟠" : "🟡";
      const cveStr = vuln.cve ? ` (${vuln.cve})` : "";
      report += `${emoji} **[${vuln.severity.toUpperCase()}] ${vuln.id}${cveStr}**\n`;
      report += `   ${vuln.summary}\n`;
      report += `   Fixed in: >= ${vuln.fixedIn}\n\n`;
    }
  }

  // Runtime check results
  report += `## Runtime Configuration Check\n\n`;
  report += `**Result**: ${checkCounts.PASS} PASS / ${checkCounts.FAIL} FAIL / ${checkCounts.SKIP} SKIP\n\n`;

  for (const [category, categoryResults] of checksByCategory) {
    report += `### ${category}\n\n`;
    for (const result of categoryResults) {
      const statusEmoji =
        result.status === "PASS" ? "✅" :
        result.status === "FAIL" ? "❌" :
        "⏭️";

      report += `${statusEmoji} **${result.id} ${result.name}** (${result.severity})\n`;

      if (result.status === "FAIL") {
        report += `   - Current: \`${result.actual}\`\n`;
        report += `   - Expected: \`${result.expected}\`\n`;
        report += `   - Fix: ${result.recommendation}\n`;
      } else if (result.status === "SKIP") {
        report += `   - Skipped: ${result.error}\n`;
      }
      report += `\n`;
    }
  }

  // Permanent warnings
  if (db.permanentWarnings.length > 0) {
    report += `## Permanent Security Warnings\n\n`;
    for (const warning of db.permanentWarnings) {
      const emoji = warning.severity === "high" ? "🔴" : warning.severity === "medium" ? "🟠" : "🟡";
      report += `${emoji} **${warning.description}**\n`;
      report += `   - Recommendation: ${warning.recommendation}\n\n`;
    }
  }

  // Recommendations
  report += `## Recommended Actions\n\n`;
  if (version !== "unknown" && vulnerabilities.length > 0) {
    report += `1. **Update OpenClaw to v${db.metadata.latestOpenClawVersion}**\n`;
  }
  if (checkCounts.FAIL > 0) {
    report += `2. **Fix ${checkCounts.FAIL} failed runtime checks** (run \`auditclaw check --fix\`)\n`;
  }
  report += `3. **Enable sandbox mode** (\`openclaw config set sandbox all\`)\n`;
  report += `4. **Review permanent security warnings above**\n\n`;

  // Save report
  const filename = `reports/${timestamp}-security-report.md`;
  try {
    writeFileSync(filename, report, "utf-8");
    console.log(`✓ Report saved to: ${filename}\n`);
  } catch (error) {
    console.error(`✗ Failed to save report: ${error}`);
    console.log("\n--- Report Content ---\n");
    console.log(report);
  }

  // Exit code: 1 if vulnerabilities or failures found
  return vulnerabilities.length > 0 || checkCounts.FAIL > 0 ? 1 : 0;
}
