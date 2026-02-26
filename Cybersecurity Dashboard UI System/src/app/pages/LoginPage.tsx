import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Lock, Mail } from 'lucide-react';
import logo from '../../assets/logo-alt.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0E1A]">
      {/* Gradient background with logo colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B6AC2]/20 via-[#E91E63]/10 to-[#FF6B35]/20" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(91, 106, 194, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(91, 106, 194, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Abstract network shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[#5B6AC2]/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-[#E91E63]/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#131825]/80 backdrop-blur-xl border border-[#5B6AC2]/20 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-48 h-32 flex items-center justify-center">
              <img src={logo} alt="VigiCore Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Secure Login</h1>
            <p className="text-gray-400 text-sm">Access VigiCore Security Operations Center</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email / Username
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="analyst@vigicore.security"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500 focus:border-[#5B6AC2] focus:ring-[#5B6AC2]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#1A1F2E]/50 border-[#5B6AC2]/30 text-white placeholder:text-gray-500 focus:border-[#5B6AC2] focus:ring-[#5B6AC2]/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#5B6AC2] via-[#E91E63] to-[#FF6B35] hover:opacity-90 text-white font-medium py-6 rounded-lg shadow-lg shadow-[#5B6AC2]/20 transition-all"
            >
              <Shield className="w-5 h-5 mr-2" />
              Secure Login
            </Button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-[#5B6AC2]/5 border border-[#5B6AC2]/20 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              <span className="text-[#5B6AC2] font-medium">🔒 Encrypted Connection</span>
              <br />
              Your session is protected with end-to-end encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
