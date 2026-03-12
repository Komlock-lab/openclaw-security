# AuditClaw Security Report

**Generated**: 2026-03-12T07:52:31.420Z

## Environment

- **OpenClaw Version**: 2026.3.2
- **Latest Version**: 2026.3.8
- **Node.js**: v25.7.0
- **Platform**: darwin (arm64)
- **DB Updated**: 2026-03-11

## Vulnerability Scan

⚠️  **13 known vulnerabilities found**

- Critical: 0
- High: 2
- Medium: 11
- Low: 0

### Vulnerabilities by Severity

🟠 **[HIGH] GHSA-6mgf-v5j7-45cr**
   fetch-guard forwards custom authorization headers across cross-origin redirects
   Fixed in: >= 2026.3.7

🟠 **[HIGH] GHSA-rchv-x836-w7xp**
   Dashboard leaked gateway auth material via browser URL/query and localStorage
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-9q36-67vc-rrwg**
   Sandboxed /acp spawn requests could initialize host ACP sessions
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-vhwf-4x96-vqx2**
   skills-install-download can be redirected outside the tools root by rebinding the validated base path
   Fixed in: >= 2026.3.8

🟡 **[MEDIUM] GHSA-g7cr-9h7q-4qxq**
   MS Teams sender allowlist bypass when route allowlist is configured and sender allowlist is empty
   Fixed in: >= 2026.3.8

🟡 **[MEDIUM] GHSA-pjvx-rx66-r3fg**
   Cross-account sender authorization expansion in /allowlist --store account scoping
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-hfpr-jhpq-x4rm**
   operator.write chat.send could reach admin-only config writes
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-8g75-q649-6pv6**
   system.run approvals did not bind mutable script operands across approval and execution
   Fixed in: >= 2026.3.8

🟡 **[MEDIUM] GHSA-j425-whc4-4jgc**
   system.run env override filtering allowed dangerous helper-command pivots
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-9q2p-vc84-2rwm**
   system.run allow-always persistence included shell-commented payload tails
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-r6qf-8968-wj9q**
   system.run wrapper-depth boundary could skip shell approval gating
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-3h2q-j2v4-6w5r**
   system.run allowlist approval parsing missed PowerShell encoded-command wrappers
   Fixed in: >= 2026.3.7

🟡 **[MEDIUM] GHSA-6rmx-gvvg-vh6j**
   hooks count non-POST requests toward auth lockout
   Fixed in: >= 2026.3.7

## Runtime Configuration Check

**Result**: 2 PASS / 4 FAIL / 13 SKIP

### Infrastructure

⏭️ **RC-001 sandbox-enabled** (high)
   - Skipped: Command execution failed

✅ **RC-002 gateway-auth** (high)

⏭️ **RC-003 dm-pairing-ratelimit** (medium)
   - Skipped: Command execution failed

⏭️ **RC-004 exec-allowlist** (high)
   - Skipped: Command execution failed

⏭️ **RC-005 webhook-secret** (high)
   - Skipped: Command execution failed

⏭️ **RC-006 auto-update** (medium)
   - Skipped: Command execution failed

### Prompt Injection Risk

⏭️ **RC-007 pi-attack-surface** (high)
   - Skipped: Command execution failed

⏭️ **RC-008 skill-external-urls** (medium)
   - Skipped: Command execution failed

### Tool Safety

⏭️ **RC-009 tools-deny** (medium)
   - Skipped: Command execution failed

⏭️ **RC-010 human-in-the-loop** (high)
   - Skipped: Command execution failed

### Network Security

❌ **RC-011 gateway-bind-loopback** (high)
   - Current: `loopback`
   - Expected: `127.0.0.1 or ::1`
   - Fix: Bind Gateway to loopback only: openclaw config set gateway.bind 127.0.0.1

❌ **RC-012 untrusted-input-channels** (medium)
   - Current: `{
  "discord": {
    "enabled": true,
    "token": "__OPENCLAW_REDACTED__",
    "groupPolicy": "allowlist",
    "streaming": "off",
    "guilds": {
      "1474570544073408755": {}
    }
  }
}`
   - Expected: `no untrusted channels or all with secret verification`
   - Fix: Ensure all external channels have authentication and input validation

### CI/CD Security

⏭️ **RC-013 claudemd-integrity** (high)
   - Skipped: Command execution failed

⏭️ **RC-014 gha-workflow-safety** (high)
   - Skipped: Command execution failed

### Agent Communication

⏭️ **RC-015 acp-dispatch-safety** (high)
   - Skipped: Command execution failed

### Version-Based Checks

❌ **RC-016 system-run-approval-binding** (high)
   - Current: `2026.3.2`
   - Expected: `>= 2026.3.8`
   - Fix: Update to >= 2026.3.8 which binds PATH-token executable identity and mutable script operands across approval and execution.

⏭️ **RC-017 dns-pinning-proxy** (medium)
   - Skipped: Command execution failed

❌ **RC-018 gateway-ui-auth-leakage** (high)
   - Current: `2026.3.2`
   - Expected: `>= 2026.3.7`
   - Fix: Update to >= 2026.3.7 which fixes dashboard gateway auth material leakage via browser URL and localStorage.

✅ **RC-019 sessions-spawn-sandbox-inheritance** (high)

## Permanent Security Warnings

🟠 **No systematic prompt injection defense in any version**
   - Recommendation: Be cautious with input from untrusted sources. Enable human-in-the-loop.

🟠 **No default rate limiting for DM pairing brute-force**
   - Recommendation: Always configure rate limiting when using DM pairing

🟡 **Sandbox disabled by default (opt-in)**
   - Recommendation: Enable with `openclaw config set sandbox all`

🔴 **CLAUDE.md and project instruction files are high-value targets for prompt injection. Attackers can replace these files via malicious PRs to hijack AI agent behavior (hackerbot-claw campaign, March 2026).**
   - Recommendation: Add CLAUDE.md to CODEOWNERS. Never auto-checkout untrusted PR code containing instruction files. Use tool allowlisting. Review CLAUDE.md changes with code-level rigor.

🔴 **Using pull_request_target with untrusted code checkout in GitHub Actions grants write tokens and secrets to attacker-controlled code. This is the primary attack pattern in AI agent CI/CD exploitation.**
   - Recommendation: Never use pull_request_target with actions/checkout of PR head. Use pull_request trigger instead. Restrict workflow permissions to minimum needed.

🔴 **system.run / exec allowlist is the largest and most actively exploited attack surface in OpenClaw. Over 28 distinct bypass techniques have been discovered across v2026.2.x-3.x, targeting approval binding, wrapper depth, PowerShell encoding, env overrides, PATH token rebinding, and allow-always persistence.**
   - Recommendation: Minimize system.run usage. Use tools.deny to block system.run where possible. Keep OpenClaw updated to latest version. Monitor for new exec bypass advisories.

🟠 **TOCTOU (Time-of-Check to Time-of-Use) race conditions in file operations can bypass sandbox boundaries. Symlink races in writeFileWithinRoot, sandbox media, and ZIP extraction have been exploited to read/write files outside sandbox root.**
   - Recommendation: Update to >= 2026.3.2 for TOCTOU fixes. Use atomic file operations where possible. Enable sandbox mode 'all' to reduce attack surface.

## Recommended Actions

1. **Update OpenClaw to v2026.3.8**
2. **Fix 4 failed runtime checks** (run `auditclaw check --fix`)
3. **Enable sandbox mode** (`openclaw config set sandbox all`)
4. **Review permanent security warnings above**

