# VigiCore Automation Strategy

## Overview

VigiCore deployment relies on a modular, bash-based automation approach to ensure consistent and reproducible installations on Ubuntu systems. The automation scripts are designed to handle prerequisites, component installation, configuration application, and service validation.

## Automation Components

The installation process is divided into distinct stages, orchestrated by a master script or run individually:

### 1. Prerequisites Check
*   **Root Privileges**: Verifies the script is run with `sudo`.
*   **OS Compatibility**: Confirms the OS is Ubuntu.
*   **Dependencies**: Installs `curl`, `wget`, `gnupg`, and `apt-transport-https`.
*   **Java Runtime**: Checks for or installs a compatible JRE/JDK if required by specific ELK versions (though modern ELK bundles its own).

### 2. Repository Setup
*   **GPG Keys**: Adds the Elastic GPG key to the system's keyring.
*   **APT Repository**: Adds the official Elastic APT repository to `/etc/apt/sources.list.d/`.

### 3. Component Installation
*   **Elasticsearch**: Installs the `elasticsearch` package.
*   **Kibana**: Installs the `kibana` package.
*   **Logstash**: Installs the `logstash` package.
*   **Filebeat**: Installs the `filebeat` package.

### 4. Configuration Management
*   **Backups**: Automatically backs up original configuration files (e.g., `/etc/elasticsearch/elasticsearch.yml`) before modification.
*   **Config Deployment**: Copies VigiCore-specific configuration files from the local project directory to their respective `/etc/` directories.
    *   `elasticsearch.yml`: Configures cluster name, network host (localhost), and discovery settings.
    *   `kibana.yml`: Configures server port and Elasticsearch connection.
    *   `logstash.conf`: Deploys the log processing pipeline to `/etc/logstash/conf.d/`.
    *   `filebeat.yml`: Configures inputs (system logs) and output (Logstash).

### 5. Service Lifecycle Management
*   **Enable Services**: Enables systemd services to start on boot.
*   **Restart Services**: Restarts services to apply new configurations.
*   **Health Checks**: Waits for services to become active and checks their health status (e.g., querying `localhost:9200/_cluster/health`).

## Execution

The user will execute a main setup script (e.g., `setup.sh`) which invokes these steps sequentially, providing color-coded status output to the terminal.

> **Note**: This document describes the automation logic. The actual shell scripts would be developed and placed in a `scripts/` directory or similar during the implementation phase, not included in this business case document.
