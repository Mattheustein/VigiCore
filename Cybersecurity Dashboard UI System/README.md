# VigiCore: Security Operations Center (SOC) Dashboard

## 🛡️ Introduction
Welcome to **VigiCore**, an advanced Cybersecurity Dashboard and Security Operations Center (SOC) interface. This platform is designed to provide real-time threat intelligence, monitor authentication logs, track suspicious IP activity, and manage security alerts. 

Built with modern web technologies, VigiCore features a stunning dark-mode UI with glassmorphism effects, interactive data visualizations, and robust user management capabilities.

---

## 🚀 How to Launch the Project (Step-by-Step Guide)

If you have received this project as a `.zip` file, follow these simple, non-technical steps to get the dashboard running on your own computer.

### Step 1: Install Node.js (If you haven't already)
This project requires a program called **Node.js** to run. 
1. Go to the official website: [https://nodejs.org/](https://nodejs.org/)
2. Download and install the version labeled **"LTS" (Long Term Support)**.
3. Follow the installation wizard (you can leave all the default settings as they are).

### Step 2: Unzip the Project
1. Locate the `.zip` file you received.
2. Right-click the file and select **"Extract All..."** (Windows) or double-click it (Mac) to unzip it into a standard folder.
3. Open the newly extracted folder so you can see the project files inside (you should see files like `package.json` and folders like `src`).

### Step 3: Open your Terminal / Command Prompt
You need to type a couple of text commands to start the project.
* **On Windows:** Click the Start menu, type `cmd`, and open the **Command Prompt**.
* **On Mac:** Press `Command + Space`, type `Terminal`, and hit Enter.

### Step 4: Navigate to the Project Folder
In your terminal, you need to "change directories" (`cd`) into the folder you just unzipped.
1. Type `cd ` (make sure to include the space after 'cd').
2. Drag and drop the unzipped project folder from your file explorer directly into the terminal window. This will automatically paste the correct folder path.
3. Press **Enter**.

### Step 5: Install Project Dependencies
The project relies on external code packages that need to be downloaded first.
1. In the terminal, type the following command and press **Enter**:
   ```bash
   npm install
   ```
2. Wait a minute or two for the process to finish. You might see some warnings; these are completely normal.

### Step 6: Start the Dashboard
Now you are ready to launch VigiCore!
1. In the same terminal, type the following command and press **Enter**:
   ```bash
   npm run dev
   ```
2. You will see a message pop up in the terminal saying the server is running, usually looking something like this:
   `➜  Local:   http://localhost:5173/`
3. Open your web browser (Chrome, Edge, Safari, etc.).
4. Type `http://localhost:5173` into the address bar and hit **Enter**.

🎉 **Congratulations! You should now see the VigiCore Secure Login screen!**

*(Note: To stop the server later, simply go back to your terminal and press `Ctrl + C`)*

---

## ✨ Key Features
* **Live Dashboards:** Visualize failed logins, system health, and active alerts through interactive charts.
* **Suspicious Activity Monitoring:** Automatically flags brute-force attacks and highlights blocked IPs.
* **User Management:** Securely add, edit, and delete analysts and administrators.
* **Responsive Design:** A beautifully crafted, responsive UI that works across different screen sizes.

## 🛠️ Technology Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Authentication & Database:** Firebase Auth & Firestore
* **Visualizations:** Recharts