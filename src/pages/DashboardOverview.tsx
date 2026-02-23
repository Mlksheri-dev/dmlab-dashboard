import { useMemo } from 'react';
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
    const toastId = toast.loading("Preparing your system audit Excel report...");
    try {
      const { generateDynamicReport } = await import('@/lib/pdf-generator');
      await generateDynamicReport('GLOBAL', { locations });
      toast.success("Excel Report Generated Successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel report. Please try again.", { id: toastId });
    }
  };



  const { data: statsData, isLoading: loading } = useQuery({
    queryKey: ['global-lab-stats'],
    queryFn: () => apiFetch('/stats/labs/all'),
    refetchInterval: 10000,
  });

  const locations = useMemo(() => {
    const labs = Array.isArray(statsData?.labs) ? statsData.labs : [];
    const cityMap = new Map<string, any>();

    labs.forEach((lab: any) => {
      const city = lab.city || 'Unknown';
      if (!cityMap.has(city)) {
        cityMap.set(city, {
          city,
          total_pcs: 0,
          online: 0,
          total_labs: 0,
          tehsils: new Set()
        });
      }
      const target = cityMap.get(city);
      target.total_pcs += Number(lab.total_pcs || 0);
      target.online += Number(lab.online || 0);
      target.total_labs += 1;
      if (lab.tehsil) target.tehsils.add(lab.tehsil);
    });

    return Array.from(cityMap.values()).map(loc => ({
      ...loc,
      total_tehsils: loc.tehsils.size || 1 // Fallback to 1 if no tehsil specified
    })).sort((a, b) => b.total_pcs - a.total_pcs);
  }, [statsData]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <header className="pb-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-display">
            DISTRICTWISE <span className="text-white/80">OVERVIEW</span>
          </h1>

        </div>

        <Button
          onClick={() => handleGenerateReport(null, locations)}
          className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          <FileText size={16} className="text-black" />
          Generate System Audit (Excel)
        </Button>
      </header>


      {/* Summary cards removed per user request */}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-white">
              <LayoutGrid size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight uppercase text-white font-display">District Nodes</h2>
          </div>
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest bg-card py-1.5 px-4 rounded-lg border border-border shadow-sm">
            {locations.length} ACTIVE DISTRICTS
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

              return (
                <Card
                  key={loc.city}
                  onClick={() => navigate(`/dashboard/tehsils?city=${loc.city}`)}
                  className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px]"
                >
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-white/80 transition-colors truncate">
                        {loc.city}
                      </h3>
                      <MoreVertical size={16} className="text-white/30" />
                    </div>


                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-white tracking-tight">{loc.total_tehsils || 0}</span>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Total Tehsil</span>
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
