# VigiCore Detection Logic

VigiCore uses a **Rule-Based Intrusion Detection** approach. The logic is implemented via Kibana Saved Searches and Visualizations that highlight anomalies matching specific criteria.

## Detection Rules

### 1. Brute Force SSH Attack (High Severity)
*   **Logic**: Detects a high volume of failed authentication attempts from a single IP address within a short time window.
*   **Criteria**:
    *   `event.dataset`: "system.auth" OR `source`: "/var/log/auth.log"
    *   `event.action`: "ssh_login_failed" OR `message` contains "Failed password"
    *   **Threshold**: > 5 attempts
    *   **Time Window**: 1 minute
    *   **Grouping**: By `source.ip`
*   **Justification**: Manual typos happen, but 5+ failures in a minute strongly indicate an automated script or brute-force tool.

### 2. Valid Login after Multiple Failures (Critical Severity)
*   **Logic**: Identify successful logins that were immediately preceded by failed attempts from the same IP.
*   **Criteria**:
    *   Sequence of events: [Failed Login] -> [Failed Login] -> ... -> [Successful Login]
    *   **Time Window**: 5 minutes
    *   **Grouping**: By `source.ip` and `user.name`
*   **Justification**: Could indicate a successful brute-force attack where the attacker finally guessed the correct credential.

### 3. Login Attempts on Non-Standard Users (Medium Severity)
*   **Logic**: Detects login attempts for users that should not exist or be used for SSH.
*   **Criteria**:
    *   `user.name`: "admin", "root", "support", "test", "oracle", "postgres" (if these are not valid users on the specific host).
    *   `event.outcome`: "failure" or "success"
*   **Justification**: Attackers often try default or common usernames.

### 4. Spike in Authentication Failures (Global)
*   **Logic**: A sudden system-wide increase in authentication failures.
*   **Visualization**: Time-series analysis (Timeline).
*   **Criteria**:
    *   Count of failed events > 3 standard deviations above moving average (visual detection).
*   **Justification**: Indicates a distributed attack (botnet) or a misconfigured service loop.

### 5. SUDO Abuse Attempts
*   **Logic**: Detects failed sudo commands.
*   **Criteria**:
    *   `process.name`: "sudo"
    *   `event.outcome`: "failure" OR `message` contains "technically INCORRECT password"
*   **Justification**: An internal user or compromised account attempting to escalate privileges without authorization.

## Explanation for Reviewers

These rules are strictly deterministic and based on well-understood attack patterns. They avoid "black box" machine learning to ensure every alert is explainable by referring to the specific log entries that triggered it.
