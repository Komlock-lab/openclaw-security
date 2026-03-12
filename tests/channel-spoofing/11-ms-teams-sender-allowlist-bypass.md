---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: medium
test_id: TC-CS-011
status: draft
ghsa: GHSA-g7cr-9h7q-4qxq
---

# Test 11: MS Teams Sender Allowlist Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-011 |
| Category | Channel Spoofing |
| Attack Vector | Empty sender allowlist defaults to allow-all |
| Severity | Medium |
| GHSA Reference | [GHSA-g7cr](https://github.com/openclaw/openclaw/security/advisories/GHSA-g7cr-9h7q-4qxq) |
| Fixed In | v2026.2.x |

## Objective

Verify MS Teams empty sender allowlist defaults to deny-all, not allow-all.

## Test Steps

### Step 1: Configure Empty Allowlist

```json
{
  "teams": {
    "senderAllowlist": []
  }
}
```

### Step 2: Send Message from Unauthorized User

```bash
# Send Teams message from non-allowlisted user
# Expected (vulnerable): Accepted
# Expected (secure): Blocked
```

## Expected Results (Secure)

1. **Empty allowlist = deny all**: No access by default
2. **Explicit allowlist required**: Must configure users
