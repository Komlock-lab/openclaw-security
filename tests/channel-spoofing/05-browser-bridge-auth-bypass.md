---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: high
test_id: TC-CS-005
status: draft
ghsa: GHSA-h9g4-589h-68xv
---

# Test 5: Browser Bridge Server Auth Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-005 |
| Category | Channel Spoofing |
| Attack Vector | Sandbox browser bridge authentication bypass |
| Severity | High |
| GHSA Reference | [GHSA-h9g4](https://github.com/openclaw/openclaw/security/advisories/GHSA-h9g4-589h-68xv) |
| Fixed In | v2026.2.x |

## Objective

Verify browser bridge server requires authentication for all operations.

## Test Steps

### Step 1: Access Bridge Without Auth

```bash
curl http://localhost:9222/json
curl http://localhost:9222/devtools/page/...
```

### Step 2: Test WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:9222/devtools/browser');
// Should require auth
```

## Expected Results (Secure)

1. **Authentication required**: All bridge endpoints protected
2. **localhost-only**: Bind to localhost, not 0.0.0.0
