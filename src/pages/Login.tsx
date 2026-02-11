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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden relative">
      <Card className="w-full max-w-md glass-card relative z-10 animate-in fade-in-0 zoom-in-95 duration-700 p-2">
        <CardHeader className="text-center space-y-3 pb-8 pt-10 px-8">
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary/30 to-secondary/10 flex items-center justify-center border border-white/10 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="w-12 h-12 text-primary relative z-10 glow-pink" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black tracking-tighter text-foreground italic uppercase font-display">
              LAB <span className="text-primary text-glow-pink">GUARDIAN</span>
            </CardTitle>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
              Centralized System Operations
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 group">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1 group-focus-within:text-glow-pink transition-all">
                Access Identifier
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@guardian.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-border pl-12 h-14 transition-all focus:bg-muted/80 focus:ring-primary/20 rounded-2xl font-medium text-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1 group-focus-within:text-glow-pink transition-all">
                Security Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-border pl-12 pr-12 h-14 transition-all focus:bg-muted/80 focus:ring-primary/20 rounded-2xl font-medium text-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Premium Math Captcha */}
            <div className="space-y-3 p-5 rounded-2xl bg-muted border border-border group">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60">
                  Human Intelligence Check
                </Label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-muted-foreground hover:text-primary transition-all hover:rotate-180 duration-500"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center justify-center h-14 rounded-xl bg-background border border-border text-xl font-black text-cyan-400 italic tracking-widest select-none font-mono">
                  {captcha.num1} + {captcha.num2}
                </div>
                <Input
                  type="number"
                  placeholder="?"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  className="w-24 h-14 bg-muted border-border text-center font-black text-xl rounded-xl text-foreground"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm tracking-widest shadow-2xl glow-pink transition-all hover:scale-[1.02] active:scale-[0.98] rounded-2xl uppercase italic"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="w-5 h-5 mr-3" />
              )}
              {isLoading ? "Validating..." : "Grant Access"}
            </Button>
          </form>

          <div className="pt-4 border-t border-border flex items-center justify-between opacity-40">
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">v2.0 PRO</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Encypted Session</span>
          </div>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-foreground/10 text-[10px] font-black uppercase tracking-[0.5em] pointer-events-none text-center w-full">
        Authorized Terminal LG_2026 • Secure Infrastructure
      </div>
    </div>
  );
}