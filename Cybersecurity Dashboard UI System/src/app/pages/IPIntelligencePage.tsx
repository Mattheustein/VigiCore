import { Card } from '../components/ui/card';
import { RiskBadge } from '../components/RiskBadge';
import { Globe, MapPin, Shield, AlertTriangle } from 'lucide-react';

const ipIntelligenceData = [
  { ip: '203.0.113.42', country: 'Unknown', city: 'VPN Detected', threats: 12, reputation: 'High Risk', attempts: 234 },
  { ip: '198.51.100.23', country: 'Russia', city: 'Moscow', threats: 8, reputation: 'High Risk', attempts: 189 },
  { ip: '192.0.2.56', country: 'China', city: 'Beijing', threats: 5, reputation: 'Medium Risk', attempts: 156 },
  { ip: '172.16.0.88', country: 'USA', city: 'New York', threats: 3, reputation: 'Medium Risk', attempts: 134 },
  { ip: '10.0.0.45', country: 'UK', city: 'London', threats: 1, reputation: 'Low Risk', attempts: 98 },
];

export function IPIntelligencePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">IP Intelligence</h1>
        <p className="text-gray-400 mt-1">Geographic and threat analysis of source IP addresses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unique IPs</p>
              <p className="text-3xl font-bold text-white mt-1">127</p>
            </div>
            <Globe className="w-10 h-10 text-[#5B6AC2] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Risk IPs</p>
              <p className="text-3xl font-bold text-red-400 mt-1">47</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">VPN Detected</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">23</p>
            </div>
            <Shield className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Countries</p>
              <p className="text-3xl font-bold text-white mt-1">34</p>
            </div>
            <MapPin className="w-10 h-10 text-[#E91E63] opacity-50" />
          </div>
        </Card>
      </div>

      {/* IP Intelligence Table */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-[#5B6AC2] to-[#E91E63] rounded-full" />
          IP Address Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5B6AC2]/20">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Country</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">City</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Threats</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Attempts</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Reputation</th>
              </tr>
            </thead>
            <tbody>
              {ipIntelligenceData.map((item, index) => (
                <tr key={index} className="border-b border-[#5B6AC2]/10 hover:bg-[#1A1F2E]/50 transition-colors">
                  <td className="py-3 px-4">
                    <code className="text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-1 rounded text-sm">
                      {item.ip}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-white">{item.country}</td>
                  <td className="py-3 px-4 text-gray-300">{item.city}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${item.threats > 5 ? 'text-red-400' : item.threats > 2 ? 'text-amber-400' : 'text-green-400'}`}>
                      {item.threats}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white">{item.attempts}</td>
                  <td className="py-3 px-4">
                    <RiskBadge level={item.reputation.includes('High') ? 'High' : item.reputation.includes('Medium') ? 'Medium' : 'Low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* World Map Placeholder */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-[#E91E63] to-[#FF6B35] rounded-full" />
          Geographic Distribution
        </h3>
        <div className="h-80 bg-[#1A1F2E]/50 rounded-lg flex items-center justify-center border border-[#5B6AC2]/20">
          <div className="text-center">
            <Globe className="w-16 h-16 text-[#5B6AC2] mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">Interactive world map visualization</p>
            <p className="text-gray-500 text-sm mt-1">Geographic threat distribution by IP address</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
