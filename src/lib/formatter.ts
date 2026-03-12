/**
 * Output Formatters
 */

import type {
  Vulnerability,
  PermanentWarning,
  VulnerabilityDB,
} from "./db.js";
import { groupBySeverity, groupByCategory } from "./db.js";

export type OutputFormat = "md" | "json" | "terminal";

export interface ScanResult {
  version: string;
  vulnerabilities: Vulnerability[];
  metadata: VulnerabilityDB["metadata"];
  permanentWarnings: PermanentWarning[];
}

/**
 * Format scan result based on output format
 */
export function formatScanResult(
  result: ScanResult,
  format: OutputFormat
): string {
  switch (format) {
    case "json":
      return formatJSON(result);
    case "md":
      return formatMarkdown(result);
    case "terminal":
      return formatTerminal(result);
  }
}

/**
 * JSON output
 */
function formatJSON(result: ScanResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Markdown output
 */
function formatMarkdown(result: ScanResult): string {
  const { version, vulnerabilities, metadata, permanentWarnings } = result;
  const bySeverity = groupBySeverity(vulnerabilities);
  const byCategory = groupByCategory(vulnerabilities);

  let output = `# AuditClaw Scan Report\n\n`;
  output += `- **Target Version**: ${version}\n`;
  output += `- **Latest Version**: ${metadata.latestOpenClawVersion}\n`;
  output += `- **DB Updated**: ${metadata.lastUpdated}\n`;
  output += `- **Scan Date**: ${new Date().toISOString().split("T")[0]}\n\n`;

  if (vulnerabilities.length === 0) {
    output += `## Result\n\nNo known registered vulnerabilities found for this version.\n`;
  } else {
    output += `## Result\n\n`;
    output += `**${vulnerabilities.length} known vulnerabilities found**\n\n`;
    output += `- Critical: ${bySeverity.critical.length}\n`;
    output += `- High: ${bySeverity.high.length}\n`;
    output += `- Medium: ${bySeverity.medium.length}\n`;
    output += `- Low: ${bySeverity.low.length}\n\n`;

    if (bySeverity.critical.length > 0) {
      output += `> **⚠️ URGENT: Critical vulnerabilities found. Update immediately!**\n\n`;
    }

    output += `## Vulnerabilities by Category\n\n`;
    for (const [category, vulns] of byCategory) {
      output += `### ${category} (${vulns.length})\n\n`;
      for (const v of vulns) {
        const cveStr = v.cve ? ` (${v.cve})` : "";
        output += `#### [${v.severity.toUpperCase()}] ${v.id}${cveStr}\n\n`;
        output += `${v.summary}\n\n`;
        output += `- **Fixed in**: >= ${v.fixedIn}\n`;
        output += `- **URL**: ${v.url}\n\n`;
      }
    }
  }

  if (permanentWarnings.length > 0) {
    output += `## Permanent Warnings\n\n`;
    for (const w of permanentWarnings) {
      output += `### [${w.severity.toUpperCase()}] ${w.description}\n\n`;
      output += `**Recommendation**: ${w.recommendation}\n\n`;
      if (w.references && w.references.length > 0) {
        output += `**References**:\n`;
        for (const ref of w.references) {
          output += `- ${ref}\n`;
        }
        output += `\n`;
      }
    }
  }

  return output;
}

/**
 * Terminal output (colored)
 */
function formatTerminal(result: ScanResult): string {
  const { version, vulnerabilities, metadata, permanentWarnings } = result;
  const bySeverity = groupBySeverity(vulnerabilities);
  const byCategory = groupByCategory(vulnerabilities);

  let output = `\n${"=".repeat(50)}\n`;
  output += `  AuditClaw Scan\n`;
  output += `  Target version: ${version}\n`;
  output += `  Latest version: ${metadata.latestOpenClawVersion}\n`;
  output += `  DB updated: ${metadata.lastUpdated}\n`;
  output += `${"=".repeat(50)}\n\n`;

  if (vulnerabilities.length === 0) {
    output += "No known registered vulnerabilities found for this version.\n";
  } else {
    output += `[Result] ${vulnerabilities.length} known vulnerabilities found\n\n`;
    output += `  Critical: ${bySeverity.critical.length}  High: ${bySeverity.high.length}  Medium: ${bySeverity.medium.length}  Low: ${bySeverity.low.length}\n\n`;

    if (bySeverity.critical.length > 0) {
      output += `!!! URGENT: Critical vulnerabilities found. Update immediately !!!\n\n`;
    }

    for (const [category, categoryVulns] of byCategory) {
      output += `--- ${category} (${categoryVulns.length}) ---\n`;
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
        output += `  ${severityIcon} ${v.id}${cveStr}\n`;
        output += `        ${v.summary}\n`;
        output += `        Fixed in: >= ${v.fixedIn}\n`;
      }
      output += `\n`;
    }
  }

  if (permanentWarnings.length > 0) {
    output += "--- Permanent Warnings ---\n";
    for (const w of permanentWarnings) {
      const icon =
        w.severity === "high"
          ? "[!! ]"
          : w.severity === "medium"
            ? "[!  ]"
            : "[   ]";
      output += `  ${icon} ${w.description}\n`;
      output += `        Recommendation: ${w.recommendation}\n`;
    }
    output += `\n`;
  }

  return output;
}
