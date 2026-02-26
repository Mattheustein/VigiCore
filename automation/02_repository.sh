#!/bin/bash
set -e

echo "----------------------------------------------------------------"
echo "Step 2: Setting up Elastic Repository..."
echo "----------------------------------------------------------------"

# Import the Elasticsearch PGP Key
echo "[+] Importing Elastic GPG Key..."
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg --yes

# Add the repository definition
echo "[+] Adding Elastic APT repository..."
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list

# Update package list to include the new repository
echo "[+] Updating apt repositories..."
sudo apt-get update

echo "[✓] Step 2 Complete."
