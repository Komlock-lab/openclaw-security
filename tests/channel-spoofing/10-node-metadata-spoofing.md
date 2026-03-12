---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: high
test_id: TC-CS-010
status: draft
ghsa: GHSA-r65x-2hqr-j5hf
---

# Test 10: Node Metadata Spoofing

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-010 |
| Category | Channel Spoofing / Policy Bypass |
| Attack Vector | Platform-based command policy bypass via Node reconnect metadata spoofing |
| Severity | High |
| GHSA Reference | [GHSA-r65x](https://github.com/openclaw/openclaw/security/advisories/GHSA-r65x-2hqr-j5hf) |
| Fixed In | v2026.2.x |

## Objective

Verify node metadata cannot be spoofed to bypass command policies.

## Test Steps

### Step 1: Configure Platform Policy

```json
{
  "policy": {
    "linux": ["git", "ls"],
    "windows": ["git", "dir", "powershell"]
  }
}
```

### Step 2: Spoof Platform Metadata

```bash
# Linux node spoofs as Windows
openclaw node reconnect --platform windows

# Now has access to powershell commands
```

## Expected Results (Secure)

1. **Metadata validation**: Platform verified, not self-reported
2. **Immutable metadata**: Cannot change after registration
