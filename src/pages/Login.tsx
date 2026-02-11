import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Captcha State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
  const [userCaptcha, setUserCaptcha] = useState('');

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Generate new math captcha
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, answer: (n1 + n2).toString() });
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      generateCaptcha();
      return;
    }
    if (userCaptcha !== captcha.answer) {
      toast.error('Incorrect captcha answer');
      generateCaptcha();
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
        generateCaptcha();
      } else {
        toast.success('Access Granted - Welcome to Lab Guardian');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative font-sans">
      <Card className="w-full max-w-md bg-white border border-border shadow-2xl relative z-10 animate-in fade-in-0 zoom-in-95 duration-700 p-1">
        <CardHeader className="relative text-center space-y-2 pb-4 pt-32 px-8 border-b border-border/50 mx-4">
          {/* Internal Logos */}
          <div className="absolute top-2 left-2">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg border border-border/20 p-3 overflow-hidden">
              <img
                src="/panjab_logo.png"
                alt="Government of Punjab"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg border border-border/20 p-3 overflow-hidden">
              <img
                src="/cm_panjab.png"
                alt="Chief Minister Punjab"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-1 pt-4">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary uppercase font-display">
              Lab <span className="text-secondary">Monitoring</span>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-8 pt-6 pb-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 group">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-black/60 ml-1">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter authorized email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50 border-border pl-11 h-11 transition-all focus:bg-white focus:ring-1 focus:ring-primary rounded-lg font-medium text-black text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 group">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-black/60 ml-1">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border-border pl-11 pr-11 h-11 transition-all focus:bg-white focus:ring-1 focus:ring-primary rounded-lg font-medium text-black text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Math Captcha Styled for ITU */}
            <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-border group">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-black/40">
                  Verification Required
                </Label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-black/40 hover:text-primary transition-all"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-center h-10 rounded-lg bg-white border border-border text-lg font-bold text-primary tracking-widest select-none font-mono shadow-sm">
                  {captcha.num1} + {captcha.num2}
                </div>
                <Input
                  type="number"
                  placeholder="?"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-20 h-10 bg-white border-border text-center font-bold text-lg rounded-lg text-black focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs tracking-widest shadow-md transition-all rounded-lg uppercase"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Verifying..." : "Get Login"}
            </Button>
          </form>

          <div className="pt-3 flex items-center justify-between text-[#8E9AAF] text-[8px] font-bold uppercase tracking-widest">
            <span>© 2026 Punjab Pk</span>
            <span>SECURE TERMINAL</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}