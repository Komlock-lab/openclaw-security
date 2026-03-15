# Secret Leakage Testing Guide

## Overview

Secret leakage attacks exploit improper handling of sensitive credentials, API keys, and authentication tokens. This test suite covers gateway auth leakage, bot token exposure, and skill secret disclosure.

**Test Coverage**: 10 test cases covering 5+ secret leakage vulnerabilities

## Test Categories

### Part 1: Gateway Auth Leakage (3 tests)
- Dashboard localStorage Leakage
- URL Query Parameter Exposure
- Browser History Leak

### Part 2: Bot Token Exposure (3 tests)
- Telegram Token Log Leakage
- skills.status Secret Disclosure
- Environment Variable Leak

### Part 3: Cross-Agent Leakage (4 tests)
- ACP Resource Share Secret Exposure
- sessions_spawn Credential Inheritance
- Skill-to-Skill Secret Access
- Plugin Isolation Bypass

## Running Tests

```bash
cd openclaw-security/tests/secret-leakage
./run-all.sh
```

## Related Resources

- **Vulnerabilities**: [Secret Leakage](../vulnerabilities/secret-leakage.md)
- **Best Practices**: [Hardening Guide](../best-practices/hardening-guide.md)
- **Test Cases**: `tests/secret-leakage/` directory
