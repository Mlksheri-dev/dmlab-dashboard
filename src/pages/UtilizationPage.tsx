import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    Cell, PieChart, Pie
} from "recharts";
import {
    Zap, AlertTriangle, Ghost, Clock, Activity,
    CheckCircle2, XCircle, Filter, MapPin, MoreVertical, Building2, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MiniWaveChart } from "@/components/dashboard/MiniWaveChart";

const COLORS = {
    used: "#00f2fe",      // Cyane Active
    idle: "#f99a1d",      // Gold/Primary for Idle Warning
    offline: "#ff4b2b",   // Red Danger
};

export default function UtilizationPage() {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<'all' | 'used' | 'idle' | 'offline' | 'stale' | 'ghost'>('all');

    const { data, isLoading, error, isFetching, isError } = useQuery({
        queryKey: ["utilization-stats"],
        queryFn: () => apiFetch("/stats/utilization"),
        refetchInterval: 15000,
        retry: 5, // Keep trying multiple times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff (2s, 4s, 8s...)
        staleTime: 5000,
    });

    const filteredLabs = useMemo(() => {
        if (!data?.lab_details) return [];
        if (activeFilter === 'all') return data.lab_details;

        return data.lab_details.filter((lab: any) => {
            if (activeFilter === 'used') return !!lab.used;
            if (activeFilter === 'online') return lab.online > 0;
            if (activeFilter === 'idle') return lab.online > 0 && !lab.used;
            if (activeFilter === 'offline') return lab.online === 0;
            if (activeFilter === 'stale') return !!lab.is_stale;
            if (activeFilter === 'ghost') return !!lab.is_ghost;
            return false; // Strict fallback
        });
    }, [data?.lab_details, activeFilter]);

    const toggleFilter = (filter: typeof activeFilter) => {
        setActiveFilter(prev => prev === filter ? 'all' : filter);
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-background">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin" />
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-primary rounded-full animate-spin" />
                </div>
                <p className="text-primary font-bold animate-pulse tracking-widest uppercase text-xs">Decoding Lab Intelligence...</p>
            </div>
        );
    }

    // Only show full error if we have NO data at all
    if (isError && !data) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-background p-10">
                <XCircle className="w-16 h-16 text-red-500 animate-bounce" />
                <h2 className="text-2xl font-black uppercase italic text-white font-display">Connectivity Error</h2>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-primary text-black font-black uppercase rounded-xl hover:scale-105 transition-all shadow-xl"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    const todayData = [
        { name: "used", value: data?.today?.used_labs || 0, color: COLORS.used },
        { name: "idle", value: data?.today?.idle_labs || 0, color: COLORS.idle },
        { name: "offline", value: data?.today?.offline_labs || 0, color: COLORS.offline },
    ].filter(d => d.value > 0);

    const totalLabsCount = (data?.today?.used_labs || 0) + (data?.today?.idle_labs || 0) + (data?.today?.offline_labs || 0);
    const onlineLabsCount = (data?.today?.used_labs || 0) + (data?.today?.idle_labs || 0);
    const usedPercent = totalLabsCount > 0 ? Math.round((data?.today?.used_labs / totalLabsCount) * 100) : 0;

    const handleLabClick = (city: string, lab: string) => {
        navigate(`/dashboard/lab-summary/${encodeURIComponent(city)}/${encodeURIComponent(lab)}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-10 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display">
                        LAB UTILIZATION
                    </h1>
                    <p className="text-white font-bold mt-1 uppercase tracking-wider text-[10px] opacity-70">
                        DISTRIBUTION OF REAL-ACTIVE VS FORMAL STATUS
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full animate-pulse">
                            <Activity className="w-3 h-3 text-primary" />
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest">Reconnecting...</span>
                        </div>
                    )}
                    <div className="bg-card border border-border p-3 px-5 rounded-xl shadow-sm flex items-center gap-4">
                        <Clock className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Last Synced</span>
                            <span className="text-xs font-bold text-white mono">{new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* TOP SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CARD 1: TODAY'S PRESENCE */}
                <Card
                    className={cn(
                        "group relative overflow-hidden bg-card border hover:border-primary/40 transition-all shadow-sm hover:shadow-lg rounded-2xl min-h-[220px]",
                        (activeFilter === 'used' || activeFilter === 'idle' || activeFilter === 'offline' || activeFilter === 'online') ? "border-primary/40 bg-primary/5 shadow-primary/5" : "border-border"
                    )}
                >
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-3 rounded-xl bg-primary text-black shrink-0 shadow-md">
                                    <Zap size={18} fill="currentColor" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">
                                        TODAY'S PRESENCE
                                    </h4>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] truncate">Utilization Factor: {usedPercent}%</p>
                                </div>
                            </div>
                            <div className="shrink-0 p-1 hover:bg-muted rounded text-white/10">
                                <MoreVertical size={16} />
                            </div>
                        </div>


                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                            <button
                                onClick={() => toggleFilter('used')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-3 rounded-xl border transition-all hover:scale-105 active:scale-95",
                                    activeFilter === 'used' ? "bg-emerald-500/20 border-emerald-500/40 shadow-inner" : "bg-background/40 border-white/5 hover:border-emerald-500/20"
                                )}
                            >
                                <span className={cn("text-xl font-bold", activeFilter === 'used' ? "text-emerald-400" : "text-white")}>{data?.today?.used_labs || 0}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Used</span>
                            </button>
                            <button
                                onClick={() => toggleFilter('idle')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-3 rounded-xl border transition-all hover:scale-105 active:scale-95",
                                    activeFilter === 'idle' ? "bg-primary/20 border-primary/40 shadow-inner" : "bg-background/40 border-white/5 hover:border-primary/20"
                                )}
                            >
                                <span className={cn("text-xl font-bold", activeFilter === 'idle' ? "text-primary" : "text-white")}>{data?.today?.idle_labs || 0}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Idle</span>
                            </button>
                            <button
                                onClick={() => toggleFilter('offline')}
                                className={cn(
                                    "flex flex-col items-center justify-center py-3 rounded-xl border transition-all hover:scale-105 active:scale-95",
                                    activeFilter === 'offline' ? "bg-destructive/20 border-destructive/40 shadow-inner" : "bg-background/40 border-white/5 hover:border-destructive/20"
                                )}
                            >
                                <span className={cn("text-xl font-bold", activeFilter === 'offline' ? "text-destructive" : "text-white")}>{data?.today?.offline_labs || 0}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Off</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 2: 7 DAYS INACTIVE */}
                <Card
                    onClick={() => toggleFilter('stale')}
                    className={cn(
                        "group relative overflow-hidden bg-card cursor-pointer border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[220px]",
                        activeFilter === 'stale' ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-primary/5" : "border-border"
                    )}
                >
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-3 rounded-xl bg-primary text-black shrink-0 shadow-md">
                                    <AlertTriangle size={18} fill="currentColor" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">
                                        7 DAYS INACTIVE
                                    </h4>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] truncate">Stale Detection</p>
                                </div>
                            </div>
                            <div className="shrink-0 p-1 hover:bg-muted rounded text-white/10">
                                <MoreVertical size={16} />
                            </div>
                        </div>


                        <div className="flex items-end justify-between pt-4 border-t border-white/5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold text-white tracking-tight">{data?.one_week_unused?.length || 0}</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Labs</span>
                            </div>
                            <div className="flex items-baseline gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 shadow-sm transition-all">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">STALE IDENTIFIED</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 3: 30 DAYS GHOSTING */}
                <Card
                    onClick={() => toggleFilter('ghost')}
                    className={cn(
                        "group relative overflow-hidden bg-card cursor-pointer border hover:border-destructive/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[220px]",
                        activeFilter === 'ghost' ? "border-destructive ring-1 ring-destructive/20 bg-destructive/5 shadow-destructive/5" : "border-border"
                    )}
                >
                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-3 rounded-xl bg-destructive text-white shrink-0 shadow-md">
                                    <Ghost size={18} fill="currentColor" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-destructive transition-colors truncate">
                                        30 DAYS GHOSTING
                                    </h4>
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] truncate">Critical State</p>
                                </div>
                            </div>
                            <div className="shrink-0 p-1 hover:bg-muted rounded text-white/10">
                                <MoreVertical size={16} />
                            </div>
                        </div>


                        <div className="flex items-end justify-between pt-4 border-t border-white/5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-bold text-white tracking-tight">{data?.one_month_unused?.length || 0}</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Labs</span>
                            </div>
                            <div className="flex items-baseline gap-2 px-4 py-1.5 rounded-full border border-destructive/20 bg-destructive/10 shadow-sm transition-all">
                                <span className="text-[9px] font-black text-destructive uppercase tracking-widest">GHOST CRITICAL</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* INTELLIGENCE MATRIX SECTION */}
            <div className="space-y-6">
                <header className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold uppercase tracking-tight text-white font-display">INTELLIGENCE MATRIX</h2>
                        {activeFilter !== 'all' && (
                            <Badge
                                variant="outline"
                                className="bg-primary text-black font-bold cursor-pointer border-none flex items-center gap-1.5 text-[9px] px-3 py-1.5 rounded-full uppercase"
                                onClick={() => setActiveFilter('all')}
                            >
                                <Filter className="w-3 h-3" />
                                Filtered: {activeFilter}
                            </Badge>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLabs.length > 0 ? (
                        filteredLabs.map((lab: any, idx: number) => (
                            <Card
                                key={`${lab.city}-${lab.lab}-${idx}`}
                                onClick={() => handleLabClick(lab.city, lab.lab)}
                                className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px]"
                            >
                                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="p-3 rounded-xl bg-primary text-black shrink-0 shadow-md">
                                                <MapPin size={18} fill="currentColor" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate">
                                                    {lab.lab}
                                                </h4>
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] truncate">{lab.city}</p>
                                            </div>
                                        </div>
                                        <MoreVertical size={16} className="text-white/10 shrink-0 mt-1" />
                                    </div>


                                    <div className="flex items-end justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-bold text-white tracking-tight">{lab.total}</span>
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Units</span>
                                        </div>
                                        <div className={cn(
                                            "flex items-baseline gap-2 px-4 py-1.5 rounded-full border shadow-sm transition-all",
                                            lab.used ? "bg-emerald-500/10 border-emerald-500/20" : (lab.online > 0 ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20")
                                        )}>
                                            <span className={cn(
                                                "text-2xl font-bold tracking-tight",
                                                lab.used ? "text-emerald-400" : (lab.online > 0 ? "text-primary" : "text-destructive")
                                            )}>{lab.online}</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                lab.used ? "text-emerald-400" : (lab.online > 0 ? "text-primary" : "text-destructive")
                                            )}>Live</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-3xl group">
                            <div className="relative mb-6">
                                <Building2 className="w-16 h-16 text-primary/20 group-hover:text-primary/40 transition-colors" />
                                <Filter className="absolute -bottom-2 -right-2 w-6 h-6 text-primary animate-bounce" />
                            </div>
                            <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">No Labs Match Filter</h3>
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="border border-primary text-primary hover:bg-primary hover:text-black font-black uppercase tracking-widest text-[10px] h-10 px-8 rounded-xl transition-all"
                            >
                                View All Infrastructure
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
