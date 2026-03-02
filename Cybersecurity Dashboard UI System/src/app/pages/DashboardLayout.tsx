import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Globe,
  Bell,
  Activity,
  Settings,
  Search,
  User,
  Menu,
  Shield,
  LogOut,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { AuthService } from '../../services/auth';
import { ElasticsearchService, AuthLog, setGlobalTimeFilter, getGlobalTimeFilter } from '../../services/elasticsearch';
import profilePic from '../../assets/profile-pic.png';
import logo from '../../assets/logo-alt.png';
import logoIcon from '../../assets/logo-icon.png';
import { Footer } from '../components/Footer';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AuthLog[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [timeFilter, setTimeFilterState] = useState(getGlobalTimeFilter());

  const handleFilterChange = (filter: string) => {
    setTimeFilterState(filter);
    setGlobalTimeFilter(filter);
  };

  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchOpen(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setSearchOpen(true);
      const results = await ElasticsearchService.searchLogs(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    };

    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchUser = () => {
      setUser(AuthService.getCurrentUser());
    };
    fetchUser();
    window.addEventListener('authChange', fetchUser);
    return () => window.removeEventListener('authChange', fetchUser);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/auth-logs', label: 'Authentication Logs', icon: FileText },
    { path: '/dashboard/suspicious-activity', label: 'Suspicious Activity', icon: AlertTriangle },
    { path: '/dashboard/ip-intelligence', label: 'IP Intelligence', icon: Globe },
    { path: '/dashboard/alerts', label: 'Alerts', icon: Bell },
    { path: '/dashboard/system-health', label: 'System Health', icon: Activity },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0E1A] dark">
      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#131825' }}
        className={`fixed left-0 top-0 h-full border-r border-[#5B6AC2]/20 transition-all duration-300 z-[999] ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
          }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-[#5B6AC2]/20 p-4">
          <Link to="/dashboard" className="flex items-center justify-center h-full w-full focus:outline-none">
            {sidebarOpen ? (
              <img src={logo} alt="VigiCore" className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(91,106,194,0.6)] transition-all duration-300" />
            ) : (
              <img src={logoIcon} alt="VigiCore" className="h-8 w-auto object-contain drop-shadow-[0_0_12px_rgba(91,106,194,0.6)]" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                  ? 'bg-gradient-to-r from-[#5B6AC2]/20 to-[#E91E63]/10 text-white border border-[#5B6AC2]/30 shadow-lg shadow-[#5B6AC2]/10'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1F2E]'
                  }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content (Block element automatically fills space minus margin) */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        {/* Top Bar */}
        <header className="h-20 bg-[#131825] border-b border-[#5B6AC2]/20 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search */}
            <div className="relative w-full max-w-[150px] sm:max-w-[200px] md:max-w-96 z-[40]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search logs, IPs, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                className="pl-10 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500"
              />

              {/* Search Dropdown Modal */}
              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#131825] border border-[#5B6AC2]/30 rounded-lg shadow-xl shadow-[#0A0E1A] overflow-hidden">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      <div className="p-2 space-y-1">
                        {searchResults.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-[#1A1F2E]/50 hover:bg-[#1A1F2E] border border-transparent hover:border-[#5B6AC2]/20 rounded-md transition-colors cursor-pointer"
                            onClick={() => {
                              setSearchQuery('');
                              setSearchOpen(false);
                              navigate('/dashboard/suspicious-activity'); // Could route to specific detail page eventually
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-white text-sm font-medium">{log.user} <span className="text-gray-500">at</span> {log.sourceIp}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${log.result === 'Failed' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                {log.result}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()} • {log.risk} Risk
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">No results found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* System Status - hidden on small mobile */}
            <div className="hidden sm:block">
              <StatusBadge status="secure" label="System Secure" />
            </div>

            {/* Company/Tenant Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden lg:flex h-9 px-3 text-xs bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-gray-300 hover:text-white hover:bg-[#1A1F2E]">
                  <Globe className="w-3.5 h-3.5 mr-2 text-[#5B6AC2]" />
                  Global Analytics Corp
                  <ChevronDown className="w-3.5 h-3.5 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#131825] border-[#5B6AC2]/30 text-gray-300 shadow-xl shadow-[#0A0E1A]">
                <DropdownMenuLabel className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Select Client View</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#5B6AC2]/20" />
                {[
                  'Global Analytics Corp',
                  'Apex Financial Services',
                  'Quantum Data Systems',
                  'Nova Technologies',
                  'Horizon Healthcare',
                  'Pinnacle Aerospace',
                  'Vertex E-Commerce',
                  'Nexus Energy Systems'
                ].map(company => (
                  <DropdownMenuItem key={company} onClick={() => { }} className="hover:bg-[#1A1F2E] hover:text-white cursor-pointer focus:bg-[#1A1F2E] text-sm">
                    {company}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 px-3 text-xs bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-gray-300 hover:text-white hover:bg-[#1A1F2E]">
                  <Clock className="w-3.5 h-3.5 mr-2 text-[#E91E63]" />
                  {timeFilter}
                  <ChevronDown className="w-3.5 h-3.5 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#131825] border-[#5B6AC2]/30 text-gray-300 shadow-xl shadow-[#0A0E1A]">
                {['Last hour', 'Today', 'This week', 'This month', 'This quarter', 'This year', 'All time'].map(filter => (
                  <DropdownMenuItem key={filter} onClick={() => handleFilterChange(filter)} className="hover:bg-[#1A1F2E] hover:text-white cursor-pointer focus:bg-[#1A1F2E]">
                    {filter}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date/Time - hidden on mobile */}
            <div className="hidden md:block text-sm text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {' • '}
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#5B6AC2] to-[#E91E63] p-0.5"
                >
                  <div className="bg-[#131825] rounded-full w-full h-full flex items-center justify-center overflow-hidden">
                    {user?.username?.toLowerCase() === 'mattheustein' ? (
                      <img src={profilePic} alt="User Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-[#5B6AC2] w-6 h-6" />
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#131825] border-[#5B6AC2]/30 text-white shadow-xl shadow-[#0A0E1A]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName || user?.username || 'Guest'}</p>
                    <p className="text-xs leading-none text-gray-400 font-mono">
                      {user?.role || 'User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#5B6AC2]/20" />
                <DropdownMenuItem asChild className="hover:bg-[#1A1F2E] focus:bg-[#1A1F2E] cursor-pointer">
                  <Link to="/dashboard/settings" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-[#1A1F2E] focus:bg-[#1A1F2E] cursor-pointer">
                  <Link to="/dashboard/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Preferences</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#5B6AC2]/20" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet key={timeFilter} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
