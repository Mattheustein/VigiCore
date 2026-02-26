#!/bin/bash
set -e

echo "----------------------------------------------------------------"
echo "Step 1: Checking and Installing Prerequisites..."
echo "----------------------------------------------------------------"

# Update package list
sudo apt-get update

# Install basic dependencies
echo "[+] Installing curl, wget, gnupg, and apt-transport-https..."
sudo apt-get install -y curl wget gnupg apt-transport-https

# Check for Java
if type -p java; then
    echo "[+] Java executable found in PATH"
    _java=java
elif [[ -n "$JAVA_HOME" ]] && [[ -x "$JAVA_HOME/bin/java" ]];  then
    echo "[+] Java executable found in JAVA_HOME"
    _java="$JAVA_HOME/bin/java"
else
    echo "[!] Java not found. Installing OpenJDK 17..."
    sudo apt-get install -y openjdk-17-jre-headless
fi

echo "[✓] Step 1 Complete."
