---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: low
test_id: TC-SE-010
status: draft
ghsa: null
---

# Test 10: File Descriptor Leak

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-010 |
| Category | Sandbox Escape |
| Attack Technique | Inherited file descriptor exploitation |
| Severity | Low (Theoretical risk) |
| Difficulty | Advanced |
| GHSA Reference | None (no known OpenClaw CVE) |
| Fixed In | N/A |

## Objective

Verify that OpenClaw properly closes file descriptors before spawning sandboxed processes, preventing child processes from accessing parent's file handles.

## Vulnerability Description

When processes spawn children, open file descriptors are inherited by default (unless `FD_CLOEXEC` is set). If parent has sensitive files open, child can access them via inherited FDs.

**Attack**:
```
Parent process (OpenClaw):
  FD 3: /etc/secrets.txt (open)
  ↓ spawn child
Child process (sandboxed):
  FD 3: still points to /etc/secrets.txt
  read(3, buffer, size) → reads parent's file!
```

## Prerequisites

- [ ] OpenClaw spawning child processes
- [ ] Access to enumerate FDs in child (`/proc/self/fd/`)
- [ ] Parent has sensitive files open

## Test Steps

### Step 1: Check Parent FDs

```bash
# List OpenClaw process FDs
ls -l /proc/$(pgrep openclaw)/fd/
```

### Step 2: Spawn Child and Check FDs

```bash
# In sandboxed child process
User: "Execute: ls -l /proc/self/fd/"
User: "Execute: cat /proc/self/fd/3"  # Try reading inherited FDs
```

### Step 3: Attempt to Read Inherited FDs

```bash
# Try reading FDs 0-100
for i in {0..100}; do
  cat /proc/self/fd/$i 2>/dev/null && echo "FD $i readable"
done
```

## Expected Results (Secure)

1. **FD_CLOEXEC set**: All parent FDs have close-on-exec flag
2. **Minimal FDs**: Child only has stdin/stdout/stderr (0,1,2)
3. **No inherited FDs**: No access to parent's files

## Failure Criteria (Vulnerable)

1. **Inherited FDs**: Child has FDs > 2
2. **Readable FDs**: Child can read parent's files via FDs
3. **No FD_CLOEXEC**: Flags not set properly

## Mitigation

```javascript
// Set FD_CLOEXEC on all file descriptors
const fs = require('fs');

function setCloseOnExec(fd) {
  const flags = fs.fcntlSync(fd, fs.constants.F_GETFD);
  fs.fcntlSync(fd, fs.constants.F_SETFD, flags | fs.constants.FD_CLOEXEC);
}

// Apply to all open FDs before spawn
for (let fd = 3; fd < 1024; fd++) {
  try {
    setCloseOnExec(fd);
  } catch (e) {
    // FD not open, ignore
  }
}
```

## References

- [File Descriptor Leaks](https://owasp.org/www-community/vulnerabilities/Insecure_Temporary_File)
- [FD_CLOEXEC documentation](https://man7.org/linux/man-pages/man2/fcntl.2.html)

## Notes

- Theoretical risk — no known OpenClaw exploitation
- Defense-in-depth measure
- Modern Node.js sets FD_CLOEXEC by default
