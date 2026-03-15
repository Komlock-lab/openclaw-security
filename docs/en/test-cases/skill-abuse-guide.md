# Skill Abuse Testing Guide

## Overview

Skill abuse attacks exploit OpenClaw's skill execution and system.run approval mechanisms. This test suite covers exec allowlist bypass, skill supply chain attacks, and approval workflow bypasses.

**Test Coverage**: 10 test cases covering 16+ vulnerabilities

## Test Categories

### Part 1: Exec Allowlist Bypass (4 tests)
- GNU Long Option Abbreviation
- env -S Wrapper Bypass
- PowerShell Encoded Command
- Wrapper Depth Boundary Skip

### Part 2: Skill Supply Chain (4 tests)
- Unicode Steganography in SKILL.md
- SKILL.md Tampering via Path Traversal
- Malicious External URL Fetch
- Privilege Escalation Chain

### Part 3: Approval Binding Bypass (2 tests)
- system.run Approval ID Mismatch
- PATH Token Executable Rebind

## Running Tests

```bash
cd openclaw-security/tests/skill-abuse
./run-all.sh
```

## Related Resources

- **Vulnerabilities**: [Exec Bypass](../vulnerabilities/exec-bypass.md)
- **Test Cases**: `tests/skill-abuse/` directory
- **Best Practices**: [Hardening Guide](../best-practices/hardening-guide.md)
