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
import profilePic from '../../assets/profile-pic.png';
import logo from '../../assets/logo-alt.png';
import logoIcon from '../../assets/logo-icon.png';

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

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
    <div className="min-h-screen bg-[#0A0E1A] dark">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#131825] border-r border-[#5B6AC2]/20 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-[#5B6AC2]/20 p-4">
          {sidebarOpen ? (
            <img src={logo} alt="VigiCore" className="h-12 w-auto object-contain transition-all duration-300" />
          ) : (
            <img src={logoIcon} alt="VigiCore" className="h-8 w-auto object-contain" />
          )}
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

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="h-20 bg-[#131825] border-b border-[#5B6AC2]/20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search logs, IPs, events..."
                className="pl-10 bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <StatusBadge status="secure" label="System Secure" />

            {/* Date/Time */}
            <div className="text-sm text-gray-400">
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
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
