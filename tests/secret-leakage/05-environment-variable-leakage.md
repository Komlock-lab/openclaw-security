---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: medium
test_id: TC-SL-005
status: draft
ghsa: null
---

# Test 5: Environment Variable Leakage

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-005 |
| Category | Secret Leakage / Information Disclosure |
| Attack Technique | Process environment exposure |
| Severity | Medium |

## Objective

Verify OpenClaw doesn't leak environment variables in error messages or logs.

## Test Steps

### Step 1: Trigger Error with Environment

```bash
export SECRET_KEY="sk-1234567890"
openclaw command-that-fails
```

### Step 2: Check Error Output

```bash
# Error should NOT contain SECRET_KEY
```

### Step 3: Check Logs

```bash
grep "SECRET_KEY" ~/.openclaw/logs/*.log
```

## Expected Results (Secure)

1. **Env vars redacted**: Secrets not in error messages
2. **Logs sanitized**: Environment not logged

## Mitigation

```javascript
const REDACT_PATTERNS = [/sk-[a-zA-Z0-9]+/, /^AWS_/];

function sanitizeError(error) {
  let message = error.message;
  for (const pattern of REDACT_PATTERNS) {
    message = message.replace(pattern, '[REDACTED]');
  }
  return message;
}
```
