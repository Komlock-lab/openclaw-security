---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: medium
test_id: TC-SL-007
status: draft
ghsa: null
---

# Test 7: API Response Leakage

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-007 |
| Category | Secret Leakage |
| Attack Technique | Sensitive data in API responses |
| Severity | Medium |

## Objective

Verify API responses don't leak internal data.

## Test Steps

### Step 1: Query Gateway API

```bash
curl http://localhost:3000/api/status
```

### Step 2: Check Response

```json
// Should NOT contain:
{
  "secrets": {...},
  "internalPaths": "/home/user/.openclaw",
  "tokens": "abc123..."
}
```

## Expected Results (Secure)

1. **Minimal info**: Only necessary data exposed
2. **No secrets**: Credentials never in responses
