# OWASP LLM Top 10 Coverage Mapping

## Overview

The [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) (2025 Edition) provides a framework for understanding security risks specific to LLM-based applications. This document maps OpenClaw's vulnerability landscape and AuditClaw's test/knowledge coverage to each OWASP LLM risk category, identifying gaps and prioritizing remediation efforts.

**Coverage Status**: 3/7 applicable categories fully addressed (excluding 3 out-of-scope categories)

**Last Updated**: 2026-03-12

## Coverage Mapping

### LLM01: Prompt Injection

**Risk Overview**: Malicious prompts that alter LLM behavior or bypass intended restrictions.

**OpenClaw Context**: 15+ input channels (Discord, Slack, Telegram, etc.), URL preview injection, context compression boundary attacks.

**OpenClaw Policy**: Prompt injection alone is out of scope unless it breaches policy, authentication, or sandbox boundaries.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 29 | `tests/prompt-injection/` |
| Knowledge Articles | 4 | PI investigation, mitigation, technique taxonomy, hackerbot-claw |
| Vulnerability DB | 2 advisories | — |
| **Assessment** | — | **✅ Comprehensive** - Most thoroughly covered category |

**Gaps**:
- Context compression boundary injection (Issue #26851) - test cases pending
- Multimodal injection (image/audio) - test cases pending

---

### LLM02: Insecure Output Handling

**Risk Overview**: Improper handling of LLM outputs leading to command injection, file operations, or XSS.

**OpenClaw Context**: `system.run` command execution, file write operations, skill invocation.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 0 | No dedicated test category |
| Knowledge Articles | 1 | Indirectly covered in exec-bypass article |
| Vulnerability DB | 28+ advisories | Exec allowlist bypass |
| **Assessment** | — | **⚠️ Partial** - DB is comprehensive, but tests/knowledge lacking |

**Gaps**:
- LLM output → `system.run` sanitization validation tests
- XSS/HTML injection tests (e.g., Control UI Stored XSS)

**Recommended Actions**:
- Create `exec-bypass` test suite (planned in Phase 6-3)
- Design LLM output → `system.run` path-specific tests

---

### LLM03: Training Data Poisoning

**Risk Overview**: Model behavior manipulation via training data poisoning.

**OpenClaw Context**: **Out of Scope** - OpenClaw does not fine-tune models.

**Assessment**: Not applicable. OpenClaw uses third-party LLMs (Claude, GPT) via API and does not control training data.

---

### LLM04: Model Denial of Service

**Risk Overview**: Resource exhaustion attacks targeting LLM services (rate limits, excessive token consumption).

**OpenClaw Context**: Webhook DoS, memory amplification DoS, tar extraction DoS, unbounded URL-backed media fetch.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 0 | — |
| Knowledge Articles | 0 | — |
| Vulnerability DB | 4 advisories | DoS category |
| **Assessment** | — | **❌ Unaddressed** - 3 new DoS vulnerabilities in v2026.3.x |

**Related Advisories**:
- **GHSA-6rmx-gvvg-vh6j**: Hook counts non-POST requests toward auth lockout
- **GHSA-x4vp-4235-65hg**: Pre-auth webhook body parse enables slow-request DoS
- **GHSA-77hf-7fqf-f227**: tar.bz2 extraction bypasses archive safety parity check
- **GHSA-wr6m-jg37-68xh**: Zalo webhook query-string key chain causes memory amplification DoS

**Recommended Actions**:
- Create DoS knowledge article
- Design webhook/media fetch rate limiting tests

---

### LLM05: Supply Chain Vulnerabilities

**Risk Overview**: Attacks via compromised dependencies, plugins, or model providers.

**OpenClaw Context**: ClawHub skills, 31 plugins sharing a single process, npm dependencies.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 2 | PI test 28-29 partially cover skill supply chain |
| Knowledge Articles | 1 | hackerbot-claw GHA attack campaign |
| Vulnerability DB | 3 advisories | skills-install-download, etc. |
| **Assessment** | — | **⚠️ Partial** - GHA campaign covered, but skill supply chain needs deeper investigation |

**Gaps**:
- ClawHub skill supply chain verification tests
- Plugin isolation deficiency (CVSS 9.8, Issue #12517) tests
- npm dependency security audits

**Recommended Actions**:
- Create `skill-abuse` test suite (planned in Phase 6-3)
- Track plugin sandbox (WASM, BoxLite) implementation status

---

### LLM06: Sensitive Information Disclosure

**Risk Overview**: Leakage of sensitive information through LLM responses or application state.

**OpenClaw Context**: Secret management, Gateway auth material UI leakage, bot token log leakage.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 0 | — |
| Knowledge Articles | 0 | — |
| Vulnerability DB | 5+ advisories | secret-leakage, Gateway auth leakage |
| **Assessment** | — | **❌ Unaddressed** - DB only, tests/knowledge completely absent |

**Related Advisories**:
- **GHSA-rchv-x836-w7xp**: Dashboard leaked Gateway auth material via browser URL/localStorage
- **CVE-2026-27003**: Telegram bot token log leakage
- **CVE-2026-26326**: skills.status secret leakage

**Recommended Actions**:
- Create `secret-leakage` test suite
- Write knowledge article on safe Gateway auth material handling
- Implement runtime check RC-018 (Gateway auth material UI leakage check)

---

### LLM07: Insecure Plugin Design

**Risk Overview**: Vulnerabilities arising from poorly designed or insufficiently isolated plugins.

**OpenClaw Context**: 31 plugins sharing a single Node.js process (CVSS 9.8), jiti dynamic loader.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | 0 | — |
| Knowledge Articles | 0 | — |
| Vulnerability DB | 2 advisories | skill-abuse |
| **Assessment** | — | **❌ Unaddressed** - Zero coverage for OpenClaw's most critical design flaw |

**Critical Issue**:
- **No Plugin Isolation**: jiti dynamic loader provides no sandbox, capability limits, or resource isolation (Issue #12517)
- **Impact**: A vulnerability in one plugin grants full access to all plugin credentials, datastores, and runtime APIs
- **Proposed Solutions**: WASM-based plugin sandbox (Issue #26980), BoxLite backend (Issue #27342)

**Recommended Actions** (HIGHEST PRIORITY):
- Create `skill-abuse` test suite
- Design plugin-to-plugin information leakage tests
- Track WASM sandbox implementation

---

### LLM08: Excessive Agency

**Risk Overview**: Granting LLMs excessive permissions or autonomy.

**OpenClaw Context**: `system.run` (command execution), file I/O, browser automation, ACP dispatch.

**AuditClaw Coverage**:

| Component | Count | Status |
|-----------|-------|--------|
| Test Cases | Partial | Some PI tests verify agency controls |
| Knowledge Articles | 2 | Indirectly covered in exec-bypass, ACP inheritance articles |
| Vulnerability DB | 28+ advisories | system.run related |
| **Assessment** | — | **⚠️ Partial** - Related to system.run approval hardening, but direct tests lacking |

**Gaps**:
- Tool policy (`tools.profile`) effectiveness validation tests
- ACP dispatch permission control tests
- `agent-hijack` test suite

**Recommended Actions**:
- Create `agent-hijack` test suite (planned in Phase 6-3)
- Design tool policy bypass tests

---

### LLM09: Overreliance

**Risk Overview**: Excessive reliance on LLM outputs without human oversight.

**OpenClaw Context**: **Out of Scope** - This is a user-side concern, not a platform security issue.

**Assessment**: Not applicable.

---

### LLM10: Model Theft

**Risk Overview**: Unauthorized access to proprietary models.

**OpenClaw Context**: **Out of Scope** - OpenClaw does not host models (API-based access only).

**Assessment**: Not applicable.

---

## Coverage Summary

| # | OWASP LLM Risk | Applicable | Tests | Knowledge | DB | Assessment |
|---|---------------|-----------|-------|-----------|-----|------------|
| LLM01 | Prompt Injection | ✅ | 29 | 4 | 2 | **✅ Comprehensive** |
| LLM02 | Insecure Output Handling | ✅ | 0 | 1 | 28+ | **⚠️ Partial** |
| LLM03 | Training Data Poisoning | ❌ | — | — | — | Out of Scope |
| LLM04 | Model Denial of Service | ✅ | 0 | 0 | 4 | **❌ Unaddressed** |
| LLM05 | Supply Chain Vulnerabilities | ✅ | 2 | 1 | 3 | **⚠️ Partial** |
| LLM06 | Sensitive Information Disclosure | ✅ | 0 | 0 | 5+ | **❌ Unaddressed** |
| LLM07 | Insecure Plugin Design | ✅ | 0 | 0 | 2 | **❌ Unaddressed** |
| LLM08 | Excessive Agency | ✅ | Partial | 2 | 28+ | **⚠️ Partial** |
| LLM09 | Overreliance | ❌ | — | — | — | Out of Scope |
| LLM10 | Model Theft | ❌ | — | — | — | Out of Scope |

**Key**:
- ✅ Comprehensive: Fully covered with tests, knowledge, and DB entries
- ⚠️ Partial: Some coverage but significant gaps remain
- ❌ Unaddressed: No or minimal coverage despite applicable risk

## Priority Matrix

| Priority | OWASP Category | Rationale | Recommended Action |
|----------|---------------|-----------|-------------------|
| **🔴 Critical** | LLM07 (Plugin) | CVSS 9.8 design flaw, zero coverage | skill-abuse test suite + knowledge article |
| **🟠 High** | LLM02 (Output) | 28+ exec bypass advisories, no tests | exec-bypass test suite |
| **🟠 High** | LLM06 (Disclosure) | New Gateway auth leakage vulnerabilities | secret-leakage test suite + knowledge article |
| **🟡 Medium** | LLM04 (DoS) | 3 new DoS vulnerabilities in v2026.3.x | DoS knowledge article + tests |
| **🟡 Medium** | LLM05 (Supply Chain) | GHA covered, needs deeper investigation | Skill supply chain tests |
| **🟢 Low** | LLM08 (Agency) | Partially covered | Expand agent-hijack test suite |

## Recommendations

### Immediate Actions (Phase 6-3)

1. **Create Missing Test Suites**:
   - `exec-bypass` (28+ vulnerabilities → LLM02)
   - `skill-abuse` (CVSS 9.8 → LLM07)
   - `secret-leakage` (5+ vulnerabilities → LLM06)
   - `agent-hijack` (agency controls → LLM08)

2. **Write Knowledge Articles**:
   - **LLM07**: Plugin isolation deficiency and WASM sandbox tracking
   - **LLM06**: Safe Gateway auth material handling
   - **LLM04**: DoS attack patterns and mitigation

### Long-Term Improvements

1. **Architecture Hardening**:
   - Implement WASM-based plugin sandbox (Issue #26980)
   - Deploy BoxLite backend (Issue #27342)

2. **Monitoring & Detection**:
   - Enable runtime checks for path boundary validation, secret leakage
   - Implement rate limiting for webhooks and media fetch

3. **Supply Chain Security**:
   - Automate npm dependency audits
   - Establish ClawHub skill verification process

## References

- **OWASP LLM Top 10 (2025)**: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- **Vulnerability Database**: `data/vulnerability-db.json` (65 entries)
- **Related Guides**:
  - [Hardening Guide](./hardening-guide.md)
  - [Exec Bypass Vulnerabilities](../vulnerabilities/exec-bypass.md)
  - [Sandbox Escape Vulnerabilities](../vulnerabilities/sandbox-escape.md)
