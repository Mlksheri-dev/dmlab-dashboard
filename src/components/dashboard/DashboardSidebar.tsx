import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Monitor, LogOut, Menu, X, Globe, ShieldCheck, Beaker, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GeneratePDFDialog } from './GeneratePDFDialog';

const navItems = [
  { to: '/dashboard/analytics', icon: Activity, label: 'DASHBOARD' },
  // { to: '/dashboard', icon: Beaker, label: 'LAB DASHBOARD' },
  { to: '/dashboard/overview', icon: LayoutDashboard, label: 'DISTRICTWISE' },
  { to: '/dashboard/cities', icon: Globe, label: 'TEHSILWISE LAB' },
  { to: '/dashboard/labs', icon: Monitor, label: 'LABWISE SYSTEM' },
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

  return (
    <>
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed top-6 left-6 z-50',
            'bg-card border border-border rounded-lg shadow-lg',
            'hover:bg-primary transition-all duration-300 group'
          )}
        >
          <Menu className="w-5 h-5 group-hover:text-black text-white" />
        </Button>
      )}

      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col z-40',
          'transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl',
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg text-white tracking-tight font-display leading-tight uppercase">Lab</h1>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mt-0.5 whitespace-nowrap">Monitoring</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="shrink-0 hover:bg-muted rounded-lg w-8 h-8 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1 py-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={handleNavClick}
                className={({ isActive }) => cn(
                  'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300',
                  isActive
                    ? 'bg-primary text-black shadow-lg scale-[1.02]'
                    : 'text-white hover:text-primary hover:bg-primary/10'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-transform duration-300",
                      isActive ? "scale-110" : "group-hover:scale-110"
                    )} />
                    <span className="whitespace-nowrap">{label}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-l-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="mt-auto p-4 space-y-3">
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-2">System Status</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Connected</span>
              </div>
            </div>
          </div>

          <GeneratePDFDialog />

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-xs font-black text-black bg-primary hover:bg-primary/90 transition-all duration-300 shadow-xl group border border-primary/20"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>
    </>
  );
}