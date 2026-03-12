**English** | [日本語](README.ja.md)

# AuditClaw

A security audit toolkit for [OpenClaw](https://github.com/openclaw/openclaw). Scan for known vulnerabilities, check runtime configuration, and get actionable remediation steps.

## What You Get

```mermaid
graph LR
    A["**CLI Tool**\nOne-liner vulnerability scan"]
    B["**OpenClaw Skill**\nSay 'security scan' in chat"]
    C["**Knowledge Base**\nSecurity research & guides"]
```

## 1. CLI Tool (Full Version)

Comprehensive security scanner with vulnerability detection and runtime checks.

> **Note:** This tool is under development. To use it, clone the repository and run with `npm run dev`:

```bash
# Clone and setup
git clone https://github.com/natsuki/auditclaw.git
cd auditclaw
npm install

# Run commands
npm run dev scan          # Scan for vulnerabilities
npm run dev check         # Check runtime configuration
npm run dev report        # Generate comprehensive report
```

**What it checks:**
- **65+ known vulnerabilities** (GHSA/CVE) mapped by version (CalVer)
- **19 runtime configuration checks** - Sandbox, Gateway auth, exec allowlist, ACP dispatch, etc.
- **Permanent warnings** - Prompt injection risks, DM pairing brute-force, etc.

### Commands

```bash
# Scan specific version
npm run dev scan -- --version 2026.2.10

# Output formats
npm run dev scan -- --format md --output report.md
npm run dev scan -- --format json > scan-result.json

# Runtime configuration check
npm run dev check

# Interactive fix mode
npm run dev check -- --fix

# Comprehensive report (scan + check)
npm run dev report
```

Once published to npm, you'll be able to use `npx auditclaw` directly.

### Quick Scan (Lightweight)

No install required. Curl one-liner for quick vulnerability scan:

```bash
curl -sL https://raw.githubusercontent.com/natsuki/auditclaw/main/skill-dist/auditclaw-scan/scan.sh | bash
```

> **Note:** The curl one-liner only scans vulnerabilities. For runtime configuration checks, use the full CLI tool (`npx auditclaw check`).

## 2. OpenClaw Skill

Embed as a self-diagnostic skill inside OpenClaw. Once installed, just say "security scan" in chat.

```bash
cp -r skill-dist/auditclaw-scan /path/to/openclaw/skills/
```

The skill runs a full 6-phase scan: version detection, DB retrieval, vulnerability matching, config check, report generation, and action plan.

Details: [Skill Usage Guide](docs/en/skill/README.md)

## 3. Knowledge Base

Security research organized as a [GitBook](https://gitbook.io):

- [Vulnerability Cases](docs/en/vulnerabilities/README.md) - Prompt injection, sandbox escape, auth bypass, etc.
- [Update Information](docs/en/updates/README.md) - Version history and security milestones
- [Best Practices](docs/en/best-practices/README.md) - OWASP-based setup and hardening guides
- [Security Setup Guide](docs/en/best-practices/setup-guide.md) - Where to install, directory risks, secure configuration

## FAQ

**Does this tool access my code or secrets?**
No. It only reads its own vulnerability database and OpenClaw's version/config output. [Details](docs/en/best-practices/setup-guide.md#what-data-does-this-skill-access)

**Can OpenClaw access parent or sibling directories?**
Yes, if sandbox is disabled (the default). Enable sandbox with `openclaw config set sandbox all`. [Details](docs/en/best-practices/setup-guide.md#can-openclaw-access-parent-or-sibling-directories)

**What's the most secure setup?**
Enable sandbox, restrict exec allowlist, set webhook secrets, enable auto-update. [Full guide](docs/en/best-practices/setup-guide.md#hardened-recommended-for-production)

**Can I run it without installing?**
Yes. The curl one-liner leaves nothing except `/tmp/openclaw-vuln-db.json` (temporary).

## Disclaimer

This tool is provided as-is for informational and defensive security purposes only. Install and use at your own risk. The authors assume no liability for any damages resulting from its use. Always verify findings against [official OpenClaw security advisories](https://github.com/openclaw/openclaw/security/advisories).

## For Contributors

This project uses Claude Code slash commands for research automation:

```bash
/research-vuln prompt-injection       # Research vulnerability cases
/research-updates openclaw            # Research update information
/check-version 2026.2.10             # Version vulnerability diagnostics
/create-testcase prompt-injection     # Create attack test cases
```

## Directory Structure

```
data/             # Canonical data source (vulnerability-db.json)
docs/             # GitBook documentation (en/ + ja/)
i18n/             # Multilingual translation overlays
knowledge/        # Raw research data (knowledge base)
skill-dist/       # Distributable skills (auditclaw-scan)
tests/            # Attack test cases
reports/          # Verification reports
scripts/          # Utility scripts
```
