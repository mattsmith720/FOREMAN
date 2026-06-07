#!/usr/bin/env bash
# Branded infographic placeholders until Notebook LM PNGs arrive.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../public/assets/infographics" && pwd)"

hero() {
  cat > "$DIR/hero-job-flow.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="none">
  <rect width="800" height="500" fill="#f5f1eb"/>
  <rect x="0" y="0" width="800" height="3" fill="#ff6b00"/>
  <text x="40" y="44" fill="#1a1a1e" font-family="system-ui,sans-serif" font-size="13" font-weight="700" letter-spacing="0.12em">JOB FLOW</text>
  <text x="40" y="72" fill="#1a1a1e" font-family="system-ui,sans-serif" font-size="20" font-weight="700">Start to submission pack</text>
  <rect x="40" y="100" width="160" height="110" rx="8" stroke="#1a1a1e" stroke-width="1.5" fill="#fffefb"/>
  <text x="56" y="132" fill="#ff6b00" font-size="11" font-weight="700" font-family="system-ui">01</text>
  <text x="56" y="158" fill="#1a1a1e" font-size="14" font-weight="600" font-family="system-ui">Start</text>
  <text x="56" y="180" fill="#5c5c66" font-size="12" font-family="system-ui">Consent + job</text>
  <path d="M212 155h48" stroke="#ff6b00" stroke-width="2"/>
  <polygon points="260,155 252,151 252,159" fill="#ff6b00"/>
  <rect x="272" y="100" width="160" height="110" rx="8" stroke="#1a1a1e" stroke-width="1.5" fill="#fffefb"/>
  <text x="288" y="132" fill="#5c5c66" font-size="11" font-weight="700" font-family="system-ui">02</text>
  <text x="288" y="158" fill="#1a1a1e" font-size="14" font-weight="600" font-family="system-ui">Capture</text>
  <text x="288" y="180" fill="#5c5c66" font-size="12" font-family="system-ui">6 CER shots</text>
  <path d="M444 155h48" stroke="#1a1a1e" stroke-width="1.5"/>
  <polygon points="492,155 484,151 484,159" fill="#1a1a1e"/>
  <rect x="504" y="100" width="160" height="110" rx="8" stroke="#1a1a1e" stroke-width="1.5" fill="#fffefb"/>
  <text x="520" y="132" fill="#5c5c66" font-size="11" font-weight="700" font-family="system-ui">03</text>
  <text x="520" y="158" fill="#1a1a1e" font-size="14" font-weight="600" font-family="system-ui">Coach</text>
  <text x="520" y="180" fill="#5c5c66" font-size="12" font-family="system-ui">Fix defects live</text>
  <path d="M676 155h44" stroke="#1a1a1e" stroke-width="1.5"/>
  <rect x="728" y="118" width="32" height="74" rx="6" fill="#ff6b00"/>
  <text x="40" y="280" fill="#5c5c66" font-size="12" font-family="system-ui">Replace with Notebook LM export: hero-job-flow.png</text>
  <rect x="40" y="300" width="720" height="140" rx="8" fill="#ebe5dc" stroke="#1a1a1e" stroke-width="1" stroke-opacity="0.08"/>
  <text x="60" y="340" fill="#1a1a1e" font-size="14" font-weight="600" font-family="system-ui">Evidence pack</text>
  <text x="60" y="364" fill="#5c5c66" font-size="12" font-family="system-ui">Geo-stamped photos + manifest</text>
</svg>
EOF
}

mk_card() {
  local name="$1" label="$2" num="$3"
  cat > "$DIR/${name}.svg" <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="#f5f1eb"/>
  <rect width="400" height="3" fill="#ff6b00"/>
  <rect x="24" y="24" width="352" height="352" rx="10" fill="#fffefb" stroke="#1a1a1e" stroke-width="1.5" stroke-opacity="0.15"/>
  <text x="48" y="72" fill="#ff6b00" font-family="system-ui,sans-serif" font-size="12" font-weight="700" letter-spacing="0.1em">${num}</text>
  <text x="48" y="108" fill="#1a1a1e" font-family="system-ui,sans-serif" font-size="22" font-weight="700">${label}</text>
  <rect x="48" y="130" width="120" height="6" rx="3" fill="#ff6b00" opacity="0.85"/>
  <rect x="48" y="160" width="280" height="8" rx="4" fill="#1a1a1e" opacity="0.06"/>
  <rect x="48" y="180" width="220" height="8" rx="4" fill="#1a1a1e" opacity="0.06"/>
  <rect x="48" y="220" width="304" height="120" rx="8" fill="#ebe5dc" stroke="#1a1a1e" stroke-width="1" stroke-opacity="0.08"/>
  <text x="64" y="252" fill="#5c5c66" font-size="11" font-family="system-ui">Notebook LM placeholder</text>
</svg>
EOF
}

hero
mk_card pain-failed-claims "Failed Claims" "P1"
mk_card pain-camera-chaos "Camera Roll Chaos" "P2"
mk_card pain-regulator-ai "Regulator AI Review" "P3"
mk_card pain-callback "Return Trip" "P4"
mk_card feature-evidence "Voice Capture" "F1"
mk_card feature-coaching "Defect Coaching" "F2"
mk_card feature-pack "Evidence Pack" "F3"
mk_card feature-dashboard "Crew Dashboard" "F4"
echo "Wrote placeholders in $DIR"
