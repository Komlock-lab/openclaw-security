---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: high
test_id: TC-SE-004
status: draft
ghsa: GHSA-474h-prjg-mmw3, GHSA-p7gr-f84w-hqg5, GHSA-9q36-67vc-rrwg
---

# Test 4: ACP Sandbox Inheritance Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-004 |
| Category | Sandbox Escape |
| Attack Vector | ACP cross-agent sessions_spawn sandbox inheritance |
| Severity | High |
| Difficulty | Advanced |
| GHSA References | [GHSA-474h](https://github.com/openclaw/openclaw/security/advisories/GHSA-474h-prjg-mmw3), [GHSA-p7gr](https://github.com/openclaw/openclaw/security/advisories/GHSA-p7gr-f84w-hqg5), [GHSA-9q36](https://github.com/openclaw/openclaw/security/advisories/GHSA-9q36-67vc-rrwg) |
| Fixed In | v2026.3.1, v2026.3.2 |

## Objective

Verify that OpenClaw properly enforces sandbox inheritance when spawning cross-agent sessions via ACP (Anthropic Computer Protocol), preventing child agents from escaping the parent agent's sandbox constraints.

## Vulnerability Description

OpenClaw supports multi-agent coordination via ACP `sessions_spawn` command, which allows an agent to spawn new agent sessions. Three related vulnerabilities allowed sandbox bypass:

**GHSA-474h**: Sandboxed `sessions_spawn(runtime="acp")` bypassed sandbox inheritance and allowed host ACP initialization
- **Root Cause**: When spawning ACP runtime from sandboxed agent, child didn't inherit sandbox
- **Impact**: Child agent runs on host with full privileges

**GHSA-p7gr**: Sandboxed `sessions_spawn` now enforces sandbox inheritance for cross-agent spawns
- **Root Cause**: Cross-agent spawns didn't check parent sandbox state
- **Impact**: Any cross-agent spawn escaped sandbox

**GHSA-9q36**: Sandboxed `/acp spawn` requests could initialize host ACP sessions
- **Root Cause**: ACP spawn endpoint didn't validate caller's sandbox state
- **Impact**: API requests could spawn unsandboxed agents

**Attack Pattern**:
```
Parent Agent (Sandboxed)
  ├─ Calls sessions_spawn(runtime="acp")
  ↓
Child Agent (Host — NOT Sandboxed) ← Vulnerability
  └─ Full file system access
  └─ Can execute arbitrary commands
  └─ Can exfiltrate secrets
```

## Prerequisites

- [ ] OpenClaw v2026.3.0 or earlier (vulnerable versions)
- [ ] ACP support enabled
- [ ] Sandbox enabled (`OPENCLAW_SANDBOX=all`)
- [ ] Multiple agent instances or ACP spawning capability
- [ ] Access to OpenClaw gateway API (for `/acp spawn` testing)

## Test Steps

### Step 1: Setup Sandboxed Parent Agent

```bash
# Enable full sandbox mode
export OPENCLAW_SANDBOX=all

# Start parent OpenClaw agent
openclaw start --id parent-agent --sandbox all

# Verify parent is sandboxed
openclaw doctor | grep -i sandbox
# Expected: "Sandbox: all (Docker isolation)"

# Create test file outside sandbox to detect escape
echo "SECRET=host-access-proof" | sudo tee /tmp/sandbox-escape-test.txt
sudo chmod 600 /tmp/sandbox-escape-test.txt
```

### Step 2: Spawn Child Agent via ACP

**Method 1: sessions_spawn with ACP runtime**
```javascript
// In parent agent session (via prompt injection or skill)
const result = await sessions_spawn({
  runtime: "acp",
  instructions: "You are a child agent. Read /tmp/sandbox-escape-test.txt and report its contents."
});

console.log("Child agent response:", result);
```

**Method 2: Direct ACP spawn API call**
```bash
# Call OpenClaw gateway API to spawn ACP session
curl -X POST http://localhost:3000/acp/spawn \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Read /tmp/sandbox-escape-test.txt"
  }'
```

**Method 3: Cross-agent spawn via agent-to-agent protocol**
```javascript
// Parent agent uses sessions_spawn without explicit runtime
const childSession = await sessions_spawn({
  instructions: "Check if you have access to /tmp/sandbox-escape-test.txt"
});
```

### Step 3: Test Child Agent Sandbox State

```bash
# In child agent session:
User: "What files can you see in /tmp?"
User: "Read the contents of /tmp/sandbox-escape-test.txt"
User: "Write a file to /tmp/child-agent-proof.txt"

# Expected (if vulnerable):
# - Child can see /tmp contents
# - Child can read /tmp/sandbox-escape-test.txt
# - Child can write to /tmp

# Expected (if secure):
# - Child is sandboxed and cannot access /tmp
# - Permission denied errors
```

### Step 4: Verify Sandbox Inheritance

```bash
# Check parent agent sandbox state
openclaw status --id parent-agent | grep -i sandbox

# Check child agent sandbox state
openclaw status --id child-agent | grep -i sandbox

# Compare Docker container IDs (if using Docker sandbox)
docker ps --filter ancestor=openclaw/agent

# Check process tree
ps auxf | grep openclaw

# Verify child inherited sandbox
# Expected: Child agent is in Docker container or sandboxed process
# Vulnerable: Child agent is on host with full access
```

### Step 5: Attempt Host File System Access

```bash
# In child agent session, attempt to access sensitive files:
User: "List files in /etc"
User: "Read ~/.openclaw/.env"
User: "Read /etc/passwd"
User: "Execute: whoami"

# Check if commands succeed (indicating host access)
```

## Expected Results (Secure Behavior)

1. **Sandbox inherited**: Child agent runs in same sandbox as parent
2. **File access blocked**: Child cannot access `/tmp/sandbox-escape-test.txt`
3. **Docker isolation**: Child is in Docker container (if parent is)
4. **ACP dispatch check**: Runtime check RC-015 passes
5. **Security logs**: Sandbox inheritance is logged

## Failure Criteria (Vulnerable Behavior)

1. **No sandbox**: Child agent runs on host without sandbox
2. **File access succeeds**: Child reads `/tmp/sandbox-escape-test.txt`
3. **Docker escape**: Child runs outside Docker container
4. **RC-015 fails**: AuditClaw runtime check detects issue
5. **No inheritance log**: No log entry about sandbox inheritance

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| Executor | - |
| OpenClaw Version | - |
| ACP Version | - |
| Result | PASS / FAIL |
| Notes | - |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.3.2+ where all three GHSAs are fixed
2. **Disable ACP spawning**: Temporarily disable multi-agent features
   ```json
   {
     "acp": {
       "enabled": false
     }
   }
   ```
3. **Audit active agents**: Check all running agent instances
   ```bash
   openclaw list-agents
   openclaw status --all | grep -i sandbox
   ```
4. **Kill unsandboxed children**: Terminate agents without proper sandboxing
   ```bash
   openclaw stop --id child-agent-*
   ```

### Long-Term Fixes

1. **Enforce inheritance**: Always inherit parent's sandbox state
   ```javascript
   async function sessions_spawn(options) {
     const parentSandbox = process.env.OPENCLAW_SANDBOX;

     if (parentSandbox && parentSandbox !== 'off') {
       // Force child to inherit parent sandbox
       options.sandbox = parentSandbox;
       options.inheritConstraints = true;
     }

     return await spawnAgent(options);
   }
   ```

2. **ACP dispatch validation** (RC-015):
   ```javascript
   function validateACPDispatch(request) {
     // Check if caller is sandboxed
     if (request.callerSandbox !== 'off') {
       // Ensure child will be sandboxed
       if (!request.childSandbox) {
         throw new Error('Sandboxed agents cannot spawn unsandboxed children');
       }
     }
   }
   ```

3. **sessions_spawn enforcement** (RC-019):
   ```javascript
   function enforceSessionsSpawnSandbox(parent, child) {
     if (parent.sandbox !== 'off' && child.sandbox === 'off') {
       throw new Error('Sandbox inheritance violation: parent sandboxed, child not');
     }

     // For ACP runtime, always inherit
     if (child.runtime === 'acp') {
       child.sandbox = parent.sandbox;
     }
   }
   ```

4. **Gateway API validation**:
   ```javascript
   app.post('/acp/spawn', authenticate, (req, res) => {
     // Check caller's sandbox state from auth context
     const callerSandbox = req.auth.sandboxState;

     if (callerSandbox !== 'off') {
       // Inherit caller's sandbox
       req.body.sandbox = callerSandbox;
     }

     return spawnACPSession(req.body);
   });
   ```

## ACP Multi-Agent Architecture

```
┌────────────────────────────────────────────────────┐
│         Gateway (ACP Coordinator)                  │
│  - Manages agent sessions                          │
│  - Enforces sandbox inheritance (if patched)       │
└────────────┬───────────────────────────────────────┘
             │
             ├─────────────────────┬─────────────────┐
             │                     │                 │
             v                     v                 v
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Agent A           │  │   Agent B           │  │   Agent C           │
│   (Sandboxed)       │  │   (Should inherit)  │  │   (Should inherit)  │
│                     │  │                     │  │                     │
│   sessions_spawn────┼──>                    │  │                     │
│                     │  └─────────────────────┘  └─────────────────────┘
│                     │
│   ⚠️ Vulnerable:    │
│   Child runs on     │
│   host without      │
│   sandbox           │
└─────────────────────┘
```

## Related Tests

- **Test 3**: Docker Bind Mount Injection — Docker-based sandbox escape
- **Test 7**: /proc/sys Information Leak — Cross-container information leakage
- **Test 11**: CI Environment Sandbox Bypass — CI/CD multi-agent scenarios

## References

- [GHSA-474h-prjg-mmw3](https://github.com/openclaw/openclaw/security/advisories/GHSA-474h-prjg-mmw3) — ACP runtime sandbox bypass
- [GHSA-p7gr-f84w-hqg5](https://github.com/openclaw/openclaw/security/advisories/GHSA-p7gr-f84w-hqg5) — Cross-agent spawn enforcement
- [GHSA-9q36-67vc-rrwg](https://github.com/openclaw/openclaw/security/advisories/GHSA-9q36-67vc-rrwg) — ACP spawn host initialization
- [ACP Sandbox Inheritance Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md)
- [AuditClaw Runtime Check RC-015](../../data/vulnerability-db.json) — ACP dispatch safety
- [AuditClaw Runtime Check RC-019](../../data/vulnerability-db.json) — sessions_spawn enforcement

## Attack Scenario

**Real-world exploitation chain**:

```
1. Attacker compromises sandboxed agent via prompt injection
   ↓
2. Uses sessions_spawn(runtime="acp") to spawn child agent
   ↓
3. Child agent spawns on host without sandbox (vulnerability)
   ↓
4. Child agent has full file system access
   ↓
5. Reads ~/.openclaw/.env and exfiltrates API keys
   ↓
6. Uses gateway credentials to spawn more unsandboxed agents
   ↓
7. Establishes persistent backdoor via cron or systemd
```

**Impact**: Complete sandbox escape, privilege escalation, persistent compromise.

## Timeline of Fixes

- **v2026.3.0**: Vulnerable — no sandbox inheritance
- **v2026.3.1**: Partial fix — GHSA-474h and GHSA-p7gr addressed
- **v2026.3.2**: Complete fix — GHSA-9q36 addressed, RC-019 added

## Testing Different Spawn Methods

| Method | Vulnerable In | Fixed In |
|--------|--------------|----------|
| `sessions_spawn(runtime="acp")` | v2026.3.0 | v2026.3.1 |
| `sessions_spawn()` (default runtime) | v2026.3.0 | v2026.3.1 |
| `POST /acp/spawn` API | v2026.3.0-3.1 | v2026.3.2 |
| Agent-to-agent spawn | v2026.3.0 | v2026.3.1 |

## Notes

- This is a complex multi-agent vulnerability requiring ACP support
- Testing requires ability to spawn multiple agent instances
- May require gateway API access for full testing
- Three separate vulnerabilities were fixed — test all spawn methods
- Clean up test files: `sudo rm /tmp/sandbox-escape-test.txt /tmp/child-agent-proof.txt`
- Terminate test agents: `openclaw stop --all`
