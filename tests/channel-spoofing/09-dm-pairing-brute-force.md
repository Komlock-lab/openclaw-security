---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: medium
test_id: TC-CS-009
status: draft
ghsa: null
---

# Test 9: DM Pairing Brute Force

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-009 |
| Category | Channel Spoofing |
| Attack Technique | DM pairing code enumeration |
| Severity | Medium |

## Objective

Verify DM pairing codes are sufficiently strong and rate-limited to prevent brute force.

## Test Steps

### Step 1: Trigger Pairing

```bash
# Send message from unknown sender
# OpenClaw responds: "Send pairing code: 123456"
```

### Step 2: Brute Force Codes

```bash
for code in {000000..999999}; do
  echo "Trying: $code"
  # Send code to OpenClaw
  if [[ success ]]; then
    echo "FOUND: $code"
    break
  fi
done
```

### Step 3: Check Rate Limiting

```bash
# Send 100 attempts rapidly
# Should be rate-limited after N attempts
```

## Expected Results (Secure)

1. **Long codes**: 8+ character codes (not 6-digit)
2. **Rate limiting**: Max 5 attempts per hour
3. **Expiration**: Codes expire after 5 minutes
4. **Cryptographically random**: Not sequential
