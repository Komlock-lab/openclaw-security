---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: high
test_id: TC-SL-002
status: draft
ghsa: GHSA-p25h-9q54-ffvw
---

# Test 2: Zip Slip Tar Extraction

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-002 |
| Category | Secret Leakage / Path Traversal |
| Attack Vector | Zip Slip during tar extraction |
| Severity | High |
| GHSA Reference | [GHSA-p25h](https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw) |
| Fixed In | v2026.2.x |

## Objective

Verify tar extraction blocks path traversal attacks (Zip Slip).

## Test Steps

### Step 1: Create Malicious Archive

```bash
ln -s ~/.openclaw/.env evil
tar czf malicious.tar.gz --transform='s|evil|../../../.openclaw/.env|' evil
```

### Step 2: Extract Archive

```bash
openclaw extract malicious.tar.gz
```

### Step 3: Check for Path Traversal

```bash
# Check if .env was overwritten
```

## Expected Results (Secure)

1. **Path validation**: `../` paths rejected
2. **Extraction blocked**: Archive rejected

## References

- [GHSA-p25h-9q54-ffvw](https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw)
- [Zip Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability)
