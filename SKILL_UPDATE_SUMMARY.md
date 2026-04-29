
=== Skills Updated/Created Based on This Conversation ===

## 1. Updated Skill: nextjs-design-sandbox-debugging
**Category**: frontend-design  
**Trigger**: Next.js build fails due to experimental subdirectory scanning  
**What's New**: Added complete section on "Subdirectory Scanned by Next.js" covering:
- Root cause: Next.js auto-scans all subdirectories (including design-sandbox)
- Two-layer exclusion: tsconfig.json + next.config.js webpack rules
- Defense-in-depth strategy explanation
- Verification commands to confirm isolation
- Alternative: copy missing modules from design-sandbox to main project
- Fixed invalid config key warning (`excludeDefaultEntries` is not valid)

**Key Commands Added**:
```bash
# Verify exclusion
grep "design-sandbox" build.log  # Should be empty
ls .next/server/ | grep design  # Should be empty

# Webpack exclusion (next.config.js)
config.module.rules.push({
  test: /design-sandbox\/.*/,
  use: 'null-loader',
})
```

**Files Modified**:
- `~/.hermes/skills/frontend-design/nextjs-design-sandbox-debugging/SKILL.md`

---

## 2. New Skill: nextjs-port-conflict-and-localhost-diagnosis  
**Category**: devops  
**Trigger**: localhost not responding, dev server running but unreachable  
**Purpose**: Systematic diagnosis of Next.js dev server connectivity issues

**Five Diagnostic Scenarios Covered**:
1. Port already in use by stale process
2. Next.js auto-incremented to unknown port (3001→3002)
3. IPv6 localhost (::1) connection failure (macOS specific)
4. Multiple node instances / port conflicts
5. DNS / proxy interference

**Key Diagnostic Script Provided**:
- `scripts/diagnose-nextjs-port.sh` — comprehensive 5-step diagnosis
  - Process check
  - Port occupancy check across 3000-3010
  - Log analysis
  - IPv4/IPv6/localhost connectivity test
  - Automated recommendations

**Quick Remediation Table**:
| Problem | Command |
|---------|---------|
| All Next.js dev stuck | `pkill -9 -f 'next dev'` |
| Specific port occupied | `kill -9 $(lsof -t -i tcp:3000)` |
| Clean restart | `rm -rf .next && npm run dev` |
| Force specific port | `PORT=3000 npm run dev` |

**macOS IPv6 Fix Included**:
```bash
# Prefer IPv4 in /etc/hosts
sudo vim /etc/hosts  # Move 127.0.0.1 above ::1
sudo dscacheutil -flushcache
```

**Files Created**:
- `~/.hermes/skills/devops/nextjs-port-conflict-and-localhost-diagnosis/SKILL.md`
- `scripts/diagnose-nextjs-port.sh`
- `scripts/isolate-design-sandbox.sh`

---

## 3. Supporting Script Added
**Script**: `isolate-design-sandbox.sh`  
**Purpose**: Automate the isolation of experimental design-sandbox directory from Next.js builds  
**Operations**: Updates tsconfig.json, patches next.config.js, copies shared modules, cleans cache, rebuilds

---

## Why These Skills Matter

**Problem Context**: The seeing-single-cell project had a design-sandbox sibling directory with experimental code and different dependencies. Next.js 14 was scanning it and failing silently, causing the dev server to hang or crash. After fixing that, port conflicts and IPv6 localhost issues masked the success.

**Reusability**: 
- Any Next.js project with experimental subdirectories can use the two-layer exclusion strategy
- The port diagnostics apply to any Node.js dev server (React, Vue, Express, etc.)
- The IPv6 localhost issue is common on macOS after network changes

**Lesson**: Production-ready Next.js apps must explicitly exclude experimental directories at BOTH TypeScript and Webpack levels. Additionally, always verify connectivity with `127.0.0.1` rather than `localhost` to avoid IPv6 ambiguity.
