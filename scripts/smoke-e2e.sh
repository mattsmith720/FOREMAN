#!/usr/bin/env bash
set -euo pipefail
# Release smoke validates endpoint contract wiring even when AI upstream keys are intentionally unset.
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
FOREMAN_API_KEY="${FOREMAN_API_KEY:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIO_FIXTURE="${SCRIPT_DIR}/smoke-fixtures/tiny.wav"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/foreman-smoke.XXXXXX")"
START_RESULT="NOT_RUN"
START_NOTE=""
ANALYSE_RESULT="NOT_RUN"
ANALYSE_NOTE=""
TRANSCRIBE_RESULT="NOT_RUN"
TRANSCRIBE_NOTE=""
STOP_RESULT="NOT_RUN"
STOP_NOTE=""
FAIL_COUNT=0
set_step() {
  local step="$1"
  local result="$2"
  local note="$3"
  case "$step" in
    start) START_RESULT="$result"; START_NOTE="$note" ;;
    analyse) ANALYSE_RESULT="$result"; ANALYSE_NOTE="$note" ;;
    transcribe) TRANSCRIBE_RESULT="$result"; TRANSCRIBE_NOTE="$note" ;;
    stop) STOP_RESULT="$result"; STOP_NOTE="$note" ;;
  esac
}
mark_failure() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
}
json_error_or_preview() {
  python3 - "$1" <<'PY'
import json
import sys
path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8") as handle:
        text = handle.read()
except FileNotFoundError:
    print("missing response body")
    raise SystemExit(0)
try:
    parsed = json.loads(text)
except Exception:
    snippet = " ".join(text.strip().split())
    print((snippet[:140] + "...") if len(snippet) > 140 else snippet)
    raise SystemExit(0)
if isinstance(parsed, dict):
    value = parsed.get("error")
    if isinstance(value, str) and value.strip():
        print(value.strip())
        raise SystemExit(0)
snippet = " ".join(text.strip().split())
print((snippet[:140] + "...") if len(snippet) > 140 else snippet)
PY
}
http_request() {
  local body_path="$1"
  shift
  local http_code
  local curl_status
  set +e
  http_code="$(curl -sS -o "$body_path" -w "%{http_code}" "$@")"
  curl_status=$?
  set -e
  if [ "$curl_status" -ne 0 ]; then
    printf "curl_error:%s" "$curl_status"
    return 0
  fi
  printf "%s" "$http_code"
}
encode_wav_fixture() {
  python3 - "$1" <<'PY'
import base64
import pathlib
import sys
raw = pathlib.Path(sys.argv[1]).read_bytes()
print("data:audio/wav;base64," + base64.b64encode(raw).decode("ascii"))
PY
}
print_summary() {
  local script_exit="${1:-0}"
  local overall="PASS"
  if [ "$FAIL_COUNT" -gt 0 ] || [ "$script_exit" -ne 0 ]; then
    overall="FAIL"
  fi
  echo ""
  echo "=== Smoke E2E summary ==="
  echo "sessions/start: ${START_RESULT}${START_NOTE:+ - $START_NOTE}"
  echo "analyse: ${ANALYSE_RESULT}${ANALYSE_NOTE:+ - $ANALYSE_NOTE}"
  echo "transcribe: ${TRANSCRIBE_RESULT}${TRANSCRIBE_NOTE:+ - $TRANSCRIBE_NOTE}"
  echo "sessions/stop: ${STOP_RESULT}${STOP_NOTE:+ - $STOP_NOTE}"
  echo "overall: ${overall}"
}
on_exit() {
  local ec=$?
  print_summary "$ec"
  rm -rf "$TMP_DIR"
}
trap on_exit EXIT
if [ -z "$FOREMAN_API_KEY" ]; then
  echo "ERROR: FOREMAN_API_KEY is required."
  echo "Example: FOREMAN_API_KEY=local-smoke BASE_URL=${BASE_URL} bash scripts/smoke-e2e.sh"
  set_step "start" "SKIPPED" "missing FOREMAN_API_KEY"
  set_step "analyse" "SKIPPED" "missing FOREMAN_API_KEY"
  set_step "transcribe" "SKIPPED" "missing FOREMAN_API_KEY"
  set_step "stop" "SKIPPED" "missing FOREMAN_API_KEY"
  exit 2
fi
if [ ! -f "$AUDIO_FIXTURE" ]; then
  echo "ERROR: audio fixture missing at ${AUDIO_FIXTURE}"
  set_step "start" "SKIPPED" "missing audio fixture"
  set_step "analyse" "SKIPPED" "missing audio fixture"
  set_step "transcribe" "SKIPPED" "missing audio fixture"
  set_step "stop" "SKIPPED" "missing audio fixture"
  exit 2
fi
START_BODY="${TMP_DIR}/start.json"
ANALYSE_BODY="${TMP_DIR}/analyse.json"
TRANSCRIBE_BODY="${TMP_DIR}/transcribe.json"
STOP_BODY="${TMP_DIR}/stop.json"
SESSION_ID=""
SESSION_TOKEN=""
echo ">> request: POST ${BASE_URL}/sessions/start"
START_HTTP="$(http_request "$START_BODY" \
  -X POST "${BASE_URL}/sessions/start" \
  -H "Content-Type: application/json" \
  -H "x-foreman-api-key: ${FOREMAN_API_KEY}" \
  -d '{"jobType":"smoke_test"}')"
if [[ "$START_HTTP" == curl_error:* ]]; then
  mark_failure
  set_step "start" "FAIL" "$START_HTTP"
  set_step "analyse" "SKIPPED" "sessions/start failed"
  set_step "transcribe" "SKIPPED" "sessions/start failed"
  set_step "stop" "SKIPPED" "sessions/start failed"
  exit 1
fi
if [ "$START_HTTP" -ne 201 ]; then
  mark_failure
  set_step "start" "FAIL" "HTTP ${START_HTTP}: $(json_error_or_preview "$START_BODY")"
  set_step "analyse" "SKIPPED" "sessions/start failed"
  set_step "transcribe" "SKIPPED" "sessions/start failed"
  set_step "stop" "SKIPPED" "sessions/start failed"
  exit 1
fi
SESSION_ID="$(python3 - "$START_BODY" <<'PY'
import json
import sys
data = json.load(open(sys.argv[1], "r", encoding="utf-8"))
print(data.get("session", {}).get("id", ""))
PY
)"
SESSION_TOKEN="$(python3 - "$START_BODY" <<'PY'
import json
import sys
data = json.load(open(sys.argv[1], "r", encoding="utf-8"))
print(data.get("token", ""))
PY
)"
if [ -z "$SESSION_ID" ] || [ -z "$SESSION_TOKEN" ]; then
  mark_failure
  set_step "start" "FAIL" "HTTP 201 but missing session.id or token"
  set_step "analyse" "SKIPPED" "sessions/start response invalid"
  set_step "transcribe" "SKIPPED" "sessions/start response invalid"
  set_step "stop" "SKIPPED" "sessions/start response invalid"
  exit 1
fi
set_step "start" "PASS" "HTTP 201"
TINY_JPEG="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q=="
ANALYSE_PAYLOAD="${TMP_DIR}/analyse-payload.json"
python3 - "$SESSION_ID" "$TINY_JPEG" >"$ANALYSE_PAYLOAD" <<'PY'
import json
import sys
print(json.dumps({"image": sys.argv[2], "sessionId": sys.argv[1]}))
PY
echo ">> request: POST ${BASE_URL}/analyse"
ANALYSE_HTTP="$(http_request "$ANALYSE_BODY" \
  -X POST "${BASE_URL}/analyse" \
  -H "Content-Type: application/json" \
  -H "x-foreman-api-key: ${FOREMAN_API_KEY}" \
  -H "x-session-token: ${SESSION_TOKEN}" \
  --data-binary "@${ANALYSE_PAYLOAD}")"
if [[ "$ANALYSE_HTTP" == curl_error:* ]]; then
  mark_failure
  set_step "analyse" "FAIL" "$ANALYSE_HTTP"
elif [ "$ANALYSE_HTTP" -eq 200 ]; then
  set_step "analyse" "PASS" "HTTP 200"
elif [ "$ANALYSE_HTTP" -eq 503 ] && grep -q "ANTHROPIC_API_KEY is not set" "$ANALYSE_BODY"; then
  set_step "analyse" "CONFIGURED_PASS" "HTTP 503: ANTHROPIC_API_KEY is not set"
else
  mark_failure
  set_step "analyse" "FAIL" "HTTP ${ANALYSE_HTTP}: $(json_error_or_preview "$ANALYSE_BODY")"
fi
AUDIO_DATA_URL="$(encode_wav_fixture "$AUDIO_FIXTURE")"
TRANSCRIBE_PAYLOAD="${TMP_DIR}/transcribe-payload.json"
python3 - "$SESSION_ID" "$AUDIO_DATA_URL" >"$TRANSCRIBE_PAYLOAD" <<'PY'
import json
import sys
print(json.dumps({"audio": sys.argv[2], "sessionId": sys.argv[1]}))
PY
echo ">> request: POST ${BASE_URL}/transcribe"
TRANSCRIBE_HTTP="$(http_request "$TRANSCRIBE_BODY" \
  -X POST "${BASE_URL}/transcribe" \
  -H "Content-Type: application/json" \
  -H "x-foreman-api-key: ${FOREMAN_API_KEY}" \
  -H "x-session-token: ${SESSION_TOKEN}" \
  --data-binary "@${TRANSCRIBE_PAYLOAD}")"
if [[ "$TRANSCRIBE_HTTP" == curl_error:* ]]; then
  mark_failure
  set_step "transcribe" "FAIL" "$TRANSCRIBE_HTTP"
elif [ "$TRANSCRIBE_HTTP" -eq 200 ]; then
  set_step "transcribe" "PASS" "HTTP 200"
elif [ "$TRANSCRIBE_HTTP" -eq 503 ] && grep -q "OPENAI_API_KEY is not set" "$TRANSCRIBE_BODY"; then
  set_step "transcribe" "CONFIGURED_PASS" "HTTP 503: OPENAI_API_KEY is not set"
else
  mark_failure
  set_step "transcribe" "FAIL" "HTTP ${TRANSCRIBE_HTTP}: $(json_error_or_preview "$TRANSCRIBE_BODY")"
fi
echo ">> request: POST ${BASE_URL}/sessions/${SESSION_ID}/stop"
STOP_HTTP="$(http_request "$STOP_BODY" \
  -X POST "${BASE_URL}/sessions/${SESSION_ID}/stop" \
  -H "x-foreman-api-key: ${FOREMAN_API_KEY}" \
  -H "x-session-token: ${SESSION_TOKEN}")"
if [[ "$STOP_HTTP" == curl_error:* ]]; then
  mark_failure
  set_step "stop" "FAIL" "$STOP_HTTP"
elif [ "$STOP_HTTP" -eq 200 ]; then
  set_step "stop" "PASS" "HTTP 200"
else
  mark_failure
  set_step "stop" "FAIL" "HTTP ${STOP_HTTP}: $(json_error_or_preview "$STOP_BODY")"
fi
if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
