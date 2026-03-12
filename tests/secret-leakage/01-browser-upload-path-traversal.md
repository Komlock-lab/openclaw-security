---
date: 2026-03-13
category: test-cases
subcategory: secret-leakage
severity: high
test_id: TC-SL-001
status: draft
ghsa: GHSA-cv7m-c9jx-vg7q
---

# Test 1: Browser Upload Path Traversal

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SL-001 |
| Category | Secret Leakage / File Read |
| Attack Vector | Path traversal in browser file upload |
| Severity | High |
| GHSA Reference | [GHSA-cv7m](https://github.com/openclaw/openclaw/security/advisories/GHSA-cv7m-c9jx-vg7q) |
| Fixed In | v2026.2.x |

## Objective

Verify browser upload feature validates file paths to prevent reading arbitrary files.

## Test Steps

### Step 1: Upload File with Path Traversal

```javascript
// In browser
const input = document.createElement('input');
input.type = 'file';
input.value = '../../../../etc/passwd';
```

### Step 2: Check if File Read

```bash
# Check workspace for uploaded file content
cat ~/.openclaw/workspace/uploads/passwd
```

## Expected Results (Secure)

1. **Path validation**: `../` paths rejected
2. **File not uploaded**: Traversal blocked

## References

- [GHSA-cv7m-c9jx-vg7q](https://github.com/openclaw/openclaw/security/advisories/GHSA-cv7m-c9jx-vg7q)
