#!/bin/bash
# kb.artrosas.com diagnostic script
# Captures the actual state of the local project, git history,
# and what's deployed to kb.artrosas.com.
#
# Usage: bash diagnose.sh > diagnose-report.txt 2>&1
# Then paste diagnose-report.txt into the chat.

set +e  # don't exit on errors — keep going so we collect everything

# ─── Header ────────────────────────────────────────────────────────────────
echo "=========================================================="
echo "  kb.artrosas.com diagnostic report"
echo "  generated: $(date)"
echo "  user: $(whoami)"
echo "  host: $(hostname)"
echo "=========================================================="
echo ""

# ─── Section 1: where am I and what's here? ────────────────────────────────
echo "## 1. WORKING DIRECTORY"
echo "----------------------------------------------------------"
echo "pwd:"
pwd
echo ""
echo "Contents of working directory (top level):"
ls -la
echo ""

# Verify we're in the right place
if [ ! -f "package.json" ] || [ ! -f "docusaurus.config.js" ]; then
  echo "⚠️  WARNING: This does not appear to be a Docusaurus project root."
  echo "    Expected to find package.json and docusaurus.config.js."
  echo "    Re-run this script from ~/Code/kb.artrosas.com"
  echo ""
fi

# ─── Section 2: project structure (relevant folders only) ──────────────────
echo "## 2. PROJECT STRUCTURE (excluding node_modules)"
echo "----------------------------------------------------------"
echo "docs/ tree:"
if [ -d "docs" ]; then
  find docs -type f | sort
else
  echo "  ⚠️  docs/ folder not found"
fi
echo ""

echo "static/ tree:"
if [ -d "static" ]; then
  find static -type f | sort
else
  echo "  ⚠️  static/ folder not found"
fi
echo ""

echo "src/ tree:"
if [ -d "src" ]; then
  find src -type f | sort
else
  echo "  ⚠️  src/ folder not found"
fi
echo ""

# ─── Section 3: key config files ───────────────────────────────────────────
echo "## 3. KEY CONFIG FILES"
echo "----------------------------------------------------------"

echo "### sidebars.js (full contents):"
if [ -f "sidebars.js" ]; then
  cat -n sidebars.js
else
  echo "  ⚠️  sidebars.js NOT FOUND"
fi
echo ""

echo "### sidebars.js syntax validation:"
if [ -f "sidebars.js" ]; then
  node --check sidebars.js 2>&1 && echo "  ✓ valid JavaScript syntax"
else
  echo "  (skipped — file missing)"
fi
echo ""

echo "### docusaurus.config.js (relevant fields only):"
if [ -f "docusaurus.config.js" ]; then
  grep -E "^\s*(url|baseUrl|title|organizationName|projectName):" docusaurus.config.js | head -20
else
  echo "  ⚠️  docusaurus.config.js NOT FOUND"
fi
echo ""

echo "### package.json (name, version, key scripts):"
if [ -f "package.json" ]; then
  echo "  name:    $(grep -E '"name":' package.json | head -1 | awk -F'"' '{print $4}')"
  echo "  version: $(grep -E '"version":' package.json | head -1 | awk -F'"' '{print $4}')"
  echo "  scripts:"
  grep -A 8 '"scripts":' package.json | grep -E '^\s*"(start|build|deploy|serve)":' | sed 's/^/    /'
  echo "  docusaurus version:"
  grep -E '"@docusaurus/core":' package.json | sed 's/^/    /'
else
  echo "  ⚠️  package.json NOT FOUND"
fi
echo ""

# ─── Section 4: HOTP tester specifics ──────────────────────────────────────
echo "## 4. HOTP TESTER FILES"
echo "----------------------------------------------------------"

echo "### Is static/hotp-tester.html present?"
if [ -f "static/hotp-tester.html" ]; then
  echo "  ✓ EXISTS"
  echo "  size: $(wc -c < static/hotp-tester.html) bytes"
  echo "  first 5 lines:"
  head -5 static/hotp-tester.html | sed 's/^/    /'
else
  echo "  ✗ MISSING"
fi
echo ""

echo "### Is docs/tools/hotp-tester.mdx present?"
if [ -f "docs/tools/hotp-tester.mdx" ]; then
  echo "  ✓ EXISTS"
  echo "  full contents:"
  cat docs/tools/hotp-tester.mdx | sed 's/^/    /'
else
  echo "  ✗ NOT PRESENT (this is fine if you're using the static-file approach)"
fi
echo ""

echo "### Does sidebars.js reference the HOTP tester? (grep)"
if [ -f "sidebars.js" ]; then
  grep -n -i "hotp\|tools" sidebars.js | sed 's/^/  /' || echo "  no matches found"
else
  echo "  (sidebars.js missing)"
fi
echo ""

# ─── Section 5: git state ──────────────────────────────────────────────────
echo "## 5. GIT STATE"
echo "----------------------------------------------------------"

echo "### git status:"
git status 2>&1 | sed 's/^/  /'
echo ""

echo "### Current branch and remote:"
echo "  branch:  $(git branch --show-current 2>/dev/null)"
echo "  remote origin:"
git remote -v 2>/dev/null | sed 's/^/    /'
echo ""

echo "### Last 10 commits:"
git log --oneline -10 2>&1 | sed 's/^/  /'
echo ""

echo "### Files in last commit (HEAD):"
git show --stat --format="" HEAD 2>&1 | sed 's/^/  /'
echo ""

echo "### Is local main in sync with origin/main?"
git fetch origin main --quiet 2>&1
LOCAL=$(git rev-parse main 2>/dev/null)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
BASE=$(git merge-base main origin/main 2>/dev/null)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "  ✓ in sync (local == origin/main)"
elif [ "$LOCAL" = "$BASE" ]; then
  echo "  ⚠️  local is BEHIND origin/main — pull needed"
elif [ "$REMOTE" = "$BASE" ]; then
  echo "  ⚠️  local is AHEAD of origin/main — push needed"
else
  echo "  ⚠️  local and origin/main have DIVERGED"
fi
echo "  local HEAD:  $LOCAL"
echo "  origin/main: $REMOTE"
echo ""

echo "### Uncommitted changes (modified files only):"
git diff --stat 2>&1 | sed 's/^/  /'
echo ""

# ─── Section 6: what's actually deployed (HTTP probes) ─────────────────────
echo "## 6. DEPLOYED STATE — kb.artrosas.com"
echo "----------------------------------------------------------"

probe_url() {
  local url="$1"
  local desc="$2"
  local code=$(curl -o /dev/null -s -w "%{http_code}" -L "$url" 2>/dev/null)
  echo "  $desc"
  echo "    URL:  $url"
  echo "    HTTP: $code"
}

echo "### HTTP status of key URLs:"
probe_url "https://kb.artrosas.com/" "Site root"
probe_url "https://kb.artrosas.com/hotp-tester.html" "Static HOTP tester (raw HTML)"
probe_url "https://kb.artrosas.com/tools/hotp-tester" "MDX wrapper page (if exists)"
probe_url "https://kb.artrosas.com/runbooks/lockout-diagnosis" "Lockout diagnosis runbook"
probe_url "https://kb.artrosas.com/runbooks/re-seeding-process" "Re-seeding runbook"
echo ""

echo "### First 30 lines of /hotp-tester.html as served by production:"
curl -s "https://kb.artrosas.com/hotp-tester.html" 2>/dev/null | head -30 | sed 's/^/  /'
echo ""

# ─── Section 7: local dev server (if running) ──────────────────────────────
echo "## 7. LOCAL DEV SERVER (localhost:3000)"
echo "----------------------------------------------------------"
LOCAL_ROOT=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:3000/" 2>/dev/null)
LOCAL_HOTP=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:3000/hotp-tester.html" 2>/dev/null)
LOCAL_TOOLS=$(curl -o /dev/null -s -w "%{http_code}" -L "http://localhost:3000/tools/hotp-tester" 2>/dev/null)
echo "  http://localhost:3000/                        → $LOCAL_ROOT"
echo "  http://localhost:3000/hotp-tester.html        → $LOCAL_HOTP"
echo "  http://localhost:3000/tools/hotp-tester       → $LOCAL_TOOLS"
if [ "$LOCAL_ROOT" = "000" ]; then
  echo "  (000 = dev server not running. Start with 'npm start' in another terminal.)"
fi
echo ""

# ─── Section 8: environment versions ───────────────────────────────────────
echo "## 8. ENVIRONMENT VERSIONS"
echo "----------------------------------------------------------"
echo "  node:       $(node --version 2>/dev/null || echo 'not installed')"
echo "  npm:        $(npm --version 2>/dev/null || echo 'not installed')"
echo "  git:        $(git --version 2>/dev/null | awk '{print $3}' || echo 'not installed')"
echo "  gh:         $(gh --version 2>/dev/null | head -1 | awk '{print $3}' || echo 'not installed')"
echo "  brew:       $(brew --version 2>/dev/null | head -1 | awk '{print $2}' || echo 'not installed')"
echo "  os:         $(sw_vers -productName 2>/dev/null) $(sw_vers -productVersion 2>/dev/null)"
echo ""

# ─── Footer ────────────────────────────────────────────────────────────────
echo "=========================================================="
echo "  end of diagnostic report"
echo "=========================================================="
