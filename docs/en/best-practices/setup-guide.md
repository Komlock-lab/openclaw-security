# Security Setup Guide

Best practices for securely setting up and using the OpenClaw Security Scan skill.

## Directory Placement Risks

### Can OpenClaw access parent or sibling directories?

**Yes, if sandbox is disabled (the default).**

When `sandbox.mode` is `off` (default), OpenClaw has full filesystem access through its tools—`exec`, browser automation, file reads, etc. This means:

```
~/projects/
├── openclaw/                  # OpenClaw installation
├── openclaw-security-scan/    # This skill (sibling)
├── my-secret-project/         # ← OpenClaw CAN access this
└── .env                       # ← OpenClaw CAN access this
```

Even if the skill is in a child directory:

```
~/projects/openclaw/
├── skills/
│   └── openclaw-security-scan/   # This skill
├── config.json
└── ../../my-secret-project/      # ← OpenClaw CAN traverse up
```

**Key point**: The risk is not from this skill—`scan.sh` only reads its own `vulnerability-db.json` and outputs a report. The risk is from OpenClaw itself having unrestricted filesystem access.

### What data does this skill access?

This skill accesses **only**:
1. `vulnerability-db.json` (bundled or fetched from GitHub)
2. `openclaw --version` output (for auto-detection)
3. `openclaw config get` output (for runtime checks)

It does **not** read your code, secrets, conversation history, or any other files.

## Recommended Setup

### Minimum (Quick Scan via curl)

No installation needed. Nothing is persisted on your system except a temporary DB file at `/tmp/openclaw-vuln-db.json`.

```bash
curl -sL https://raw.githubusercontent.com/natsuki/openclaw-security/main/skill-dist/openclaw-security-scan/scan.sh | bash
```

### Standard (Skill Installation)

Install the skill in OpenClaw's skill directory:

```bash
cp -r openclaw-security-scan /path/to/openclaw/skills/
```

### Hardened (Recommended for Production)

1. **Enable sandbox**—this is the single most important step:
   ```bash
   openclaw config set sandbox all
   ```

2. **Isolate the skill directory**: Place it inside OpenClaw's skill directory, not alongside sensitive projects.

3. **Restrict exec allowlist**: Only permit the commands your workflows actually need:
   ```bash
   openclaw config set exec.allowlist '["node","bash"]'
   ```

4. **Enable Gateway authentication** if using remote connections:
   ```bash
   openclaw config set gateway.auth true
   ```

5. **Set webhook secrets** on all endpoints:
   ```bash
   openclaw config set webhook.secret '<your-secret>'
   ```

6. **Enable auto-update** to receive security patches promptly:
   ```bash
   openclaw config set autoUpdate true
   ```

## Directory Structure: Secure vs. Insecure

### Insecure (avoid)

```
~/
├── .env                          # API keys
├── .ssh/                         # SSH keys
├── openclaw/
│   └── skills/
│       └── openclaw-security-scan/
└── client-projects/
    ├── project-a/                # Client code
    └── project-b/                # Client code
```

With sandbox off, OpenClaw can access `~/.env`, `~/.ssh/`, and all client projects.

### Secure (recommended)

```
~/openclaw-workspace/             # Dedicated, isolated directory
├── openclaw/
│   ├── config.json               # sandbox: all
│   └── skills/
│       └── openclaw-security-scan/
└── workspace/                    # Only files OpenClaw should access
```

Sensitive files (`~/.env`, `~/.ssh/`, client projects) are **outside** the workspace. With sandbox enabled, OpenClaw is confined to the workspace directory.

## Sandbox Modes

| Mode | Filesystem Access | Recommendation |
|------|------------------|----------------|
| `off` (default) | **Full access** to entire filesystem | Do not use in production |
| `workspace` | Restricted to workspace directory | Minimum for production |
| `all` | Fully sandboxed (Docker) | **Recommended** |

```bash
# Check current setting
openclaw config get sandbox

# Enable full sandbox
openclaw config set sandbox all
```

## Network Security

- This skill makes **one outbound HTTPS request** to `raw.githubusercontent.com` to fetch the latest vulnerability DB
- If you are in an air-gapped environment, it falls back to the bundled DB (no network required)
- No data is sent from your system to any external service

## Verification Checklist

After setup, verify your security posture:

- [ ] `openclaw config get sandbox` returns `all` or `workspace`
- [ ] `openclaw config get gateway.auth` returns `true`
- [ ] `openclaw config get webhook.secret` is set
- [ ] `openclaw config get exec.allowlist` is restricted
- [ ] `openclaw config get autoUpdate` returns `true`
- [ ] Sensitive files are outside the OpenClaw workspace directory
- [ ] Run `curl -sL .../scan.sh | bash` and confirm 0 Critical findings
