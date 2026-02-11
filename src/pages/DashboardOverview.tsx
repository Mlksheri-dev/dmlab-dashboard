import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Wifi, WifiOff, LayoutGrid, MoreVertical, Activity, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import { Button } from '@/components/ui/button';
import { generateDailyReport } from '@/lib/pdf-generator';
import { toast } from 'sonner';

export default function DashboardOverview() {
  const navigate = useNavigate();

  const handleGenerateReport = async (stats: any, locations: any[]) => {
    const toastId = toast.loading("Preparing your system audit PDF...");
    try {
      const { generateDynamicReport } = await import('@/lib/pdf-generator');
      await generateDynamicReport('GLOBAL', { locations });
      toast.success("PDF Generated Successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    }
  };



  const { data: locResponse, isLoading: locLoading } = useQuery({
    queryKey: ['location-stats'],
    queryFn: () => apiFetch('/stats/locations'),
    refetchInterval: 10000,
  });

  const locations = locResponse?.locations || [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => apiFetch('/stats/overview'),
    refetchInterval: 10000,
  });

  const loading = locLoading || statsLoading;

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground">
            TOTAL <span className="text-primary">CITY</span>
          </h1>
          <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[10px]">
            Operational Overview & System Health
          </p>
        </div>

        <Button
          onClick={() => handleGenerateReport(stats, locations)}
          className="bg-card/40 hover:bg-card/60 border border-border/40 text-foreground gap-2 px-6 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest transition-all group backdrop-blur-xl"
        >
          <FileText size={16} className="text-primary group-hover:scale-110 transition-transform" />
          generate dailybasePDF
        </Button>
      </header>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <div onClick={() => navigate('/dashboard/cities')} className="cursor-pointer">
              <StatsCard title="Total Cities" value={locations.length} icon={Globe} variant="blue" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=online')} className="cursor-pointer">
              <StatsCard title="Online PCs" value={stats?.online_devices || 0} icon={Wifi} variant="yellow" />
            </div>
            <div onClick={() => navigate('/dashboard/devices?status=offline')} className="cursor-pointer">
              <StatsCard title="Offline PCs" value={stats?.offline_devices || 0} icon={WifiOff} variant="blue" />
            </div>
            <div className="glass-card premium-border rounded-3xl p-5 flex items-center gap-4 hover:bg-primary/5 transition-all border-dashed border-primary/20 bg-background/50">
              <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                <Activity size={24} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-0.5">Global Score</p>
                <p className="text-2xl font-black italic text-foreground tracking-tighter">98<span className="text-primary">%</span></p>
                <p className="text-[7px] font-bold text-primary uppercase">Optimized Protocol</p>
              </div>
            </div>
          </>
        )}
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary glow-blue">
              <LayoutGrid size={20} />
            </div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase text-foreground">System Nodes</h2>
          </div>
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest bg-muted py-1 px-3 rounded-full border border-border">
            {locations.length} Regions Active
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
          </div>
        ) : (locations && locations.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {locations.map((loc: any) => {
              if (!loc) return null;
              const online = loc.online || 0;
              const total = loc.total_pcs || 0;
              const intensity = Math.max(0.1, (total > 0 ? (online / total) : 0));

              return (
                <Card
                  key={loc.city}
                  onClick={() => navigate(`/dashboard/devices?city=${loc.city}`)}
                  className="group relative overflow-hidden glass-card cursor-pointer hover:border-primary/50 transition-all hover:translate-y-[-4px] premium-border rounded-[2rem] min-h-[220px]"
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-black italic tracking-tighter uppercase text-foreground group-hover:text-primary transition-colors truncate pr-2">
                        {loc.city}
                      </h3>
                      <MoreVertical size={16} className="opacity-20" />
                    </div>

                    <div className="flex justify-center flex-1 items-center">
                      <MiniWaveChart
                        color="#3b82f6"
                        width={180}
                        height={50}
                        intensity={intensity}
                        showGrid={true}
                      />
                    </div>

                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black italic text-foreground tracking-tighter">{total}</span>
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Total</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black italic text-yellow-400 tracking-tighter text-glow-yellow">{online}</span>
                        <span className="text-[8px] font-black text-yellow-500/40 uppercase tracking-widest">Live</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-muted border-dashed border-border p-12 text-center">
            <WifiOff className="w-12 h-12 opacity-20 mx-auto mb-4 text-foreground" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No active nodes detected.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
