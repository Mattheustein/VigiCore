#!/bin/bash
set -e

PROJECT_ROOT=$(pwd)

echo "----------------------------------------------------------------"
echo "Step 4: Configuring Components..."
echo "----------------------------------------------------------------"

# --- Elasticsearch ---
echo "[+] Configuring Elasticsearch..."
if [ -f /etc/elasticsearch/elasticsearch.yml ]; then
    sudo cp /etc/elasticsearch/elasticsearch.yml /etc/elasticsearch/elasticsearch.yml.bak
fi
sudo cp "$PROJECT_ROOT/elasticsearch/elasticsearch.yml" /etc/elasticsearch/elasticsearch.yml
sudo chown root:elasticsearch /etc/elasticsearch/elasticsearch.yml
sudo chmod 660 /etc/elasticsearch/elasticsearch.yml

# --- Kibana ---
echo "[+] Configuring Kibana..."
if [ -f /etc/kibana/kibana.yml ]; then
    sudo cp /etc/kibana/kibana.yml /etc/kibana/kibana.yml.bak
fi
sudo cp "$PROJECT_ROOT/kibana/kibana.yml" /etc/kibana/kibana.yml

# --- Logstash ---
echo "[+] Configuring Logstash..."
# Remove default configs if any to avoid conflicts? Usually conf.d is empty or has a sample.
# Copy our pipeline
sudo cp "$PROJECT_ROOT"/logstash/*.conf /etc/logstash/conf.d/

# --- Filebeat ---
echo "[+] Configuring Filebeat..."
if [ -f /etc/filebeat/filebeat.yml ]; then
    sudo cp /etc/filebeat/filebeat.yml /etc/filebeat/filebeat.yml.bak
fi
sudo cp "$PROJECT_ROOT/filebeat/filebeat.yml" /etc/filebeat/filebeat.yml

# --- Enable and Start Services ---
echo "[+] Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "[+] Enabling and starting Elasticsearch (this may take a moment)..."
sudo systemctl enable elasticsearch
sudo systemctl start elasticsearch

echo "[+] Enabling and starting Kibana..."
sudo systemctl enable kibana
sudo systemctl start kibana

echo "[+] Enabling and starting Logstash..."
sudo systemctl enable logstash
sudo systemctl start logstash

echo "[+] Enabling and starting Filebeat..."
sudo systemctl enable filebeat
sudo systemctl start filebeat

echo "[✓] Step 4 Complete."
