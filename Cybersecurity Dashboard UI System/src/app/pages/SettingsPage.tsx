import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Settings, Shield, Bell, Database, Users } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure VigiCore security monitoring system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          {[
            { icon: Shield, label: 'Security', active: true },
            { icon: Bell, label: 'Notifications', active: false },
            { icon: Database, label: 'Data Sources', active: false },
            { icon: Users, label: 'User Management', active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className={`p-4 cursor-pointer transition-all ${
                  item.active
                    ? 'bg-gradient-to-r from-[#5B6AC2]/20 to-[#E91E63]/10 border-[#5B6AC2]/30'
                    : 'bg-[#131825] border-[#5B6AC2]/20 hover:border-[#5B6AC2]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#5B6AC2]" />
                  <span className="text-white">{item.label}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security Settings */}
          <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#5B6AC2]" />
              Security Settings
            </h3>

            <div className="space-y-6">
              {/* Auto-block Failed Attempts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Auto-block Failed Attempts</Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Automatically block IPs after multiple failed login attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Failed Attempts Threshold */}
              <div className="space-y-2">
                <Label className="text-white">Failed Attempts Threshold</Label>
                <Input
                  type="number"
                  defaultValue="5"
                  className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white"
                />
                <p className="text-sm text-gray-400">Number of failed attempts before blocking</p>
              </div>

              {/* Time Window */}
              <div className="space-y-2">
                <Label className="text-white">Time Window (minutes)</Label>
                <Input
                  type="number"
                  defaultValue="5"
                  className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white"
                />
                <p className="text-sm text-gray-400">Time frame to count failed attempts</p>
              </div>

              {/* Brute Force Detection */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Brute Force Detection</Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Enable advanced pattern recognition for brute force attacks
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Geo-blocking */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Geo-blocking</Label>
                  <p className="text-sm text-gray-400 mt-1">
                    Block connections from high-risk countries
                  </p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-[#5B6AC2]/20">
              <Button className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
                Save Changes
              </Button>
              <Button variant="outline" className="border-[#5B6AC2]/30 hover:bg-[#1A1F2E]">
                Reset to Defaults
              </Button>
            </div>
          </Card>

          {/* ELK Stack Configuration */}
          <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#E91E63]" />
              ELK Stack Configuration
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Elasticsearch Host</Label>
                <Input
                  type="text"
                  defaultValue="localhost:9200"
                  className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Kibana Host</Label>
                <Input
                  type="text"
                  defaultValue="localhost:5601"
                  className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Logstash Pipeline</Label>
                <Input
                  type="text"
                  defaultValue="/etc/logstash/conf.d/ssh-auth.conf"
                  className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white">Real-time Monitoring</Label>
                  <p className="text-sm text-gray-400 mt-1">Enable live log streaming</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-[#5B6AC2]/20">
              <Button className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
                Test Connection
              </Button>
              <Button variant="outline" className="border-[#5B6AC2]/30 hover:bg-[#1A1F2E]">
                Save Configuration
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
