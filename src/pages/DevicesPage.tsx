import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { Search, Monitor, ArrowLeft, Layout, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DevicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityParam = searchParams.get('city');
  const labParam = searchParams.get('lab');
  const tehsilParam = searchParams.get('tehsil');
  const statusParam = searchParams.get('status') as 'all' | 'online' | 'offline' | 'offline_7d' | 'offline_30d' | 'defective';

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'offline_7d' | 'offline_30d' | 'defective'>(statusParam || 'all');

  useEffect(() => {
    if (statusParam) setStatusFilter(statusParam);
  }, [statusParam]);

  const { data: response, isLoading } = useQuery({
    queryKey: ['devices-list', cityParam, labParam, tehsilParam, statusFilter, search],
    queryFn: async () => {
      let query = supabase.from('devices').select('*');

      if (cityParam) query = query.eq('city', cityParam);
      if (tehsilParam) query = query.eq('tehsil', tehsilParam);
      if (labParam) query = query.eq('lab_name', labParam);

      // Handle base status filter from DB
      if (statusFilter === 'online') query = query.eq('status', 'online');
      if (statusFilter === 'offline' || statusFilter === 'offline_7d' || statusFilter === 'offline_30d') {
        query = query.eq('status', 'offline');
      }

      if (search) {
        // Simple search on pc_name
        query = query.ilike('pc_name', `%${search}%`);
      }

      // Execute query
      const { data, error } = await query;
      if (error) throw error;

      return {
        devices: data,
        server_time: new Date().toISOString()
      };
    },
    refetchInterval: 1000,
    staleTime: 1000,
    gcTime: 30000
  });

  let devices = response?.devices || [];

  // Frontend filtering for specific offline durations and defective status
  const defectiveDevices = JSON.parse(localStorage.getItem('defective_devices') || '[]');

  if (statusFilter === 'defective') {
    devices = devices.map(d => ({
      ...d,
      is_defective: d.is_defective || defectiveDevices.includes(d.system_id)
    })).filter((d: any) => d.is_defective);
  } else {
    // For other filters, inject the persisted defective state
    devices = devices.map(d => ({
      ...d,
      is_defective: d.is_defective || defectiveDevices.includes(d.system_id)
    }));

    if (statusFilter === 'offline_7d' || statusFilter === 'offline_30d') {
      const now = response?.server_time ? new Date(response.server_time) : new Date();
      const daysThreshold = statusFilter === 'offline_7d' ? 7 : 30;

      devices = devices.filter((device: any) => {
        if (device.is_defective) return false; // Show in defective category instead
        if (device.status !== 'offline') return false;
        if (!device.last_seen) return true;
        const lastSeen = new Date(device.last_seen);
        const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= daysThreshold;
      });
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 bg-background min-h-screen">
      {/* Network Header */}
      <header className="pb-6 border-b border-border space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary transition-all font-display"
              onClick={() => navigate(labParam ? `/dashboard/labs?city=${cityParam}&tehsil=${tehsilParam}` : cityParam ? `/dashboard/tehsils?city=${cityParam}` : '/dashboard/cities')}
            >
              <ArrowLeft className="w-3 h-3 mr-2" /> Back to Hierarchy
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase text-white font-display leading-tight max-w-4xl">
                {statusFilter === 'offline_7d' ? '7 DAYS+ OFFLINE' :
                  statusFilter === 'offline_30d' ? 'ONE MONTH+ OFFLINE' :
                    labParam ? labParam : (cityParam ? cityParam : "LABWISE")} <span className="text-white/80">SYSTEM</span>
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-wider text-[9px] mt-1">
                {cityParam && labParam ? `${cityParam} / ${tehsilParam || 'GENERAL'} / ${labParam}` : "System Monitoring & Asset Management"}
              </p>
            </div>
          </div>

          <Button
            onClick={async () => {
              const toastId = toast.loading(`Synthesizing audit for ${labParam || cityParam || 'Fleet'}...`);
              try {
                const { generateDynamicReport } = await import('@/lib/pdf-generator');
                await generateDynamicReport(
                  (cityParam && labParam) ? 'LAB' : 'SYSTEM',
                  { ...response, city: cityParam, lab: labParam },
                  labParam || cityParam || 'SYSTEM WIDE'
                );
                toast.success("Infrastructure Audit Ready", { id: toastId });
              } catch (e) {
                console.error(e);
                toast.error("Audit Generation Failed", { id: toastId });
              }
            }}
            className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shrink-0"
          >
            <Monitor size={16} className="text-black" />
            Generate Facility Audit
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-2">
          {/* Segmented Control for Status */}
          <div className="flex p-1 rounded-lg bg-card border border-border shadow-sm w-full lg:w-auto">
            {[
              { id: 'all', label: 'All Units', color: 'text-primary' },
              { id: 'online', label: 'Online', color: 'text-emerald-600' },
              { id: 'offline', label: 'Offline', color: 'text-red-600' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={cn(
                  "flex-1 lg:px-6 py-2 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                  (statusFilter === f.id || (f.id === 'offline' && (statusFilter === 'offline_7d' || statusFilter === 'offline_30d')))
                    ? "bg-primary text-black shadow-sm"
                    : cn("text-white/60 hover:text-white hover:bg-muted/50")
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all w-4 h-4" />
            <Input
              placeholder="SEARCH BY SYSTEM ID OR NAME..."
              className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-11 rounded-lg transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Meta Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-card border border-border">
            <Layout size={12} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">{devices.length}</span>
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Active Units in Region</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
          <Activity size={10} className="text-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Real-time Stream Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
          <Monitor className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Operational Nodes Detected</h3>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-3 max-w-sm mx-auto opacity-60">
            The telemetry stream returned zero matches for the current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
          {devices.map((device: any) => (
            <DeviceCard key={device.system_id} device={device} serverTime={response?.server_time} />
          ))}
        </div>
      )}
    </div>
  );
}
