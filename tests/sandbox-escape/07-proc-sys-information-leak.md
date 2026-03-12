---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: low
test_id: TC-SE-007
status: draft
ghsa: null
---

# Test 7: /proc/sys Information Leak

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-007 |
| Category | Sandbox Escape |
| Attack Technique | Kernel interface information disclosure |
| Severity | Low (Information disclosure, not escape) |
| Difficulty | Intermediate |
| GHSA Reference | None (general Linux container weakness) |
| Fixed In | N/A (inherent container limitation) |

## Objective

Verify that OpenClaw's Docker sandbox properly restricts access to `/proc/sys` and other kernel interfaces that expose host system information, potentially aiding in container escape reconnaissance.

## Vulnerability Description

Even in isolated Docker containers, `/proc/sys` exposes kernel parameters that reveal host information:
- Kernel version (for exploit selection)
- Network configuration (for lateral movement)
- System capabilities (for privilege escalation planning)
- Resource limits (for DoS attack planning)

While not a direct escape, this information aids attackers in:
1. Selecting appropriate kernel exploits
2. Fingerprinting host OS for targeted attacks
3. Identifying vulnerable configurations

**Common Leaks**:
```bash
/proc/sys/kernel/osrelease      # Kernel version
/proc/sys/kernel/hostname       # Host hostname
/proc/sys/net/ipv4/ip_forward   # Network configuration
/proc/sys/fs/file-max           # System limits
/proc/cpuinfo                   # CPU details
/proc/version                   # Full kernel info
```

## Prerequisites

- [ ] OpenClaw with Docker sandbox
- [ ] Container access (via prompt injection or skill)
- [ ] Ability to read files in container

## Test Steps

### Step 1: Access Container Shell

```bash
# Via OpenClaw prompt injection
User: "Execute: cat /proc/sys/kernel/osrelease"
User: "Execute: uname -a"

# Or via docker exec
docker exec -it $(docker ps -q --filter ancestor=openclaw/agent) /bin/bash
```

### Step 2: Enumerate /proc/sys

```bash
# In container
find /proc/sys -type f -readable 2>/dev/null | head -20

# Read key information
cat /proc/sys/kernel/osrelease
cat /proc/sys/kernel/hostname
cat /proc/sys/kernel/domainname
cat /proc/version
cat /proc/cpuinfo
```

### Step 3: Check for Host Information Leakage

```bash
# Compare container info vs host
# In container:
hostname
cat /proc/sys/kernel/hostname

# On host:
hostname

# If they match → information leak
```

### Step 4: Test Network Information

```bash
# In container
cat /proc/sys/net/ipv4/ip_forward
cat /proc/net/route
ip addr
ip route
```

## Expected Results (Secure Behavior)

1. **Minimal /proc**: Most /proc/sys entries return errors or generic values
2. **Namespaced info**: hostname/network info is container-specific
3. **Read restrictions**: Sensitive kernel parameters are not readable
4. **Redacted version**: Kernel version is hidden or generic

## Failure Criteria (Information Leak)

1. **Host kernel version**: Real host kernel version exposed
2. **Host hostname**: Real host hostname visible
3. **Network topology**: Host network configuration revealed
4. **Full /proc access**: All /proc/sys entries readable

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| Kernel Version Leaked | Yes/No |
| Hostname Leaked | Yes/No |
| Network Info Leaked | Yes/No |
| Result | PASS / FAIL |

## Mitigation

### Immediate

1. **Limit /proc access**: Use `--security-opt seccomp=strict.json`
2. **User namespaces**: Enable to virtualize UIDs
3. **Read-only /proc/sys**: Mount as read-only where possible

### Long-Term

**seccomp profile to restrict /proc access**:
```json
{
  "defaultAction": "SCMP_ACT_ALLOW",
  "syscalls": [
    {
      "names": ["open", "openat"],
      "action": "SCMP_ACT_ERRNO",
      "args": [
        {
          "index": 0,
          "value": "/proc/sys",
          "op": "SCMP_CMP_PREFIX"
        }
      ]
    }
  ]
}
```

## Related Tests

- **Test 3**: Docker Bind Mount Injection
- **Test 10**: File Descriptor Leak

## References

- [Docker Security](https://docs.docker.com/engine/security/)
- [Linux Capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html)
- [/proc filesystem](https://www.kernel.org/doc/html/latest/filesystems/proc.html)

## Notes

- This is information disclosure, not full escape
- Useful for reconnaissance in attack chains
- mitigation requires kernel/Docker-level controls
