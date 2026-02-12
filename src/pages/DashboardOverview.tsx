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
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <header className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-display">
            CITYWISE <span className="text-white/80">OVERVIEW</span>
          </h1>

        </div>

        <Button
          onClick={() => handleGenerateReport(stats, locations)}
          className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          <FileText size={16} className="text-black" />
          Generate System Audit
        </Button>
      </header>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
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
            <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-0.5">System Health</p>
                <p className="text-2xl font-bold text-white tracking-tight">98<span className="text-white/60">%</span></p>
                <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Optimal</p>
              </div>
            </div>
          </>
        )}
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-white">
              <LayoutGrid size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight uppercase text-white font-display">Regional Nodes</h2>
          </div>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest bg-card py-1.5 px-4 rounded-lg border border-border shadow-sm">
            {locations.length} ACTIVE REGIONS
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : (locations && locations.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {locations.map((loc: any) => {
              if (!loc) return null;
              const online = loc.online || 0;
              const total = loc.total_pcs || 0;
              const intensity = Math.max(0.1, (total > 0 ? (online / total) : 0));

              return (
                <Card
                  key={loc.city}
                  onClick={() => navigate(`/dashboard/devices?city=${loc.city}`)}
                  className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px]"
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-white/80 transition-colors truncate">
                        {loc.city}
                      </h3>
                      <MoreVertical size={16} className="text-white/30" />
                    </div>

                    <div className="flex justify-center flex-1 items-center opacity-40">
                      <MiniWaveChart
                        color="#01416D"
                        width={180}
                        height={40}
                        intensity={intensity}
                        showGrid={false}
                      />
                    </div>

                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Total</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xl font-bold text-emerald-400 tracking-tight">{online}</span>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-dashed border-border p-12 text-center rounded-2xl">
            <WifiOff className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 font-bold uppercase tracking-widest text-xs">No active nodes detected</p>
          </Card>
        )
        }
      </section >
    </div >
  );
}
