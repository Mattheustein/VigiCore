import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Download, RefreshCw, FileText } from 'lucide-react';
import { useState } from 'react';

import { ElasticsearchService, AuthLog } from '../../services/elasticsearch';
import { useEffect } from 'react';

// Removed static mock data

export function AuthLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, publickey: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const logs = await ElasticsearchService.getAuthLogs(100);
      setAuthLogs(logs);

      // Fetch global metrics to stay in-sync with Main Dashboard
      const glStats = await ElasticsearchService.getAuthStats();
      setStats(glStats);
    };

    fetchData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const filteredLogs = authLogs.filter((log) => {
    const matchesSearch =
      log.user.includes(searchQuery) ||
      log.sourceIp.includes(searchQuery) ||
      log.host.includes(searchQuery);

    const matchesFilter = filterResult === 'all' || log.result === filterResult;

    return matchesSearch && matchesFilter;
  });

  const handleExportLogs = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Source IP', 'Host', 'Result', 'Method', 'Port', 'Risk'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log =>
        [log.id, log.timestamp, log.user, log.sourceIp, log.host, log.result, log.method, log.port, log.risk || 'N/A'].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vigicore_auth_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Authentication Logs</h1>
          <p className="text-gray-400 mt-1">Real-time SSH authentication events from all hosts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#5B6AC2]/30 hover:bg-[#1A1F2E]" onClick={() => setRefreshTrigger(prev => prev + 1)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportLogs} className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">Export Logs</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Logs</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Successful</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.success}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-xl">✗</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.failed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <span className="text-xl">🔑</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm">PublicKey Auth</p>
              <p className="text-2xl font-bold text-purple-400">
                {stats.publickey}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by user, IP, or hostname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500"
            />
          </div>

          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-full sm:w-48 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white">
              <SelectValue placeholder="Filter by result" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1F2E] border-[#5B6AC2]/30 text-white">
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="Success">Success Only</SelectItem>
              <SelectItem value="Failed">Failed Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1F2E]/50 border-b border-[#5B6AC2]/20">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Source IP</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Host</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Method</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Port</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[#5B6AC2]/10 hover:bg-[#1A1F2E]/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-300 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm text-white bg-[#1A1F2E] px-2 py-1 rounded">
                      {log.user}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-1 rounded">
                      {log.sourceIp}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">{log.host}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${log.method === 'publickey'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 font-mono">{log.port}</td>
                  <td className="py-3 px-4">
                    {log.result === 'Success' ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
