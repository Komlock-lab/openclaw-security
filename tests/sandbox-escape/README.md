# Sandbox Escape Tests

Attack test cases for sandbox escape vulnerabilities in OpenClaw.

## Overview

Sandbox escape represents one of the most critical threats to OpenClaw's security model. The sandbox is designed to isolate untrusted code execution and file system access, preventing malicious operations from affecting the host system. However, various bypass techniques have been discovered, particularly:

- **Symlink/hardlink manipulation** — exploiting file system link semantics
- **TOCTOU (Time-of-Check to Time-of-Use) race conditions** — attacking the gap between validation and use
- **Container/runtime escape** — breaking out of Docker or ACP isolation
- **Path traversal** — bypassing path boundary checks

This test suite covers three dimensions:
- **Part 1 (Tests 1-4)**: Attack **vectors** — how attackers enter the sandbox boundary
- **Part 2 (Tests 5-10)**: Attack **techniques** — specific exploitation methods
- **Part 3 (Tests 11-12)**: **CI/CD & supply chain** — attacks through deployment and installation

## Test Index

### Part 1: Vector-Based Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 1 | Dangling Symlink Bypass | Intermediate | Workspace write boundary | [GHSA-qcc4-p59m-p54m](https://github.com/openclaw/openclaw/security/advisories/GHSA-qcc4-p59m-p54m) |
| 2 | Hardlink Alias Bypass | Intermediate | Workspace file boundary | [GHSA-3jx4-q2m7-r496](https://github.com/openclaw/openclaw/security/advisories/GHSA-3jx4-q2m7-r496) |
| 3 | Docker Bind Mount Injection | Advanced | Container configuration | [GHSA-w235-x559-36mg](https://github.com/openclaw/openclaw/security/advisories/GHSA-w235-x559-36mg) |
| 4 | ACP Sandbox Inheritance Bypass | Advanced | Cross-agent sessions_spawn | [GHSA-474h](https://github.com/openclaw/openclaw/security/advisories/GHSA-474h-prjg-mmw3), [GHSA-p7gr](https://github.com/openclaw/openclaw/security/advisories/GHSA-p7gr-f84w-hqg5), [GHSA-9q36](https://github.com/openclaw/openclaw/security/advisories/GHSA-9q36-67vc-rrwg) |

### Part 2: Technique-Based Tests

| # | Test | Difficulty | Technique Category | GHSA Reference |
|---|------|------------|-------------------|----------------|
| 5 | TOCTOU Symlink Race | Advanced | Race condition | [GHSA-x82f](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c), [GHSA-7xmq](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv) |
| 6 | ZIP Extraction Race | Advanced | Race condition | [GHSA-r54r](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84) |
| 7 | /proc/sys Information Leak | Intermediate | Kernel interface | (No direct GHSA — general Linux container escape) |
| 8 | Environment Variable Override | Intermediate | Process environment | Related to exec allowlist bypass patterns |
| 9 | Tmpdir Escape | Intermediate | Temporary directory | Related symlink traversal patterns |
| 10 | File Descriptor Leak | Advanced | Process inheritance | (No direct GHSA — FD table leakage pattern) |

### Part 3: CI/CD & Supply Chain Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 11 | CI Environment Sandbox Bypass | Advanced | GitHub Actions / CI runner | Related to Docker and environment patterns |
| 12 | Plugin Install Path Traversal | Advanced | Skill installation | [GHSA-qrq5](https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw), [GHSA-vhwf](https://github.com/openclaw/openclaw/security/advisories/GHSA-vhwf-4x96-vqx2) |

## Test Coverage Matrix

| Technique Category | Tests | Count |
|-------------------|-------|-------|
| Symlink/Hardlink Manipulation | 1, 2, 5 | 3 |
| Race Condition (TOCTOU) | 5, 6 | 2 |
| Container Escape | 3, 7, 11 | 3 |
| Process/Environment | 8, 10 | 2 |
| Path Traversal | 9, 12 | 2 |

## Vulnerability Statistics

Based on vulnerability-db.json (as of 2026-03-11):

| Category | Count | Highest Severity |
|----------|-------|------------------|
| Sandbox Escape | 7 | High |
| TOCTOU | 3 | Medium |
| Path Traversal | 6 | Critical |
| Docker/Container | 2+ | Medium-High |

**Total coverage**: 12 test cases covering 18+ known vulnerabilities and general bypass patterns.

## Attack Pattern Evolution

```
Phase 1: Static Link Bypass (v2026.1.x ~ v2026.2.x)
├── Dangling symlinks (GHSA-qcc4)
├── Non-existent symlink leaf (GHSA-mgrq)
├── Hardlink alias (GHSA-3jx4)
└── Symlink parent path (GHSA-m8v2)

Phase 2: TOCTOU Race Conditions (v2026.3.1-3.2)
├── writeFileWithinRoot symlink race (GHSA-x82f)
├── Sandbox media TOCTOU (GHSA-7xmq)
└── ZIP extraction race (GHSA-r54r)

Phase 3: ACP Multi-Agent Bypass (v2026.3.1-3.2)
├── sessions_spawn sandbox inheritance (GHSA-474h)
├── Cross-agent spawn enforcement (GHSA-p7gr)
└── Host ACP initialization bypass (GHSA-9q36)

Phase 4: Container & Supply Chain (ongoing)
├── Docker bind mount injection (GHSA-w235)
├── Plugin install path traversal (GHSA-qrq5, GHSA-vhwf)
└── CI environment sandbox bypass (in-the-wild patterns)
```

## Related Resources

- [TOCTOU Sandbox Bypass Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md)
- [ACP Sandbox Inheritance Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-acp-sandbox-inheritance.md)
- [Sandbox Escape Vulnerabilities (Docs)](../../docs/en/vulnerabilities/sandbox-escape.md)
- [OpenClaw Sandbox Architecture](https://openclaw.ai/docs/security/sandbox)
- [AuditClaw Runtime Check RC-003](../../data/vulnerability-db.json) — Sandbox enabled check
- [AuditClaw Runtime Check RC-019](../../data/vulnerability-db.json) — sessions_spawn sandbox inheritance

## Sandbox Configuration Levels

OpenClaw provides three sandbox modes (controlled by `OPENCLAW_SANDBOX` environment variable):

| Mode | Description | Risk Level |
|------|-------------|------------|
| `off` | No sandboxing — all operations run on host | **Critical** |
| `non-main` | Only sandbox tool operations (exec, filesystem) | **High** |
| `all` | Full sandbox (recommended for untrusted environments) | **Low** |

**Test recommendation**: All tests should be executed with `OPENCLAW_SANDBOX=all` to verify proper isolation.

## Key Open Issues

| Issue Pattern | Description | Status |
|--------------|-------------|--------|
| TOCTOU fundamentals | Race conditions inherent to check-then-use patterns | Partially mitigated (atomic operations needed) |
| ACP cross-session isolation | Multi-agent communication security boundaries | Fixed in v2026.3.2+ but needs ongoing verification |
| Container breakout | Docker/runtime escape via kernel vulnerabilities | Ongoing monitoring of CVEs |
| FD inheritance | File descriptor leakage across sandbox boundaries | No known exploit, monitoring |

## Testing Prerequisites

Before running sandbox escape tests:

1. **Isolated environment**: Use a dedicated VM or container
2. **Root/sudo access**: Some tests require elevated privileges to create links/mounts
3. **OpenClaw installation**: Version v2026.2.0+ recommended
4. **Backup**: Some tests may affect system files — ensure backups
5. **Monitoring**: Enable audit logging to track file system operations

⚠️ **WARNING**: Sandbox escape tests may break containment by design. Only run in controlled environments.

## Test Execution Best Practices

1. **Snapshot before testing**: Take VM/container snapshot for easy rollback
2. **One test at a time**: Don't run multiple sandbox tests concurrently
3. **Monitor file system**: Use `inotify` or `auditd` to track file operations
4. **Clean up**: Remove all symlinks, hardlinks, and test files after each test
5. **Document results**: Record success/failure with OpenClaw version and configuration

## Mitigation Strategies (Post-Test)

If tests reveal vulnerabilities:

1. **Upgrade immediately**: Update to latest OpenClaw version
2. **Enable full sandbox**: Set `OPENCLAW_SANDBOX=all`
3. **Restrict Docker**: Use `--security-opt=no-new-privileges`
4. **Monitor logs**: Enable audit logging for sandbox violations
5. **Report to OpenClaw**: Submit findings to security@openclaw.ai

## Success Criteria

A test **PASSES (secure)** if:
- The sandbox boundary is maintained
- Unauthorized file system access is blocked
- No privilege escalation occurs
- Audit logs show the blocked attempt

A test **FAILS (vulnerable)** if:
- Files outside sandbox are accessed
- Sandbox escape is confirmed
- Host system is compromised
- No error/warning is logged
