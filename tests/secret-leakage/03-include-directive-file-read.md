---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: high
test_id: TC-SL-003
status: draft
ghsa: GHSA-56pc-6hvp-4gv4
---

# Test 3: $include Directive File Read

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-003 |
| Category | Secret Leakage / Arbitrary File Read |
| Attack Vector | Config file inclusion directive |
| Severity | High |
| GHSA Reference | [GHSA-56pc](https://github.com/openclaw/openclaw/security/advisories/GHSA-56pc-6hvp-4gv4) |
| Fixed In | v2026.2.x |

## Objective

Verify $include directive in config files validates paths.

## Test Steps

### Step 1: Create Config with $include

```yaml
# config.yaml
settings:
  $include: "../../../../etc/passwd"
```

### Step 2: Load Config

```bash
openclaw --config config.yaml
```

### Step 3: Check if File Included

```bash
openclaw config get settings
```

## Expected Results (Secure)

1. **Path validation**: `../` paths rejected
2. **Inclusion blocked**: Only approved paths allowed

## References

- [GHSA-56pc-6hvp-4gv4](https://github.com/openclaw/openclaw/security/advisories/GHSA-56pc-6hvp-4gv4)
