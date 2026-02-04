import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { Search, Monitor, ArrowLeft, Layout, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function DevicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityParam = searchParams.get('city');
  const labParam = searchParams.get('lab');
  const statusParam = searchParams.get('status') as 'all' | 'online' | 'offline';

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>(statusParam || 'all');

  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam);
  }, [statusParam]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['devices-list', cityParam, labParam, statusFilter, search],
    queryFn: () => {
      let path = '/devices?';
      if (cityParam) path += `city=${cityParam}&`;
      if (labParam) path += `lab=${labParam}&`;
      if (statusFilter !== 'all') path += `status=${statusFilter}&`;
      if (search) path += `search=${search}&`;
      return apiFetch(path);
    },
    refetchInterval: 15000,
    staleTime: 5000,
    gcTime: 30000
  });

  const devices = response?.devices || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Network Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-xl bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-display"
            onClick={() => navigate(cityParam ? `/dashboard/labs?city=${cityParam}` : '/dashboard/cities')}
          >
            <ArrowLeft className="w-3 h-3 mr-2" /> RETURN TO HIERARCHY
          </Button>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground font-display leading-[0.8]">
              {labParam ? `${labParam}` : (cityParam ? cityParam : "TOTAL")} <span className="text-primary text-glow-pink">SYSTEM</span>
            </h1>

            <p className="text-muted-foreground font-black mt-2 uppercase tracking-[0.3em] text-[10px]">
              {cityParam && labParam ? `${cityParam.toUpperCase()} / ${labParam.toUpperCase()} INFRASTRUCTURE` : "System Node Management & Inventory"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={async () => {
              const { generateDynamicReport } = await import('@/lib/pdf-generator');
              await generateDynamicReport('SYSTEM', response);
            }}
            className="bg-muted hover:bg-muted/80 border border-border text-foreground gap-2 px-6 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest transition-all group backdrop-blur-xl"
          >
            <Monitor size={16} className="text-primary group-hover:scale-110 transition-transform" />
            generate dailybasePDF
          </Button>

          {/* Segmented Control for Status */}
          <div className="flex p-1 rounded-2xl bg-muted border border-border backdrop-blur-xl">

            {[
              { id: 'all', label: 'All Units', color: 'text-foreground' },
              { id: 'online', label: 'Live Nodes', color: 'text-cyan-400' },
              { id: 'offline', label: 'Idle Nodes', color: 'text-pink-500' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  statusFilter === f.id
                    ? "bg-primary text-primary-foreground shadow-xl glow-pink"
                    : cn("text-muted-foreground hover:bg-muted/50", f.color)
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-glow-pink transition-all w-4 h-4" />
            <Input
              placeholder="SEARCH HID / SYSTEM..."
              className="pl-12 bg-muted/50 border-border focus:border-primary/50 text-[10px] font-black uppercase tracking-[0.2em] h-12 rounded-2xl transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Meta Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Layout size={12} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">{devices.length}</span>
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Active Units in Region</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
          <Activity size={10} className="text-cyan-400 animate-pulse" />
          <span className="text-[9px] font-black text-cyan-400/80 uppercase tracking-tighter">Real-time Stream Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2rem]" />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="p-20 text-center glass-card border-dashed border-border rounded-[3rem]">
          <Monitor className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-black italic text-foreground uppercase tracking-tighter italic">No Operational Nodes Detected</h3>
          <p className="text-muted-foreground text-[10px] uppercase font-black tracking-[0.2em] mt-3 max-w-sm mx-auto opacity-60">
            The telemetry stream returned zero matches for the current filter criteria. Check agent heartbeats.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-20">
          {devices.map((device: any) => (
            <DeviceCard key={device.system_id} device={device} serverTime={response?.server_time} />
          ))}
        </div>
      )}
    </div>
  );
}
