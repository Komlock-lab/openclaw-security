# Remote Code Execution (RCE) Vulnerabilities

## Overview

Remote Code Execution (RCE) vulnerabilities allow attackers to execute arbitrary code on the target system. OpenClaw has had 7 RCE vulnerabilities across multiple attack vectors: Gateway authentication bypass, WebSocket configuration injection, shell command injection, and approval mechanism bypass.

## Statistics

| Metric | Value |
|--------|-------|
| Total Vulnerabilities | 7 RCE vulnerabilities |
| Severity Distribution | Critical: 1, High: 6 |
| Affected Versions | v2026.1.20 ~ v2026.3.0 |
| Latest Fix Version | >= v2026.3.1 |
| Impact | Full system compromise |

---

## Critical Severity

### GHSA-gv46-4xfq-jv58: Gateway Node Invoke Approval Bypass RCE

| Property | Value |
|----------|-------|
| Severity | **Critical** |
| Fixed In | >= 2026.2.14 |
| Attack Vector | Gateway Node Invoke |

**Impact**: Remote code execution via Gateway Node Invoke approval bypass

**Mitigation**: Update to >= 2026.2.14 + configure Gateway authentication

**References**: [GHSA-gv46](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58)

---

## High Severity

### GHSA-g55j-c2v4-pjcg: Unauthenticated WebSocket config.apply RCE

| Property | Value |
|----------|-------|
| Severity | High |
| CVE | CVE-2026-25593 |
| Fixed In | >= 2026.1.20 |

**Impact**: Unauthenticated local RCE via WebSocket `config.apply` method

**Mitigation**: Update to >= 2026.1.20

**References**: [GHSA-g55j](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg)

---

### GHSA-g8p2-7wf7-98mq: One-Click RCE via Auth Token Theft

| Property | Value |
|----------|-------|
| Severity | High |
| Fixed In | >= 2026.1.29 |

**Impact**: One-click RCE via auth token theft through `gatewayUrl` manipulation

**Mitigation**: Update to >= 2026.1.29

**References**: [GHSA-g8p2](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq)

---

### GHSA-65rx-fvh6-r4h2: Heredoc Expansion Shell Injection

| Property | Value |
|----------|-------|
| Severity | High |
| CVE | CVE-2026-27209 |
| Fixed In | >= 2026.2.21 |

**Impact**: Shell command injection via heredoc expansion in exec allowlist

**Mitigation**: Update to >= 2026.2.21

**References**:
- [GHSA-65rx](https://github.com/openclaw/openclaw/security/advisories/GHSA-65rx-fvh6-r4h2)
- [Exec Bypass Vulnerabilities](exec-bypass.md)

---

### GHSA-vffc-f7r7-rx2w: systemd Unit Newline Injection (Linux)

| Property | Value |
|----------|-------|
| Severity | High |
| Fixed In | >= 2026.2.21 |
| Platform | Linux only |

**Impact**: Local command execution via newline injection in systemd unit generation

**Mitigation**: Update to >= 2026.2.21 (Linux users)

**References**: [GHSA-vffc](https://github.com/openclaw/openclaw/security/advisories/GHSA-vffc-f7r7-rx2w)

---

### GHSA-hwpq-rrpf-pgcq: system.run Approval ID Mismatch

| Property | Value |
|----------|-------|
| Severity | High |
| Fixed In | >= 2026.2.25 |

**Impact**: system.run approval ID mismatch executes different binary than displayed

**Mitigation**: Update to >= 2026.2.25

**References**:
- [GHSA-hwpq](https://github.com/openclaw/openclaw/security/advisories/GHSA-hwpq-rrpf-pgcq)
- [Exec Bypass Vulnerabilities](exec-bypass.md)

---

### GHSA-6f6j-wx9w-ff4j: ACPX Windows cwd Injection

| Property | Value |
|----------|-------|
| Severity | High |
| Fixed In | >= 2026.3.1 |
| Platform | Windows only |

**Impact**: ACPX Windows wrapper shell fallback allowed cwd injection

**Mitigation**: Update to >= 2026.3.1 (Windows users)

**References**:
- [GHSA-6f6j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6f6j-wx9w-ff4j)
- [ACP Security](acp-security.md)

---

## Defense Strategy

### Immediate Actions
1. **Update to >= v2026.3.1**: All RCE vulnerabilities fixed
2. **Configure Gateway Auth**: `openclaw config set gateway.auth true`
3. **Enable Sandbox**: `openclaw config set sandbox all`

### Related Resources
- [Exec Bypass Vulnerabilities](exec-bypass.md)
- [ACP Security](acp-security.md)
- [Hardening Guide](../best-practices/hardening-guide.md)

---

**Last Updated**: 2026-03-15
**Database Version**: vulnerability-db.json (2026-03-11, 7 RCE entries)
