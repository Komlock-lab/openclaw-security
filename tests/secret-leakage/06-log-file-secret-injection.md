---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: medium
test_id: TC-SL-006
status: draft
ghsa: null
---

# Test 6: Log File Secret Injection

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-006 |
| Category | Secret Leakage |
| Attack Technique | Logging user input containing secrets |
| Severity | Medium |

## Objective

Verify user input is sanitized before logging to prevent secret leakage.

## Test Steps

### Step 1: Send Message with Fake Secret

```bash
User: "My API key is sk-1234567890abcdef"
```

### Step 2: Check Logs

```bash
grep "sk-1234567890" ~/.openclaw/logs/openclaw.log
```

## Expected Results (Secure)

1. **Secrets redacted**: API keys not logged
2. **Pattern matching**: Common secret patterns detected

## Mitigation

Use `.secrets.baseline` and detect-secrets tool.
