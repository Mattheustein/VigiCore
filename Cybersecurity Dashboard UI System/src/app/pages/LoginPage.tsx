import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Lock, Mail, AlertTriangle } from 'lucide-react';
import logo from '../../assets/vigicore-logo-grad-2-01.png';
import { AuthService } from '../../services/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Authenticate with mock database
    const result = await AuthService.login(email, password);

    if (result.success) {
      // Mock login - navigate to dashboard
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const result = await AuthService.loginWithGoogle();
    if (result.success) {
      navigate('/dashboard');
    }
    else {
      setError(result.error || 'Google Login failed');
    }
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
            <div className="w-72 h-44 flex items-center justify-center">
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
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

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

          {/* Google Login Divider & Button */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#5B6AC2]/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#131825]/80 text-gray-400 backdrop-blur-xl">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-[#1A1F2E] hover:bg-[#1A1F2E]/80 border border-[#5B6AC2]/30 text-white font-medium py-6 rounded-lg transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>

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
