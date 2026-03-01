# Prompt Injection

> Last updated: 2026-02-27

## Overview

Prompt injection is ranked **#1 (LLM01)** in the OWASP LLM Top 10 2025, making it the most representative attack technique against LLM applications. Attackers rewrite LLM behavior through user input or external data, causing unintended operations.

## Classification

| Type | Description |
|------|-------------|
| **Direct Injection** | Malicious instructions directly included in user input |
| **Indirect Injection** | Instructions embedded in external data such as web pages, files, or images |

## Risk in OpenClaw

OpenClaw possesses all elements of the **"Lethal Trifecta"**:

1. **Access to private data**: Secret management, conversation history
2. **Processing untrusted content**: External messages, URLs, file attachments
3. **External communication capability**: Multi-channel communication, webhooks, browser automation

### Attack Vectors

| Vector | OpenClaw Equivalent |
|--------|-------------------|
| Text messages | Message input across all channels |
| Image/file attachments | Multimodal processing |
| URL sharing | Browser automation, link previews |
| Group chat | Discord/Slack/Telegram groups |
| Webhook/API | Webhooks feature |
| Agent-to-Agent | Multi-agent communication |
| Skill files | Skill installation via ClawHub |

## Major Cases (2024-2026)

### ChatGPT SpAIware - Memory Persistence Attack (2024)

An attack that exploits ChatGPT's memory feature via indirect prompt injection to embed long-term persistent spyware. Simply processing a malicious website causes data exfiltration across all subsequent conversations.

- **Discoverer**: Johann Rehberger
- **Mitigation**: OpenAI fixed in September 2024 (url_safe API verification)

### GitHub Copilot RCE (CVE-2025-53773)

Indirect prompt injection enables YOLO mode (auto-approve all operations) and achieves arbitrary code execution on developer machines. Configuration file auto-rewrite is the core technique.

- **Mitigation**: Fixed in August 2025 Patch Tuesday

### Claude Code DNS Exfiltration (CVE-2025-55284)

During review of untrusted code, API keys are encoded in DNS request subdomains for external exfiltration. Exploits the allowlisted `ping` command.

- **CVSS**: 7.1 (High)
- **Mitigation**: Anthropic fixed in June 2025 by excluding ping

### Manus AI Kill Chain (2025)

Injection embedded in a PDF exposes the autonomous agent's internal VS Code Server to the internet, achieving full remote access.

### AgentHopper - AI Virus (2025)

A PoC AI virus that self-propagates across multiple coding agents. Injects infection payloads into Git repositories, compromising the entire supply chain.

### Scary Agent Skills - Invisible Unicode Attack (2026)

A supply chain attack that embeds invisible injections in AI agent skill files using Unicode tags. Undetectable by human review.

## OpenClaw Status (as of 2026-02-27)

### Official Stance
- Prompt injection alone is **out of scope** (when not accompanied by boundary violation)
- Security boundaries are enforced via non-prompt mechanisms (authentication, tool policies, sandbox, exec approval)

### Unpatched Issues (OPEN)
- Fake system message injection via URL link preview metadata
- Fake system message injection during context compression
- Content contamination in Telegram pipeline
- `WORKFLOW_AUTO.md` payload repeatedly observed across multiple channels

### Proposed but Unimplemented Defenses
- Echo Guard, Content Trust Gateway, Shield.md, etc.

## Recommended Countermeasures (by Priority)

| Priority | Countermeasure |
|----------|---------------|
| **P0** | Human-in-the-loop for high-risk operations |
| **P0** | Input sanitization across all channels |
| **P0** | Least privilege for LLM and skills |
| **P0** | Block data exfiltration channels (URL/DNS/HTTP) |
| **P1** | Code signing for ClawHub skills + invisible Unicode detection |
| **P1** | Mutual authentication and privilege separation for agent communication |
| **P1** | Prevent automatic configuration file changes |
| **P2** | Sensitive information masking in LLM output |
| **P2** | Audit logging for all tool invocations |

## Test Your Defense

Want to verify how your OpenClaw instance holds up against these attacks? The testing guide covers 27 practical tests — from basic "ignore previous instructions" to advanced supply chain and side-channel attacks.

**[Prompt Injection Testing Guide (27 tests)](../test-cases/prompt-injection-guide.md)**

You can also run the automated risk assessment:

```bash
bash scan.sh
```

The scan report includes a **Prompt Injection Risk Assessment** section (RC-007 through RC-012) that checks your configuration for PI exposure.

## References

- [OWASP LLM01:2025 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Greshake et al. Indirect Prompt Injection](https://arxiv.org/abs/2302.12173)
- [Simon Willison: The Lethal Trifecta](https://simonwillison.net/2025/Jun/14/the-lethal-trifecta/)
- [Embrace The Red Blog](https://embracethered.com/blog/)
