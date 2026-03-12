---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: medium
test_id: TC-CS-002
status: draft
ghsa: null
---

# Test 2: Webhook Signature Forgery

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-002 |
| Category | Channel Spoofing |
| Attack Technique | Weak webhook signature validation |
| Severity | Medium |
| GHSA Reference | None (general pattern) |

## Objective

Verify webhook signature validation cannot be bypassed via timing attacks or weak crypto.

## Test Steps

### Step 1: Capture Valid Webhook

```bash
# Intercept valid webhook
tcpdump -i any -A 'port 3000'
```

### Step 2: Test Signature Replay

```bash
# Replay captured signature
curl -X POST http://localhost:3000/webhook/discord \
  -H "X-Signature-Ed25519: <captured-signature>" \
  -d '{"malicious": "payload"}'
```

### Step 3: Test Timing Attack

```javascript
// Measure timing differences
const validSig = "real_signature";
const testSigs = generateSimilarSignatures(validSig);

for (const sig of testSigs) {
  const start = Date.now();
  await validateSignature(sig);
  const elapsed = Date.now() - start;
  console.log(sig, elapsed);
}
```

## Expected Results (Secure)

1. **Constant-time comparison**: Timing attacks prevented
2. **Nonce validation**: Replay attacks blocked
3. **Strong crypto**: HMAC-SHA256 or better

## Mitigation

```javascript
const crypto = require('crypto');

function constantTimeEqual(a, b) {
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}
```
