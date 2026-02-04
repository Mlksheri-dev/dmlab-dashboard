import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Wifi, WifiOff, Activity, Shield, Terminal, ArrowRight, Target, Zap, Waves } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';

const LabSummaryPage = () => {
    const { city, lab } = useParams();
    const navigate = useNavigate();

    const { data: labsResponse, isLoading } = useQuery({
        queryKey: ['city-labs', city],
        queryFn: () => apiFetch(`/stats/city/${city}/labs`),
        enabled: !!city,
        refetchInterval: 5000,
    });

    const labData = labsResponse?.labs?.find((l: any) => l.lab_name === lab);

    // Dynamic Intensity for Wave Charts
    const getIntensity = (val: number, total: number) => Math.max(0.1, total > 0 ? (val / total) : 0);

    const stats = [
        {
            label: "TOTAL PC",
            value: labData?.total_pcs || 0,
            icon: Monitor,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            glow: "glow-blue",
            waveColor: "#3b82f6",
            filter: "all",
            subtitle: "Global Node Inventory",
            intensity: 0.8
        },
        {
            label: "ONLINE PC",
            value: labData?.online || 0,
            icon: Wifi,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            glow: "glow-emerald",
            waveColor: "#10b981",
            filter: "online",
            subtitle: "Active Heartbeat Sync",
            intensity: getIntensity(labData?.online || 0, labData?.total_pcs || 1)
        },
        {
            label: "OFFLINE PC",
            value: labData?.offline || 0,
            icon: WifiOff,
            color: "text-red-400",
            bg: "bg-red-500/10",
            borderColor: "border-red-500/20",
            glow: "glow-red",
            waveColor: "#ef4444",
            filter: "offline",
            subtitle: "Connection Terminated",
            intensity: getIntensity(labData?.offline || 0, labData?.total_pcs || 1)
        }
    ];

    const allStats = [
        ...stats,
        {
            label: "7+ DAYS OFFLINE",
            value: labData?.offline_7d || 0,
            icon: Terminal,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            glow: "glow-purple",
            waveColor: "#a855f7",
            filter: "offline",
            intensity: getIntensity(labData?.offline_7d || 0, labData?.total_pcs || 1)
        },
        {
            label: "30+ DAYS OFFLINE",
            value: labData?.offline_30d || 0,
            icon: Target,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            borderColor: "border-pink-500/20",
            glow: "glow-pink",
            waveColor: "#ec4899",
            filter: "offline",
            intensity: getIntensity(labData?.offline_30d || 0, labData?.total_pcs || 1)
        }
    ];

    if (isLoading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-64 rounded-[2rem] bg-white/5" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-700 min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Elegant Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.05),transparent)] pointer-events-none" />
            <div className="fixed inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

            {/* TOP NAVIGATION BAR */}
            <div className="relative z-10 flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => navigate(`/dashboard/lab-analytics?city=${city}`)}
                        className="bg-muted/50 border border-border/50 hover:bg-muted/80 rounded-xl w-10 h-10 flex items-center justify-center group transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest italic">Core Lab Dashboard</span>
                            <div className="w-0.5 h-0.5 bg-foreground/30 rounded-full" />
                            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest italic">{city}</span>
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-foreground">
                            {lab} <span className="opacity-20">SEGMENT</span>
                        </h1>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-6">
                    <Button
                        onClick={async () => {
                            const { generateDynamicReport } = await import('@/lib/pdf-generator');
                            await generateDynamicReport('LAB', labData, lab);
                        }}
                        className="bg-muted/50 hover:bg-muted/80 border border-border/50 text-foreground gap-2 px-4 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest transition-all group backdrop-blur-xl mr-2"
                    >
                        <Zap size={14} className="text-primary group-hover:scale-110 transition-transform" />
                        generate dailybasePDF
                    </Button>

                    {[
                        { label: "STABILITY", value: "99.9%", icon: Activity },
                        { label: "STATUS", value: "ENCRYPTED", icon: Shield },
                        { label: "THREATS", value: labData?.offline_30d || 0, icon: Target },
                    ].map((m, i) => (
                        <div key={i} className="flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                                <m.icon size={10} className="text-primary" />
                                <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.3em]">{m.label}</span>
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-widest text-foreground">{m.value}</span>
                        </div>
                    ))}
                </div>

            </div>

            {/* CORE METRICS GRID - EVERYTHING IN ONE VIEW */}
            <div className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {allStats.map((stat, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab}&status=${stat.filter}`)}
                            className={cn(
                                "group glass-card premium-border rounded-2xl p-4 md:p-5 cursor-pointer transition-all duration-500 hover:translate-y-[-4px] relative overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-[180px]",
                                stat.glow,
                                // Special styling for alerts
                                i >= 3 && "border-yellow-500/20"
                            )}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "p-2.5 rounded-xl bg-background/40 border transition-all duration-500 group-hover:scale-110 shadow-inner",
                                    stat.borderColor
                                )}>
                                    <stat.icon size={20} className={stat.color} />
                                    {i >= 3 && <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[6px] font-black px-1 py-0.5 rounded-sm shadow-lg">ALERT</div>}
                                </div>
                                <div className="bg-background/20 p-1.5 rounded-lg border border-border/30 backdrop-blur-md">
                                    <MiniWaveChart
                                        color={stat.waveColor}
                                        width={80}
                                        height={35}
                                        intensity={stat.intensity}
                                        showGrid={false}
                                    />
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <div className={cn("border-l pl-2 mb-1 transition-all group-hover:pl-3", stat.borderColor)}>
                                    <p className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 italic transition-colors", stat.color)}>
                                        {stat.label}
                                    </p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground leading-none transition-all duration-500 group-hover:scale-105">
                                        {stat.value}
                                    </h2>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "text-[7px] font-black uppercase tracking-widest",
                                            i >= 3 ? "text-red-500" : "text-emerald-500"
                                        )}>
                                            {i >= 3 ? "Critical" : "+5.2%"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 blur-[60px] opacity-10 rounded-full", stat.bg)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* PRESENTATION FOOTER */}
            <div className="relative z-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-border/50">
                <div>
                    <p className="text-[7px] font-black opacity-20 uppercase tracking-[0.5em] mb-1 group-hover:text-primary">System Branch</p>
                    <p className="text-[10px] font-black opacity-60 uppercase italic tracking-widest text-foreground">{city} • SECTOR CLUSTER</p>
                </div>

                <div className="text-center md:text-right">
                    <p className="text-[9px] font-black opacity-30 tracking-widest italic uppercase text-foreground">© 2026 Lab Guardian • Core Intelligence systems</p>
                    <p className="text-[8px] font-bold text-primary/40 uppercase tracking-[0.5em] italic">V2.0 PRO INFRASTRUCTURE</p>
                </div>
            </div>
        </div>
    );
};

export default LabSummaryPage;
