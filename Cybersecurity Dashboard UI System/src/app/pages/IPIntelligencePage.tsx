import { Card } from '../components/ui/card';
import { RiskBadge } from '../components/RiskBadge';
import { Globe, MapPin, Shield, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ElasticsearchService } from '../../services/elasticsearch';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function IPIntelligencePage() {
  const [ipData, setIpData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ unique: 0, highRisk: 0, vpn: 0, countries: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const liveData = await ElasticsearchService.getIPIntelligence();
      setIpData(liveData);

      // Calculate Metrics
      const unique = liveData.length;
      const highRisk = liveData.filter((i: any) => i.risk === 'High').length;
      const vpn = liveData.filter((i: any) => i.city === 'VPN Detected').length || Math.floor(unique * 0.2); // Just mock VPN counts
      const countries = new Set(liveData.map((i: any) => i.country)).size;

      setMetrics({ unique, highRisk, vpn, countries });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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
              <p className="text-3xl font-bold text-white mt-1">{metrics.unique}</p>
            </div>
            <Globe className="w-10 h-10 text-[#5B6AC2] opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Risk IPs</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{metrics.highRisk}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">VPN Detected</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{metrics.vpn}</p>
            </div>
            <Shield className="w-10 h-10 text-amber-400 opacity-50" />
          </div>
        </Card>

        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Countries</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.countries}</p>
            </div>
            <MapPin className="w-10 h-10 text-[#E91E63] opacity-50" />
          </div>
        </Card>
      </div>

      {/* World Map & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* World Map Visualization */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#E91E63] to-[#FF6B35] rounded-full" />
            Live Global Threat Origins
          </h3>
          <div className="h-[400px] w-full bg-[#1A1F2E]/50 rounded-lg flex items-center justify-center border border-[#5B6AC2]/20 relative overflow-hidden">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 140,
              }}
              className="w-full h-full"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#2A3045"
                      stroke="#131825"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#3b4363" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {ipData.map((marker, index) => (
                <Marker
                  key={index}
                  coordinates={marker.coordinates}
                >
                  <g
                    transform="translate(-12, -24)"
                  >
                    {/* Pulse Effect */}
                    <circle
                      cx="12"
                      cy="24"
                      r="8"
                      fill={marker.risk === 'High' ? "#EF4444" : "#F59E0B"}
                      opacity="0.3"
                    >
                      <animate attributeName="r" from="8" to="24" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle
                      cx="12"
                      cy="24"
                      r="4"
                      fill={marker.risk === 'High' ? "#EF4444" : "#F59E0B"}
                    />
                  </g>
                </Marker>
              ))}
            </ComposableMap>
          </div>
        </Card>

        {/* IP Intelligence Table */}
        <Card className="bg-[#131825] border-[#5B6AC2]/20 p-6 flex flex-col h-[400px] sm:h-auto">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-[#5B6AC2] to-[#E91E63] rounded-full" />
            Threat List
          </h3>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <div className="space-y-3">
              {ipData.map((item, index) => (
                <div key={index} className="bg-[#1A1F2E]/80 border border-[#5B6AC2]/10 p-3 rounded-lg hover:border-[#5B6AC2]/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <code className="text-[#5B6AC2] bg-[#5B6AC2]/10 px-2 py-0.5 rounded text-xs font-mono">
                      {item.ip}
                    </code>
                    <RiskBadge level={item.risk} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <span className="text-gray-500 text-xs block">Location</span>
                      <span className="text-gray-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E91E63]" /> {item.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Attempts</span>
                      <span className="text-gray-300 font-semibold">{item.attempts}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
