# Exec Allowlist Bypass Vulnerabilities

## Overview

OpenClaw's `system.run` command execution mechanism and `exec allowlist` (also known as `safeBins`) are core security features designed to allow only user-approved commands to execute. However, **28+ distinct bypass techniques** have been discovered since v2026.1.x, making this the largest and most actively exploited attack surface in OpenClaw (accounting for approximately 17% of all security advisories).

### Root Cause

The fundamental limitation lies in attempting to defend against the complexity of shells (bash, sh, zsh, cmd.exe, PowerShell, busybox, etc.) using **string-based pattern matching**. Statically determining command equivalence is theoretically intractable when dealing with Turing-complete shell languages.

## Statistics

| Metric | Value |
|--------|-------|
| Total Vulnerabilities | 28+ techniques (9 formal GHSA entries in database) |
| Severity Distribution | High: 3, Medium: 6 |
| Affected Versions | v2026.1.x ~ v2026.3.7 |
| Latest Fix Version | >= v2026.3.8 |
| Impact | Remote Code Execution (RCE) |

## Vulnerability Classification

### Category 1: Shell Syntax Bypass (8 techniques)

Exploiting shell parsing complexity to circumvent allowlist checks.

| # | GHSA ID | Severity | Technique | Description |
|---|---------|----------|-----------|-------------|
| 1 | GHSA-3c6h-g97w-fg78 | **High** | GNU long option abbreviation | Exploits GNU getopt's ability to expand `--he` to `--help` |
| 2 | GHSA-3hcm-ggvf-rch5 | High | Command substitution/backticks | Executes commands via `$(...)` or `` `...` `` within double quotes |
| 3 | GHSA-9868-vxmx-w862 | Medium | Line continuation + command substitution | Combines backslash line continuation with command substitution |
| 4 | GHSA-9p38-94jf-hgjj | Medium | macOS quote command substitution | Exploits macOS-specific quote handling differences |
| 5 | GHSA-6rcp-vxwf-3mfp | Medium | Positional argument carrier | Embeds hidden commands in shell wrapper positional arguments |
| 6 | GHSA-65rx-fvh6-r4h2 | High | Heredoc expansion | Bypasses via unquoted heredoc shell expansion (CVE-2026-27209) |
| 7 | GHSA-qj77-c3c8-9c3q | High | Windows cmd.exe parsing | Exploits Windows-specific command parser differences |
| 8 | GHSA-3h2q-j2v4-6w5r | **Medium** | PowerShell encoded command | Parser misses `-EncodedCommand` wrapper |

**GHSA-3c6h-g97w-fg78**: Exec allowlist bypass via GNU long option abbreviation
- **Fixed In**: >= 2026.2.23
- **Attack Scenario**: Attacker provides `mycmd --he` which GNU getopt expands to `mycmd --help`, bypassing allowlist that only checks for exact matches.
- **Mitigation**: Update to v2026.2.23+ which performs full option expansion before allowlist matching.

**GHSA-3h2q-j2v4-6w5r**: PowerShell encoded-command wrapper missed by approval parsing
- **Fixed In**: >= 2026.3.7
- **Attack Scenario**: `powershell.exe -EncodedCommand <base64>` bypasses allowlist parsing that doesn't decode Base64 payloads.
- **Mitigation**: Update to v2026.3.7+ which decodes and validates PowerShell encoded commands before approval.

---

### Category 2: Environment Variable & PATH Injection (8 techniques)

Manipulating environment variables or PATH settings to hijack command execution.

| # | GHSA ID | Severity | Technique | Description |
|---|---------|----------|-----------|-------------|
| 9 | GHSA-g75x-8qqm-2vxp | Medium | PATH hijacking | Manipulates PATH environment variable to execute fake binaries |
| 10 | GHSA-qhrr-grqp-6x2g | Medium | Binary shadowing | Places same-name binary in trusted PATH directory |
| 11 | GHSA-2fgq-7j6h-9rm4 | Medium | SHELLOPTS/PS4 injection | Exploits shell debug environment variables for code execution |
| 12 | GHSA-w9cg-v44m-4qv8 | Medium | BASH_ENV/ENV injection | Exploits shell startup file auto-loading |
| 13 | GHSA-xgf2-vxv2-rrmg | Medium | Startup env injection (RCE) | Achieves RCE via shell startup environment variables |
| 14 | GHSA-5h2c-8v84-qpvr | Medium | Login shell path | Exploits trusted startup env with attacker-influenced login shell path |
| 15 | GHSA-f8mp-vj46-cq8v | Medium | SHELL path fallback | Exploits unvalidated SHELL path in shell env fallback |
| 16 | GHSA-p4wh-cr8m-gm6c | Medium | $SHELL fallback exploitation | Executes attacker-controlled binary via $SHELL fallback |

---

### Category 3: Wrapper & Dispatch Chain Bypass (4 techniques)

Exploiting insufficient validation of command execution wrappers or dispatch chains.

| # | GHSA ID | Severity | Technique | Description |
|---|---------|----------|-----------|-------------|
| 17 | GHSA-48wf-g7cp-gr3m | Medium | env -S wrapper | Executes commands indirectly via `env -S` |
| 18 | GHSA-796m-2973-wc5q | **High** | env -S wrapper interpretation | Exploits interpretation differences in env -S wrapper |
| 19 | GHSA-gwqp-86q6-w47g | Medium | busybox/toybox sh -c | Indirect execution via lightweight shell's `sh -c` |
| 20 | GHSA-jj82-76v6-933r | Medium | Insufficient dispatch chain unwrap | Incomplete expansion of env/shell dispatch chains |

**GHSA-796m-2973-wc5q**: safeBins bypass via env -S wrapper
- **Fixed In**: >= 2026.2.23
- **Attack Scenario**: `env -S "mycmd --forbidden-flag"` bypasses allowlist by wrapping the command in env's `-S` (split string) option.
- **Mitigation**: Update to v2026.2.23+ which unwraps env -S wrappers before allowlist checking.

---

### Category 4: Approval Mechanism Bypass (5 techniques)

Circumventing the `system.run` approval mechanism itself. Concentrated discovery in v2026.3.x series.

| # | GHSA ID | Severity | Technique | Description |
|---|---------|----------|-----------|-------------|
| 21 | GHSA-hwpq-rrpf-pgcq | High | Approval ID mismatch | Displayed command differs from actually executed binary |
| 22 | GHSA-q399-23r3-hfx4 | **High** | PATH token unbinding | Executable can be replaced after approval (TOCTOU-like) |
| 23 | GHSA-8g75-q649-6pv6 | **Medium** | Script operand unbinding | Mutable script operands not bound between approval and execution |
| 24 | GHSA-9q2p-vc84-2rwm | **Medium** | allow-always persistence pollution | Shell comment payload tails persist in allow-always |
| 25 | GHSA-r6qf-8968-wj9q | **Medium** | Wrapper depth boundary skip | Wrapper depth limit can skip shell approval gating |

**GHSA-q399-23r3-hfx4**: PATH token executable identity not bound during approvals
- **Fixed In**: >= 2026.3.1
- **Attack Scenario**:
  1. User approves execution of `/usr/bin/mycmd`
  2. Attacker replaces `/usr/bin/mycmd` with malicious binary before execution
  3. Approval system doesn't verify executable identity hasn't changed
- **Mitigation**: Update to v2026.3.1+ which binds PATH-token executable identity across approval and execution.

**GHSA-8g75-q649-6pv6**: Script operands not bound across approval and execution
- **Fixed In**: >= 2026.3.8
- **Attack Scenario**: Mutable script operands (e.g., script file path) can be modified between approval and execution.
- **Mitigation**: Update to v2026.3.8+ which binds mutable script operands.

**GHSA-9q2p-vc84-2rwm**: allow-always persistence includes shell-commented payload tails
- **Fixed In**: >= 2026.3.7
- **Attack Scenario**: `mycmd # malicious-payload` gets persisted in allow-always, and the comment payload may be interpreted in future contexts.
- **Mitigation**: Update to v2026.3.7+ which sanitizes allow-always persistence.

**GHSA-r6qf-8968-wj9q**: Wrapper depth boundary could skip shell approval gating
- **Fixed In**: >= 2026.3.7
- **Attack Scenario**: Wrapper depth limit enforcement can be bypassed, allowing nested wrappers to skip approval requirements.
- **Mitigation**: Update to v2026.3.7+ which properly enforces wrapper depth limits.

**GHSA-j425-whc4-4jgc**: env override filtering allowed dangerous helper-command pivots
- **Fixed In**: >= 2026.3.7
- **Attack Scenario**: Environment variable override filtering permits pivots to dangerous helper commands.
- **Mitigation**: Update to v2026.3.7+ with improved env override filtering.

---

### Category 5: Other Bypass Techniques (3+ techniques)

| # | GHSA ID | Severity | Technique | Description |
|---|---------|----------|-----------|-------------|
| 26 | GHSA-ccg8-46r6-9qgj | Medium | Dispatch depth cap mismatch | Dispatch wrapper depth cap inconsistency |
| 27 | GHSA-5gj7-jf77-q2q2 | Medium | Writable directory binary hijack | Binary hijacking (e.g., jq) via writable directories |
| 28 | GHSA-j425-whc4-4jgc | **Medium** | env override pivot | env override filtering permits dangerous helper-command pivots |

**GHSA-h3rm-6x7g-882f**: Approval hardening wrapper semantic drift
- **Fixed In**: >= 2026.3.2
- **Attack Scenario**: Node system.run approval hardening wrapper's semantic drift can execute unintended local scripts.
- **Mitigation**: Update to v2026.3.2+ with corrected wrapper semantics.

---

## Attack Pattern Evolution Timeline

```
v2026.1.x ~ v2026.2.26 (Phase 1-4: Initial Discovery)
├── Shell syntax bypass (GNU options, command substitution, heredoc, etc.)
├── Environment variable injection (PATH, BASH_ENV, SHELLOPTS, etc.)
├── Wrapper chain circumvention (env -S, busybox, dispatch)
└── Known approval ID mismatches

v2026.3.1 (Phase 5: Approval Binding Hardening)
├── Added PATH token executable ID binding
└── Attacks on approval mechanism itself intensify

v2026.3.2 (Approval Hardening)
└── Discovery of hardening bypass via semantic drift

v2026.3.7 (Phase 6: Multi-Vector Bypass)
├── env override pivot
├── allow-always persistence pollution
├── Wrapper depth boundary skip
└── PowerShell encoded command bypass

v2026.3.8 (Latest)
└── Script operand unbinding fix
```

## Impact Assessment

### Prerequisites
- LLM agent under attacker control (after successful prompt injection), OR
- Malicious skill/plugin installed

### Impact
- **Arbitrary Command Execution**: Bypass exec allowlist to execute unauthorized commands
- **Data Exfiltration**: File system access to steal credentials
- **Persistence**: Pollute allow-always feature for approval-free future execution
- **Lateral Movement**: Pivot from system.run to other system components

### Example Attack Chain

```
Prompt Injection
  └→ LLM calls system.run
      └→ Exec allowlist bypass (e.g., env -S, heredoc expansion)
          └→ Arbitrary command execution
              ├→ curl to exfiltrate data to external C2
              ├→ Read files (steal secrets)
              └→ Pollute allow-always (persistence)
```

## Defense Strategy

### Immediate Actions
1. **Update to Latest Version**: Upgrade to >= v2026.3.8 to apply known bypass fixes
2. **Minimize Exec Allowlist**: Only include absolutely necessary commands in allowlist
3. **Enable Sandbox**: Set `sandbox.mode: all` to isolate command execution in containers

### Medium-Term Actions
4. **Runtime Checks**: Regularly run `openclaw security audit --deep` to verify system.run configuration
5. **Sanitize Environment Variables**: Restrict dangerous environment variables (BASH_ENV, SHELLOPTS, PATH, etc.)
6. **Audit allow-always**: Periodically review persisted approval list contents

### Long-Term Solutions
7. **Architectural Redesign**: Migrate from string pattern matching to executable hash verification / signature-based approval
8. **Sandbox-First Execution Model**: Default all command execution to sandbox-only

## Related Resources

- [system.run Attack Surface Research](../../knowledge/vulnerabilities/exec-bypass/2026-03-12-system-run-attack-surface.md)
- [Skill Abuse Testing Guide](../test-cases/skill-abuse-guide.md)
- [Hardening Guide](../best-practices/hardening-guide.md)
- [OpenClaw Security Advisories](https://github.com/openclaw/openclaw/security/advisories)

---

**Last Updated**: 2026-03-14
**Database Version**: vulnerability-db.json (2026-03-11, 65 entries)
