#!/usr/bin/env node
/**
 * AuditClaw CLI
 *
 * Usage:
 *   auditclaw scan [--version <version>] [--format md|json|terminal] [--output <path>]
 *   auditclaw check [--fix]
 *   auditclaw report
 *   auditclaw --help
 *   auditclaw --version
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scanCommand, type ScanOptions } from "./commands/scan.js";
import { checkCommand, type CheckOptions } from "./commands/check.js";
import { reportCommand } from "./commands/report.js";
import type { OutputFormat } from "./lib/formatter.js";

// Load version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf-8")
);
const VERSION = packageJson.version;

function showHelp(): void {
  console.log(`
AuditClaw v${VERSION} - Security scanner for OpenClaw

Usage:
  auditclaw scan [options]     Scan for known vulnerabilities
  auditclaw check [options]    Check runtime configuration
  auditclaw report             Generate comprehensive report
  auditclaw --help             Show this help
  auditclaw --version          Show version

Scan Options:
  --version <version>          Specify OpenClaw version (auto-detect if omitted)
  --format <md|json|terminal>  Output format (default: terminal)
  --output <path>              Save to file instead of stdout

Check Options:
  --fix                        Interactively apply fixes for failed checks

Examples:
  auditclaw scan
  auditclaw scan --version 2026.2.10
  auditclaw scan --format md --output report.md
  auditclaw check
  auditclaw check --fix
  auditclaw report
`);
}

function parseArgs(
  argv: string[]
): { command: string; options: Record<string, string | boolean> } {
  const [, , ...args] = argv;
  const options: Record<string, string | boolean> = {};
  let command = "help";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        options[key] = next;
        i++;
      } else {
        options[key] = true;
      }
    } else if (i === 0 && !arg.startsWith("-")) {
      // First non-flag argument is the command
      command = arg;
    }
  }

  return { command, options };
}

async function main(): Promise<void> {
  const { command, options } = parseArgs(process.argv);

  // Global flags (only when no command specified)
  if (command === "help" && !options.version) {
    showHelp();
    process.exit(0);
  }

  if (command === "help" && options.version) {
    console.log(`AuditClaw v${VERSION}`);
    process.exit(0);
  }

  if (command === "version") {
    console.log(`AuditClaw v${VERSION}`);
    process.exit(0);
  }

  // Command routing
  try {
    switch (command) {
      case "scan": {
        const scanOpts: ScanOptions = {
          version: options.version as string | undefined,
          format: (options.format as OutputFormat) || "terminal",
          output: options.output as string | undefined,
        };
        const exitCode = scanCommand(scanOpts);
        process.exit(exitCode);
      }

      case "check": {
        const checkOpts: CheckOptions = {
          fix: !!options.fix,
        };
        const exitCode = await checkCommand(checkOpts);
        process.exit(exitCode);
      }

      case "report": {
        const exitCode = reportCommand();
        process.exit(exitCode);
      }

      default:
        console.error(`Error: Unknown command '${command}'`);
        console.error("Run 'auditclaw --help' for usage.");
        process.exit(2);
    }
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
