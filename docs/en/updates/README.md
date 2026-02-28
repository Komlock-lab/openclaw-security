# Update Information

Tracking security updates for OpenClaw and related libraries.

## Version Vulnerability Checker

Quickly check what vulnerabilities affect the OpenClaw version you're using.

```bash
# Check via script
npx tsx scripts/version-check.ts 2026.2.10

# Check via Claude Code command
/check-version 2026.2.10
```

## Version History Overview

OpenClaw was born in November 2025 and has changed names 4 times.

| Period | Name | Version Format |
|--------|------|---------------|
| 2025-11 | warelay | Semantic (v0.1.1~) |
| 2025-12 | clawdis | Semantic (v2.0.0-beta~) |
| 2026-01 | clawdbot | CalVer (2026.1.5~) |
| 2026-01-29~ | **openclaw** | CalVer (2026.1.29~) |

Currently releasing almost daily.

## Key Security Milestones

| Version | Date | Importance | Content |
|---------|------|------------|---------|
| **2026.2.26** | 02-27 | Latest | Sandbox bypass fix, Gateway auth fix |
| **2026.2.14** | 02-15 | Critical | **39 fixes at once** (including Critical RCE) |
| **2026.2.1** | 02-02 | Critical fix | Plugin path traversal, Telegram auth fix |
| **2026.1.29** | 01-30 | OpenClaw v1 | One-click RCE fix, name change |
| **2026.1.20** | 01-21 | Critical fix | Unauthenticated local RCE fix |

### Especially Dangerous Versions

- **Below 2026.2.14**: Critical RCE (Gateway approval bypass) unpatched. **Update immediately**
- **Below 2026.1.20**: Unauthenticated WebSocket RCE unpatched. **Extremely dangerous**

## Tracking Targets

- **OpenClaw core**: Release notes, security fixes
- **Major dependencies**: discord.js, grammY, Baileys, and other channel SDKs
- **Runtime**: Node.js security updates
