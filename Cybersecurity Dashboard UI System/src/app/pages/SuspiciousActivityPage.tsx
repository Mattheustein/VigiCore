import { Card } from '../components/ui/card';
import { RiskBadge } from '../components/RiskBadge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertModal } from '../components/AlertModal';
import { ElasticsearchService } from '../../services/elasticsearch';

interface SuspiciousEvent {
  id: string;
  timestamp: string;
  type: string;
  sourceIp: string;
  targetUser: string;
  attempts: number;
  status: string;
  risk: 'Low' | 'Medium' | 'High';
  host: string;
  details: string[];
}

export function SuspiciousActivityPage() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [suspiciousEvents, setSuspiciousEvents] = useState<SuspiciousEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await ElasticsearchService.getSuspiciousIPs();
      const mappedEvents = data.map((item: any, index: number) => ({
        id: `susp-${index}`,
        timestamp: item.timestamp,
        type: item.type || 'Brute Force / Failed Logins',
        sourceIp: item.ip,
        targetUser: item.user,
        attempts: item.attempts,
        status: item.status,
        risk: item.risk,
        host: 'ubuntu-server', // Placeholder until host info is added to agg
        details: [
          `Detected ${item.attempts} indicators of compromise (${item.type || 'Anomalous Activity'})`,
          `Last activity recorded at ${new Date(item.timestamp).toLocaleTimeString()}`,
          `Targeting user/resource: ${item.user}`
        ]
      }));
      setSuspiciousEvents(mappedEvents);
    };

    fetchData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = suspiciousEvents.filter((event) => {
    const matchesSearch =
      event.sourceIp.includes(searchQuery) ||
      event.targetUser.includes(searchQuery) ||
      event.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterRisk === 'all' || event.risk === filterRisk;

    return matchesSearch && matchesFilter;
  });

  const handleExportReport = () => {
    const headers = ['ID', 'Timestamp', 'Type', 'Source IP', 'Target User', 'Attempts', 'Status', 'Risk', 'Host'];
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(event =>
        [event.id, event.timestamp, event.type, event.sourceIp, event.targetUser, event.attempts, event.status, event.risk, event.host].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vigicore_suspicious_activity_${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-3xl font-bold text-white">Suspicious Activity</h1>
          <p className="text-gray-400 mt-1">
            Detected brute-force attempts and abnormal authentication patterns
          </p>
        </div>
        <Button onClick={handleExportReport} className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90">
          <Download className="w-4 h-4 mr-2" />
          <span className="whitespace-nowrap">Export Report</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-[#131825] border-[#5B6AC2]/20 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by IP, user, or event type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500"
            />
          </div>

          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-full sm:w-48 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1F2E] border-[#5B6AC2]/30 text-white">
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="Low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEvent === event.id;

          return (
            <Card
              key={event.id}
              className="bg-[#131825] border-[#5B6AC2]/20 overflow-hidden transition-all hover:border-[#5B6AC2]/40"
            >
              {/* Event Header */}
              <div
                className="p-4 cursor-pointer flex items-center gap-4"
                onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </Button>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-xs text-gray-400">Timestamp</p>
                    <p className="text-sm text-white font-mono">
                      {new Date(event.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-sm text-white">{event.type}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Source IP</p>
                    <code className="text-sm text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-0.5 rounded">
                      {event.sourceIp}
                    </code>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Target User</p>
                    <p className="text-sm text-white font-mono">{event.targetUser}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Attempts</p>
                    <p className="text-sm text-red-400 font-semibold">{event.attempts}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <RiskBadge level={event.risk} />
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${event.status === 'Active'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : event.status === 'Blocked'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : event.status === 'Monitoring'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-green-500/10 text-green-400 border border-green-500/30'
                        }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#5B6AC2]/20">
                  <div className="mt-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Event Details</h4>
                      <div className="space-y-1">
                        {event.details.map((detail, index) => (
                          <p key={index} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-[#E91E63] mt-1">•</span>
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] hover:opacity-90"
                        onClick={() =>
                          setSelectedAlert({
                            type: event.type,
                            timestamp: event.timestamp,
                            ip: event.sourceIp,
                            user: event.targetUser,
                            attempts: event.attempts,
                            host: event.host,
                            risk: event.risk,
                          })
                        }
                      >
                        View Full Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#5B6AC2]/30 hover:bg-[#1A1F2E]"
                        onClick={() => {
                          setSuspiciousEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'Resolved' } : e));
                          setExpandedEvent(null);
                        }}
                      >
                        Mark as Investigated
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          setSuspiciousEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'Blocked' } : e));
                          setExpandedEvent(null);
                        }}
                      >
                        Block IP
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Alert Modal */}
      {selectedAlert && (
        <AlertModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}
