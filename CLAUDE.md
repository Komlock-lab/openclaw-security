# AuditClaw

Repository for improving OpenClaw security. Covers attack test case creation/execution and security knowledge accumulation.

## Project Structure

```
auditclaw/
├── .claude/commands/    # Slash commands
├── .claude/skills/      # Skill definitions
├── data/                # Canonical data source
│   └── vulnerability-db.json  # Vulnerability database (single source of truth)
├── i18n/                # Multilingual translation overlays
│   └── ja/              # Japanese translations
├── docs/                # GitBook documentation (managed via SUMMARY.md)
│   ├── en/              # English documentation (primary)
│   └── ja/              # Japanese documentation
├── knowledge/           # Internal knowledge (raw research data)
├── skill-dist/          # Distributable skills
│   └── auditclaw-scan/  # Security self-scan skill
├── tests/               # Attack test cases (by category)
├── reports/             # Verification reports
├── scripts/             # Utility scripts
└── book.json            # GitBook configuration
```

## GitBook Publishing

- `docs/` is the GitBook root directory
- `docs/en/SUMMARY.md` and `docs/ja/SUMMARY.md` manage the table of contents
- Research results are saved to `knowledge/` then refined into `docs/` as published documentation
- Published via GitBook: https://gitbook.io

## Slash Commands

### Research
| Command | Description |
|---------|-------------|
| `/research-vuln [category]` | Research vulnerability cases (CVE, GitHub Advisory, etc.) |
| `/research-updates [target]` | Research version updates and security fixes |
| `/research-bestpractice [topic]` | Research best practices from OWASP, etc. |

### Diagnostics
| Command | Description |
|---------|-------------|
| `/check-version [version]` | Diagnose vulnerabilities for a specific version |

### Testing
| Command | Description |
|---------|-------------|
| `/create-testcase [category]` | Design and create attack test cases |
| `/run-test [path or category]` | Execute test cases |
| `/generate-report [type]` | Generate verification reports |

### Build
| Command | Description |
|---------|-------------|
| `/build-scan-skill` | Build security scan skill (JSON copy + integrity check) |

## Attack Categories

| Category | Description |
|----------|-------------|
| `prompt-injection` | Prompt injection attacks |
| `sandbox-escape` | Sandbox escape |
| `skill-abuse` | Skill system abuse |
| `channel-spoofing` | Channel spoofing |
| `secret-leakage` | Secret leakage |
| `agent-hijack` | Agent communication hijacking |

## Skill Hierarchy

```
Level 1: Basic Skills
  └── web_search        # Web search (Brave Search API)

Level 2: Research Skills
  ├── vuln_research     # Vulnerability case research
  ├── update_watch      # Update monitoring
  └── bestpractice_research # Best practice research

Level 3: Test Skills
  └── attack_test       # Attack test design

Common:
  ├── security_rules    # Common security research rules
  └── output_format     # Unified output format rules
```

## Knowledge Storage Rules

- Filename: `{YYYY-MM-DD}-{slug}.md`
- Frontmatter required (date, category, severity, source, etc.)
- Append index entry to `knowledge/index.md`
- For English sources, add a Japanese summary

## Target Project

- **OpenClaw**: https://github.com/openclaw/openclaw
- **Tech Stack**: TypeScript, Node.js >= 22
- **Latest Version**: v2026.2.26
