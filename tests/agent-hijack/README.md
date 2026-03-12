# Agent Hijack Tests

Attack test cases for agent communication hijacking and remote code execution vulnerabilities in OpenClaw.

## Overview

Agent hijacking represents attacks that compromise the integrity and security of agent-to-agent communication, remote execution, and gateway infrastructure. Unlike sandbox escape (which focuses on file system boundaries), agent hijack attacks target:

- **Remote code execution (RCE)** — direct execution of attacker-controlled code
- **Gateway/WebSocket communication** — intercepting or manipulating agent messages
- **Cross-agent spawning** — exploiting multi-agent coordination mechanisms
- **Command injection** — injecting malicious payloads into system commands
- **SSRF (Server-Side Request Forgery)** — abusing agent network capabilities

This test suite covers three dimensions:
- **Part 1 (Tests 1-5)**: Attack **vectors** — entry points for RCE and hijacking
- **Part 2 (Tests 6-10)**: Attack **techniques** — specific command injection and SSRF methods
- **Part 3 (Tests 11-12)**: **Multi-agent** — exploiting agent-to-agent communication

## Test Index

### Part 1: Vector-Based Tests

| # | Test | Difficulty | Target | GHSA Reference |
|---|------|------------|--------|----------------|
| 1 | WebSocket RCE via config.apply | Advanced | Unauthenticated WebSocket | [GHSA-g55j-c2v4-pjcg](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg) |
| 2 | gatewayUrl Token Theft | Advanced | One-click RCE via auth token | [GHSA-g8p2-7wf7-98mq](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq) |
| 3 | Heredoc Expansion Injection | Advanced | exec allowlist heredoc | [GHSA-65rx-fvh6-r4h2](https://github.com/openclaw/openclaw/security/advisories/GHSA-65rx-fvh6-r4h2) |
| 4 | Systemd Newline Injection (Linux) | Advanced | systemd unit generation | [GHSA-vffc-f7r7-rx2w](https://github.com/openclaw/openclaw/security/advisories/GHSA-vffc-f7r7-rx2w) |
| 5 | Gateway Node Invoke Bypass | Critical | Remote Node Invoke approval | [GHSA-gv46-4xfq-jv58](https://github.com/openclaw/openclaw/security/advisories/GHSA-gv46-4xfq-jv58) |

### Part 2: Technique-Based Tests

| # | Test | Difficulty | Technique Category | GHSA Reference |
|---|------|------------|-------------------|----------------|
| 6 | Docker PATH Injection | Intermediate | Environment variable manipulation | [GHSA-mc68-q9jw-2h3v](https://github.com/openclaw/openclaw/security/advisories/GHSA-mc68-q9jw-2h3v) |
| 7 | sshNodeCommand Injection | Advanced | OS command injection | [GHSA-q284-4pvr-m585](https://github.com/openclaw/openclaw/security/advisories/GHSA-q284-4pvr-m585) |
| 8 | macOS Keychain Injection | Advanced | Shell injection (macOS) | [GHSA-4564-pvr2-qq4h](https://github.com/openclaw/openclaw/security/advisories/GHSA-4564-pvr2-qq4h) |
| 9 | SSRF via IPv4-mapped IPv6 | Intermediate | SSRF guard bypass | [GHSA-jrvc-8ff5-2f9f](https://github.com/openclaw/openclaw/security/advisories/GHSA-jrvc-8ff5-2f9f) |
| 10 | ACPX CWD Prompt Injection | Advanced | Working directory manipulation | [GHSA-6f6j-wx9w-ff4j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6f6j-wx9w-ff4j) |

### Part 3: Multi-Agent Tests

| # | Test | Difficulty | Target | Reference |
|---|------|------------|--------|-----------|
| 11 | ACP Resource Link Prompt Injection | Advanced | Cross-agent resource sharing | Related to ACP security patterns |
| 12 | Agent Identity Spoofing | Advanced | Agent-to-agent authentication | Related to sessions_spawn and cross-agent communication |

## Test Coverage Matrix

| Technique Category | Tests | Count |
|-------------------|-------|-------|
| Remote Code Execution | 1, 2, 3, 4, 5 | 5 |
| Command Injection | 6, 7, 8, 10 | 4 |
| SSRF | 9 | 1 |
| Multi-Agent Communication | 11, 12 | 2 |

## Vulnerability Statistics

Based on vulnerability-db.json (as of 2026-03-11):

| Category | Count | Highest Severity |
|----------|-------|------------------|
| RCE | 7 | Critical |
| Command Injection | 3 | High |
| SSRF | 5 | High |
| Authentication Bypass (Gateway) | 3+ | Critical |

**Total coverage**: 12 test cases covering 18+ known RCE/hijacking vulnerabilities.

## Attack Pattern Evolution

```
Phase 1: Gateway/WebSocket Attacks (v2026.1.x)
├── Unauthenticated WebSocket RCE (GHSA-g55j)
├── gatewayUrl token theft (GHSA-g8p2)
└── Gateway Node Invoke bypass (GHSA-gv46)

Phase 2: Command Injection Variants (v2026.2.x)
├── Heredoc expansion (GHSA-65rx)
├── Systemd newline injection (GHSA-vffc)
├── Docker PATH injection (GHSA-mc68)
├── sshNodeCommand injection (GHSA-q284)
└── macOS Keychain injection (GHSA-4564)

Phase 3: SSRF & Network Bypass (v2026.3.x)
├── IPv4-mapped IPv6 bypass (GHSA-jrvc)
├── Authorization header forwarding (GHSA-6mgf)
├── DNS pinning loss via proxy (GHSA-8mvx)
├── Node camera URL bypass (GHSA-2858)
└── web_search citation SSRF (GHSA-g99v)

Phase 4: Multi-Agent Security (v2026.3.x)
├── ACP sandbox inheritance bypass (GHSA-474h, GHSA-p7gr)
├── sessions_spawn enforcement (GHSA-9q36)
└── Agent identity & authorization patterns
```

## Related Resources

- [Channel Authentication Bypass Patterns](../../knowledge/vulnerabilities/auth-bypass/2026-03-12-channel-auth-bypass-patterns.md)
- [RCE Vulnerabilities (Docs)](../../docs/en/vulnerabilities/rce.md)
- [Command Injection (Docs)](../../docs/en/vulnerabilities/command-injection.md)
- [SSRF Vulnerabilities (Docs)](../../docs/en/vulnerabilities/ssrf.md)
- [OpenClaw Gateway Security](https://openclaw.ai/docs/gateway)
- [AuditClaw Runtime Check RC-001](../../data/vulnerability-db.json) — OpenClaw version check
- [AuditClaw Runtime Check RC-015](../../data/vulnerability-db.json) — ACP dispatch safety

## Gateway Architecture

OpenClaw's gateway serves as the central hub for agent communication:

```
┌─────────────────┐
│  External User  │ (WhatsApp, Telegram, Discord, Slack, etc.)
└────────┬────────┘
         │
         v
┌─────────────────────────────────────────────────────┐
│               Gateway (WebSocket/HTTP)              │
│  - Authentication & Authorization                   │
│  - Message routing & transformation                 │
│  - Node Invoke (remote command execution)           │
└────────┬────────────────────────────────────────────┘
         │
         v
┌─────────────────────────────────────────────────────┐
│             OpenClaw Agent (LLM)                    │
│  - Tool execution (system.run, filesystem, etc.)    │
│  - Skill invocation                                 │
│  - Multi-agent coordination (ACP sessions_spawn)    │
└─────────────────────────────────────────────────────┘
```

**Attack surfaces**:
1. **Gateway → Agent**: Malicious commands via WebSocket/HTTP
2. **Agent → Gateway**: SSRF attacks via gateway fetch
3. **Agent → Host**: RCE via system.run and exec allowlist bypass
4. **Agent → Agent**: Cross-agent prompt injection and resource manipulation

## Authentication & Authorization Levels

| Level | Description | Bypass Patterns |
|-------|-------------|-----------------|
| Gateway authentication | Token/secret validation | GHSA-mp5h (Telegram secret), GHSA-gv46 (Node Invoke) |
| Channel authorization | Per-channel access control | Various channel-specific bypasses |
| Tool authorization | system.run approval workflow | GHSA-hwpq (approval ID mismatch) |
| Agent-to-agent | Cross-agent spawn permissions | GHSA-474h (ACP inheritance bypass) |

## Key Open Issues

| Issue Pattern | Description | Status |
|--------------|-------------|--------|
| Gateway approval workflows | system.run and Node Invoke approval can be bypassed via ID mismatches | Fixed in v2026.2.25+ but complex UX flow remains |
| SSRF fundamentals | Agents need network access but must avoid SSRF — ongoing balance | Partial mitigations (DNS pinning, fetch-guard) |
| Command injection surface | exec allowlist bypasses keep emerging — shell metacharacter handling is hard | 9 distinct bypass patterns fixed |
| Multi-agent trust model | Agent-to-agent communication assumes trusted peers — no mutual auth | Under review |

## Testing Prerequisites

Before running agent hijack tests:

1. **Gateway setup**: Configure OpenClaw with gateway enabled
2. **Network isolation**: Use isolated network environment
3. **Multiple nodes**: Some tests require multi-agent setup
4. **Root/sudo**: Some tests (systemd, Keychain) require elevated privileges
5. **Platform-specific**: Tests 4 (Linux) and 8 (macOS) are OS-specific
6. **Monitoring**: Enable WebSocket traffic capture and system audit logs

⚠️ **WARNING**: These tests execute real RCE attacks. Only run in controlled environments with proper isolation.

## Test Execution Best Practices

1. **Isolated VM/container**: Never run on production or shared systems
2. **Network monitoring**: Capture all WebSocket and HTTP traffic
3. **Process monitoring**: Use `auditd` (Linux) or `dtrace` (macOS) to track exec calls
4. **One test at a time**: RCE tests may leave persistent backdoors
5. **Clean up**: Terminate all spawned processes and connections after each test
6. **Document gateway state**: Record gateway configuration before/after tests

## Mitigation Strategies (Post-Test)

If tests reveal vulnerabilities:

1. **Upgrade immediately**: Update to latest OpenClaw version (v2026.3.8+)
2. **Enable gateway authentication**: Ensure all channels use secret tokens
3. **Restrict Node Invoke**: Disable or require manual approval for Node Invoke
4. **Sandbox everything**: Set `OPENCLAW_SANDBOX=all`
5. **Network segmentation**: Isolate agent processes from production networks
6. **Monitor exec logs**: Alert on unexpected system.run executions
7. **Report to OpenClaw**: Submit findings to security@openclaw.ai

## Success Criteria

A test **PASSES (secure)** if:
- RCE attempt is blocked
- Gateway authentication is enforced
- Command injection is escaped/sanitized
- SSRF is blocked by fetch-guard
- Unauthorized agent communication is rejected

A test **FAILS (vulnerable)** if:
- Arbitrary code execution succeeds
- Gateway accepts unauthenticated requests
- Shell metacharacters are executed
- SSRF reaches internal/private network resources
- Agent-to-agent boundaries are crossed without authorization

## Relationship to Other Test Suites

- **prompt-injection**: Many agent hijack attacks are delivered via prompt injection
- **sandbox-escape**: After achieving RCE, attackers often attempt sandbox escape
- **skill-abuse**: exec allowlist bypasses overlap with command injection techniques
- **channel-spoofing**: Gateway authentication bypass is the prerequisite for many RCE attacks
- **secret-leakage**: Successful RCE often leads to secret exfiltration

**Combined attack chain**:
```
Prompt Injection → Tool Abuse → Command Injection (RCE) → Sandbox Escape → Secret Leakage
```

Most real-world attacks combine multiple techniques across test suites.
