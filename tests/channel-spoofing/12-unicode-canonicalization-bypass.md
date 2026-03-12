---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: medium
test_id: TC-CS-012
status: draft
ghsa: GHSA-392f-ggf5-fp3c
---

# Test 12: Unicode Canonicalization Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-012 |
| Category | Channel Spoofing / Input Sanitization |
| Attack Vector | Unicode normalization drift in policy classification |
| Severity | Medium |
| GHSA Reference | [GHSA-392f](https://github.com/openclaw/openclaw/security/advisories/GHSA-392f-ggf5-fp3c) |
| Fixed In | v2026.2.x |

## Objective

Verify sender allowlist uses consistent Unicode normalization.

## Test Steps

### Step 1: Configure Allowlist with NFC

```json
{
  "allowlist": ["user@example.com"]  // NFC normalized
}
```

### Step 2: Test NFD Variant

```bash
# Send message from user@example.com (NFD normalized)
# Characters look identical but different Unicode
```

## Expected Results (Secure)

1. **Consistent normalization**: All strings normalized to NFC
2. **Bypass blocked**: NFD variant rejected

## Mitigation

```javascript
function normalizeUsername(username) {
  return username.normalize('NFC');
}

function checkAllowlist(username, allowlist) {
  const normalized = normalizeUsername(username);
  return allowlist.includes(normalized);
}
```
