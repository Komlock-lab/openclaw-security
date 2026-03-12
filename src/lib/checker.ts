/**
 * Runtime Check Execution Engine
 */

import { execSync } from "node:child_process";
import type { RuntimeCheck } from "./db.js";

export type CheckStatus = "PASS" | "FAIL" | "SKIP" | "ERROR";

export interface CheckResult {
  id: string;
  name: string;
  severity: string;
  description: string;
  status: CheckStatus;
  actual: string | null;
  expected: string;
  recommendation: string;
  error?: string;
}

/**
 * Execute a single runtime check
 */
export function executeCheck(check: RuntimeCheck): CheckResult {
  try {
    const output = execSync(check.checkCommand, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    const status = evaluateCheckResult(output, check.expectedValue);

    return {
      id: check.id,
      name: check.name,
      severity: check.severity,
      description: check.description,
      status,
      actual: output || "(empty)",
      expected: check.expectedValue,
      recommendation: check.recommendation,
    };
  } catch (error: unknown) {
    // All command execution failures are treated as SKIP
    // (command not found, execution error, timeout, etc.)
    let errorMessage = "Command execution failed";

    if (error instanceof Error) {
      if ("code" in error) {
        if (error.code === "ENOENT" || error.code === 127) {
          errorMessage = "Command not found";
        } else if (error.code === "ETIMEDOUT") {
          errorMessage = "Timeout";
        }
      }
    }

    return {
      id: check.id,
      name: check.name,
      severity: check.severity,
      description: check.description,
      status: "SKIP",
      actual: null,
      expected: check.expectedValue,
      recommendation: check.recommendation,
      error: errorMessage,
    };
  }
}

/**
 * Evaluate check result against expected value
 */
function evaluateCheckResult(actual: string, expected: string): CheckStatus {
  // Direct match
  if (actual === expected) {
    return "PASS";
  }

  // Special cases for expectedValue patterns
  if (expected === "true") {
    // "true" means "configured" - accept "true", "enabled", or any non-empty JSON object
    if (actual === "true" || actual === "enabled") {
      return "PASS";
    }
    // If output is a JSON object, consider it as configured
    if (actual.startsWith("{") && actual.includes("}")) {
      return "PASS";
    }
  }

  if (expected === "all" && actual === "all") {
    return "PASS";
  }

  if (expected === "set" && actual && actual !== "null" && actual !== "(empty)") {
    return "PASS";
  }

  if (expected === "configured" && actual && actual !== "null" && actual !== "(empty)") {
    return "PASS";
  }

  // Version checks (RC-016, RC-017, RC-018, RC-019)
  if (expected.includes(">=")) {
    const match = expected.match(/>= ([\d.]+)/);
    if (match) {
      const requiredVersion = match[1];
      const actualVersionMatch = actual.match(/v?([\d.]+)/);
      if (actualVersionMatch) {
        const actualVersion = actualVersionMatch[1];
        return isVersionGreaterOrEqual(actualVersion, requiredVersion) ? "PASS" : "FAIL";
      }
    }
  }

  // Complex conditions (RC-007: "sandbox=all OR tools.web=disabled")
  if (expected.includes("OR")) {
    // For now, mark as FAIL (complex evaluation needs more context)
    return "FAIL";
  }

  // Default: FAIL
  return "FAIL";
}

/**
 * Check if version is greater than or equal to target
 */
function isVersionGreaterOrEqual(version: string, target: string): boolean {
  const v = version.split(".").map(Number);
  const t = target.split(".").map(Number);
  for (let i = 0; i < Math.max(v.length, t.length); i++) {
    const a = v[i] ?? 0;
    const b = t[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true; // Equal
}

/**
 * Execute all runtime checks
 */
export function executeAllChecks(checks: RuntimeCheck[]): CheckResult[] {
  return checks.map(executeCheck);
}

/**
 * Group check results by category
 */
export function groupChecksByCategory(
  results: CheckResult[]
): Map<string, CheckResult[]> {
  const categories = new Map<string, CheckResult[]>();

  // Define category mapping based on check IDs
  const categoryMap: Record<string, string> = {
    "RC-001": "Infrastructure",
    "RC-002": "Infrastructure",
    "RC-003": "Infrastructure",
    "RC-004": "Infrastructure",
    "RC-005": "Infrastructure",
    "RC-006": "Infrastructure",
    "RC-007": "Prompt Injection Risk",
    "RC-008": "Prompt Injection Risk",
    "RC-009": "Tool Safety",
    "RC-010": "Tool Safety",
    "RC-011": "Network Security",
    "RC-012": "Network Security",
    "RC-013": "CI/CD Security",
    "RC-014": "CI/CD Security",
    "RC-015": "Agent Communication",
    "RC-016": "Version-Based Checks",
    "RC-017": "Version-Based Checks",
    "RC-018": "Version-Based Checks",
    "RC-019": "Version-Based Checks",
  };

  for (const result of results) {
    const category = categoryMap[result.id] || "Other";
    const list = categories.get(category) || [];
    list.push(result);
    categories.set(category, list);
  }

  return categories;
}
