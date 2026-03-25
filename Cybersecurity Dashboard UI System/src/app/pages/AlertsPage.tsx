import { Card } from '../components/ui/card';
import { RiskBadge } from '../components/RiskBadge';
import { Button } from '../components/ui/button';
import { Bell, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ElasticsearchService } from '../../services/elasticsearch';
import { AlertModal } from '../components/AlertModal';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, monitoring: 0, resolved: 0 });
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      const data = await ElasticsearchService.getAlerts();
      setAlerts(data);
      const metrics = await ElasticsearchService.getAlertStats();
      setStats(metrics);
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
          <p className="text-gray-400 mt-1">Real-time security notifications and threat alerts (Live from VigiCore)</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90"
          onClick={() => setAlerts(prev => prev.map(a => ({ ...a, status: 'Resolved' })))}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Alerts</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <Bell className="w-10 h-10 text-[#5B6AC2] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active</p>
              <p className="text-3xl font-bold text-red-400 mt-1">
                {stats.active}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monitoring</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">
                {stats.monitoring}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <span className="text-2xl">👁️</span>
            </div>
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {stats.resolved}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className="bg-[#131825] border-[#5B6AC2]/20 p-6 hover:border-[#5B6AC2]/40 transition-all">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${alert.status === 'Active' ? 'bg-red-500/10' :
                alert.status === 'Monitoring' ? 'bg-amber-500/10' :
                  'bg-green-500/10'
                }`}>
                {alert.status === 'Active' ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : alert.status === 'Monitoring' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
                  </div>
                  <RiskBadge level={alert.severity} />
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${alert.status === 'Active' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                    alert.status === 'Monitoring' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                    {alert.status}
                  </span>

                  <div className="flex-1" />

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-[#5B6AC2]/30 hover:bg-[#1A1F2E]"
                    onClick={() => setSelectedAlert({
                      type: alert.title,
                      timestamp: alert.timestamp,
                      ip: 'Unknown',
                      user: 'Unknown',
                      attempts: 1,
                      host: 'System',
                      risk: alert.severity
                    })}
                  >
                    View Details
                  </Button>
                  {alert.status !== 'Resolved' && (
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90"
                      onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: 'Resolved' } : a))}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedAlert && (
        <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
