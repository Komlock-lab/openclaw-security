---
date: 2026-03-13
category: test-cases
subcategory: agent-hijack
severity: critical
test_id: TC-AH-005
status: draft
ghsa: GHSA-gv46-4xfq-jv58
---

# Test 5: Gateway Node Invoke Approval Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-AH-005 |
| Category | Agent Hijack / RCE |
| Attack Vector | Gateway Node Invoke approval workflow bypass |
| Severity | Critical |
| Difficulty | Critical |
| GHSA Reference | [GHSA-gv46](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58) |
| Fixed In | v2026.2.14 |

## Objective

Verify that OpenClaw's Gateway Node Invoke feature properly enforces user approval for remote command execution.

## Vulnerability Description

Gateway Node Invoke allows executing commands on remote nodes. The approval workflow had a bypass:
1. User approves `node1:command1`
2. Attacker substitutes `node2:command2` with same approval ID
3. `command2` executes without new approval

## Test Steps

### Step 1: Request Node Invoke Approval

```bash
# Request approval for benign command
openclaw gateway node-invoke node1 "git status"

# Approval ID: ABC123
```

### Step 2: Substitute Malicious Command

```javascript
// After approval, send different command with same ID
gatewayApi.nodeInvoke({
  approvalId: 'ABC123',
  node: 'node1',
  command: 'cat /etc/passwd'  // Different command
});
```

### Step 3: Verify Command Execution

```bash
# Check if malicious command executed
# Check gateway logs for executed commands
grep "node-invoke.*ABC123" ~/.openclaw/logs/gateway.log
```

## Expected Results (Secure)

1. **Approval binds command**: Approval ID tied to specific command
2. **Substitution blocked**: Different command rejected
3. **New approval required**: Must approve each distinct command

## Mitigation

```javascript
function validateNodeInvokeApproval(request) {
  const approval = getApproval(request.approvalId);

  // Verify command matches approved command
  if (approval.command !== request.command) {
    throw new Error('Command does not match approval');
  }

  // Verify node matches
  if (approval.node !== request.node) {
    throw new Error('Node does not match approval');
  }
}
```

## References

- [GHSA-gv46-4xfq-jv58](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58)

## Notes

- Critical severity — remote code execution
- Similar to Test 9 (system.run approval bypass)
