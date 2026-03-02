import { Card } from '../components/ui/card';
import { ArrowDownToLine, ArrowUpFromLine, Network, Activity, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';

// Fixed initial chart generation to avoid hydrating empty
const generateInitialBandwidth = () => {
    const data = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
        data.push({
            time: new Date(now - i * 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            inbound: Math.floor(Math.random() * 50) + 20,
            outbound: Math.floor(Math.random() * 30) + 10,
        });
    }
    return data;
};

const PROTOCOL_COLORS = ['#5B6AC2', '#E91E63', '#10B981', '#F59E0B'];

export function NetworkTrafficPage() {
    const [bandwidthData, setBandwidthData] = useState<any[]>(generateInitialBandwidth());
    const [metrics, setMetrics] = useState({
        inboundMbps: 0,
        outboundMbps: 0,
        activeConnections: 0,
        droppedPackets: 0,
    });

    const [protocolData, setProtocolData] = useState([
        { name: 'TCP', value: 65 },
        { name: 'UDP', value: 20 },
        { name: 'ICMP', value: 10 },
        { name: 'Other', value: 5 },
    ]);

    const [connections, setConnections] = useState<any[]>([]);

    useEffect(() => {
        // Generate static list of connections for display
        const generatedConnections = Array(10).fill(0).map((_, i) => ({
            id: i,
            source: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
            dest: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.10.5`,
            port: [443, 80, 22, 53, 3389][Math.floor(Math.random() * 5)],
            protocol: ['TCP', 'UDP', 'TCP', 'UDP', 'ICMP'][Math.floor(Math.random() * 5)],
            bytes: Math.floor(Math.random() * 5000) + 500,
            status: Math.random() > 0.1 ? 'ESTABLISHED' : 'BLOCKED'
        }));
        setConnections(generatedConnections);

        const interval = setInterval(() => {
            // Update Bandwidth
            const inbound = Math.floor(Math.random() * 60) + 20;
            const outbound = Math.floor(Math.random() * 40) + 10;

            setBandwidthData(prev => {
                const newData = [...prev.slice(1)];
                newData.push({
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    inbound,
                    outbound,
                });
                return newData;
            });

            // Update Metrics
            setMetrics({
                inboundMbps: inbound,
                outboundMbps: outbound,
                activeConnections: Math.floor(Math.random() * 500) + 2000,
                droppedPackets: Math.floor(Math.random() * 50) + 5,
            });

            // Slightly fluctuate protocols
            setProtocolData(prev =>
                prev.map(p => ({
                    ...p,
                    value: Math.max(1, p.value + (Math.random() * 4 - 2))
                }))
            );

        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Network Traffic Analysis (NTA)</h1>
                <p className="text-gray-400 mt-1">Real-time volumetric traffic, protocol distribution, and active connections.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 border-b border-[#5B6AC2]/20">
                {['overview', 'connections', 'protocols'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                            ? 'border-[#5B6AC2] text-[#5B6AC2]'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Top Metrics Cards */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Inbound Traffic</p>
                                <p className="text-3xl font-bold text-blue-400 mt-1">{metrics.inboundMbps} <span className="text-xs text-gray-400 font-normal">Mbps</span></p>
                            </div>
                            <ArrowDownToLine className="w-10 h-10 text-blue-400 opacity-50" />
                        </div>
                    </Card>

                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Outbound Traffic</p>
                                <p className="text-3xl font-bold text-green-400 mt-1">{metrics.outboundMbps} <span className="text-xs text-gray-400 font-normal">Mbps</span></p>
                            </div>
                            <ArrowUpFromLine className="w-10 h-10 text-green-400 opacity-50" />
                        </div>
                    </Card>

                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Active Connections</p>
                                <p className="text-3xl font-bold text-white mt-1">{metrics.activeConnections}</p>
                            </div>
                            <Network className="w-10 h-10 text-[#5B6AC2] opacity-50" />
                        </div>
                    </Card>

                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Dropped Packets</p>
                                <p className="text-3xl font-bold text-red-400 mt-1">{metrics.droppedPackets}</p>
                            </div>
                            <Activity className="w-10 h-10 text-red-400 opacity-50" />
                        </div>
                    </Card>
                </div>
            )}

            {/* Charts Grid */}
            {(activeTab === 'overview' || activeTab === 'protocols') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Bandwidth Area Chart */}
                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-[#5B6AC2] to-[#E91E63] rounded-full" />
                            Live Bandwidth
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={bandwidthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#5B6AC2" opacity={0.1} />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1F2E', borderColor: '#5B6AC2', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="inbound" stroke="#60A5FA" fillOpacity={1} fill="url(#colorInbound)" name="Inbound (Mbps)" />
                                    <Area type="monotone" dataKey="outbound" stroke="#34D399" fillOpacity={1} fill="url(#colorOutbound)" name="Outbound (Mbps)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Protocol Distribution Pie Chart */}
                    <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-[#10B981] to-[#3B82F6] rounded-full" />
                            Protocol Distribution
                        </h3>
                        <div className="h-[300px] flex flex-col justify-center">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={protocolData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {protocolData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PROTOCOL_COLORS[index % PROTOCOL_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1F2E', borderColor: '#5B6AC2', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => `${Math.round(value)}%`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                {protocolData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2 text-sm text-gray-300">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PROTOCOL_COLORS[index % PROTOCOL_COLORS.length] }} />
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Active Connections Table */}
            {(activeTab === 'overview' || activeTab === 'connections') && (
                <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#F59E0B] to-[#EF4444] rounded-full" />
                        Latest Monitored Connections
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#5B6AC2]/20">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Source IP</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Destination IP</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Port</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Protocol</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Bytes Transferred</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {connections.map((conn) => (
                                    <tr key={conn.id} className="border-b border-[#5B6AC2]/10 hover:bg-[#1A1F2E]/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <code className="text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-1 rounded text-sm">{conn.source}</code>
                                        </td>
                                        <td className="py-3 px-4">
                                            <code className="text-gray-300 bg-gray-800 px-2 py-1 rounded text-sm">{conn.dest}</code>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">{conn.port}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
                                                {conn.protocol}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300 font-mono">{(conn.bytes / 1024).toFixed(2)} KB</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${conn.status === 'ESTABLISHED' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                }`}>
                                                {conn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
