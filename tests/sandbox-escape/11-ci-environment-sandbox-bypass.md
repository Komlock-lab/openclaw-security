---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: high
test_id: TC-SE-011
status: draft
ghsa: null
---

# Test 11: CI Environment Sandbox Bypass

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-011 |
| Category | Sandbox Escape |
| Attack Vector | CI/CD pipeline sandbox configuration |
| Severity | High |
| Difficulty | Advanced |
| GHSA Reference | None (general CI/CD pattern, related to hackerbot-claw campaign) |
| Fixed In | N/A (configuration issue) |

## Objective

Verify that OpenClaw running in CI/CD environments (GitHub Actions, GitLab CI, etc.) has proper sandbox configuration and cannot be bypassed through CI-specific environment variables or Docker configurations.

## Vulnerability Description

CI/CD environments often:
- Run containers with elevated privileges
- Mount host directories for caching
- Use Docker-in-Docker (DinD) patterns
- Expose CI secrets as environment variables

**hackerbot-claw campaign (March 2026)**: Attackers exploited GitHub Actions with `pull_request_target` trigger:
1. Malicious PR modifies `.github/workflows/`
2. Workflow runs with write token and secrets
3. Workflow spawns OpenClaw with `OPENCLAW_SANDBOX=off`
4. OpenClaw executes attacker code with full CI privileges

**Attack Pattern**:
```yaml
# Vulnerable GitHub Actions workflow
name: Test
on: pull_request_target  # ⚠️ Dangerous with untrusted code

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # Untrusted code

      - name: Run OpenClaw
        env:
          OPENCLAW_SANDBOX: off  # ⚠️ Sandbox disabled in CI
        run: openclaw test
```

## Prerequisites

- [ ] OpenClaw configured for CI/CD
- [ ] GitHub Actions, GitLab CI, or similar
- [ ] Access to CI configuration files
- [ ] Ability to trigger CI runs (malicious PR)

## Test Steps

### Step 1: Review CI Configuration

```bash
# Check CI workflow files
cat .github/workflows/*.yml
cat .gitlab-ci.yml

# Look for dangerous patterns:
grep -r "pull_request_target" .github/
grep -r "OPENCLAW_SANDBOX.*off" .github/
grep -r "actions/checkout.*head.sha" .github/
grep -r "docker.*--privileged" .github/
```

### Step 2: Check Sandbox Configuration in CI

```yaml
# In CI workflow
- name: Check OpenClaw sandbox
  run: |
    openclaw doctor | grep -i sandbox
    echo "OPENCLAW_SANDBOX=$OPENCLAW_SANDBOX"
    docker inspect $(docker ps -q) | jq '.[0].HostConfig.Privileged'
```

### Step 3: Test Sandbox Bypass via PR

```yaml
# Malicious PR: Modify .github/workflows/test.yml
- name: Bypass sandbox
  env:
    OPENCLAW_SANDBOX: off
  run: |
    openclaw execute "cat /etc/passwd"
    openclaw execute "env | grep SECRET"
```

### Step 4: Test Docker-in-Docker Escape

```bash
# If CI uses Docker-in-Docker
- name: Test DinD escape
  run: |
    docker run --rm -v /:/host alpine cat /host/etc/passwd
```

### Step 5: Verify Secret Exposure

```bash
# Check if CI secrets are accessible
- name: Check secrets
  run: |
    env | grep -i secret
    env | grep -i token
    openclaw execute "echo $GITHUB_TOKEN"
```

## Expected Results (Secure)

1. **Sandbox always enabled**: `OPENCLAW_SANDBOX=all` in CI
2. **No pull_request_target**: Use `pull_request` trigger only
3. **No privileged Docker**: Containers run without `--privileged`
4. **Secret protection**: Secrets not exposed to untrusted code
5. **CODEOWNERS**: `.github/` requires review

## Failure Criteria (Vulnerable)

1. **Sandbox disabled**: `OPENCLAW_SANDBOX=off` in CI
2. **pull_request_target used**: With untrusted code checkout
3. **Privileged containers**: Docker runs with elevated privileges
4. **Secret leakage**: CI secrets accessible to OpenClaw

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| CI Platform | GitHub Actions / GitLab CI / etc. |
| Sandbox Config | - |
| Result | PASS / FAIL |

## Mitigation

### Immediate Actions

1. **Fix workflows**: Change `pull_request_target` to `pull_request`
   ```yaml
   on:
     pull_request:  # ✓ Safe — runs in fork context
   ```

2. **Enable sandbox**: Force `OPENCLAW_SANDBOX=all` in CI
   ```yaml
   env:
     OPENCLAW_SANDBOX: all  # ✓ Always sandboxed
   ```

3. **Add CODEOWNERS**:
   ```
   # .github/CODEOWNERS
   .github/ @security-team
   CLAUDE.md @security-team
   .claude/ @security-team
   ```

### Long-Term Fixes

**Secure GitHub Actions pattern**:
```yaml
name: Secure Test
on:
  pull_request:  # ✓ Runs in fork context, no write token

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        # ✓ No need to specify ref — safe default

      - name: Run OpenClaw Tests
        env:
          OPENCLAW_SANDBOX: all  # ✓ Enforced
        run: |
          # Verify sandbox is enabled
          if [ "$OPENCLAW_SANDBOX" != "all" ]; then
            echo "ERROR: Sandbox must be enabled"
            exit 1
          fi
          openclaw test
```

**Security scanning in CI**:
```yaml
- name: Security Scan
  run: |
    npx auditclaw scan
    npx auditclaw check

    # Fail on high/critical findings
    npx auditclaw scan --format json | jq -e '.high + .critical == 0'
```

## CI Platform Comparison

| Platform | pull_request_target | Sandbox Control | Risk Level |
|----------|---------------------|-----------------|------------|
| GitHub Actions | Yes (dangerous) | Environment variables | High |
| GitLab CI | N/A (different model) | .gitlab-ci.yml | Medium |
| CircleCI | N/A | config.yml | Medium |
| Jenkins | N/A | Jenkinsfile | Varies |

## Related Tests

- **Test 3**: Docker Bind Mount Injection — Similar container escape patterns
- **Test 12**: Plugin Install Path Traversal — Supply chain attacks

## References

- [hackerbot-claw Campaign](../../knowledge/vulnerabilities/supply-chain/2026-03-08-hackerbot-claw-gha-campaign.md)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Keeping your GitHub Actions secure](https://securitylab.github.com/research/github-actions-preventing-pwn-requests/)
- [Runtime Check RC-008](../../data/vulnerability-db.json) — pull_request_target usage
- [Permanent Warning PW-004](../../data/vulnerability-db.json) — CLAUDE.md poisoning

## Attack Scenario

**hackerbot-claw campaign**:

```
1. Attacker forks OpenClaw project
   ↓
2. Creates malicious PR modifying .github/workflows/test.yml
   ↓
3. Workflow uses pull_request_target (runs with write token)
   ↓
4. Workflow checks out attacker's code
   ↓
5. Modified CLAUDE.md injects prompt to disable sandbox
   ↓
6. OpenClaw runs with OPENCLAW_SANDBOX=off
   ↓
7. Attacker exfiltrates $GITHUB_TOKEN
   ↓
8. Uses token to push backdoor to main branch
```

**Impact**: Repository compromise, secret theft, supply chain attack.

## Detection

**Check for vulnerable workflows**:
```bash
# Scan GitHub Actions workflows
gh api repos/{owner}/{repo}/actions/workflows \
  | jq '.workflows[] | select(.path | contains("pull_request_target"))'

# Or use AuditClaw
npx auditclaw check
# → RC-008: FAIL if pull_request_target detected
```

## Notes

- This test requires CI/CD access
- Always test in non-production environments
- CI sandbox bypass is a major supply chain risk
- Clean up test PRs after testing
