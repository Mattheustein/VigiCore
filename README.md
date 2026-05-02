# VigiCore IDS (Graduation Project)

**VigiCore** is a log-based Intrusion Detection System (IDS) designed for local Debian/Linux deployment (such as Kali Linux). It leverages the **ELK Stack** (Filebeat, Logstash, Elasticsearch, Kibana) to collect, process, and visualize system and authentication logs, detecting suspicious activities through defined rule-based logic.

## Project Overview

*   **Type**: Detection-only IDS (no prevention/blocking).
*   **Deployment**: Debian/Linux environment (e.g., Kali Linux).
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

See `docs/installation.md` for ELK backend setup instructions.

---

## 🚀 How to Launch the Dashboard

If you have received this project as a `.zip` file, follow these simple steps to run the interactive dashboard on your local machine.

### Step 1: Install Node.js
The dashboard requires **Node.js** to run. 
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download and install the version labeled **"LTS" (Long Term Support)**.
3. Follow the installation wizard with default settings.

### Step 2: Open Terminal / Command Prompt
* **Windows:** Open the Start menu, type `cmd`, and open the **Command Prompt**.
* **Mac/Linux:** Open your **Terminal**.

### Step 3: Navigate to the Dashboard Folder
1. In your terminal, type `cd ` (make sure to include the space).
2. Drag and drop the unzipped `VigiCore` folder into the terminal, then press **Enter**.
3. Navigate to the UI folder by typing:
   ```bash
   cd "Cybersecurity Dashboard UI System"
   ```
4. Press **Enter**.

### Step 4: Install Dependencies & Run
1. Install the required packages by running:
   ```bash
   npm install
   ```
2. Start the dashboard server by running:
   ```bash
   npm run dev
   ```
3. Open your web browser and navigate to `http://localhost:5173` to see the VigiCore Dashboard running locally!
