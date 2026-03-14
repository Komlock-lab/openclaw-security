# OpenClaw Hardening Guide

## Overview

This guide provides actionable steps to harden your OpenClaw installation against known security threats. It covers 19 runtime security checks (RC-001 through RC-019) extracted from production security advisories, arranged by priority and category.

**Target Audience**: OpenClaw operators, security teams, and anyone running OpenClaw in production or high-trust environments.

**Prerequisites**:
- OpenClaw >= v2026.3.8 (recommended)
- Command-line access to the OpenClaw instance
- `openclaw` CLI tool installed

---

## Quick Start

For immediate security improvement, run these three commands:

```bash
# 1. Enable sandbox mode (isolates command execution)
openclaw config set sandbox all

# 2. Enable human-in-the-loop approval for sensitive operations
openclaw config set approvalMode always

# 3. Verify current version is up-to-date
openclaw --version
# Expected: >= v2026.3.8
```

If your version is outdated, update immediately:

```bash
openclaw update
```

---

## Critical Security Checks (High Severity)

### RC-001: Sandbox Enabled

**Check**:
```bash
openclaw config get sandbox
```

**Expected Value**: `all`

**Why It Matters**: Sandbox mode isolates command execution in Docker containers, preventing malicious code from accessing the host filesystem or network.

**How to Fix**:
```bash
openclaw config set sandbox all
```

**Verification**:
```bash
# After enabling, verify sandbox is active
openclaw config get sandbox
# Output: all
```

---

### RC-002: Gateway Authentication

**Check**:
```bash
openclaw config get gateway.auth
```

**Expected Value**: `true`

**Why It Matters**: Unauthenticated Gateway connections allow anyone on the network to control your OpenClaw instance.

**How to Fix**:
```bash
# Generate a secure token
TOKEN=$(openssl rand -hex 32)
openclaw config set gateway.auth "$TOKEN"

# Store the token securely for client connections
echo "Gateway Token: $TOKEN" >> ~/.openclaw/gateway-token.txt
chmod 600 ~/.openclaw/gateway-token.txt
```

---

### RC-004: Exec Allowlist Restricted

**Check**:
```bash
openclaw config get exec.allowlist
```

**Expected Value**: Minimal set of required commands only

**Why It Matters**: Overly permissive allowlists enable 28+ known bypass techniques ([see Exec Bypass Vulnerabilities](../vulnerabilities/exec-bypass.md)).

**How to Fix**:
```bash
# Example: restrict to essential commands only
openclaw config set exec.allowlist "git,npm,python3,node"

# Better: disable system.run entirely if not needed
openclaw config set tools.deny "system.run,exec"
```

---

### RC-005: Webhook Secret Verification

**Check**:
```bash
openclaw config get webhook.secret
```

**Expected Value**: Secret token configured

**Why It Matters**: Unverified webhooks allow attackers to forge requests and execute commands.

**How to Fix**:
```bash
# Configure a secret for all webhook endpoints
WEBHOOK_SECRET=$(openssl rand -hex 32)
openclaw config set webhook.secret "$WEBHOOK_SECRET"

# Update your webhook providers (Telegram, Slack, etc.) with this secret
```

---

### RC-007: Prompt Injection Attack Surface

**Check**:
```bash
# Check if both sandbox is OFF and web tools are enabled (dangerous combination)
openclaw config get sandbox
openclaw config get tools.web
```

**Expected Value**: `sandbox=all` OR `tools.web=disabled`

**Why It Matters**: Disabled sandbox + enabled web tools = maximum prompt injection attack surface.

**How to Fix**:
```bash
# Option 1: Enable sandbox (recommended)
openclaw config set sandbox all

# Option 2: Disable web-facing tools
openclaw config set tools.web false
```

---

### RC-010: Human-in-the-Loop Approval

**Check**:
```bash
openclaw config get approvalMode
```

**Expected Value**: `always` or `selective`

**Why It Matters**: Automated approval of sensitive operations (file writes, command execution) enables silent attacks.

**How to Fix**:
```bash
# Require approval for all sensitive operations
openclaw config set approvalMode always

# Or: selective approval for specific operations
openclaw config set approvalMode selective
```

---

### RC-011: Gateway Bind to Loopback Only

**Check**:
```bash
openclaw config get gateway.bind
```

**Expected Value**: `127.0.0.1` or `::1`

**Why It Matters**: Binding to `0.0.0.0` exposes Gateway to the entire network, enabling remote attacks.

**How to Fix**:
```bash
# Bind to loopback only (local connections only)
openclaw config set gateway.bind 127.0.0.1
```

---

### RC-013: CLAUDE.md Integrity (CI/CD)

**Check**:
```bash
# Check if CLAUDE.md or .claude/ has been modified in recent commits
git diff --name-only HEAD~1 | grep -c 'CLAUDE.md\|.claude/'
```

**Expected Value**: `0` (no untrusted changes to instruction files)

**Why It Matters**: Malicious PRs can modify CLAUDE.md to hijack AI agent behavior ([hackerbot-claw campaign](../vulnerabilities/cicd-supply-chain.md)).

**How to Fix**:
```bash
# Add CLAUDE.md to CODEOWNERS (requires GitHub)
echo "CLAUDE.md @your-security-team" >> .github/CODEOWNERS
echo ".claude/ @your-security-team" >> .github/CODEOWNERS

# In GitHub repo settings, enable "Require review from Code Owners"
```

---

### RC-014: GitHub Actions Workflow Safety

**Check**:
```bash
# Check for dangerous pull_request_target pattern
grep -r 'pull_request_target' .github/workflows/
grep -r 'ref.*head' .github/workflows/
```

**Expected Value**: No `pull_request_target` with PR head checkout

**Why It Matters**: `pull_request_target` + untrusted code checkout = write token exposure ([GHSA-gv46, hackerbot-claw](../vulnerabilities/cicd-supply-chain.md)).

**How to Fix**:
```yaml
# BEFORE (dangerous):
on:
  pull_request_target:  # NEVER use this with untrusted checkout
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # DANGER

# AFTER (safe):
on:
  pull_request:  # Use pull_request instead
jobs:
  test:
    permissions:
      contents: read  # Restrict token scope
    steps:
      - uses: actions/checkout@v4  # Safe: checks out PR code with read-only token
```

---

### RC-015: ACP Dispatch Sandbox Inheritance

**Check**:
```bash
openclaw config get acp.dispatch
openclaw --version
```

**Expected Value**: `enabled with sandbox inheritance` AND `>= 2026.3.1`

**Why It Matters**: Without sandbox inheritance, sandboxed agents can spawn unsandboxed child agents ([GHSA-474h, GHSA-p7gr](../vulnerabilities/acp-security.md)).

**How to Fix**:
```bash
# 1. Update to >= 2026.3.1 (enforces sandbox inheritance)
openclaw update

# 2. Verify ACP dispatch configuration
openclaw config get acp.dispatch
# Should show: enabled=true, sandboxInheritance=true
```

---

### RC-016: system.run Approval Binding

**Check**:
```bash
openclaw --version
```

**Expected Value**: `>= 2026.3.8`

**Why It Matters**: Earlier versions allow TOCTOU attacks where executables or script operands are replaced between approval and execution ([GHSA-q399, GHSA-8g75](../vulnerabilities/exec-bypass.md)).

**How to Fix**:
```bash
# Update to >= 2026.3.8
openclaw update
```

---

### RC-018: Gateway UI Auth Leakage

**Check**:
```bash
openclaw --version
```

**Expected Value**: `>= 2026.3.7`

**Why It Matters**: Earlier versions leak Gateway auth tokens via browser URL and localStorage ([GHSA-rchv](https://github.com/openclaw/openclaw/security/advisories/GHSA-rchv-x836-w7xp)).

**How to Fix**:
```bash
# Update to >= 2026.3.7
openclaw update
```

---

### RC-019: sessions_spawn Sandbox Inheritance

**Check**:
```bash
openclaw --version
```

**Expected Value**: `>= 2026.3.2`

**Why It Matters**: Earlier versions allow sandbox bypass via `sessions_spawn` with `runtime='acp'` ([GHSA-474h](../vulnerabilities/acp-security.md)).

**How to Fix**:
```bash
# Update to >= 2026.3.2
openclaw update
```

---

## Medium Priority Checks

### RC-003: DM Pairing Rate Limiting

**Check**:
```bash
openclaw config get dm.rateLimit
```

**Expected Value**: `true`

**How to Fix**:
```bash
# Enable rate limiting for DM pairing (prevents brute-force)
openclaw config set dm.rateLimit true
openclaw config set dm.rateLimit.maxAttempts 5
openclaw config set dm.rateLimit.window 3600  # 1 hour
```

---

### RC-006: Auto-Update Enabled

**Check**:
```bash
openclaw config get autoUpdate
```

**Expected Value**: `true`

**How to Fix**:
```bash
# Enable auto-update for prompt security fixes
openclaw config set autoUpdate true
```

---

### RC-008: Skill External URL Auditing

**Check**:
```bash
# Audit installed skills for external URL fetches
grep -r 'WebFetch\|fetch(' ~/.openclaw/skills/
```

**Expected Value**: No external URL fetches (or all reviewed and trusted)

**Why It Matters**: Skills fetching external URLs can be prompt injection vectors.

**How to Fix**:
```bash
# Review each skill that fetches URLs
# Option 1: Remove untrusted skills
openclaw skills uninstall <skill-name>

# Option 2: Audit and allowlist trusted skills
openclaw config set skills.urlFetchAllowlist "skill-name-1,skill-name-2"
```

---

### RC-009: Tools Deny List

**Check**:
```bash
openclaw config get tools.deny
```

**Expected Value**: Dangerous tools blocked (e.g., `system.run`, `exec`)

**How to Fix**:
```bash
# Block dangerous tools
openclaw config set tools.deny "system.run,exec,eval"
```

---

### RC-012: Untrusted Input Channels

**Check**:
```bash
openclaw config get channels
```

**Expected Value**: No untrusted channels OR all with secret verification

**How to Fix**:
```bash
# For each external channel (Telegram, Slack, webhooks):
# 1. Configure secret verification
openclaw config set channels.telegram.secret "$TELEGRAM_SECRET"
openclaw config set channels.slack.secret "$SLACK_SECRET"

# 2. Enable sender allowlisting
openclaw config set channels.telegram.allowlist "user1,user2"
```

---

### RC-017: DNS Pinning with Proxy

**Check**:
```bash
openclaw config get proxy
openclaw --version
```

**Expected Value**: `>= 2026.3.2` OR no proxy configured

**Why It Matters**: Earlier versions lose DNS pinning when HTTP proxy is configured, enabling SSRF via DNS rebinding ([GHSA-8mvx](https://github.com/openclaw/openclaw/security/advisories/GHSA-8mvx-p2r9-r375)).

**How to Fix**:
```bash
# Update to >= 2026.3.2 if using a proxy
openclaw update
```

---

## Comprehensive Verification

After applying the above hardening steps, run a comprehensive audit:

```bash
# Full security audit (requires >= v2026.3.0)
openclaw security audit --deep

# Expected output:
# ✓ Sandbox: enabled (all)
# ✓ Gateway auth: configured
# ✓ Webhook secrets: configured
# ✓ Exec allowlist: restricted
# ✓ Approval mode: always
# ✓ Version: 2026.3.8 (up-to-date)
# ⚠ 2 medium-priority warnings (see details below)
```

---

## Troubleshooting

### "openclaw security audit" command not found

**Cause**: Running OpenClaw < v2026.3.0

**Solution**:
```bash
openclaw update
```

---

### Sandbox mode breaks my workflows

**Cause**: Sandbox mode restricts filesystem and network access

**Solution**:
```bash
# Option 1: Use selective sandbox mode
openclaw config set sandbox selective
openclaw config set sandbox.allowCommands "git,npm"

# Option 2: Mount specific directories into sandbox
openclaw config set sandbox.mounts "/path/to/project:/workspace"
```

---

### Gateway authentication blocks legitimate clients

**Cause**: Clients not configured with the auth token

**Solution**:
```bash
# On client side, export the token
export OPENCLAW_GATEWAY_TOKEN="your-token-here"

# Or: pass via CLI
openclaw-client --token "your-token-here"
```

---

## Hardening Checklist

Copy this checklist and check off as you complete each step:

```markdown
## Critical (High Severity)
- [ ] RC-001: Sandbox enabled (mode=all)
- [ ] RC-002: Gateway authentication configured
- [ ] RC-004: Exec allowlist minimized
- [ ] RC-005: Webhook secret verification enabled
- [ ] RC-007: Prompt injection attack surface reduced
- [ ] RC-010: Human-in-the-loop approval enabled
- [ ] RC-011: Gateway bound to loopback only
- [ ] RC-013: CLAUDE.md protected via CODEOWNERS
- [ ] RC-014: GitHub Actions workflows safe (no pull_request_target)
- [ ] RC-015: ACP dispatch sandbox inheritance (>= 2026.3.1)
- [ ] RC-016: system.run approval binding (>= 2026.3.8)
- [ ] RC-018: Gateway UI auth leakage fixed (>= 2026.3.7)
- [ ] RC-019: sessions_spawn sandbox inheritance (>= 2026.3.2)

## Medium Priority
- [ ] RC-003: DM pairing rate limiting enabled
- [ ] RC-006: Auto-update enabled
- [ ] RC-008: Skill external URLs audited
- [ ] RC-009: Dangerous tools denied
- [ ] RC-012: Untrusted channels authenticated
- [ ] RC-017: DNS pinning maintained with proxy (>= 2026.3.2)

## Verification
- [ ] Run: openclaw security audit --deep
- [ ] All checks pass or warnings documented
- [ ] Security configuration documented in project README
```

---

## Related Resources

- [Exec Allowlist Bypass Vulnerabilities](../vulnerabilities/exec-bypass.md)
- [ACP Security Vulnerabilities](../vulnerabilities/acp-security.md)
- [CI/CD Supply Chain Vulnerabilities](../vulnerabilities/cicd-supply-chain.md)
- [OWASP LLM Top 10 Mapping](owasp-llm-mapping.md)
- [Channel Security Guide](channel-security.md)

---

**Last Updated**: 2026-03-14
**Database Version**: vulnerability-db.json (2026-03-11, 19 runtime checks)
