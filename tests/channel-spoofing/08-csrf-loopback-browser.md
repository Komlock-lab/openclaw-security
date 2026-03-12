---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: high
test_id: TC-CS-008
status: draft
ghsa: GHSA-3fqr-4cg8-h96q
---

# Test 8: CSRF via Loopback Browser

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-008 |
| Category | Channel Spoofing / CSRF |
| Attack Vector | CSRF on loopback browser endpoint |
| Severity | High |
| GHSA Reference | [GHSA-3fqr](https://github.com/openclaw/openclaw/security/advisories/GHSA-3fqr-4cg8-h96q) |
| Fixed In | v2026.2.x |

## Objective

Verify browser endpoints use CSRF tokens to prevent cross-site attacks.

## Test Steps

### Step 1: Create Malicious Page

```html
<!-- attacker.com/csrf.html -->
<form action="http://localhost:3000/browser/execute" method="POST">
  <input name="command" value="cat ~/.openclaw/.env">
</form>
<script>document.forms[0].submit();</script>
```

### Step 2: Visit Malicious Page

```bash
# User visits attacker.com/csrf.html
# Form auto-submits to localhost:3000
```

## Expected Results (Secure)

1. **CSRF token required**: Requests without token rejected
2. **SameSite cookies**: Cookie protection enabled
3. **Origin validation**: Cross-origin requests blocked
