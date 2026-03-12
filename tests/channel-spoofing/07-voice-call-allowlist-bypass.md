---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: critical
test_id: TC-CS-007
status: draft
ghsa: GHSA-4rj2-gpmh-qq5x
---

# Test 7: voice-call Allowlist Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-007 |
| Category | Channel Spoofing |
| Attack Vector | Empty caller ID + suffix matching bypass |
| Severity | Critical |
| GHSA Reference | [GHSA-4rj2](https://github.com/openclaw/openclaw/security/advisories/GHSA-4rj2-gpmh-qq5x) |
| Fixed In | v2026.2.2 |

## Objective

Verify voice-call extension properly validates caller ID allowlist, preventing empty caller ID bypass.

## Vulnerability Description

Empty caller ID (`""`) matched any suffix in allowlist, bypassing all restrictions.

## Test Steps

### Step 1: Configure Allowlist

```json
{
  "voiceCall": {
    "allowlist": ["+1234567890"]
  }
}
```

### Step 2: Call with Empty Caller ID

```bash
# Spoof caller ID as empty
twilio call --from "" --to openclaw-number
```

### Step 3: Call with Blocked Number

```bash
twilio call --from "+9999999999" --to openclaw-number
# Expected: Blocked (not in allowlist)
```

## Expected Results (Secure)

1. **Empty ID blocked**: Empty caller ID rejected
2. **Exact matching**: Only exact allowlist matches accepted
3. **No suffix matching**: Partial matches rejected

## Mitigation

```javascript
function validateCallerID(callerID, allowlist) {
  if (!callerID || callerID === '') {
    throw new Error('Empty caller ID not allowed');
  }

  if (!allowlist.includes(callerID)) {
    throw new Error('Caller not in allowlist');
  }
}
```
