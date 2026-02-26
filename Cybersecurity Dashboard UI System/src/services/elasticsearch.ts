import axios from 'axios';

const ES_API_URL = '/api/elasticsearch';

export interface FailedLogin {
    time: string;
    attempts: number;
}

export interface TopIP {
    ip: string;
    attempts: number;
}

export interface AuthLog {
    id: string;
    timestamp: string;
    user: string;
    sourceIp: string;
    host: string;
    result: 'Success' | 'Failed';
    method: string;
    port: number;
}

export interface AuthEvent {
    time: string;
    events: number;
}

export const ElasticsearchService = {
    /**
     * Fetch raw authentication logs
     */
    getAuthLogs: async (size: number = 50): Promise<AuthLog[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: size,
                sort: [{ "@timestamp": { order: "desc" } }],
                query: {
                    terms: { "event_action.keyword": ["ssh_login_success", "ssh_login_failed"] }
                }
            });

            return response.data.hits.hits.map((hit: any) => {
                const source = hit._source;
                const message = source.message || "";
                // Extract port if available in message (simple regex)
                const portMatch = message.match(/port (\d+)/);
                const port = portMatch ? parseInt(portMatch[1]) : 22;

                return {
                    id: hit._id,
                    timestamp: source["@timestamp"],
                    user: source.user || "unknown",
                    sourceIp: source.src_ip || "unknown",
                    host: source.hostname || source.host?.name || "unknown",
                    result: source.event_action === "ssh_login_success" ? "Success" : "Failed",
                    method: "password", // promoting password as default for now, could parse from message
                    port: port
                };
            });
        } catch (error) {
            console.error('Error fetching auth logs:', error);
            return [];
        }
    },

    /**
     * Fetch failed login attempts over time (histogram)
     */
    getFailedLogins: async (): Promise<FailedLogin[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 0,
                query: {
                    bool: {
                        must: [
                            { term: { "event_action.keyword": "ssh_login_failed" } }
                        ],
                        filter: [
                            { range: { "@timestamp": { gte: "now-24h" } } }
                        ]
                    }
                },
                aggs: {
                    attempts_over_time: {
                        date_histogram: {
                            field: "@timestamp",
                            fixed_interval: "4h",
                            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                    }
                }
            });

            return response.data.aggregations.attempts_over_time.buckets.map((bucket: any) => ({
                time: new Date(bucket.key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attempts: bucket.doc_count
            }));
        } catch (error) {
            console.error('Error fetching failed logins:', error);
            return [];
        }
    },

    /**
     * Fetch top source IPs (terms aggregation)
     */
    getTopSourceIPs: async (): Promise<TopIP[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 0,
                query: {
                    range: { "@timestamp": { gte: "now-24h" } }
                },
                aggs: {
                    top_source_ips: {
                        terms: {
                            field: "src_ip.keyword",
                            size: 5
                        }
                    }
                }
            });

            return response.data.aggregations.top_source_ips.buckets.map((bucket: any) => ({
                ip: bucket.key,
                attempts: bucket.doc_count
            }));
        } catch (error) {
            console.error('Error fetching top source IPs:', error);
            return [];
        }
    },

    /**
     * Fetch authentication timeline (success vs failure)
     */
    getAuthTimeline: async (): Promise<AuthEvent[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 0,
                query: {
                    range: { "@timestamp": { gte: "now-24h" } }
                },
                aggs: {
                    events_over_time: {
                        date_histogram: {
                            field: "@timestamp",
                            fixed_interval: "4h",
                            time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                    }
                }
            });

            return response.data.aggregations.events_over_time.buckets.map((bucket: any) => ({
                time: new Date(bucket.key).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                events: bucket.doc_count
            }));
        } catch (error) {
            console.error('Error fetching auth timeline:', error);
            return [];
        }
    },

    /**
     * Fetch Login Success vs Failure distribution
     */
    getLoginDistribution: async (): Promise<{ name: string; value: number; color: string }[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 0,
                query: {
                    bool: {
                        must: [
                            { terms: { "event_action.keyword": ["ssh_login_success", "ssh_login_failed"] } }
                        ],
                        filter: [
                            { range: { "@timestamp": { gte: "now-24h" } } }
                        ]
                    }
                },
                aggs: {
                    action_distribution: {
                        terms: { field: "event_action.keyword" }
                    }
                }
            });

            const buckets = response.data.aggregations.action_distribution.buckets;
            const successCount = buckets.find((b: any) => b.key === 'ssh_login_success')?.doc_count || 0;
            const failureCount = buckets.find((b: any) => b.key === 'ssh_login_failed')?.doc_count || 0;

            return [
                { name: 'Success', value: successCount, color: '#10B981' },
                { name: 'Failed', value: failureCount, color: '#EF4444' },
            ];
        } catch (error) {
            console.error('Error fetching login distribution:', error);
            // Return empty structure to prevent crashes, but with 0 values
            return [
                { name: 'Success', value: 0, color: '#10B981' },
                { name: 'Failed', value: 0, color: '#EF4444' },
            ];
        }
    },

    /**
     * Fetch Suspicious IP Activity (Top failed logins with details)
     */
    getSuspiciousIPs: async (): Promise<any[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 0,
                query: {
                    bool: {
                        must: [
                            { term: { "event_action.keyword": "ssh_login_failed" } }
                        ],
                        filter: [
                            { range: { "@timestamp": { gte: "now-24h" } } }
                        ]
                    }
                },
                aggs: {
                    top_suspicious: {
                        terms: { field: "src_ip.keyword", size: 5 },
                        aggs: {
                            top_user_hits: {
                                top_hits: {
                                    size: 1,
                                    _source: ["user", "@timestamp"]
                                }
                            }
                        }
                    }
                }
            });

            return response.data.aggregations.top_suspicious.buckets.map((bucket: any) => {
                const attempts = bucket.doc_count;
                // Determine risk based on attempts (arbitrary logic for demo)
                const risk = attempts > 50 ? 'High' : attempts > 20 ? 'Medium' : 'Low';
                const status = attempts > 50 ? 'Blocked' : 'Monitoring';
                const user = bucket.top_user_hits.hits.hits[0]?._source?.user || 'unknown';
                const timestamp = bucket.top_user_hits.hits.hits[0]?._source?.['@timestamp'] || new Date().toISOString();

                return {
                    ip: bucket.key,
                    attempts: attempts,
                    user: user,
                    status: status,
                    risk: risk,
                    timestamp: timestamp
                };
            });
        } catch (error) {
            console.error('Error fetching suspicious IPs:', error);
            return [];
        }
    },

    /**
     * Get System Health Metrics (CPU, Memory, Disk)
     * mocked or from system-metrics logs
     */
    getSystemHealth: async (): Promise<any> => {
        try {
            // Try to fetch latest system-metrics log
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 1,
                sort: [{ "@timestamp": { order: "desc" } }],
                query: {
                    match: { "event.dataset": "system_metrics" }
                }
            });

            if (response.data.hits.hits.length > 0) {
                const source = response.data.hits.hits[0]._source;
                // Parse message if fields aren't extracted, or use extracted fields
                // Logstash grok: cpu_usage:int, memory_usage:int, disk_usage:int
                return {
                    cpu: source.cpu_usage || 0,
                    memory: source.memory_usage || 0,
                    disk: source.disk_usage || 0,
                    status: source.cpu_usage > 80 ? 'Critical' : source.cpu_usage > 60 ? 'Warning' : 'Healthy'
                };
            }
            return { cpu: 0, memory: 0, disk: 0, status: 'Unknown' };
        } catch (error) {
            console.error('Error fetching system health:', error);
            return { cpu: 0, memory: 0, disk: 0, status: 'Unknown' };
        }
    },

    /**
     * Get recent security alerts (High risk attempts)
     */
    getAlerts: async (): Promise<any[]> => {
        try {
            const response = await axios.post(`${ES_API_URL}/vigicore-*/_search`, {
                size: 20,
                sort: [{ "@timestamp": { order: "desc" } }],
                query: {
                    bool: {
                        must: [
                            { term: { "event_action.keyword": "ssh_login_failed" } }
                        ],
                        filter: [
                            { range: { "@timestamp": { gte: "now-24h" } } }
                        ]
                    }
                }
            });

            return response.data.hits.hits.map((hit: any) => ({
                id: hit._id,
                title: 'Failed Login Attempt',
                severity: 'Medium', // Default to medium for single failures
                timestamp: hit._source["@timestamp"],
                status: 'Active',
                description: `Failed login for user ${hit._source.user || 'unknown'} from ${hit._source.src_ip || 'unknown'}`
            }));
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
    },

    /**
     * Get cluster health to verify connection
     */
    checkHealth: async () => {
        try {
            const response = await axios.get(`${ES_API_URL}/_cluster/health`);
            return response.data;
        } catch (error) {
            console.error('Error checking cluster health:', error);
            return null;
        }
    }
};
