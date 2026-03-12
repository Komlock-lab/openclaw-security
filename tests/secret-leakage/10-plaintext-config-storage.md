---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: low
test_id: TC-SL-010
status: draft
ghsa: null
---

# Test 10: Plaintext Config Storage

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-010 |
| Category | Secret Leakage |
| Attack Technique | Unencrypted secrets in config files |
| Severity | Low (design issue) |

## Objective

Verify OpenClaw supports encrypted secret storage.

## Test Steps

### Step 1: Check Config Files

```bash
cat ~/.openclaw/.env
cat ~/.openclaw/config.json
```

### Step 2: Check for Plaintext Secrets

```bash
grep -r "sk-" ~/.openclaw/
grep -r "password" ~/.openclaw/
```

## Expected Results (Secure)

1. **Encryption available**: `openclaw secrets` command available
2. **Encrypted storage**: Secrets not in plaintext
3. **Documentation**: Clear guidance on secret management

## Mitigation

Use `openclaw secrets` workflow with encryption at rest.

## References

- [OpenClaw Secret Management](https://openclaw.ai/docs/secrets)
