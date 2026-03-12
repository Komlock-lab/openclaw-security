/**
 * Check Command - Runtime configuration checker
 */

import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { loadVulnerabilityDB } from "../lib/db.js";
import {
  executeAllChecks,
  groupChecksByCategory,
  type CheckResult,
} from "../lib/checker.js";

export interface CheckOptions {
  fix: boolean;
}

/**
 * Execute check command
 */
export function checkCommand(options: CheckOptions): number {
  const db = loadVulnerabilityDB();
  const checks = db.runtimeChecks;

  console.log("\n" + "=".repeat(50));
  console.log("  AuditClaw Runtime Check");
  console.log("=".repeat(50) + "\n");

  // Execute all checks
  const results = executeAllChecks(checks);
  const byCategory = groupChecksByCategory(results);

  // Display results by category
  for (const [category, categoryResults] of byCategory) {
    console.log(`\n${category}`);
    for (const result of categoryResults) {
      const statusIcon = getStatusIcon(result.status);
      const statusColor = getStatusColor(result.status);
      console.log(
        `  ${statusColor}${statusIcon} ${result.id} ${result.name}${resetColor()}`
      );

      if (result.status === "FAIL") {
        console.log(`        Current: ${result.actual}`);
        console.log(`        Expected: ${result.expected}`);
        console.log(`        → Fix: ${result.recommendation}`);
      } else if (result.status === "ERROR") {
        console.log(`        Error: ${result.error}`);
      } else if (result.status === "SKIP") {
        console.log(`        Skipped: ${result.error || "Command not available"}`);
      }
    }
  }

  // Summary
  const counts = {
    PASS: results.filter((r) => r.status === "PASS").length,
    FAIL: results.filter((r) => r.status === "FAIL").length,
    SKIP: results.filter((r) => r.status === "SKIP").length,
    ERROR: results.filter((r) => r.status === "ERROR").length,
  };

  console.log("\n" + "=".repeat(50));
  console.log(
    `  Result: ${counts.PASS} PASS / ${counts.FAIL} FAIL / ${counts.SKIP} SKIP / ${counts.ERROR} ERROR`
  );
  console.log("=".repeat(50) + "\n");

  // Fix mode
  if (options.fix && counts.FAIL > 0) {
    const failures = results.filter((r) => r.status === "FAIL");
    console.log("Attempting to fix failed checks...\n");
    applyFixes(failures);
  }

  // Exit code: 1 if any failures, 0 otherwise
  return counts.FAIL > 0 ? 1 : 0;
}

/**
 * Get status icon
 */
function getStatusIcon(status: CheckResult["status"]): string {
  switch (status) {
    case "PASS":
      return "[PASS]";
    case "FAIL":
      return "[FAIL]";
    case "SKIP":
      return "[SKIP]";
    case "ERROR":
      return "[ERR ]";
  }
}

/**
 * Get status color (ANSI escape codes)
 */
function getStatusColor(status: CheckResult["status"]): string {
  switch (status) {
    case "PASS":
      return "\x1b[32m"; // Green
    case "FAIL":
      return "\x1b[31m"; // Red
    case "SKIP":
      return "\x1b[33m"; // Yellow
    case "ERROR":
      return "\x1b[35m"; // Magenta
  }
}

/**
 * Reset color
 */
function resetColor(): string {
  return "\x1b[0m";
}

/**
 * Apply fixes interactively
 */
async function applyFixes(failures: CheckResult[]): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  for (const failure of failures) {
    // Skip version-based checks (require manual update)
    if (failure.id.match(/RC-01[6-9]/)) {
      console.log(
        `${failure.id} ${failure.name}: Requires OpenClaw update (skipping auto-fix)`
      );
      continue;
    }

    // Skip complex checks that don't have simple fix commands
    if (
      failure.id === "RC-007" ||
      failure.id === "RC-008" ||
      failure.id === "RC-013" ||
      failure.id === "RC-014"
    ) {
      console.log(
        `${failure.id} ${failure.name}: Requires manual review (skipping auto-fix)`
      );
      continue;
    }

    console.log(`\n[FAIL] ${failure.id} ${failure.name}`);
    console.log(`Current: ${failure.actual}`);
    console.log(`Fix: ${failure.recommendation}`);

    const answer = await question("Apply? [y/N]: ");

    if (answer.toLowerCase() === "y") {
      try {
        // Extract command from recommendation
        const commandMatch = failure.recommendation.match(
          /openclaw [^\n]+|git [^\n]+|grep [^\n]+/
        );
        if (commandMatch) {
          const command = commandMatch[0];
          console.log(`Executing: ${command}`);
          execSync(command, { stdio: "inherit" });
          console.log("✓ Applied");
        } else {
          console.log("✗ Could not extract fix command");
        }
      } catch (error) {
        console.log(
          `✗ Failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      console.log("Skipped");
    }
  }

  rl.close();
}
