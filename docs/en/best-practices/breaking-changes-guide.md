# Breaking Changes Guide - v2026.3.x

## Overview

The OpenClaw v2026.3.x series introduces several **breaking changes** to address critical security vulnerabilities. This guide helps you understand and migrate to the new behavior.

**Target Audience**: System administrators, DevOps engineers, security teams

**Upgrade Path**: v2026.2.x → v2026.3.8 (latest)

## Summary of Breaking Changes

| Change | Impact | Migration Difficulty |
|--------|--------|---------------------|
| Sandbox Inheritance Enforcement | High | Medium |
| Exec Approval Binding | Medium | Low |
| Empty Allowlist Fail-Closed | High | Low |
| Gateway Auth Material Storage | Low | Low |

---

## 1. Sandbox Inheritance Enforcement

### What Changed

**Before v2026.3.1**: `sessions_spawn(runtime="acp")` in sandboxed mode could initialize host ACP sessions, bypassing sandbox.

**After v2026.3.2**: All `sessions_spawn` calls from sandboxed agents **must** inherit sandbox configuration. Host ACP initialization is blocked.

### Why This Changed

**Security Issue**: GHSA-474h-prjg-mmw3, GHSA-p7gr-f84w-hqg5, GHSA-9q36-67vc-rrwg

Sandboxed agents could escape isolation by spawning non-sandboxed ACP sessions, gaining unrestricted host access.

### Impact on Your Deployment

**High Impact** if you:
- Use multi-agent coordination with `sessions_spawn`
- Rely on spawned agents having different sandbox settings
- Have automation that expects spawned agents to run on host

**Example of Breaking Code**:
```javascript
// In sandboxed agent (OPENCLAW_SANDBOX=all)
const childSession = await sessions_spawn({
  runtime: "acp",
  prompt: "Analyze this file"
});
// Before: childSession runs on host (no sandbox) ❌
// After: childSession inherits sandbox ✅
```

### Migration Steps

#### Step 1: Audit Your sessions_spawn Calls

```bash
# Find all sessions_spawn usage
grep -r "sessions_spawn" --include="*.js" --include="*.ts"

# Check if any rely on non-sandboxed spawns
```

#### Step 2: Update Spawn Configuration

If you need host access for specific spawned sessions:

```javascript
// Option A: Run parent agent without sandbox
// Set OPENCLAW_SANDBOX=non-main or off for specific workflows

// Option B: Use explicit permissions
const childSession = await sessions_spawn({
  runtime: "acp",
  prompt: "Task requiring host access",
  // Document why host access is needed
  // Consider security implications
});
```

#### Step 3: Test Multi-Agent Workflows

```bash
# Test in staging with OPENCLAW_SANDBOX=all
export OPENCLAW_SANDBOX=all
openclaw run your-multi-agent-workflow.js

# Verify spawned agents respect sandbox
```

---

## 2. Exec Approval Binding

### What Changed

**Before v2026.3.1**: `system.run` approvals did not bind:
- PATH-resolved executable identity
- Script file content (for mutable scripts)

Attackers could modify PATH or script content after approval but before execution.

**After v2026.3.1**: Approvals bind:
- Full executable path (not just command name)
- Script content hash (for file-based scripts)

### Why This Changed

**Security Issue**: GHSA-q399-23r3-hfx4, GHSA-8g75-q649-6pv6

### Impact on Your Deployment

**Medium Impact** if you:
- Use `system.run` with approval workflows
- Dynamically modify PATH between approval and execution
- Edit scripts after approval

**Example of Breaking Behavior**:
```javascript
// 1. User approves: system.run("node", ["script.js"])
// Approval binds: /usr/bin/node + hash(script.js)

// 2. Attacker modifies script.js
// Before: Executes modified script ❌
// After: Approval rejected - content hash mismatch ✅

// 3. Attacker modifies PATH to include malicious 'node'
// Before: Executes /tmp/evil/node ❌
// After: Approval rejected - path mismatch ✅
```

### Migration Steps

#### Step 1: No Action Required (Most Cases)

If you don't modify PATH or scripts between approval and execution, **no changes needed**.

#### Step 2: Update Workflows That Modify Scripts

If you legitimately edit scripts between approval and execution:

```javascript
// ❌ Old pattern (now fails)
// 1. Request approval
const approval = await requestApproval("node", ["script.js"]);

// 2. Modify script (e.g., add logging)
fs.writeFileSync("script.js", updatedContent);

// 3. Execute (FAILS - content hash mismatch)
await system.run("node", ["script.js"], { approval });

// ✅ New pattern
// Request approval AFTER finalizing script
const updatedContent = addLogging(originalContent);
fs.writeFileSync("script.js", updatedContent);

const approval = await requestApproval("node", ["script.js"]);
await system.run("node", ["script.js"], { approval });
```

#### Step 3: Avoid PATH Manipulation

```javascript
// ❌ Don't do this
process.env.PATH = "/custom/bin:" + process.env.PATH;
await system.run("mycommand"); // May fail approval

// ✅ Use absolute paths
await system.run("/usr/local/bin/mycommand");
```

---

## 3. Empty Allowlist Fail-Closed

### What Changed

**Before v2026.3.2**: Empty `allowFrom` or `allowedUserIds` arrays were sometimes interpreted as "allow all".

**After v2026.3.8**: Empty allowlists **always** deny access (fail-closed).

### Why This Changed

**Security Issue**: GHSA-g7cr-9h7q-4qxq, GHSA-gw85-xp4q-5gp9

Empty allowlists created unintended access for unauthenticated users.

### Impact on Your Deployment

**High Impact** if you:
- Have channels with empty `allowFrom` or `allowedUserIds`
- Relied on empty lists for "allow all" behavior
- Use route-level allowlists without sender-level allowlists

**Example of Breaking Configuration**:
```yaml
# Before: Empty allowlist allowed all senders ❌
channels:
  teams:
    allowFrom: []  # Was interpreted as "allow all"

# After: Empty allowlist denies all ✅
# Must explicitly configure allowlist
channels:
  teams:
    allowFrom:
      - sender: "alice@example.com"
      - sender: "bob@example.com"
```

### Migration Steps

#### Step 1: Audit All Channel Configurations

```bash
# Find channels with empty allowlists
openclaw channels list --show-allowlists | grep -A 5 "allowFrom: \[\]"
```

#### Step 2: Add Explicit Allowlists

```yaml
# ❌ Breaking config
channels:
  discord:
    allowFrom: []

# ✅ Fixed config (option 1: specific users)
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"
      - user_id: "987654321098765432"

# ✅ Fixed config (option 2: open DMs via pairing)
channels:
  discord:
    dmPolicy: paired  # Require pairing for DMs
    # Group channels still need allowFrom
```

#### Step 3: Test Access Controls

```bash
# Test with unauthorized account
# Should be denied after upgrade

# Test with authorized account
# Should still work
```

---

## 4. Gateway Auth Material Storage

### What Changed

**Before v2026.3.7**: Dashboard stored gateway auth tokens in browser `localStorage` and URL query parameters.

**After v2026.3.7**: Auth material removed from browser storage and URLs (stored in secure HTTP-only cookies or server-side sessions).

### Why This Changed

**Security Issue**: GHSA-rchv-x836-w7xp

Auth tokens in browser storage are vulnerable to XSS attacks and browser extensions.

### Impact on Your Deployment

**Low Impact**: Automatic migration on first dashboard access after upgrade.

### Migration Steps

#### Step 1: Clear Browser Storage (Optional)

```javascript
// Clear old auth tokens from browser
localStorage.removeItem('gateway_auth_token');
sessionStorage.removeItem('gateway_auth_token');
```

#### Step 2: Update Custom Dashboard Integrations

If you have custom code accessing gateway auth:

```javascript
// ❌ Old code (no longer works)
const token = localStorage.getItem('gateway_auth_token');

// ✅ New code (token handled by server)
// No client-side token access needed
// Auth automatically included in requests via HTTP-only cookies
```

---

## Verification Checklist

After upgrading to v2026.3.8, verify the following:

### Sandbox Configuration

```bash
# ✅ Verify sandbox enabled
export OPENCLAW_SANDBOX=all
openclaw --version

# ✅ Test sessions_spawn inherits sandbox
# Create test script that spawns child session
# Verify child cannot access host files
```

### Exec Approvals

```bash
# ✅ Test approval binding
# 1. Request approval for command
# 2. Attempt to modify PATH
# 3. Execute command - should fail with "approval invalid"

# ✅ Test script hash binding
# 1. Request approval for script
# 2. Modify script content
# 3. Execute - should fail with "content mismatch"
```

### Allowlist Configuration

```bash
# ✅ Audit all channels
openclaw channels audit --check empty-allowlist

# ✅ Test unauthorized access
# Attempt access from unlisted sender - should be denied

# ✅ Test authorized access
# Attempt access from allowlisted sender - should work
```

### Gateway Auth

```bash
# ✅ Dashboard login
# Verify can still login to dashboard
# Check browser devtools - no auth tokens in localStorage

# ✅ Gateway API calls
# Verify API calls still authenticated
# Auth should be via HTTP-only cookies
```

---

## Rollback Instructions (Emergency Only)

If you encounter critical issues and must rollback:

```bash
# ⚠️ WARNING: Rollback exposes security vulnerabilities
# Only rollback if absolutely necessary

# 1. Downgrade to v2026.2.x
npm install -g openclaw@2026.2.26

# 2. Restart OpenClaw
systemctl restart openclaw

# 3. Monitor logs
tail -f /var/log/openclaw/openclaw.log

# 4. Plan immediate re-upgrade with proper configuration
```

**Do not remain on v2026.2.x** - it contains critical vulnerabilities.

---

## Support Resources

- **Migration Issues**: Open issue at https://github.com/openclaw/openclaw/issues
- **Security Questions**: Contact security@openclaw.ai
- **Related Guides**:
  - [Hardening Guide](./hardening-guide.md)
  - [Channel Security](./channel-security.md)
  - [v2026.3.x Changelog](../updates/v2026.3.x-changelog.md)

## References

- **GHSA-474h-prjg-mmw3**: Sandbox inheritance bypass
- **GHSA-q399-23r3-hfx4**: Exec approval PATH binding
- **GHSA-g7cr-9h7q-4qxq**: Empty allowlist fail-open
- **GHSA-rchv-x836-w7xp**: Gateway auth material leakage
