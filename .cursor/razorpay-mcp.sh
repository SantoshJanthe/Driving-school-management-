#!/usr/bin/env bash
# Starts Razorpay's hosted MCP server (https://mcp.razorpay.com/mcp).
# The key id and secret are read from the environment or from .env.local.
# They are passed to mcp-remote through the environment, not as a printed
# argument, and this script never writes them to the repo.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

read_env() {
  local key="$1"
  local file="$root/.env.local"
  local line value
  if [[ ! -f "$file" ]]; then
    return 0
  fi
  line="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  value="${line#*=}"
  value="${value%%#*}"
  value="${value%"${value##*[![:space:]]}"}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

key_id="${RAZORPAY_KEY_ID:-$(read_env RAZORPAY_KEY_ID)}"
key_secret="${RAZORPAY_KEY_SECRET:-$(read_env RAZORPAY_KEY_SECRET)}"

if [[ -z "$key_id" || -z "$key_secret" ]]; then
  echo "Razorpay MCP: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local (use rzp_test_ keys until go-live). Do not commit them." >&2
  exit 1
fi

token="$(printf '%s' "${key_id}:${key_secret}" | base64 | tr -d '\n')"
export AUTH_HEADER="Basic ${token}"
unset key_id key_secret token

# Single quotes keep the secret out of the process arguments. mcp-remote
# substitutes ${AUTH_HEADER} from the environment.
exec npx -y mcp-remote https://mcp.razorpay.com/mcp --header 'Authorization:${AUTH_HEADER}'
