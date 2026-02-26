#!/bin/bash
set -e

echo "----------------------------------------------------------------"
echo "Step 3: Installing ELK Components..."
echo "----------------------------------------------------------------"

# Install components
echo "[+] Installing Elasticsearch..."
sudo apt-get install -y elasticsearch

echo "[+] Installing Kibana..."
sudo apt-get install -y kibana

echo "[+] Installing Logstash..."
sudo apt-get install -y logstash

echo "[+] Installing Filebeat..."
sudo apt-get install -y filebeat

echo "[✓] Step 3 Complete."
