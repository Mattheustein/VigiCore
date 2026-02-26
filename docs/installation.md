# VigiCore Installation Guide

This guide outlines the steps to deploy VigiCore on a local Ubuntu system.

## Prerequisites

*   **OS**: Ubuntu 20.04 LTS or 22.04 LTS (Desktop or Server).
*   **Resources**: Minimum 4GB RAM, 2 CPU cores.
*   **Disk Space**: At least 10GB free.
*   **User**: sudo-privileged account.

## Automated Installation

The installation is automated via a bash script. 

### Steps

1.  **Clone or Download Repository**:
    Navigate to the project directory:
    ```bash
    cd VigiCore
    ```

2.  **Run the Setup Script**:
    Execute the master installation script:
    ```bash
    # Note: Logic to be implemented in Week 2
    sudo ./setup.sh
    ```

    *The script will automatically:*
    *   Install Java (if needed), Elastic GPG keys, and repositories.
    *   Install `elasticsearch`, `kibana`, `logstash`, `filebeat`.
    *   Deploy configuration files from the local repository to `/etc/`.
    *   Enable and start all services.

3.  **Verify Services**:
    Check if the stack is running:
    ```bash
    sudo systemctl status elasticsearch kibana logstash filebeat
    ```

## Post-Installation

Once installed, access Kibana at:
`http://localhost:5601`

## Troubleshooting

*   **Elasticsearch fails to start**: Check `/var/log/elasticsearch/vigicore.log`. Often due to memory limits (JVM heap).
*   **Kibana not accessible**: Ensure Elasticsearch is running first.
*   **No logs in Kibana**: Check Filebeat logs (`/var/log/filebeat/filebeat`) to ensure it can read `/var/log/syslog`.
