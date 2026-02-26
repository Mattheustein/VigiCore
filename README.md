# VigiCore IDS

**VigiCore** is a log-based Intrusion Detection System (IDS) designed for local Ubuntu deployment. It leverages the **ELK Stack** (Filebeat, Logstash, Elasticsearch, Kibana) to collect, process, and visualize system and authentication logs, detecting suspicious activities through defined rule-based logic.

## Project Overview

*   **Type**: Detection-only IDS (no prevention/blocking).
*   **Deployment**: Local Ubuntu installation.
*   **Tech Stack**: Filebeat, Logstash, Elasticsearch, Kibana.
*   **Log Sources**: `/var/log/syslog`, `/var/log/auth.log`.

## Directory Structure

*   `automation/`: Documentation of the bash-based automated installation approach.
*   `filebeat/`: Configuration and resources for log collection.
*   `logstash/`: Parsing pipelines and Grok patterns.
*   `elasticsearch/`: Index templates and mapping configurations.
*   `kibana/`: Dashboard definitions and visualization exports.
*   `docs/`: Detailed project documentation.

## Getting Started

See `docs/installation.md` for setup instructions.
