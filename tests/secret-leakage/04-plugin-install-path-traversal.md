---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: critical
test_id: TC-SL-004
status: draft
ghsa: GHSA-qrq5-wjgg-rvqw
---

# Test 4: Plugin Install Path Traversal

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-004 |
| Category | Secret Leakage / Path Traversal |
| Attack Vector | Path traversal during plugin installation |
| Severity | Critical |
| GHSA Reference | [GHSA-qrq5](https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw) |
| Fixed In | v2026.2.1 |

## Objective

Verify plugin installation blocks path traversal (see sandbox-escape Test 12).

## References

- [sandbox-escape Test 12](../sandbox-escape/12-plugin-install-path-traversal.md)
