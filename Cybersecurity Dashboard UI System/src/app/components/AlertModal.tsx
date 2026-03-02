import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { RiskBadge } from './RiskBadge';
import { Button } from './ui/button';
import { X, Shield, Clock, Server, MapPin, User, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AlertModalProps {
  alert: {
    type: string;
    timestamp: string;
    ip: string;
    user: string;
    attempts: number;
    host: string;
    risk: 'Low' | 'Medium' | 'High';
  };
  onClose: () => void;
}

// Mock mini timeline data
const miniTimelineData = [
  { time: '10:00', count: 2 },
  { time: '10:15', count: 5 },
  { time: '10:30', count: 12 },
  { time: '10:45', count: 45 },
  { time: '11:00', count: 89 },
  { time: '11:15', count: 67 },
  { time: '11:30', count: 34 },
];

export function AlertModal({ alert, onClose }: AlertModalProps) {
  const riskScore = alert.risk === 'High' ? 92 : alert.risk === 'Medium' ? 65 : 38;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] lg:max-w-4xl bg-[#131825] border-[#5B6AC2]/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5B6AC2] to-[#E91E63] flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Alert Details
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Alert Type & Risk */}
          <div className="flex items-center justify-between p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
            <div>
              <p className="text-gray-400 text-sm">Alert Type</p>
              <p className="text-xl font-semibold mt-1">{alert.type}</p>
            </div>
            <RiskBadge level={alert.risk} />
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Clock className="w-4 h-4" />
                Timestamp
              </div>
              <p className="text-white font-mono">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Server className="w-4 h-4" />
                Affected Host
              </div>
              <p className="text-white font-mono">{alert.host}</p>
            </div>

            <div className="p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                Source IP
              </div>
              <code className="text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-1 rounded">
                {alert.ip}
              </code>
            </div>

            <div className="p-4 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <User className="w-4 h-4" />
                Target User
              </div>
              <p className="text-white font-mono">{alert.user}</p>
            </div>
          </div>

          {/* Risk Score Visualization */}
          <div className="p-6 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[#E91E63]" />
              <h4 className="font-semibold md:text-lg">Risk Score</h4>
            </div>
            <div className="relative">
              <div className="w-full h-3 bg-[#0A0E1A] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${alert.risk === 'High'
                    ? 'bg-gradient-to-r from-red-600 to-red-400'
                    : alert.risk === 'Medium'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-gradient-to-r from-green-600 to-green-400'
                    }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Low (0)</span>
                <span className="text-white font-semibold">{riskScore}/100</span>
                <span>Critical (100)</span>
              </div>
            </div>
          </div>

          {/* Attack Timeline */}
          <div className="p-6 bg-[#1A1F2E]/50 rounded-lg border border-[#5B6AC2]/20">
            <h4 className="font-semibold mb-4 md:text-lg">Attack Timeline (Last 90 minutes)</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={miniTimelineData}>
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
                  dataKey="count"
                  stroke="#E91E63"
                  strokeWidth={2}
                  dot={{ fill: '#E91E63', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Full Log Message */}
          <div className="p-4 bg-[#0A0E1A] rounded-lg border border-[#5B6AC2]/20">
            <p className="text-gray-400 text-sm mb-2 md:text-base">Full Log Message</p>
            <pre className="text-xs md:text-sm text-gray-300 overflow-x-auto font-mono">
              {`[${new Date(alert.timestamp).toISOString()}] SSHD[12345]: Failed password for ${alert.user} from ${alert.ip} port 52314 ssh2
[${new Date(alert.timestamp).toISOString()}] SSHD[12346]: Connection closed by authenticating user ${alert.user} ${alert.ip} port 52314 [preauth]
[${new Date(alert.timestamp).toISOString()}] SSHD[12347]: Failed password for ${alert.user} from ${alert.ip} port 52315 ssh2
Pattern detected: ${alert.attempts} failed attempts within 5 minutes
Risk Assessment: ${alert.risk} - Brute force attack pattern identified
Recommended Action: Block source IP and investigate user account`}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
              Block IP Address
            </Button>
            <Button variant="outline" className="flex-1 border-[#5B6AC2]/30 hover:bg-[#1A1F2E]">
              Mark as Investigated
            </Button>
            <Button variant="outline" className="flex-1 border-[#5B6AC2]/30 hover:bg-[#1A1F2E]">
              View Full Logs
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
