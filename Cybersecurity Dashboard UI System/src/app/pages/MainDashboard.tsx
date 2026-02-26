import { Card } from '../components/ui/card';
import { RiskBadge } from '../components/RiskBadge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertModal } from '../components/AlertModal';
import { ElasticsearchService, FailedLogin, TopIP, AuthEvent } from '../../services/elasticsearch';

// Mock data removed - using live data from ElasticsearchService

export function MainDashboard() {
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [failedLoginData, setFailedLoginData] = useState<FailedLogin[]>([]);
  const [topSourceIPs, setTopSourceIPs] = useState<TopIP[]>([]);
  const [authTimelineData, setAuthTimelineData] = useState<AuthEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [params, setParams] = useState({ successFailureData: [], suspiciousIPs: [] });
  const [successFailureData, setSuccessFailureData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [suspiciousIPs, setSuspiciousIPs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const failedLogins = await ElasticsearchService.getFailedLogins();
      setFailedLoginData(failedLogins);

      const topIPs = await ElasticsearchService.getTopSourceIPs();
      setTopSourceIPs(topIPs);

      const authTimeline = await ElasticsearchService.getAuthTimeline();
      // setAuthTimelineData(authTimeline); // Set in validation block below

      const loginDist = await ElasticsearchService.getLoginDistribution();
      // setSuccessFailureData(loginDist); // Set in validation block below

      const suspIPs = await ElasticsearchService.getSuspiciousIPs();
      setSuspiciousIPs(suspIPs);

      const sysAlerts = await ElasticsearchService.getAlerts();
      setAlerts(sysAlerts);

      // Calculate total events from timeline
      const total = authTimeline.reduce((acc, curr) => acc + curr.events, 0);
      setTotalEvents(total);

      // Ensure data for pie chart exists (mock if 0 to avoid empty chart)
      const hasLoginData = loginDist.some(d => d.value > 0);
      if (!hasLoginData) {
        setSuccessFailureData([
          { name: 'Success', value: 1, color: '#10B98110' }, // Ghost data for visibility
          { name: 'Failed', value: 0, color: '#EF4444' }
        ]);
      } else {
        setSuccessFailureData(loginDist);
      }

      // Ensure timeline has points
      if (authTimeline.length === 0) {
        setAuthTimelineData([{ time: new Date().toLocaleTimeString(), events: 0 }]);
      } else {
        setAuthTimelineData(authTimeline);
      }
    };

    fetchData();
    // Refresh every 5 seconds for live data feel
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Events (24h)</p>
              <p className="text-3xl font-bold text-white mt-1">{totalEvents}</p>
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live Data
              </p>
            </div>
            <Activity className="w-12 h-12 text-[#5B6AC2] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failed Logins (24h)</p>
              <p className="text-3xl font-bold text-white mt-1">
                {failedLoginData.reduce((acc, curr) => acc + curr.attempts, 0)}
              </p>
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                ssh_login_failed
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-[#E91E63] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Blocked IPs</p>
              <p className="text-3xl font-bold text-white mt-1">
                {suspiciousIPs.filter(ip => ip.status === 'Blocked').length}
              </p>
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Auto-protected
              </p>
            </div>
            <Shield className="w-12 h-12 text-[#FF6B35] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Alerts</p>
              <p className="text-3xl font-bold text-white mt-1">
                {alerts.filter(a => a.status === 'Active').length}
              </p>
              <p className="text-amber-400 text-xs mt-1">Requires attention</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed Login Attempts */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#5B6AC2] to-[#E91E63] rounded-full" />
            Failed Login Attempts (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={failedLoginData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#5B6AC2" opacity={0.1} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
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
                dataKey="attempts"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Source IPs */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#E91E63] to-[#FF6B35] rounded-full" />
            Top Source IPs (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSourceIPs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#5B6AC2" opacity={0.1} />
              <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
              <YAxis dataKey="ip" type="category" stroke="#9CA3AF" fontSize={12} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1F2E',
                  border: '1px solid #5B6AC2',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="attempts" fill="url(#colorGradient)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5B6AC2" />
                  <stop offset="50%" stopColor="#E91E63" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Success vs Failure */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#10B981] to-[#EF4444] rounded-full" />
            Login Success vs Failure
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={successFailureData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {successFailureData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1F2E',
                  border: '1px solid #5B6AC2',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Authentication Timeline */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#FF6B35] to-[#5B6AC2] rounded-full" />
            Authentication Timeline (24h)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={authTimelineData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B6AC2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#5B6AC2" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#5B6AC2" opacity={0.1} />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1F2E',
                  border: '1px solid #5B6AC2',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="#5B6AC2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Suspicious IP Table */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-[#E91E63] to-[#FF6B35] rounded-full" />
          Suspicious IP Activity
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5B6AC2]/20">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Attempts</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Target User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Risk Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suspiciousIPs.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-[#5B6AC2]/10 hover:bg-[#1A1F2E]/50 transition-colors cursor-pointer"
                  onClick={() =>
                    setSelectedAlert({
                      type: 'Brute Force Attack',
                      timestamp: new Date().toISOString(),
                      ip: item.ip,
                      user: item.user,
                      attempts: item.attempts,
                      host: 'ubuntu-server-01',
                      risk: item.risk,
                    })
                  }
                >
                  <td className="py-3 px-4">
                    <code className="text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-1 rounded text-sm">
                      {item.ip}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-white">{item.attempts}</td>
                  <td className="py-3 px-4 text-gray-300">{item.user}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs ${item.status === 'Blocked'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : item.status === 'Monitoring'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={item.risk} />
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-[#5B6AC2] hover:text-[#E91E63] text-sm transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert Modal */}
      {selectedAlert && (
        <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
