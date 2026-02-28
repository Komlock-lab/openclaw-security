#!/usr/bin/env bash
#
# OpenClaw Security Scan Script
#
# Matches a version against the vulnerability DB and outputs affected
# vulnerabilities as a Markdown report.
# Uses Node.js (a prerequisite for OpenClaw) for JSON processing.
#
# Usage:
#   bash scan.sh <version> [db-path]
#
# Examples:
#   bash scan.sh 2026.2.10
#   bash scan.sh 2026.2.10 /path/to/vulnerability-db.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-/dev/null}")" 2>/dev/null && pwd || echo ".")"

# Auto-detect version if not provided
if [ -n "${1:-}" ]; then
  VERSION="$1"
else
  VERSION=$(openclaw --version 2>/dev/null | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1 || true)
  if [ -z "$VERSION" ]; then
    echo "Error: Could not auto-detect OpenClaw version."
    echo "Usage: bash scan.sh [version] [db-path]"
    echo "Example: bash scan.sh 2026.2.10"
    exit 1
  fi
  echo "Auto-detected version: $VERSION" >&2
fi

# Determine DB path (argument > GitHub fetch > bundled)
if [ -n "${2:-}" ] && [ -f "${2}" ]; then
  DB_PATH="$2"
  DB_SOURCE="Specified file"
else
  # Fetch latest from GitHub (5-second timeout)
  DB_URL="https://raw.githubusercontent.com/natsuki/openclaw-security/main/data/vulnerability-db.json"
  LATEST_DB=$(curl -sf --connect-timeout 5 "$DB_URL" 2>/dev/null || true)

  if [ -n "$LATEST_DB" ]; then
    echo "$LATEST_DB" > /tmp/openclaw-vuln-db.json
    DB_PATH="/tmp/openclaw-vuln-db.json"
    DB_SOURCE="GitHub (latest)"
  elif [ -f "${SCRIPT_DIR}/vulnerability-db.json" ]; then
    DB_PATH="${SCRIPT_DIR}/vulnerability-db.json"
    DB_SOURCE="Bundled"
  else
    echo "Error: Vulnerability database not found"
    exit 1
  fi
fi

# Run version matching and report generation with Node.js
node -e "
const fs = require('fs');

const version = process.argv[1];
const dbPath = process.argv[2];
const dbSource = process.argv[3];

const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Version comparison
function parseVersion(v) {
  return v.replace(/^v/, '').split('-')[0].split('.').map(Number);
}

function isLessThan(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const x = va[i] || 0;
    const y = vb[i] || 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}

// Filter affected vulnerabilities
const affected = db.vulnerabilities.filter(v => isLessThan(version, v.fixedIn));

// Count by severity
const counts = { critical: 0, high: 0, medium: 0, low: 0 };
affected.forEach(v => counts[v.severity]++);

const total = affected.length;
const scanDate = new Date().toISOString().split('T')[0];

// Markdown output
const lines = [];
lines.push('# OpenClaw Security Scan Results');
lines.push('');
lines.push('| Item | Value |');
lines.push('|------|-------|');
lines.push('| Scan date | ' + scanDate + ' |');
lines.push('| Target version | ' + version + ' |');
lines.push('| Latest version | ' + db.metadata.latestOpenClawVersion + ' |');
lines.push('| Data source | ' + dbSource + ' |');
lines.push('| DB updated | ' + db.metadata.lastUpdated + ' |');
lines.push('');

// Summary
lines.push('## Summary');
lines.push('');

if (total === 0) {
  lines.push('No known registered vulnerabilities found for this version.');
} else {
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  lines.push('| Critical | ' + counts.critical + ' |');
  lines.push('| High | ' + counts.high + ' |');
  lines.push('| Medium | ' + counts.medium + ' |');
  lines.push('| Low | ' + counts.low + ' |');
  lines.push('| **Total** | **' + total + '** |');

  if (counts.critical > 0) {
    lines.push('');
    lines.push('> **URGENT**: Critical vulnerabilities found. Update immediately.');
  }
}

// Vulnerability list (by severity)
if (total > 0) {
  lines.push('');
  lines.push('## Vulnerabilities');

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const severityLabel = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

  for (const sev of severityOrder) {
    const items = affected.filter(v => v.severity === sev);
    if (items.length === 0) continue;

    lines.push('');
    lines.push('### ' + severityLabel[sev] + ' (' + items.length + ')');
    lines.push('');

    for (const v of items) {
      const cveStr = v.cve ? ' (' + v.cve + ')' : '';
      lines.push('- **' + v.id + cveStr + '**: ' + v.summary);
      lines.push('  - Category: ' + v.category);
      lines.push('  - Fixed in: >= ' + v.fixedIn);
      lines.push('  - ' + v.url);
    }
  }
}

// Runtime configuration checks
lines.push('');
lines.push('## Runtime Configuration Checks');
lines.push('');
lines.push('Verify the following settings (check with \`openclaw config get\`):');
lines.push('');
lines.push('| ID | Item | Severity | Recommendation |');
lines.push('|----|------|----------|----------------|');
for (const rc of db.runtimeChecks) {
  lines.push('| ' + rc.id + ' | ' + rc.description + ' | ' + rc.severity + ' | \`' + rc.recommendation + '\` |');
}

// Permanent warnings
lines.push('');
lines.push('## Permanent Warnings');
lines.push('');
for (const pw of db.permanentWarnings) {
  lines.push('- **[' + pw.id + '] ' + pw.description + '**');
  lines.push('  - Severity: ' + pw.severity);
  lines.push('  - Recommendation: ' + pw.recommendation);
  if (pw.references && pw.references.length > 0) {
    lines.push('  - References:');
    for (const ref of pw.references) {
      lines.push('    - ' + ref);
    }
  }
}

// Action plan
lines.push('');
lines.push('## Action Plan');
lines.push('');

if (counts.critical > 0) {
  lines.push('### 1. Urgent (Do now)');
  lines.push('');
  lines.push('\`\`\`bash');
  lines.push('openclaw update');
  lines.push('\`\`\`');
  lines.push('');
  lines.push('Minimum version that fixes Critical vulnerabilities: **v2026.2.14**');
  lines.push('');
}

if (counts.high > 0) {
  lines.push('### ' + (counts.critical > 0 ? '2' : '1') + '. Important (Act soon)');
  lines.push('');
  lines.push('\`\`\`bash');
  lines.push('# Enable sandbox');
  lines.push('openclaw config set sandbox all');
  lines.push('');
  lines.push('# Update to latest');
  lines.push('openclaw update');
  lines.push('\`\`\`');
  lines.push('');
}

const actionIdx = (counts.critical > 0 ? 1 : 0) + (counts.high > 0 ? 1 : 0) + 1;
lines.push('### ' + actionIdx + '. Ongoing Attention');
lines.push('');
lines.push('- No systematic prompt injection defense in any version');
lines.push('- Be cautious when processing input from untrusted sources');
lines.push('- Enabling human-in-the-loop is recommended');
lines.push('');
lines.push('---');
lines.push('*This report was auto-generated by openclaw-security-scan*');
lines.push('*Vulnerability DB: ' + dbSource + ' (' + db.metadata.lastUpdated + ')*');

console.log(lines.join('\n'));
" "$VERSION" "$DB_PATH" "$DB_SOURCE"
