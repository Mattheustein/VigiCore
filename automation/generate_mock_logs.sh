#!/bin/bash
# VigiCore - Mock Log Generator
# Generates "dumb" logs to simulate traffic and attacks for visualization.

LOG_FILE="/var/log/auth.log" # We write to the actual log file being watched (or a copy if preferred)
# Note: Writing to /var/log/auth.log usually requires root. 
# Alternatively, we can write to a custom file and tell Filebeat to watch it, 
# but for "VigiCore" usually we watch system logs.
# Let's write to a custom file in /tmp/vigicore_mock.log and ensure Filebeat watches it,
# OR just simulate via logger command which writes to syslog/auth.log correctly.

echo "Starting VigiCore Mock Log Generator..."
echo "Press [CTRL+C] to stop."

while true; do
  # 1. Simulate SSH Failed Login (Brute Force)
  USER="fake_admin_$(shuf -i 1-5 -n 1)"
  IP="$((RANDOM % 223 + 1)).$((RANDOM % 255)).$((RANDOM % 255)).$((RANDOM % 255))"
  logger -p auth.info -t sshd "Failed password for invalid user $USER from $IP port 22 ssh2"
  echo "[+] Generated SSH failure for $USER from $IP"
  
  # 2. Simulate SSH Successful Login (Normal Admin)
  if [ $((RANDOM % 3)) -eq 0 ]; then
      USER="admin"
      IP="192.168.1.$((RANDOM % 20 + 10))"
      logger -p auth.info -t sshd "Accepted password for $USER from $IP port 22 ssh2"
      echo "[*] Generated SSH success for $USER from $IP"
  fi

  # 3. Simulate Sudo Access (Privilege Escalation attempt maybe?)
  if [ $((RANDOM % 5)) -eq 0 ]; then
      logger -p authpriv.notice -t sudo "alert_user : TTY=pts/0 ; PWD=/home/alert_user ; USER=root ; COMMAND=/bin/cat /etc/shadow"
      echo "[!] Generated Suspicious Sudo command"
  fi

  # 4. Simulate Normal Traffic
  logger -p user.info -t google-chrome "Created new window in existing browser session."
  
  sleep $(shuf -i 1-2 -n 1) # Faster generation (1-2s sleep) for demo
done
