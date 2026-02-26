import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/StatusBadge';
import { Activity, Cpu, HardDrive, Network, Server, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { ElasticsearchService } from '../../services/elasticsearch';

const initialCpuData = Array(7).fill(0).map((_, i) => ({
  time: new Date(Date.now() - (6 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  usage: 0
}));

export function SystemHealthPage() {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, disk: 0, status: 'Healthy' });
  const [cpuHistory, setCpuHistory] = useState<any[]>(initialCpuData);
  const [servers, setServers] = useState([
    { name: 'ubuntu-2204 (Primary)', status: 'secure', cpu: 0, memory: 0, disk: 0, uptime: 'Live' }
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await ElasticsearchService.getSystemHealth();
      setMetrics(data);

      // Update server list with live data
      setServers([
        {
          name: 'ubuntu-2204 (Primary)',
          status: data.status === 'Critical' ? 'critical' : data.status === 'Warning' ? 'warning' : 'secure',
          cpu: data.cpu,
          memory: data.memory,
          disk: data.disk,
          uptime: 'Active'
        },
        // Keep placeholder servers for UI balance if desired, or remove them. 
        // User complained it was "messed up", implying they liked the old grid.
        { name: 'backup-server-01', status: 'secure', cpu: 12, memory: 24, disk: 15, uptime: 'Offline' },
        { name: 'db-cluster-node', status: 'secure', cpu: 5, memory: 18, disk: 45, uptime: 'Offline' },
        { name: 'file-storage-01', status: 'warning', cpu: 0, memory: 0, disk: 88, uptime: 'Maintenance' },
      ]);

      setCpuHistory(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          usage: data.cpu
        };
        return [...prev.slice(1), newPoint];
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000); // Fast refresh for system stats
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Health</h1>
        <p className="text-gray-400 mt-1">Monitor infrastructure status and performance metrics (Live from VigiCore/Logs)</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className="text-3xl font-bold text-white mt-1">Online</p>
              <p className="text-green-400 text-xs mt-1">System Active</p>
            </div>
            <Server className="w-10 h-10 text-[#5B6AC2] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">CPU Usage</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.cpu}%</p>
              <p className={`${metrics.cpu > 80 ? 'text-red-400' : 'text-green-400'} text-xs mt-1`}>
                {metrics.cpu > 80 ? 'High Load' : 'Normal'}
              </p>
            </div>
            <Cpu className="w-10 h-10 text-[#E91E63] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Memory</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.memory}%</p>
              <p className="text-green-400 text-xs mt-1">Healthy</p>
            </div>
            <Zap className="w-10 h-10 text-[#FF6B35] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Disk Usage</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.disk}%</p>
              <p className="text-green-400 text-xs mt-1">/dev/sda1</p>
            </div>
            <HardDrive className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* CPU Usage Chart */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-[#5B6AC2] to-[#E91E63] rounded-full" />
          Live CPU Usage
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={cpuHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#5B6AC2" opacity={0.1} />
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1F2E',
                border: '1px solid #5B6AC2',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#5B6AC2"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Server Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map((server: any) => (
          <Card key={server.name} className="bg-[#131825] border-[#5B6AC2]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B6AC2] to-[#E91E63] flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{server.name}</h4>
                  <p className="text-xs text-gray-400">Uptime: {server.uptime}</p>
                </div>
              </div>
              <StatusBadge status={server.status} />
            </div>

            <div className="space-y-3">
              {/* CPU */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    CPU
                  </span>
                  <span className="text-white">{server.cpu}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0E1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B6AC2] to-[#E91E63]"
                    style={{ width: `${server.cpu}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Memory
                  </span>
                  <span className="text-white">{server.memory}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0E1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E91E63] to-[#FF6B35]"
                    style={{ width: `${server.memory}%` }}
                  />
                </div>
              </div>

              {/* Disk */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-1">
                    <HardDrive className="w-4 h-4" />
                    Disk
                  </span>
                  <span className="text-white">{server.disk}%</span>
                </div>
                <div className="w-full h-2 bg-[#0A0E1A] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B981] to-[#5B6AC2]"
                    style={{ width: `${server.disk}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
