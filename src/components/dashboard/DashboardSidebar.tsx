import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, ShieldCheck, Beaker, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { to: '/dashboard/lab-analytics', icon: Beaker, label: 'LAB DASHBOARD', color: 'emerald' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'TOTAL CITY', color: 'blue' },
  { to: '/dashboard/cities', icon: Globe, label: 'CITY WISE SYSTEM', color: 'purple' },
  { to: '/dashboard/devices', icon: Monitor, label: 'TOTAL SYSTEM', color: 'rose' },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function DashboardSidebar({ isOpen, setIsOpen, isMobile }: DashboardSidebarProps) {
  const { signOut } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const getColorClasses = (color: string) => {
    const variants: Record<string, any> = {
      emerald: {
        active: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.1)]',
        hover: 'hover:bg-emerald-500/10 dark:hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400',
        icon: 'text-emerald-600 dark:text-emerald-500',
        indicator: 'bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_15px_#10b981]'
      },
      blue: {
        active: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-500/10 border-blue-500/30 dark:border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]',
        hover: 'hover:bg-blue-500/10 dark:hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400',
        icon: 'text-blue-600 dark:text-blue-500',
        indicator: 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_15px_#3b82f6]'
      },
      purple: {
        active: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 dark:bg-purple-500/10 border-purple-500/30 dark:border-purple-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.1)]',
        hover: 'hover:bg-purple-500/10 dark:hover:bg-purple-500/5 hover:text-purple-600 dark:hover:text-purple-400',
        icon: 'text-purple-600 dark:text-purple-500',
        indicator: 'bg-purple-600 dark:bg-purple-500 shadow-[0_0_15px_#8b5cf6]'
      },
      rose: {
        active: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/10 border-rose-500/30 dark:border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.1)]',
        hover: 'hover:bg-rose-500/10 dark:hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400',
        icon: 'text-rose-600 dark:text-rose-500',
        indicator: 'bg-rose-600 dark:bg-rose-500 shadow-[0_0_15px_#f43f5e]'
      }
    };
    return variants[color] || variants.blue;
  };

  return (
    <>
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed top-6 left-6 z-50',
            'bg-muted backdrop-blur-xl border border-border rounded-xl',
            'hover:bg-primary/20 transition-all duration-300 shadow-2xl group'
          )}
        >
          <Menu className="w-5 h-5 group-hover:text-primary" />
        </Button>
      )}

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card/95 backdrop-blur-3xl border-r border-border flex flex-col z-40',
          'transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/10 flex items-center justify-center shrink-0 border border-border shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-black text-xl text-foreground italic tracking-tighter uppercase font-display leading-tight">LAB <span className="text-primary text-glow-blue">GUARDIAN</span></h1>
                <p className="text-[10px] font-black opacity-60 dark:opacity-40 uppercase tracking-[0.3em] mt-0.5 whitespace-nowrap">V2.0 PRO INFRA</p>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0 hover:bg-muted rounded-xl w-9 h-9 border border-transparent hover:border-border transition-all"
            >
              <X className="w-4 h-4 opacity-40" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-2 py-2">
            {navItems.map(({ to, icon: Icon, label, color }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleNavClick}
                className={({ isActive }) => {
                  const style = getColorClasses(color);
                  return cn(
                    'group relative flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500',
                    'border border-transparent',
                    isActive ? style.active : cn('text-muted-foreground/60', style.hover)
                  );
                }}
              >
                {({ isActive }) => {
                  const style = getColorClasses(color);
                  return (
                    <>
                      <Icon className={cn(
                        "w-5 h-5 shrink-0 transition-all duration-500",
                        isActive ? style.icon + " scale-110" : "group-hover:" + style.icon + ""
                      )} />
                      <span className={cn(
                        "whitespace-nowrap italic transition-all duration-500",
                        isActive ? "translate-x-1" : "group-hover:translate-x-1"
                      )}>
                        {label}
                      </span>
                      {isActive && (
                        <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full", style.indicator)} />
                      )}
                    </>
                  );
                }}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-muted/50 border border-border backdrop-blur-xl">
            <p className="text-[9px] font-black opacity-60 dark:opacity-40 uppercase tracking-[0.3em] mb-3">Core Connection</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                <span className="text-[10px] font-black opacity-80 uppercase italic tracking-widest">ENCRYPTED</span>
              </div>
              <Activity className="w-3 h-3 opacity-20" />
            </div>
          </div>

          <ThemeToggle />

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-500 group italic transform hover:scale-[1.02] active:scale-95"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>
    </>
  );
}