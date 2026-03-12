---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: high
test_id: TC-CS-004
status: draft
ghsa: GHSA-vvjh-f6p9-5vcf
---

# Test 4: Canvas Authentication Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-004 |
| Category | Channel Spoofing / Authorization Bypass |
| Attack Vector | Canvas channel authentication bypass |
| Severity | High |
| GHSA Reference | [GHSA-vvjh](https://github.com/openclaw/openclaw/security/advisories/GHSA-vvjh-f6p9-5vcf) |
| ZDI | ZDI-CAN-29311 |
| Fixed In | v2026.2.x |

## Objective

Verify Canvas channel properly authenticates requests.

## Test Steps

### Step 1: Access Canvas Without Auth

```bash
curl http://localhost:3000/canvas/webhook \
  -d '{"action": "execute", "command": "ls"}'
```

### Step 2: Test Bypass Techniques

```bash
# Missing auth header
# Forged auth token
# Empty credentials
```

## Expected Results (Secure)

1. **Authentication required**: All Canvas requests authenticated
2. **Token validation**: Invalid tokens rejected

## Mitigation

See [Channel Auth Bypass Patterns](../../knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md)
