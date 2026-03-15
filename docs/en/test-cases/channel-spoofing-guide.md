# Channel Spoofing Testing Guide

## Overview

Channel spoofing attacks exploit authentication and authorization weaknesses across OpenClaw's 15+ messaging platform integrations. This test suite covers DM pairing vulnerabilities, allowlist bypasses, and sender verification issues.

**Test Coverage**: 12 test cases covering 25+ authentication bypass vulnerabilities

## Test Categories

### Part 1: DM Pairing Attacks (4 tests)
- Brute Force Pairing Code
- pairing-store Cross-Account Scope
- Rate Limit Bypass
- Pairing Replay Attack

### Part 2: Allowlist Bypass (4 tests)
- Display Name Collision
- Username Spoofing
- Empty Allowlist Fail-Open
- Allowlist Slug Collision

### Part 3: Channel-Specific Bypasses (4 tests)
- MS Teams Sender Bypass
- Discord Owner Flag Omission
- Slack Interactive Callback Skip
- Matrix Cross-Homeserver Spoofing

## Running Tests

```bash
cd openclaw-security/tests/channel-spoofing
./run-all.sh
```

## Related Resources

- **Vulnerabilities**: [Authentication Bypass](../vulnerabilities/auth-bypass.md)
- **Best Practices**: [Channel Security](../best-practices/channel-security.md)
- **Test Cases**: `tests/channel-spoofing/` directory
