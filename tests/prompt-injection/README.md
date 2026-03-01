# Prompt Injection Tests

Attack test cases for prompt injection vulnerabilities in OpenClaw.

## Overview

Prompt injection is the most fundamental and unresolved threat to LLM-based agents. Unlike traditional software vulnerabilities that can be patched, prompt injection exploits the inherent nature of how language models process instructions mixed with data.

This test suite covers two dimensions:
- **Part 1 (Tests 1-11)**: Attack **vectors** — where injections enter the system
- **Part 2 (Tests 12-27)**: Attack **techniques** — how the model is tricked

## Test Index

### Part 1: Vector-Based Tests

| # | Test | Difficulty | Target | Guide |
|---|------|------------|--------|-------|
| 1 | Direct Prompt Injection | Beginner | Basic defense | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-1-direct-prompt-injection-beginner) |
| 2 | System Prompt Extraction | Beginner | Information leakage | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-2-system-prompt-extraction-beginner) |
| 3 | Tool Abuse | Intermediate | Tool call control | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-3-tool-abuse-intermediate) |
| 4 | Jailbreak (Roleplay) | Intermediate | Guardrails | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-4-jailbreak-via-roleplay-intermediate) |
| 5 | Indirect Injection (File) | Intermediate | External data processing | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-5-indirect-injection-via-file-intermediate) |
| 6 | URL Metadata Injection | Advanced | Issue #22060 (unresolved) | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-6-url-metadata-injection-advanced) |
| 7 | Context Compression Fake System Msg | Advanced | Issue #26851 (unresolved) | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-7-fake-system-message-via-context-compression-advanced) |
| 8 | Telegram Pipeline Injection | Advanced | Issue #25423 (unresolved) | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-8-telegram-pipeline-injection-advanced) |
| 9 | Skill Supply Chain Attack | Advanced | Invisible Unicode / SKILL.md | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-9-skill-supply-chain-attack-advanced) |
| 10 | Data Exfiltration via Side Channels | Advanced | DNS/HTTP exfiltration | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-10-data-exfiltration-via-side-channels-advanced) |
| 11 | Webhook/API Injection | Advanced | Slack/Discord/Webhook | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-11-webhookapi-injection-advanced) |

### Part 2: Technique-Based Tests

| # | Test | Difficulty | Technique Category | Guide |
|---|------|------------|-------------------|-------|
| 12 | Base64 Encoding Attack | Beginner | Encoding/Obfuscation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-12-base64-encoding-attack-beginner) |
| 13 | ROT13 / Caesar Cipher Attack | Beginner | Encoding/Obfuscation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-13-rot13--caesar-cipher-attack-beginner) |
| 14 | Leet Speak / Character Substitution | Beginner | Encoding/Obfuscation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-14-leet-speak--character-substitution-beginner) |
| 15 | Payload Splitting & Reassembly | Beginner | Payload Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-15-payload-splitting--reassembly-beginner) |
| 16 | Language Switching Attack | Beginner | Language/Translation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-16-language-switching-attack-beginner) |
| 17 | Negation / Double Negation Trick | Beginner | Logic Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-17-negation--double-negation-trick-beginner) |
| 18 | Delimiter Confusion / Tag Injection | Intermediate | Structure Abuse | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-18-delimiter-confusion--tag-injection-intermediate) |
| 19 | Code Block Disguise | Intermediate | Structure Abuse | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-19-code-block-disguise-intermediate) |
| 20 | JSON/YAML Injection | Intermediate | Structure Abuse | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-20-jsonyaml-injection-intermediate) |
| 21 | Translation Task Disguise | Intermediate | Language/Translation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-21-translation-task-disguise-intermediate) |
| 22 | Authority Spoofing / Developer Mode | Intermediate | Social Engineering | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-22-authority-spoofing--developer-mode-intermediate) |
| 23 | Token Smuggling / Completion Hijacking | Intermediate | Output Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-23-token-smuggling--completion-hijacking-intermediate) |
| 24 | Output Format Manipulation | Intermediate | Output Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-24-output-format-manipulation-intermediate) |
| 25 | Conversation History Spoofing | Intermediate | Context Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-25-conversation-history-spoofing-intermediate) |
| 26 | Agreement Priming / Yes-Ladder | Intermediate | Social Engineering | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-26-agreement-priming--yes-ladder-intermediate) |
| 27 | Few-Shot Example Manipulation | Intermediate | Context Manipulation | [Guide](../../docs/en/test-cases/prompt-injection-guide.md#test-27-few-shot-example-manipulation-intermediate) |

## Test Coverage Matrix

| Technique Category | Tests | Count |
|-------------------|-------|-------|
| Encoding/Obfuscation | 12, 13, 14 | 3 |
| Payload Manipulation | 15 | 1 |
| Language/Translation | 16, 21 | 2 |
| Logic Manipulation | 17 | 1 |
| Structure Abuse | 18, 19, 20 | 3 |
| Social Engineering | 22, 26 | 2 |
| Output Manipulation | 23, 24 | 2 |
| Context Manipulation | 25, 27 | 2 |

## Related Resources

- [Prompt Injection Vulnerability Research](../../docs/en/vulnerabilities/prompt-injection.md)
- [PI Attack Techniques Taxonomy](../../knowledge/vulnerabilities/prompt-injection/2026-03-01-pi-attack-techniques-taxonomy.md)
- [AuditClaw Scan — PI Risk Assessment](../../skill-dist/auditclaw-scan/)
- [OWASP LLM Top 10 — LLM01: Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

## Key Open Issues

| Issue | Description | Status |
|-------|-------------|--------|
| [#22060](https://github.com/openclaw/openclaw/issues/22060) | URL metadata injection vector | Open |
| [#26851](https://github.com/openclaw/openclaw/issues/26851) | Context compression fake system messages | Open |
| [#25423](https://github.com/openclaw/openclaw/issues/25423) | Telegram pipeline injection | Open |
