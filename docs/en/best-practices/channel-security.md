# Channel Security Best Practices

## Overview

OpenClaw supports 15+ messaging platforms (WhatsApp, Telegram, Discord, Slack, LINE, Signal, iMessage, MS Teams, Zalo, Matrix, Nextcloud Talk, Twitch, Feishu, Synology Chat, and more). Each channel has unique authentication and authorization mechanisms, leading to **25+ authentication bypass vulnerabilities** discovered across platforms.

This guide provides best practices for securing OpenClaw deployments across multiple messaging channels, focusing on preventing authentication bypasses, sender spoofing, and unauthorized access.

**Key Risks**:
- **DM Pairing Vulnerabilities**: Rate limiting gaps, pairing-store scope issues
- **Allowlist Bypasses**: Sender identification inconsistencies across platforms
- **OAuth/Auth Failures**: Bootstrap failures, token validation order issues

**Last Updated**: 2026-03-12

## Authentication Mechanisms

### 1. DM Pairing

**How it works**: Users send a DM to the bot and receive an 8-character alphanumeric pairing code (40-bit entropy). The pairing code must be entered within 1 hour.

**Security Considerations**:
- **Brute Force Risk**: No rate limiting on pairing code attempts (Issue #16458, unresolved)
- **Distributed Infrastructure**: With sufficient resources, an attacker can brute-force a code within 1 hour
- **Cross-Account Scope**: Pairing codes stored with incorrect scope, allowing unintended access

**Secure Configuration**:
```yaml
channels:
  discord:
    dmPolicy: paired  # Default, requires pairing
    # Avoid: dmPolicy: open (allows any DM sender)
```

### 2. Allowlist-Based Authorization

**How it works**: Administrators configure sender allowlists (`allowFrom`, `allowedUserIds`) to restrict who can interact with the bot.

**Security Considerations**:
- **Sender Identification Varies**: Each platform uses different identifiers (user IDs, display names, usernames)
- **Display Name Collisions**: 4 platforms vulnerable to display name/username spoofing (Feishu, Telegram, Nextcloud Talk, Matrix)
- **Fail-Open Defaults**: Empty allowlists sometimes interpreted as "allow all" instead of "deny all"

**Secure Configuration**:
```yaml
channels:
  slack:
    allowFrom:
      - user_id: U012345  # Use user IDs, not display names
      - user_id: U067890

  telegram:
    allowedUserIds:
      - 123456789  # Use numeric user IDs, not @usernames
```

### 3. OAuth/Token-Based Authentication

**How it works**: Certain integrations (macOS onboarding, Canvas, Tailscale) use OAuth flows or token-based authentication.

**Security Considerations**:
- **Predictable State**: OAuth state parameter based on timestamp (Issue #12551)
- **PKCE Verifier Leakage**: PKCE code verifier leaked in OAuth state (GHSA-6g25-pc82-vfwp)
- **Bootstrap Failures**: Browser auth continues unauthenticated after bootstrap failure (GHSA-vpj2-69hf-rppw)

**Secure Configuration**:
- Use cryptographically random OAuth state parameters
- Validate OAuth callbacks before proceeding
- Fail-closed on authentication bootstrap failures

## Common Vulnerabilities

### Pattern 1: DM Pairing Vulnerabilities (7+ incidents)

**Root Cause**: Structural weaknesses in DM pairing implementation.

**Known Issues**:
- **Brute Force** (Issue #16458, OPEN): No rate limiting, 40-bit entropy
- **Pairing-Store Scope** (7 advisories): Cross-account, cross-channel scope leakage

**Affected Channels**:
- BlueBubbles (GHSA-25pw-4h6w-qwvm)
- Signal (GHSA-wm8r-w8pf-2v6w)
- LINE (GHSA-gp3q-wpq4-5c5h) - High severity
- iMessage (CVE-2026-26328)
- Cross-account general (GHSA-vjp8-wprm-2jw9, GHSA-jv6r-27ww-4gw4)

**Mitigation**:
```yaml
channels:
  all:
    dmPolicy: paired  # Require pairing for DMs
    # Consider restricting DM access entirely for high-security deployments
```

### Pattern 2: Allowlist Bypasses (10+ incidents)

**Root Cause**: Sender identification method varies per platform, enabling spoofing.

**Bypass Techniques**:
| Technique | Incidents | Affected Channels |
|-----------|-----------|------------------|
| Display name/username collision | 4 | Feishu, Telegram, Nextcloud Talk, Matrix |
| Allowlist unenforced/skipped | 3 | Slack, Twitch, Synology Chat |
| ID collision/slug collision | 2 | Discord, Slack |
| Empty list fail-open | 1 | Synology Chat |

**Mitigation**:
```yaml
# ✅ Good: Use platform-specific user IDs
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"

  matrix:
    allowFrom:
      - user_id: "@alice:matrix.org"  # Full MXID, not display name

# ❌ Bad: Use display names or usernames
channels:
  telegram:
    allowFrom:
      - username: "@alice"  # Usernames are changeable
```

**Specific Advisories**:
- **GHSA-x2ff-j5c2-ggpr** (Slack): Interactive callback sender check skipped
- **GHSA-r5h9-vjqc-hq3r** (Nextcloud Talk): Display name spoofing
- **GHSA-33rq-m5x2-fvgf** (Twitch): allowFrom not enforced
- **GHSA-gw85-xp4q-5gp9** (Synology Chat): Empty allowedUserIds fail-open

### Pattern 3: OAuth/Auth Failures (5 incidents)

**Known Issues**:
- **GHSA-rv39-79c4-7459**: Device ID check skipped before auth.token validation
- **GHSA-hff7-ccv5-52f8**: Tailscale tokenless auth applied to HTTP routes
- **GHSA-vvjh-f6p9-5vcf** (High): Canvas UI authentication bypass (ZDI-CAN-29311)
- **GHSA-vpj2-69hf-rppw**: Browser auth continues after bootstrap failure

**Mitigation**:
- Update to v2026.3.1+ for all OAuth-related fixes
- Enable runtime check RC-003 (auth-bootstrap-validation)

### Pattern 4: v2026.3.x New Bypasses (6 incidents)

**Recent Discoveries** (all fixed in v2026.3.8):
- **GHSA-g7cr-9h7q-4qxq**: MS Teams sender allowlist bypass when route allowlist configured and sender allowlist empty
- **GHSA-pjvx-rx66-r3fg**: Cross-account authorization via `/allowlist --store` account scoping deficiency
- **GHSA-wpg9-4g4v-f9rc**: Discord voice transcript owner flag missing
- **GHSA-v865-p3gq-hw6m**: Encoded-path auth bypass in plugin `/api/channels` route classification
- **GHSA-vpj2-69hf-rppw**: Browser auth continues unauthenticated after bootstrap failure
- **GHSA-8m9v-xpgf-g99m**: Unauthenticated sender bypass for stop trigger and `/models` command

**Mitigation**: Upgrade to **v2026.3.8 or later** immediately.

## Securing Individual Channels

### WhatsApp, Telegram, LINE

**Risk**: Username/display name collisions.

**Secure Configuration**:
```yaml
channels:
  telegram:
    allowedUserIds:
      - 123456789  # Numeric user ID (immutable)
      # Avoid: @username (changeable)

  line:
    allowedUserIds:
      - "U1234567890abcdef"  # LINE user ID (immutable)
      # Avoid: displayName (changeable)
```

### Discord, Slack, MS Teams

**Risk**: Allowlist bypass via ID collisions, empty sender lists.

**Secure Configuration**:
```yaml
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"  # Discord snowflake ID

  slack:
    allowFrom:
      - user_id: "U012345"  # Slack user ID
      # Avoid: display_name

  teams:
    allowFrom:
      - sender: "alice@example.com"
    # Always configure sender allowlist explicitly (never leave empty)
```

### Matrix, Nextcloud Talk

**Risk**: Cross-homeserver spoofing, display name collisions.

**Secure Configuration**:
```yaml
channels:
  matrix:
    allowFrom:
      - user_id: "@alice:matrix.org"  # Full MXID with homeserver
      # Ensure homeserver portion is validated

  nextcloud_talk:
    allowFrom:
      - user_id: "alice"  # Nextcloud user ID
      # Avoid: displayName
```

### Synology Chat, Feishu, Zalo

**Risk**: Empty allowlist fail-open, group sender bypass.

**Secure Configuration**:
```yaml
channels:
  synology_chat:
    allowedUserIds:
      - "user1"
      - "user2"
    # Never leave empty (fail-open risk)

  feishu:
    allowFrom:
      - user_id: "ou_xxxxx"  # Feishu open_id
      # Avoid: displayName (collision risk)

  zalo:
    allowFrom:
      - user_id: "123456789"
    # Configure group sender allowlist separately
```

## Configuration Best Practices

### 1. Always Upgrade to Latest Version

**Critical**: Upgrade to **v2026.3.8 or later** to receive all authentication bypass fixes.

```bash
# Check current version
openclaw --version

# Upgrade (example with npm)
npm install -g openclaw@latest
```

### 2. Explicit Allowlist Configuration

**Principle**: Never rely on defaults. Always explicitly configure sender allowlists.

```yaml
# ✅ Good: Explicit allowlist
channels:
  discord:
    allowFrom:
      - user_id: "123456789012345678"

# ❌ Bad: Empty allowlist (fail-open risk)
channels:
  discord:
    allowFrom: []
```

### 3. Use Immutable Identifiers

**Principle**: Prefer platform-specific user IDs over usernames or display names.

| Platform | Use | Avoid |
|----------|-----|-------|
| Telegram | Numeric user ID | @username |
| Discord | Snowflake ID | username#discriminator |
| LINE | User ID | displayName |
| Matrix | Full MXID | Display name |

### 4. Restrict DM Access

**Principle**: Use `dmPolicy: paired` (default) instead of `dmPolicy: open`.

```yaml
channels:
  all:
    dmPolicy: paired  # Require pairing for DMs

# Only use dmPolicy: open for low-security testing environments
```

### 5. Enable Runtime Checks

**Principle**: Use OpenClaw runtime checks to detect misconfigurations.

```bash
# Enable DM pairing rate limit check (proposed, not yet implemented)
openclaw --runtime-check dm-pairing-rate-limit

# Enable allowlist strictness check (proposed)
openclaw --runtime-check allowlist-strictness

# Enable auth bootstrap validation
openclaw --runtime-check auth-bootstrap-validation
```

See [Hardening Guide](./hardening-guide.md) for comprehensive runtime check configuration.

### 6. Audit Channel Configurations Regularly

**Principle**: Periodically review allowlist configurations for all active channels.

```bash
# List all channel configurations
openclaw channels list --show-allowlists

# Audit for empty allowlists
openclaw channels audit --check empty-allowlist
```

## Attack Chain Examples

### Example 1: Display Name Spoofing (Nextcloud Talk)

```
1. Attacker sets display name to match legitimate user (e.g., "Alice")
2. OpenClaw allowFrom uses display name for matching
3. Attacker authenticated as "Alice"
4. Attacker gains access to owner-only tools
```

**Defense**: Use Nextcloud user IDs instead of display names.

### Example 2: Empty Allowlist Fail-Open (MS Teams)

```
1. Admin configures route allowlist (e.g., /models)
2. Sender allowlist left empty (unintentional)
3. Empty allowlist interpreted as "allow all"
4. Unauthenticated users access bot
```

**Defense**: Always explicitly configure sender allowlists (never leave empty).

### Example 3: DM Pairing Brute Force

```
1. Attacker sends DM to bot
2. Bot responds with pairing code request
3. Attacker attempts brute force (no rate limit)
4. With distributed infrastructure, succeeds within 1 hour
5. Attacker gains full bot access
```

**Defense**: Monitor Issue #16458 for rate limiting implementation. Consider disabling DM access entirely for high-security deployments.

## Verification

### Test Allowlist Configuration

```bash
# Test sender authentication (as attacker)
# 1. Create test account with display name matching legitimate user
# 2. Send message to bot
# 3. Verify bot rejects message (should fail authentication)

# Test empty allowlist (as admin)
# 1. Configure channel with empty allowedUserIds
# 2. Attempt access from unauthorized account
# 3. Verify bot rejects access (should not fail-open)
```

### Audit Log Review

```bash
# Review authentication failures
grep "auth failed" /var/log/openclaw/auth.log

# Check for pairing code attempts
grep "pairing code" /var/log/openclaw/auth.log | wc -l
```

## Related Resources

- **Runtime Checks**: [Hardening Guide - Runtime Checks](./hardening-guide.md)
- **Testing**: Test cases available in `tests/channel-spoofing/` directory
- **Vulnerability Database**: `data/vulnerability-db.json` (25+ auth bypass entries)
- **Related Guides**:
  - [OWASP LLM Top 10 Mapping](./owasp-llm-mapping.md)
  - [Secret Leakage Prevention](../vulnerabilities/secret-leakage.md)

## References

- **OpenClaw Security Advisories**: https://github.com/openclaw/openclaw/security/advisories
- **Sender Identification Patterns**: Knowledge article `2026-03-12-channel-auth-bypass-patterns.md`
- **DM Pairing Brute Force**: Issue #16458 (OPEN, stale)
- **CWE-287**: Improper Authentication
- **CWE-290**: Authentication Bypass by Spoofing
