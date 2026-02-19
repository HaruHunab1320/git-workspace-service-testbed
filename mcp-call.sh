#!/bin/bash
# mcp-call.sh — Calls Raven MCP API with automatic approval handling.
# Usage: ./mcp-call.sh <tool_name> '<json_arguments>'
# Example: ./mcp-call.sh task_update '{"taskId":"abc","workspaceId":"xyz","status":"done"}'

set -euo pipefail

TOOL_NAME="$1"
ARGS_JSON="$2"
API_URL="http://localhost:3000/api/mcp-standard/call_tool"

# First call
PAYLOAD=$(jq -n --arg name "$TOOL_NAME" --argjson args "$ARGS_JSON" '{name: $name, arguments: $args}')
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -d "$PAYLOAD")

echo ">>> First call response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Check for approval token in the response
APPROVAL_TOKEN=$(echo "$RESPONSE" | jq -r '
  .data.content[0].text // empty
' 2>/dev/null | jq -r '.error.data.approvalToken // empty' 2>/dev/null || echo "")

if [ -n "$APPROVAL_TOKEN" ] && [ "$APPROVAL_TOKEN" != "null" ]; then
  echo ">>> Approval required — re-calling with token..."
  # Re-call with approvalToken injected into the arguments
  APPROVED_ARGS=$(echo "$ARGS_JSON" | jq --arg token "$APPROVAL_TOKEN" '. + {approvalToken: $token}')
  PAYLOAD2=$(jq -n --arg name "$TOOL_NAME" --argjson args "$APPROVED_ARGS" '{name: $name, arguments: $args}')
  RESPONSE2=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MCP_API_KEY" \
    -d "$PAYLOAD2")
  echo ">>> Approved call response:"
  echo "$RESPONSE2" | jq . 2>/dev/null || echo "$RESPONSE2"
else
  echo ">>> No approval needed — done."
fi
