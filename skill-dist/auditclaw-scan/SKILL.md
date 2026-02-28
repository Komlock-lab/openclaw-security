# AuditClaw Self-Scan

A skill for self-diagnosing known vulnerabilities and runtime configuration issues in OpenClaw.

## Trigger

Execute this skill when the user says something like:
- "security scan"
- "security check"
- "vulnerability check"
- "is my version safe?"
- "run a security audit"

## Behavioral Rules

1. **Never** skip the version detection step. Always confirm the exact version before scanning.
2. **Never** modify any OpenClaw configuration without explicit user approval.
3. **Always** report the data source (GitHub latest vs. bundled) so the user knows how current the data is.
4. **Always** present Critical and High severity findings first.
5. **Never** downplay Critical or High findings. Use clear, urgent language.
6. **Always** provide actionable remediation commands, not just descriptions.
7. **Never** execute remediation commands automatically. Only suggest them.
8. **Always** mention permanent warnings (prompt injection, DM pairing) regardless of version.
9. **Never** claim the scan is comprehensive. Always note it only covers known/registered vulnerabilities.
10. **Always** recommend updating to the latest version when the user is behind.
11. **Never** expose raw JSON data to the user. Always format as readable Markdown.
12. **Always** include advisory URLs so users can verify findings independently.
13. **Never** cache scan results across sessions. Always run a fresh scan.
14. **Always** fail gracefully if openclaw CLI is not available (version-only mode).
15. **Always** complete all 6 phases in order. Do not skip phases.

## Execution Flow (6 Phases)

### Phase 1: Version Detection

Detect the OpenClaw version.

```bash
openclaw --version 2>/dev/null || echo "unknown"
```

If the version cannot be detected, ask the user directly.
Version format is `YYYY.M.D` (e.g., `2026.2.26`). Strip any `v` prefix.

### Phase 2: Vulnerability DB Retrieval

Retrieve the latest vulnerability database. First try GitHub, then fall back to the bundled version.

```bash
# Determine the skill directory
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# Fetch latest from GitHub (5-second timeout)
DB_URL="https://raw.githubusercontent.com/natsuki/auditclaw/main/data/vulnerability-db.json"
LATEST_DB=$(curl -sf --connect-timeout 5 "$DB_URL" 2>/dev/null)

if [ -n "$LATEST_DB" ]; then
  echo "$LATEST_DB" > /tmp/openclaw-vuln-db.json
  DB_PATH="/tmp/openclaw-vuln-db.json"
  DB_SOURCE="GitHub (latest)"
else
  # Fallback: use bundled version
  DB_PATH="${SKILL_DIR}/vulnerability-db.json"
  DB_SOURCE="Bundled"
fi
```

Report the data source (GitHub latest or Bundled) to the user.

### Phase 3: Version Matching

Match the detected version against all vulnerability entries in the DB and list affected vulnerabilities.

Version comparison logic:
- Split CalVer format `YYYY.M.D` by `.` and compare numerically
- If the user's version is less than `fixedIn`, the vulnerability applies

```bash
# Run version matching using scan.sh
bash "${SKILL_DIR}/scan.sh" "$VERSION" "$DB_PATH"
```

### Phase 4: Runtime Configuration Check

Check the following configuration items. If a command does not exist or cannot be executed, mark as "Unable to verify" and skip.

| Check Item | Command | Expected Value |
|-----------|---------|----------------|
| Sandbox | `openclaw config get sandbox` | `all` |
| Gateway Auth | `openclaw config get gateway.auth` | `true` |
| DM Rate Limit | `openclaw config get dm.rateLimit` | `true` |
| Exec Allowlist | `openclaw config get exec.allowlist` | Restricted |
| Webhook Secret | `openclaw config get webhook.secret` | Configured |
| Auto-Update | `openclaw config get autoUpdate` | `true` |

### Phase 5: Report Generation

Report scan results in the following format:

```markdown
# AuditClaw Scan Results

**Scan date**: YYYY-MM-DD HH:MM
**Target version**: [detected version]
**Latest version**: [latest version from DB]
**Data source**: [GitHub latest / Bundled]

## Summary

| Severity | Count |
|----------|-------|
| Critical | X |
| High | X |
| Medium | X |
| Low | X |

## Vulnerabilities

### Critical

- **[GHSA-ID]**: [Summary]
  - Fixed in: >= [fixedIn]
  - [URL]

### High
...

## Runtime Configuration Check

| Item | Status | Recommendation |
|------|--------|----------------|
| Sandbox | OK / NG / Unable to verify | ... |
...

## Permanent Warnings

- [PW-001] No systematic prompt injection defense in any version
  - Recommendation: ...

## Action Plan
(Generated in Phase 6)
```

### Phase 6: Action Plan

Based on vulnerability severity and configuration check results, present remediation steps in priority order:

1. **Urgent (Do now)**: If Critical vulnerabilities exist
   - Update command: `openclaw update`
   - Specify the minimum version that fixes Critical issues

2. **Important (Act soon)**: If High vulnerabilities or configuration issues exist
   - Provide specific configuration commands
   - Example: `openclaw config set sandbox all`

3. **Recommended (Plan for)**: Medium and lower vulnerabilities
   - Suggest an update schedule

4. **Ongoing Attention**: Permanent warnings
   - Link to prompt injection best practices

## Notes

- This scan only checks known vulnerabilities. Unknown vulnerabilities cannot be detected.
- Runtime configuration checks depend on the OpenClaw CLI. In environments where OpenClaw is not installed, only version matching is performed.
- The vulnerability database is updated regularly. For the latest information, check https://github.com/openclaw/openclaw/security/advisories.
