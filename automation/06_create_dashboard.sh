#!/bin/bash

# VigiCore - Automated Dashboard Creation
# Creates "Top Attackers", "Targeted Users", "Attack Timeline" and "VigiCore Overview" Dashboard.

KIBANA_URL="http://localhost:5601"
HEADER_ContentType="Content-Type: application/json"
HEADER_kbn_xsrf="kbn-xsrf: true"

echo "[*] VigiCore: Creating Dashboard..."

# 1. Get Data View ID
DATA_VIEW_ID=$(curl -s -X GET "${KIBANA_URL}/api/data_views" | jq -r '.data_view[] | select(.title=="vigicore-*") | .id')

if [ -z "$DATA_VIEW_ID" ]; then
    echo "[!] Error: Data View 'vigicore-*' not found. Run 05_setup_kibana.sh first."
    exit 1
fi
echo "[+] Using Data View ID: $DATA_VIEW_ID"

# 2. Create Visualizations (Lens)

# Visualization 1: Top Attackers (Horizontal Bar)
echo "[-] Creating Visualization: Top Attackers..."
VIS_ATTACKERS_ID="vigicore-viz-attackers"
curl -s -X POST "${KIBANA_URL}/api/saved_objects/lens/${VIS_ATTACKERS_ID}?overwrite=true" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d "{
  \"attributes\": {
    \"title\": \"Top Attackers (Source IP)\",
    \"description\": \"Most frequent source IPs from auth logs.\",
    \"visState\": \"{\\\"visualizationType\\\":\\\"lnsXY\\\",\\\"title\\\":\\\"Top Attackers (Source IP)\\\",\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"layerType\\\":\\\"data\\\",\\\"isLayerBased\\\":true,\\\"layers\\\":[{\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"series\\\":[{\\\"isStats\\\":false,\\\"type\\\":\\\"bar_horizontal\\\",\\\"gridItem\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"w\\\":24,\\\"h\\\":15},\\\"x\\\":{\\\"accessor\\\":\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"format\\\":{\\\"id\\\":\\\"number\\\"},\\\"params\\\":{},\\\"label\\\":\\\"Count of records\\\",\\\"dataType\\\":\\\"number\\\"},\\\"y\\\":{\\\"accessor\\\":\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\",\\\"format\\\":{\\\"id\\\":\\\"terms\\\",\\\"params\\\":{\\\"missingBucketLabel\\\":\\\"Missing\\\",\\\"otherBucketLabel\\\":\\\"Other\\\"}},\\\"params\\\":{},\\\"label\\\":\\\"Top 10 Source IPs\\\",\\\"dataType\\\":\\\"string\\\"},\\\"accessors\\\":[\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\"]}],\\\"accessors\\\":{\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"count\\\"},\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"es_terms\\\",\\\"field\\\":\\\"src_ip.keyword\\\",\\\"sort\\\":{\\\"type\\\":\\\"measure\\\",\\\"field\\\":\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"direction\\\":\\\"desc\\\"},\\\"size\\\":10}}}],\\\"query\\\":{\\\"query\\\":\\\"\\\",\\\"language\\\":\\\"kuery\\\"}}\"
  },
  \"references\": [
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-current-layer\",
      \"type\": \"index-pattern\"
    },
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-layer-570530e3-9584-4861-bd8c-529606869888\",
      \"type\": \"index-pattern\"
    }
  ]
}" > /dev/null
echo "[+] Created 'Top Attackers' Visualization."

# Visualization 2: Targeted Users (Donut)
echo "[-] Creating Visualization: Targeted Users..."
VIS_USERS_ID="vigicore-viz-users"
curl -s -X POST "${KIBANA_URL}/api/saved_objects/lens/${VIS_USERS_ID}?overwrite=true" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d "{
  \"attributes\": {
    \"title\": \"Targeted Users\",
    \"description\": \"Which users are being brute-forced.\",
    \"visState\": \"{\\\"visualizationType\\\":\\\"lnsPie\\\",\\\"title\\\":\\\"Targeted Users\\\",\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"layerType\\\":\\\"data\\\",\\\"isLayerBased\\\":true,\\\"layers\\\":[{\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"series\\\":[{\\\"isStats\\\":false,\\\"type\\\":\\\"pie\\\",\\\"gridItem\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"w\\\":24,\\\"h\\\":15},\\\"shape\\\":\\\"donut\\\",\\\"slice\\\":{\\\"accessor\\\":\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\",\\\"format\\\":{\\\"id\\\":\\\"terms\\\",\\\"params\\\":{\\\"missingBucketLabel\\\":\\\"Missing\\\",\\\"otherBucketLabel\\\":\\\"Other\\\"}},\\\"params\\\":{},\\\"label\\\":\\\"Top 5 Users\\\",\\\"dataType\\\":\\\"string\\\"},\\\"size\\\":{\\\"accessor\\\":\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"format\\\":{\\\"id\\\":\\\"number\\\"},\\\"params\\\":{},\\\"label\\\":\\\"Count of records\\\",\\\"dataType\\\":\\\"number\\\"},\\\"accessors\\\":[\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\"]}],\\\"accessors\\\":{\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"count\\\"},\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"es_terms\\\",\\\"field\\\":\\\"user.keyword\\\",\\\"sort\\\":{\\\"type\\\":\\\"measure\\\",\\\"field\\\":\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"direction\\\":\\\"desc\\\"},\\\"size\\\":5}}}],\\\"query\\\":{\\\"query\\\":\\\"\\\",\\\"language\\\":\\\"kuery\\\"}}\"
  },
  \"references\": [
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-current-layer\",
      \"type\": \"index-pattern\"
    },
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-layer-570530e3-9584-4861-bd8c-529606869888\",
      \"type\": \"index-pattern\"
    }
  ]
}" > /dev/null
echo "[+] Created 'Targeted Users' Visualization."


# Visualization 3: Attack Timeline (Area)
echo "[-] Creating Visualization: Attack Timeline..."
VIS_TIMELINE_ID="vigicore-viz-timeline"
curl -s -X POST "${KIBANA_URL}/api/saved_objects/lens/${VIS_TIMELINE_ID}?overwrite=true" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d "{
  \"attributes\": {
    \"title\": \"Attack Timeline\",
    \"description\": \"Attacks over time.\",
    \"visState\": \"{\\\"visualizationType\\\":\\\"lnsXY\\\",\\\"title\\\":\\\"Attack Timeline\\\",\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"layerType\\\":\\\"data\\\",\\\"isLayerBased\\\":true,\\\"layers\\\":[{\\\"layerId\\\":\\\"570530e3-9584-4861-bd8c-529606869888\\\",\\\"series\\\":[{\\\"isStats\\\":false,\\\"type\\\":\\\"area_stacked\\\",\\\"gridItem\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"w\\\":24,\\\"h\\\":15},\\\"x\\\":{\\\"accessor\\\":\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"format\\\":{\\\"id\\\":\\\"date_nanos\\\",\\\"params\\\":{\\\"pattern\\\":\\\"MMM D, YYYY @ HH:mm:ss.SSS\\\"}},\\\"params\\\":{\\\"date\\\":true,\\\"interval\\\":\\\"auto\\\"},\\\"label\\\":\\\"Timestamp\\\",\\\"dataType\\\":\\\"date\\\"},\\\"y\\\":{\\\"accessor\\\":\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\",\\\"format\\\":{\\\"id\\\":\\\"number\\\"},\\\"params\\\":{},\\\"label\\\":\\\"Count of records\\\",\\\"dataType\\\":\\\"number\\\"},\\\"breakdown\\\":{\\\"accessor\\\":\\\"breakdown_accessor\\\",\\\"format\\\":{\\\"id\\\":\\\"terms\\\",\\\"params\\\":{\\\"missingBucketLabel\\\":\\\"Missing\\\",\\\"otherBucketLabel\\\":\\\"Other\\\"}},\\\"params\\\":{},\\\"label\\\":\\\"Program\\\",\\\"dataType\\\":\\\"string\\\"},\\\"accessors\\\":[\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\",\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\",\\\"breakdown_accessor\\\"]}],\\\"accessors\\\":{\\\"c01c03b4-f06b-4786-8968-45ec674b35d5\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"es_date_histogram\\\",\\\"field\\\":\\\"@timestamp\\\",\\\"timeInterval\\\":\\\"auto\\\"},\\\"54162985-1f9e-4c75-9c59-b3aee10f3679\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"count\\\"},\\\"breakdown_accessor\\\":{\\\"sourceId\\\":\\\"$DATA_VIEW_ID\\\",\\\"type\\\":\\\"es_terms\\\",\\\"field\\\":\\\"program.keyword\\\",\\\"size\\\":3}}}],\\\"query\\\":{\\\"query\\\":\\\"\\\",\\\"language\\\":\\\"kuery\\\"}}\"
  },
  \"references\": [
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-current-layer\",
      \"type\": \"index-pattern\"
    },
    {
      \"id\": \"$DATA_VIEW_ID\",
      \"name\": \"indexpattern-datasource-layer-570530e3-9584-4861-bd8c-529606869888\",
      \"type\": \"index-pattern\"
    }
  ]
}" > /dev/null
echo "[+] Created 'Attack Timeline' Visualization."


# 3. Create Dashboard
echo "[-] Creating Dashboard: VigiCore Overview..."
DASH_ID="vigicore-dashboard"
curl -s -X POST "${KIBANA_URL}/api/saved_objects/dashboard/${DASH_ID}?overwrite=true" \
  -H "${HEADER_kbn_xsrf}" \
  -H "${HEADER_ContentType}" \
  -d "{
  \"attributes\": {
    \"title\": \"VigiCore Overview\",
    \"description\": \"Main dashboard for VigiCore IDS.\",
    \"panelsJSON\": \"[{\\\"version\\\":\\\"8.0.0\\\",\\\"type\\\":\\\"lens\\\",\\\"gridData\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"w\\\":24,\\\"h\\\":15,\\\"i\\\":\\\"1\\\"},\\\"panelIndex\\\":\\\"1\\\",\\\"embeddableConfig\\\":{},\\\"panelRefName\\\":\\\"panel_0\\\"},{\\\"version\\\":\\\"8.0.0\\\",\\\"type\\\":\\\"lens\\\",\\\"gridData\\\":{\\\"x\\\":24,\\\"y\\\":0,\\\"w\\\":24,\\\"h\\\":15,\\\"i\\\":\\\"2\\\"},\\\"panelIndex\\\":\\\"2\\\",\\\"embeddableConfig\\\":{},\\\"panelRefName\\\":\\\"panel_1\\\"},{\\\"version\\\":\\\"8.0.0\\\",\\\"type\\\":\\\"lens\\\",\\\"gridData\\\":{\\\"x\\\":0,\\\"y\\\":15,\\\"w\\\":48,\\\"h\\\":15,\\\"i\\\":\\\"3\\\"},\\\"panelIndex\\\":\\\"3\\\",\\\"embeddableConfig\\\":{},\\\"panelRefName\\\":\\\"panel_2\\\"}]\",
    \"optionsJSON\": \"{\\\"useMargins\\\":true,\\\"hidePanelTitles\\\":false}\" 
  },
  \"references\": [
    {
      \"id\": \"${VIS_ATTACKERS_ID}\",
      \"name\": \"panel_0\",
      \"type\": \"lens\"
    },
    {
      \"id\": \"${VIS_USERS_ID}\",
      \"name\": \"panel_1\",
      \"type\": \"lens\"
    },
    {
      \"id\": \"${VIS_TIMELINE_ID}\",
      \"name\": \"panel_2\",
      \"type\": \"lens\"
    }
  ]
}" > /dev/null
echo "[+] Created 'VigiCore Overview' Dashboard."

echo "[*] Dashboard creation complete! Access it here: ${KIBANA_URL}/app/dashboards#/view/${DASH_ID}"
