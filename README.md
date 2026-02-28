**English** | [日本語](README.ja.md)

# AuditClaw

A repository for improving the security of OpenClaw.

## Why This Matters

[OpenClaw](https://github.com/openclaw/openclaw) (230K+ stars, open-source AI assistant) is powerful, but comes with significant security risks:

- 160+ published security advisories
- Sandbox disabled by default
- No systematic prompt injection defense
- Vast attack surface across 15+ messaging platforms

## What We Do

```mermaid
graph LR
    A["Research"] --> B["Test"] --> C["Defend"]
```

1. **Research**: Collect vulnerability cases, CVEs, and update information
2. **Test**: Create attack test cases and run simulated attacks against bots
3. **Defend**: Compile best practices and produce security guides

## Usage (Claude Code Slash Commands)

### Research
```bash
/research-vuln prompt-injection       # Research vulnerability cases
/research-updates openclaw            # Research update information
/research-bestpractice llm-security   # Research best practices
```

### Version Diagnostics
```bash
/check-version 2026.2.10             # Diagnose vulnerabilities for a version

# Or run directly via script
npx tsx scripts/version-check.ts 2026.2.10
```

### Testing
```bash
/create-testcase prompt-injection     # Create attack test cases
/run-test prompt-injection            # Run tests
```

### Reporting
```bash
/generate-report security-posture     # Generate security posture report
```

## Quick Scan

```bash
curl -sL https://raw.githubusercontent.com/natsuki/auditclaw/main/skill-dist/auditclaw-scan/scan.sh | bash
```

That's it. Auto-detects your OpenClaw version and outputs a Markdown security report. To scan a specific version:

```bash
curl -sL https://raw.githubusercontent.com/natsuki/auditclaw/main/skill-dist/auditclaw-scan/scan.sh | bash -s 2026.2.10
```

## OpenClaw Skill Integration

Embed as a self-diagnostic skill in OpenClaw. Just say "security scan" in chat.

Details: [Skill Usage Guide](docs/en/skill/README.md)

## FAQ

**Does this skill access my code or secrets?**
No. It only reads its own `vulnerability-db.json` and OpenClaw's version/config output. It does not touch your files. [Details](docs/en/best-practices/setup-guide.md#what-data-does-this-skill-access)

**Can OpenClaw access parent or sibling directories?**
Yes, if sandbox is disabled (the default). This is an OpenClaw-level risk, not specific to this skill. Enable sandbox with `openclaw config set sandbox all`. [Details](docs/en/best-practices/setup-guide.md#can-openclaw-access-parent-or-sibling-directories)

**Where should I set this up?**
Use a dedicated, isolated directory. Keep sensitive files outside the OpenClaw workspace. [Recommended directory structure](docs/en/best-practices/setup-guide.md#directory-structure-secure-vs-insecure)

**What's the most secure setup?**
Enable sandbox, restrict exec allowlist, set webhook secrets, and enable auto-update. [Full security setup guide](docs/en/best-practices/setup-guide.md#hardened-recommended-for-production)

**Can I run it without installing as a skill?**
Yes. The curl one-liner installs nothing. The only file left after execution is `/tmp/openclaw-vuln-db.json` (temporary). Just use "Quick Scan" above.

## Disclaimer

This tool is provided as-is for informational and defensive security purposes only. Install and use at your own risk. The authors assume no liability for any damages resulting from its use. Always verify findings against [official OpenClaw security advisories](https://github.com/openclaw/openclaw/security/advisories).

## Knowledge Base (GitBook)

Research results are organized in `docs/` and published via GitBook.

## Directory Structure

```
data/             # Canonical data source (vulnerability-db.json)
docs/             # GitBook documentation (en/ + ja/)
i18n/             # Multilingual translation overlays
knowledge/        # Raw research data (knowledge base)
skill-dist/       # Distributable skills (security self-scan)
tests/            # Attack test cases
reports/          # Verification reports
scripts/          # Utility scripts
.claude/skills/   # Research & test automation skills
.claude/commands/ # Slash command definitions
```
