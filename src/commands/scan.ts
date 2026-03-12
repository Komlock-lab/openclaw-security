/**
 * Scan Command - Version vulnerability scanner
 */

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  loadVulnerabilityDB,
  getVulnerabilitiesForVersion,
  isVersionLessThan,
} from "../lib/db.js";
import { formatScanResult, type OutputFormat } from "../lib/formatter.js";

export interface ScanOptions {
  version?: string;
  format: OutputFormat;
  output?: string;
}

/**
 * Detect OpenClaw version from `openclaw --version`
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
 * Execute scan command
 */
export function scanCommand(options: ScanOptions): number {
  const db = loadVulnerabilityDB();

  // Determine version
  let version: string = options.version || "";
  if (!version) {
    const detected = detectOpenClawVersion();
    if (!detected) {
      console.error(
        "Error: Could not detect OpenClaw version. Specify with --version."
      );
      return 2;
    }
    version = detected;
  }

  // Get vulnerabilities
  const vulnerabilities = getVulnerabilitiesForVersion(
    version,
    db.vulnerabilities
  );

  // Format result
  const result = {
    version,
    vulnerabilities,
    metadata: db.metadata,
    permanentWarnings: db.permanentWarnings,
  };

  const formatted = formatScanResult(result, options.format);

  // Output
  if (options.output) {
    // Ensure parent directory exists
    const dir = dirname(options.output);
    if (dir && dir !== ".") {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(options.output, formatted, "utf-8");
    console.log(`Report saved to: ${options.output}`);
  } else {
    console.log(formatted);
  }

  // Print recommended actions (terminal only)
  if (options.format === "terminal" && !options.output) {
    printRecommendedActions(version, db.metadata.latestOpenClawVersion);
  }

  // Exit code: 1 if vulnerabilities found, 0 otherwise
  return vulnerabilities.length > 0 ? 1 : 0;
}

/**
 * Print recommended actions
 */
function printRecommendedActions(
  version: string,
  latestVersion: string
): void {
  console.log("=".repeat(50));
  console.log("  Recommended Actions");
  console.log("=".repeat(50));
  console.log();

  if (isVersionLessThan(version, "2026.2.14")) {
    console.log("  [URGENT] Update to v2026.2.14 or later");
    console.log(
      "           Multiple vulnerabilities including Critical RCE have been fixed\n"
    );
  } else if (isVersionLessThan(version, latestVersion)) {
    console.log(`  [Recommended] Update to latest v${latestVersion}\n`);
  }

  console.log("  [Always] Enable sandbox (disabled by default)");
  console.log(
    "  [Always] No systematic prompt injection defense in any version"
  );
  console.log("  [Always] No rate limiting for DM pairing brute-force\n");
}
