---
date: 2026-03-13
category: test-cases
subcategory: channel-spoofing
severity: high
test_id: TC-CS-006
status: draft
ghsa: GHSA-x2ff-j5c2-ggpr
---

# Test 6: Slack Callback Sender Check Skip

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-CS-006 |
| Category | Channel Spoofing |
| Attack Vector | Slack interactive callback sender verification skip |
| Severity | High |
| GHSA Reference | [GHSA-x2ff](https://github.com/openclaw/openclaw/security/advisories/GHSA-x2ff-j5c2-ggpr) |
| Fixed In | v2026.2.x |

## Objective

Verify Slack interactive callbacks validate sender identity.

## Test Steps

### Step 1: Forge Slack Callback

```bash
curl -X POST http://localhost:3000/slack/interactive \
  -d 'payload={"user": {"id": "U12345"}, "actions": [{"value": "approve"}]}'
```

### Step 2: Test Sender Spoofing

```bash
# Change user ID to impersonate
-d 'payload={"user": {"id": "U_ADMIN"}, ...}'
```

## Expected Results (Secure)

1. **Sender validation**: User ID verified against workspace
2. **Signature check**: Slack signature validated
