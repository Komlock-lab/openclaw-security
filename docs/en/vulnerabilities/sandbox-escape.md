# Sandbox Escape

## Overview

Sandbox escape attacks break out of container or sandbox environments to access the host system.
OpenClaw provides Docker-based sandboxing, but configuration or implementation flaws can lead to breakouts.

## Risk in OpenClaw

- `sandbox.mode: off` (default) runs without sandbox
- Container escape via Docker socket mount
- Host file access via volume mounts
- Privileged container abuse

## Cases

<!-- Add research results from /research-vuln sandbox-escape here -->
