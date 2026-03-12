# Channel Spoofing Tests

Attack test cases for channel authentication bypass and identity spoofing vulnerabilities in OpenClaw.

## Overview

Channel spoofing attacks exploit authentication and authorization weaknesses in OpenClaw's multi-channel architecture. OpenClaw supports 10+ messaging platforms (WhatsApp, Telegram, Discord, Slack, Teams, etc.), each with different authentication models. Common vulnerabilities include:

- **Webhook authentication bypass** — missing or weak secret token verification
- **Sender identity spoofing** — bypassing sender allowlist/DM pairing
- **Gateway authentication bypass** — unauthorized API access
- **Channel-specific authorization flaws** — platform-specific implementation bugs
- **CSRF attacks** — cross-site request forgery via browser endpoints

This test suite covers three dimensions:
- **Part 1 (Tests 1-3)**: **Webhook/Token authentication** — missing or weak authentication
- **Part 2 (Tests 4-8)**: **Authorization bypass** — sender allowlist and permission bypass
- **Part 3 (Tests 9-12)**: **Allowlist/Policy bypass** — node metadata and policy evasion

## Test Index

### Part 1: Webhook/Token Authentication Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 1 | Telegram Webhook Secret Bypass | Intermediate | Missing secret token verification | [GHSA-mp5h-m6qj-6292](https://github.com/openclaw/openclaw/security/advisories/GHSA-mp5h-m6qj-6292) |
| 2 | Webhook Signature Forgery | Advanced | Weak signature validation | Related to webhook authentication patterns |
| 3 | Gateway Unauthenticated Connection | Intermediate | Gateway API without authentication | Related to gateway security |

### Part 2: Authorization Bypass Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 4 | Canvas Authentication Bypass | Advanced | Canvas channel authentication | [GHSA-vvjh-f6p9-5vcf](https://github.com/openclaw/openclaw/security/advisories/GHSA-vvjh-f6p9-5vcf) |
| 5 | Browser Bridge Server Bypass | Advanced | Sandbox browser authentication | [GHSA-h9g4-589h-68xv](https://github.com/openclaw/openclaw/security/advisories/GHSA-h9g4-589h-68xv) |
| 6 | Slack Callback Sender Check Skip | Intermediate | Slack interactive callback | [GHSA-x2ff-j5c2-ggpr](https://github.com/openclaw/openclaw/security/advisories/GHSA-x2ff-j5c2-ggpr) |
| 7 | voice-call Allowlist Bypass | Critical | Empty caller ID + suffix matching | [GHSA-4rj2-gpmh-qq5x](https://github.com/openclaw/openclaw/security/advisories/GHSA-4rj2-gpmh-qq5x) |
| 8 | CSRF via Loopback Browser | Advanced | Browser endpoint CSRF | [GHSA-3fqr-4cg8-h96q](https://github.com/openclaw/openclaw/security/advisories/GHSA-3fqr-4cg8-h96q) |

### Part 3: Allowlist/Policy Bypass Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 9 | DM Pairing Brute Force | Intermediate | DM pairing code enumeration | Related to DM authentication |
| 10 | Node Metadata Spoofing | Advanced | Platform-based command policy | [GHSA-r65x-2hqr-j5hf](https://github.com/openclaw/openclaw/security/advisories/GHSA-r65x-2hqr-j5hf) |
| 11 | MS Teams Sender Allowlist Bypass | Intermediate | Empty sender allowlist | [GHSA-g7cr-9h7q-4qxq](https://github.com/openclaw/openclaw/security/advisories/GHSA-g7cr-9h7q-4qxq) |
| 12 | Input Sanitization Bypass | Intermediate | Unicode canonicalization | [GHSA-392f-ggf5-fp3c](https://github.com/openclaw/openclaw/security/advisories/GHSA-392f-ggf5-fp3c) |

## Test Coverage Matrix

| Technique Category | Tests | Count |
|-------------------|-------|-------|
| Webhook/Token Authentication | 1, 2, 3 | 3 |
| Authorization Bypass | 4, 5, 6, 7, 8 | 5 |
| Allowlist/Policy Bypass | 9, 10, 11, 12 | 4 |

## Vulnerability Statistics

Based on vulnerability-db.json (as of 2026-03-11):

| Category | Count | Highest Severity |
|----------|-------|------------------|
| Authentication Bypass | 12 | Critical |
| Policy Bypass | 2 | High |
| CSRF | 1 | High |

**Total coverage**: 12 test cases covering 15+ known authentication and authorization vulnerabilities.

## Multi-Channel Architecture

OpenClaw supports 10+ messaging platforms with varying authentication models:

```
┌──────────────────────────────────────────────────────────────┐
│                    External Platforms                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  WhatsApp    │  Telegram    │  Discord     │  Slack         │
│  (QR code)   │  (Bot token) │  (Bot token) │  (OAuth)       │
├──────────────┼──────────────┼──────────────┼────────────────┤
│  MS Teams    │  Signal      │  iMessage    │  WebChat       │
│  (OAuth)     │  (Link)      │  (AppleScript)│ (Embed token) │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                           │
                           v
       ┌────────────────────────────────────────────┐
       │         Gateway (Authentication Hub)       │
       │  - Webhook endpoints                       │
       │  - DM pairing                              │
       │  - Sender allowlist                        │
       │  - Channel-specific auth logic             │
       └────────────────────┬───────────────────────┘
                            │
                            v
       ┌────────────────────────────────────────────┐
       │           OpenClaw Agent (LLM)             │
       │  - Channel-agnostic processing             │
       │  - Tool authorization                      │
       └────────────────────────────────────────────┘
```

**Attack surfaces**:
1. **Webhook → Gateway**: Forged webhook requests (Test #1, #2)
2. **Platform → Gateway**: Platform-specific auth bypass (Test #4, #5, #6, #7, #11)
3. **Browser → Gateway**: CSRF attacks (Test #8)
4. **Gateway → Agent**: Authorization logic bypass (Test #9, #10, #12)

## Authentication Models by Platform

| Platform | Auth Method | Key Vulnerabilities |
|----------|-------------|---------------------|
| Telegram | Bot token + webhook secret | GHSA-mp5h (missing secret verification) |
| Discord | Bot token + signature | Signature verification weaknesses |
| Slack | OAuth + signature + callback verification | GHSA-x2ff (callback sender check skip) |
| MS Teams | OAuth + tenant validation | GHSA-g7cr (empty sender allowlist bypass) |
| voice-call | Caller ID allowlist | GHSA-4rj2 (empty caller ID + suffix matching) |
| Canvas | Custom auth | GHSA-vvjh (authentication bypass) |
| Browser bridge | Sandbox auth bootstrap | GHSA-h9g4 (auth bypass), GHSA-vpj2 (auth failure continue) |
| WebChat | Embed token | CSRF vulnerabilities |
| Gateway API | /api/channels auth | GHSA-mwxv (dot-segment traversal), GHSA-v865 (encoded-path bypass) |

## DM Pairing Mechanism

OpenClaw uses DM pairing to authenticate unknown senders:

```
1. Unknown sender sends message
   ↓
2. OpenClaw responds: "Send pairing code: 123456"
   ↓
3. Sender replies: "123456"
   ↓
4. OpenClaw verifies code → Sender is paired
   ↓
5. Future messages from sender are accepted
```

**Attack vector (Test #9)**:
- **Brute force**: Try all 6-digit codes (000000-999999)
- **Rate limiting**: Check if OpenClaw rate-limits pairing attempts
- **Code reuse**: Check if codes expire or can be reused
- **Code prediction**: Check if codes are cryptographically random

## Sender Allowlist Bypass Patterns

### Pattern 1: Empty Allowlist Default-Allow

```typescript
// Vulnerable code pattern
if (senderAllowlist.length === 0) {
  // BUG: Empty allowlist should deny all, but defaults to allow all
  return true;
}
```

**Affected**: MS Teams (GHSA-g7cr), voice-call (GHSA-4rj2)

### Pattern 2: Suffix/Prefix Matching

```typescript
// Vulnerable code pattern
if (callerID.endsWith(allowedSuffix)) {
  return true;
}
```

**Attack**: Empty caller ID (`""`) matches any suffix (`""`)
**Affected**: voice-call (GHSA-4rj2)

### Pattern 3: Unicode Canonicalization Drift

```typescript
// Vulnerable code pattern
const normalizedSender = sender.normalize("NFC");
if (allowlist.includes(normalizedSender)) {
  return true;
}
```

**Attack**: Use different Unicode normalization (NFD vs NFC) to bypass
**Affected**: Node metadata policy (GHSA-392f)

## Key Open Issues

| Issue Pattern | Description | Status |
|--------------|-------------|--------|
| Inconsistent auth models | Each channel has different auth logic — hard to audit comprehensively | Ongoing refactoring |
| DM pairing entropy | 6-digit codes may be bruteforceable without rate limiting | Under review |
| Empty allowlist semantics | Empty allowlist behavior is inconsistent across channels | Fixed in most channels |
| CSRF fundamentals | Browser-based channels are vulnerable to CSRF without proper token validation | Partial mitigations |

## Testing Prerequisites

Before running channel spoofing tests:

1. **Multi-channel setup**: Configure at least 3 different channels (Telegram, Discord, Slack recommended)
2. **Webhook endpoints**: Access to webhook URLs (may require ngrok or similar)
3. **Test accounts**: Multiple user accounts on each platform
4. **Network capture**: Tools to intercept/modify webhook requests (Burp Suite, mitmproxy)
5. **Gateway access**: Ability to test gateway API directly

⚠️ **WARNING**: Some tests involve sending crafted webhook requests that may violate platform ToS. Only test in controlled environments with permission.

## Test Execution Best Practices

1. **Isolated channels**: Use test channels/servers, not production
2. **Capture traffic**: Record all webhook requests/responses
3. **Test rate limiting**: Verify that brute force attempts are rate-limited
4. **Check logs**: Review gateway logs for authentication failures
5. **Platform-specific**: Some tests only apply to specific platforms
6. **Clean up**: Remove test accounts and channels after testing

## Mitigation Strategies (Post-Test)

If tests reveal vulnerabilities:

1. **Upgrade immediately**: Update to latest OpenClaw version
2. **Enable DM pairing**: Require pairing for all new senders
3. **Configure sender allowlist**: Explicitly whitelist trusted senders
4. **Verify webhook secrets**: Ensure all channels use secret token verification
5. **Enable signature validation**: Use platform-provided signature verification
6. **Monitor authentication logs**: Alert on repeated authentication failures
7. **CSRF protection**: Enable CSRF tokens for browser endpoints
8. **Report to OpenClaw**: Submit findings to security@openclaw.ai

## Success Criteria

A test **PASSES (secure)** if:
- Webhook without valid secret is rejected
- Unauthenticated sender is blocked
- DM pairing is enforced for unknown senders
- Empty allowlist denies all access (not allows all)
- CSRF attempts are blocked

A test **FAILS (vulnerable)** if:
- Forged webhook is accepted
- Sender allowlist can be bypassed
- DM pairing can be brute-forced
- CSRF attack succeeds
- Gateway API accepts unauthenticated requests

## Relationship to Other Test Suites

- **prompt-injection**: After bypassing channel auth, attackers send prompt injection payloads
- **agent-hijack**: Channel auth bypass is often the first step to gateway RCE attacks
- **skill-abuse**: Authenticated channel access enables skill installation and abuse
- **sandbox-escape**: After gaining channel access, attackers exploit sandbox weaknesses
- **secret-leakage**: Authenticated access enables secret exfiltration via tool execution

**Combined attack chain**:
```
Channel Auth Bypass → Prompt Injection → Tool Abuse → Secret Leakage
```

## Notable Resource: Channel Auth Bypass Patterns

According to [knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md](../../knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md), channel authentication bypasses follow systematic patterns:

### Common Patterns:
1. **Missing authentication**: No authentication required (Canvas, Browser bridge)
2. **Weak secret validation**: Secret token not verified (Telegram)
3. **Empty allowlist default-allow**: Empty list grants access instead of denying (MS Teams, voice-call)
4. **Signature bypass**: Weak or missing signature validation
5. **CSRF**: Browser endpoints without CSRF protection
6. **Path traversal**: /api/channels auth bypass via dot-segments (GHSA-mwxv) or encoded paths (GHSA-v865)

### Platform-Specific:
- **Telegram**: Missing webhook secret (GHSA-mp5h)
- **Slack**: Callback sender check skip (GHSA-x2ff)
- **MS Teams**: Empty sender allowlist (GHSA-g7cr)
- **voice-call**: Empty caller ID + suffix matching (GHSA-4rj2)
- **Canvas**: Authentication bypass (GHSA-vvjh)
- **Browser bridge**: Auth bootstrap failure continue (GHSA-vpj2, GHSA-h9g4)
- **Discord**: Owner-flag omission in voice transcripts (GHSA-wpg9)

This test suite systematically covers these patterns across all major platforms.
