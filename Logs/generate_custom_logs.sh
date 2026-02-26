#!/bin/bash
# VigiCore - Custom Log Generator
# Writes simulated auth logs AND system metrics to VigiCore/Logs/custom_traffic.log

LOG_FILE="/home/ubuntu/VigiCore/Logs/custom_traffic.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "Starting High-Volume Custom Log Generator (Auth + Metrics)..."
echo "Writing validation logs to: $LOG_FILE"
echo "Press [CTRL+C] to stop."

# Ensure file exists
touch "$LOG_FILE"

# IP Ranges for variety
declare -a ATTACKER_IPS=("45.13.22.11" "103.20.1.5" "185.99.2.1" "203.0.113.42" "198.51.100.23")
declare -a USERS=("root" "admin" "ubuntu" "test_user" "deploy" "postgres")

generate_log() {
    TIMESTAMP=$(date "+%b %d %H:%M:%S")
    HOSTNAME="ubuntu-2204"
    
    # 20% chance of system metric, 80% auth log
    if [ $((RANDOM % 10)) -lt 2 ]; then
        # System Metric
        CPU=$((RANDOM % 60 + 10)) # 10-70%
        MEM=$((RANDOM % 40 + 30)) # 30-70%
        DISK=45
        echo "$TIMESTAMP $HOSTNAME system-metrics: cpu=$CPU memory=$MEM disk=$DISK" >> "$LOG_FILE"
        echo "[#] Generated Metrics: CPU=$CPU% MEM=$MEM%"
    else
        # Auth Log (70% Attack / 30% Benign of the remaining 80%)
        if [ $((RANDOM % 10)) -lt 7 ]; then
            # Attack Logic
            USER=${USERS[$((RANDOM % ${#USERS[@]}))]}
            IP=${ATTACKER_IPS[$((RANDOM % ${#ATTACKER_IPS[@]}))]}
            PORT=$((RANDOM % 10000 + 1024))
            
            echo "$TIMESTAMP $HOSTNAME sshd[12345]: Failed password for invalid user $USER from $IP port $PORT ssh2" >> "$LOG_FILE"
            echo "[!] Generated Attack: $USER from $IP"
        else
            # Success Logic
            USER="admin"
            IP="192.168.1.$((RANDOM % 20 + 20))"
            PORT=$((RANDOM % 10000 + 1024))
            
            echo "$TIMESTAMP $HOSTNAME sshd[12345]: Accepted password for $USER from $IP port $PORT ssh2" >> "$LOG_FILE"
            echo "[+] Generated Success: $USER from $IP"
        fi
    fi
}

# Generate a burst of logs initially
echo "Generating initial burst..."
for i in {1..20}; do
    generate_log
done

# Continuous generation
while true; do
    generate_log
    sleep 0.5 
done
