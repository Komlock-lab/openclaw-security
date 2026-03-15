# Path Traversal

## Overview

Path traversal vulnerabilities allow attackers to access files and directories outside the intended scope by manipulating file paths. In OpenClaw, these vulnerabilities have been found in plugin installation, file uploads, archive extraction, and sandbox media staging operations.

**Impact**: Arbitrary file read, file overwrite, sandbox escape, and potential remote code execution.

## Vulnerability List

### High Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-qrq5-wjgg-rvqw](https://github.com/openclaw/openclaw/security/advisories/GHSA-qrq5-wjgg-rvqw) | — | Path traversal during plugin installation | v2026.2.1 |
| [GHSA-cv7m-c9jx-vg7q](https://github.com/openclaw/openclaw/security/advisories/GHSA-cv7m-c9jx-vg7q) | — | Local file read via path traversal in browser uploads | v2026.2.14 |
| [GHSA-p25h-9q54-ffvw](https://github.com/openclaw/openclaw/security/advisories/GHSA-p25h-9q54-ffvw) | — | Zip Slip path traversal during tar extraction | v2026.2.22 |

### Medium Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-cfvj-7rx7-fc7c](https://github.com/openclaw/openclaw/security/advisories/GHSA-cfvj-7rx7-fc7c) | — | stageSandboxMedia destination symlink traversal can overwrite files outside sandbox workspace | v2026.3.2 |
| [GHSA-vhwf-4x96-vqx2](https://github.com/openclaw/openclaw/security/advisories/GHSA-vhwf-4x96-vqx2) | — | skills-install-download can be redirected outside the tools root by rebinding the validated base path | v2026.3.8 |
| [GHSA-3pxq-f3cp-jmxp](https://github.com/openclaw/openclaw/security/advisories/GHSA-3pxq-f3cp-jmxp) | — | Unified root-bound write hardening for browser output and related path-boundary flows | v2026.3.2 |

**Total**: 6 advisories (3 high, 3 medium)

## Attack Scenarios

### 1. Plugin Installation Path Traversal (GHSA-qrq5-wjgg-rvqw)

**Attack Vector**: During plugin installation, an attacker can craft a malicious plugin package with file paths containing `../` sequences to write files outside the plugin directory.

**Example**:
```
plugin-package/
  ../../../.ssh/authorized_keys  # Overwrites SSH keys
  ../../../.bashrc               # Injects malicious code
```

**Impact**: Arbitrary file write, leading to remote code execution.

### 2. Browser Upload Path Traversal (GHSA-cv7m-c9jx-vg7q)

**Attack Vector**: Manipulate file upload paths in browser-based tool outputs to read arbitrary local files.

**Example**:
```json
{
  "filePath": "../../../../../etc/passwd"
}
```

**Impact**: Local file read, exposing sensitive system configuration and credentials.

### 3. Zip Slip During Archive Extraction (GHSA-p25h-9q54-ffvw)

**Attack Vector**: Craft a malicious tar/zip archive with file entries containing `../` sequences. When extracted, files are written outside the intended directory.

**Example**:
```
malicious.tar:
  ../../../../tmp/malicious.sh
  ../../../../home/user/.bashrc
```

**Impact**: Arbitrary file overwrite, potential remote code execution.

### 4. Symlink Traversal in Sandbox Media (GHSA-cfvj-7rx7-fc7c)

**Attack Vector**: Use symbolic links to redirect `stageSandboxMedia` operations to write files outside the sandbox workspace.

**Example**:
```bash
ln -s /etc/passwd workspace/target
# stageSandboxMedia writes to /etc/passwd via symlink
```

**Impact**: Sandbox escape, arbitrary file overwrite.

### 5. Skills Install Download Rebinding (GHSA-vhwf-4x96-vqx2)

**Attack Vector**: During skill installation, rebind the validated base path to redirect downloads outside the tools root directory.

**Impact**: Arbitrary file write in unintended locations.

### 6. Browser Output Path Boundary (GHSA-3pxq-f3cp-jmxp)

**Attack Vector**: Exploit path boundary validation weaknesses in browser output flows to write files outside the designated root.

**Impact**: File system integrity compromise.

## Mitigation

### 1. Path Normalization and Validation

Always normalize and validate file paths before file system operations:

```javascript
const path = require('path');

function validatePath(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  const normalized = path.normalize(resolved);

  // Ensure the resolved path is within basePath
  if (!normalized.startsWith(path.resolve(basePath))) {
    throw new Error('Path traversal detected');
  }

  return normalized;
}
```

### 2. Disable Symlink Following

For critical operations, disable symlink following to prevent symlink-based traversal:

```javascript
const fs = require('fs');

fs.readFileSync(filePath, {
  flag: 'r',
  // Use lstat instead of stat to detect symlinks
});
```

### 3. Use Root-Bound Write APIs

Leverage OpenClaw's root-bound write APIs that enforce path boundaries:

```javascript
// Use OpenClaw's safe write API
await sandbox.writeFile(relativePath, content, {
  rootBound: true,  // Enforce root boundary
  followSymlinks: false
});
```

### 4. Archive Extraction Validation

When extracting archives, validate all entry paths:

```javascript
const tar = require('tar');

tar.extract({
  file: 'archive.tar',
  cwd: targetDir,
  filter: (path, entry) => {
    // Reject any path containing '../'
    if (path.includes('..')) {
      console.error(`Rejected path traversal: ${path}`);
      return false;
    }
    return true;
  }
});
```

### 5. Plugin Installation Validation

Validate plugin package contents before installation:

```javascript
function validatePluginPackage(packagePath) {
  const entries = getPackageEntries(packagePath);

  for (const entry of entries) {
    if (entry.path.includes('..') || path.isAbsolute(entry.path)) {
      throw new Error(`Invalid plugin path: ${entry.path}`);
    }
  }
}
```

### 6. Runtime Checks

Enable OpenClaw runtime checks for path traversal detection:

```bash
# Enable path traversal detection
openclaw --runtime-check path-boundary-validation
```

See [Hardening Guide](../best-practices/hardening-guide.md) for comprehensive runtime check configuration.

## Related Resources

- **Runtime Checks**: [Hardening Guide - Path Boundary Validation](../best-practices/hardening-guide.md#path-boundary-validation)
- **Testing**: Test cases available in `tests/sandbox-escape/` directory
- **Related Vulnerabilities**: [Sandbox Escape](./sandbox-escape.md), [RCE](./rce.md)

## References

- [CWE-22: Improper Limitation of a Pathname to a Restricted Directory](https://cwe.mitre.org/data/definitions/22.html)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Zip Slip Vulnerability](https://snyk.io/research/zip-slip-vulnerability)
