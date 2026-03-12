---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: high
test_id: TC-SL-008
status: draft
ghsa: GHSA-rchv-x836-w7xp
---

# Test 8: Gateway UI localStorage Leakage

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-008 |
| Category | Secret Leakage |
| Attack Vector | Gateway auth material in browser localStorage |
| Severity | High |
| GHSA Reference | [GHSA-rchv](https://github.com/openclaw/openclaw/security/advisories/GHSA-rchv-x836-w7xp) |
| Fixed In | v2026.3.x |

## Objective

Verify gateway dashboard doesn't store auth tokens in localStorage.

## Test Steps

### Step 1: Open Dashboard

```bash
open http://localhost:3000/dashboard
```

### Step 2: Check localStorage

```javascript
// In browser console
console.log(localStorage.getItem('gateway_token'));
console.log(localStorage.getItem('auth_token'));
```

## Expected Results (Secure)

1. **No tokens in localStorage**: Auth in httpOnly cookies
2. **Session-only storage**: Use sessionStorage not localStorage

## References

- [GHSA-rchv-x836-w7xp](https://github.com/openclaw/openclaw/security/advisories/GHSA-rchv-x836-w7xp)
