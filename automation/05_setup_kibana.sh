#!/bin/bash

# VigiCore - Kibana Automated Setup
# Configures Data Views and Branding (Dark Mode)

KIBANA_URL="http://localhost:5601"
HEADER_ContentType="Content-Type: application/json"
HEADER_kbn_xsrf="kbn-xsrf: true"

echo "[*] VigiCore: Configuring Kibana..."

# 1. Wait for Kibana to be ready
echo "[-] Waiting for Kibana to be ready..."
until curl -s "${KIBANA_URL}/api/status" | grep -q "available"; do
    echo "    ... waiting for Kibana (may take a minute) ..."
    sleep 5
done
echo "[+] Kibana is ready."

# 2. Create Data View (logstash-*)
# We check if it exists first or just try to create and handle error
echo "[-] Creating Data View 'VigiCore Logs' (logstash-*)..."

RESPONSE=$(curl -s -X POST "${KIBANA_URL}/api/data_views/data_view" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d '{
        "data_view": {
           "title": "vigicore-*",
           "name": "VigiCore Logs"
        }
      }')

if echo "$RESPONSE" | grep -q "Duplicate data view"; then
    echo "[!] Data View already exists. Skipping."
elif echo "$RESPONSE" | grep -q "id"; then
    echo "[+] Data View created successfully."
else
    echo "[!] Warning: Unexpected response when creating Data View:"
    echo "$RESPONSE"
fi

# 3. Enable Dark Mode (VigiCore Branding)
echo "[-] Enabling Dark Mode..."
RESPONSE=$(curl -s -X POST "${KIBANA_URL}/api/kibana/settings" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d '{
        "changes": {
            "theme:darkMode": true
        }
      }')

if echo "$RESPONSE" | grep -q "settings"; then
    echo "[+] Dark Mode enabled."
else
    echo "[!] Warning: Failed to enable Dark Mode."
    echo "$RESPONSE"
fi

echo "[*] Kibana configuration complete!"
