# VigiCore IDS (Graduation Project)

> [!IMPORTANT]
> **🌐 Live Dashboard Demo:** [VigiCore on Vercel](https://vigi-core.vercel.app/)
> **🐙 GitHub Repository:** [Mattheustein/VigiCore](https://github.com/Mattheustein/VigiCore)
> 
> **Evaluation Credentials:**
> - **Username:** `Admin`
> - **Password:** `Admin123`

**VigiCore** is a log-based Intrusion Detection System (IDS) designed for local Debian/Linux deployment (such as Kali Linux). It leverages the **ELK Stack** (Filebeat, Logstash, Elasticsearch, Kibana) to collect, process, and visualize system and authentication logs, detecting suspicious activities through defined rule-based logic.

## Project Overview

*   **Type**: Detection-only IDS (no prevention/blocking).
*   **Deployment**: Linux environment (e.g., Kali, Debian, Ubuntu).
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
You need to change your terminal's directory to the UI folder. If you extracted the `VigiCore` folder to your **Downloads**, simply copy, paste, and run the command for your operating system:

**For Windows:**
```cmd
cd %USERPROFILE%\Downloads\VigiCore\"Cybersecurity Dashboard UI System"
```

**For Mac/Linux:**
```bash
cd ~/Downloads/VigiCore/"Cybersecurity Dashboard UI System"
```

*(Note: If you extracted the folder somewhere else, replace the path in the command with your actual folder location.)*

### Step 4: Install Dependencies & Run
1. Install the required packages by copying, pasting, and running this command:
   ```bash
   npm install
   ```
2. Start the dashboard server by running:
   ```bash
   npm run dev
   ```
3. Open your web browser and navigate to `http://localhost:5173` to see the VigiCore Dashboard running locally!
