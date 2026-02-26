#!/bin/bash
set -e

# VigiCore Colors (Purple & Orange Gradient Theme)
COLOR_PRIMARY='\033[38;5;129m' # Deep Purple
COLOR_SECONDARY='\033[38;5;208m' # Orange
COLOR_RESET='\033[0m'

# Ensure script is run with sudo if not root
if [ "$EUID" -ne 0 ]; then
  echo -e "${COLOR_SECONDARY}Please run as root (use sudo)${COLOR_RESET}"
  exit 1
fi

echo -e "${COLOR_PRIMARY}================================================================${COLOR_RESET}"
echo -e "${COLOR_PRIMARY}          VigiCore IDS ${COLOR_SECONDARY}- Automated Installer${COLOR_RESET}"
echo -e "${COLOR_PRIMARY}================================================================${COLOR_RESET}"

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Make scripts executable
chmod +x automation/*.sh

# Execute steps
echo -e "${COLOR_SECONDARY}Starting Installation...${COLOR_RESET}"
./automation/01_prerequisites.sh
./automation/02_repository.sh
./automation/03_install_components.sh
./automation/04_configure.sh

echo -e "${COLOR_PRIMARY}================================================================${COLOR_RESET}"
echo -e "${COLOR_SECONDARY}          Installation Complete!                                ${COLOR_RESET}"
echo -e "${COLOR_PRIMARY}================================================================${COLOR_RESET}"
echo ""
echo -e "${COLOR_PRIMARY}Please verify services are running:${COLOR_RESET}"
echo "sudo systemctl status elasticsearch kibana logstash filebeat"
echo ""
echo -e "${COLOR_PRIMARY}Access Kibana at: ${COLOR_SECONDARY}http://localhost:5601${COLOR_RESET}"
