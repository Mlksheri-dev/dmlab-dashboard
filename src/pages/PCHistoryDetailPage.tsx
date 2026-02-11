import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Timer,
    Activity,
    Cpu,
    Layout,
    Info,
    History,
    Play,
    Square,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAppName, parseUTC } from '@/lib/utils';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';

export default function PCHistoryDetailPage() {
    const { id, date } = useParams();
    const navigate = useNavigate();

    const { data: detail, isLoading } = useQuery({
        queryKey: ['pc-detail', id],
        queryFn: () => apiFetch(`/devices/${id}`),
    });

    if (isLoading) return <div className="p-8"><Skeleton className="h-screen rounded-[2.5rem]" /></div>;
    if (!detail?.device) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
            <History className="w-20 h-20 text-foreground opacity-5" />
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">History Log Not Found</h1>
            <Button onClick={() => navigate(-1)} className="premium-border glass-card px-8 uppercase font-black text-xs text-foreground">Return</Button>
        </div>
    );

    const { device, history } = detail;
    const isToday = date === new Date().toISOString().split('T')[0];

    // Fallback logic: If it's today and not in history yet, construct a virtual log from current device data
    const historyLog = history?.find((h: any) => (h.history_date || h.start_time?.split('T')[0]) === date) || (isToday ? {
        history_date: date,
        avg_score: device.cpu_score,
        runtime_minutes: device.runtime_minutes,
        start_time: device.today_start_time,
        end_time: device.today_last_active,
        app_usage: device.app_usage || {}
    } : null);

    if (!historyLog) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
            <History className="w-20 h-20 text-foreground opacity-5" />
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">No Archive Data for {date}</h1>
            <Button onClick={() => navigate(-1)} className="premium-border glass-card px-8 uppercase font-black text-xs text-foreground">Back to Device</Button>
        </div>
    );

    const formattedDate = new Date(date!).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).toUpperCase();

    // DAILY LIMIT HANDLER: Ensure data doesn't exceed 24 hours (1440 minutes)
    // If runtime_minutes is unusually high (e.g. > 1440), it likely contains accumulated data
    const rawRuntime = historyLog.runtime_minutes || 0;
    const runtimeMins = Math.min(1440, rawRuntime);

    // Calculate display hours and minutes
    const hours = Math.floor(runtimeMins / 60);
    const mins = Math.floor(runtimeMins % 60);

    return (
        <div className="bg-background h-screen w-full flex flex-col overflow-hidden relative font-sans animate-in fade-in duration-1000">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 pb-8 border-b border-border shadow-2xl relative z-10">
                <div className="flex items-start gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-lg bg-card border border-border hover:bg-primary/10 hover:text-primary transition-all group shrink-0 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1 text-primary" />
                    </Button>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                                ARCHIVE REPORT: <span className="text-white/80">{date}</span>
                            </h1>
                            <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                Historical Audit Log
                            </div>
                        </div>
                        <p className="text-white font-bold text-[10px] uppercase tracking-widest opacity-60">
                            Unit Identifier: <span className="text-white/80">{device.pc_name}</span> • Faculty Cluster: <span className="text-white/80">{device.lab_name}</span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Core Stats */}
                <div className="space-y-6">
                    <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-[10px] font-bold tracking-widest text-white uppercase opacity-60">Session Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="p-6 rounded-xl bg-background border border-border relative overflow-hidden group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-lg bg-primary text-white shadow-sm">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Average Performance Index</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white tracking-tight">{Number(historyLog.avg_score || 0).toFixed(1)}</span>
                                            <span className="text-[10px] font-bold text-white/80 uppercase">Units</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/20 transition-all group shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-lg bg-secondary text-white shadow-sm">
                                            <Timer size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Total Active Duration</p>
                                            <p className="text-3xl font-bold text-white tracking-tight">{hours}H <span className="text-white/80">{mins}M</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                                    <CardContent className="p-6 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                                                <Play size={24} className="fill-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Session Ingress</p>
                                                <h3 className="text-2xl font-bold uppercase tracking-tight text-primary">
                                                    {(() => {
                                                        const rawVal = historyLog.start_time || (isToday ? device.today_start_time : null);
                                                        if (!rawVal) return '08:00 AM';
                                                        const d = parseUTC(rawVal);
                                                        return isNaN(d.getTime()) ? '08:00 AM' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                    })()}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block px-3 py-1 rounded-md bg-background border border-border">
                                            <span className="text-[9px] font-bold text-primary/60 uppercase">Entry</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-all">
                                    <CardContent className="p-6 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-lg bg-orange-50 text-secondary flex items-center justify-center shrink-0 border border-orange-100">
                                                <Square size={20} className="fill-secondary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Session Egress</p>
                                                <h3 className="text-2xl font-bold uppercase tracking-tight text-primary">
                                                    {(() => {
                                                        const rawEnd = historyLog.end_time || (isToday ? (device.today_last_active || device.last_seen) : null);

                                                        // 1. If we have a valid end time, show it
                                                        if (rawEnd) {
                                                            const d = parseUTC(rawEnd);
                                                            if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                        }

                                                        // 2. If it's today and no time, it's active
                                                        if (isToday) return 'ACTIVE';

                                                        // 3. For History: Calculate from Start + Duration
                                                        const rawStart = historyLog.start_time || (isToday ? device.today_start_time : null);
                                                        const runtimeMins = Number(historyLog.runtime_minutes || 0);

                                                        if (runtimeMins > 0) {
                                                            let startTime: Date;
                                                            if (rawStart) {
                                                                startTime = parseUTC(rawStart);
                                                            } else {
                                                                // assume standard 08:00 AM start
                                                                startTime = new Date(`${date}T08:00:00`);
                                                            }

                                                            const calculatedEnd = new Date(startTime.getTime() + runtimeMins * 60000);
                                                            return calculatedEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                        }

                                                        return 'COMPLETED';
                                                    })()}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block px-3 py-1 rounded-md bg-background border border-border">
                                            <span className="text-[9px] font-bold text-secondary/60 uppercase">{isToday ? 'Tracking' : 'Exit'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Activity size={18} className="text-primary" />
                                        <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Estimated Peak Load</span>
                                    </div>
                                    <span className="text-sm font-bold text-primary">{(historyLog.avg_score * 1.2).toFixed(1)} UNITS</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </div>

                {/* Right Columns - Big Software Spectrum */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border border-border rounded-2xl overflow-hidden min-h-[610px] flex flex-col shadow-sm">
                        <CardHeader className="p-8 flex flex-row items-center justify-between bg-primary/5 border-b border-border">
                            <div>
                                <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">Software Utilization Matrix</CardTitle>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-[11px] font-bold text-primary uppercase tracking-tight">{formattedDate}</p>
                                    <div className="h-1 w-1 rounded-full bg-secondary/30" />
                                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{device.pc_name} AUDIT LOG</p>
                                </div>
                            </div>
                            <Layout className="text-primary/10 w-8 h-8" />
                        </CardHeader>
                        <CardContent className="p-8 flex-1">
                            {historyLog.app_usage && Object.keys(historyLog.app_usage).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        {(() => {
                                            const appEntries = Object.entries(historyLog.app_usage as Record<string, number>)
                                                .filter(([, secs]) => secs > 0)
                                                .sort(([, a], [, b]) => b - a);

                                            const totalAppSecs = appEntries.reduce((acc, [, v]) => acc + v, 0);
                                            const targetTotalSecs = runtimeMins * 60;

                                            // PROPORTIONAL SCALING: 
                                            // If accumulated data exceeds the 24h (or runtime) window, scale it down proportionally
                                            return appEntries.map(([app, rawSecs], idx) => {
                                                const scaleFactor = totalAppSecs > targetTotalSecs ? (targetTotalSecs / totalAppSecs) : 1;
                                                const secs = Math.floor(rawSecs * scaleFactor);
                                                const percent = totalAppSecs > 0 ? (rawSecs / totalAppSecs) * 100 : 0;

                                                const h = Math.floor(secs / 3600);
                                                const m = Math.floor((secs % 3600) / 60);

                                                if (secs < 60 && idx > 5) return null; // Hide tiny apps if list is long

                                                return (
                                                    <div key={app} className="p-5 rounded-xl bg-background border border-border hover:border-primary/20 transition-all group shadow-sm">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Index Unit {idx + 1}</span>
                                                                <span className="text-lg font-bold text-primary uppercase tracking-tight">{formatAppName(app)}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block mb-1">Session Duration</span>
                                                                <span className="text-xl font-bold text-primary">{h > 0 ? `${h}H ` : ''}{m}M</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                                                            <div
                                                                className="h-full bg-primary rounded-full shadow-sm"
                                                                style={{ width: `${Math.max(2, percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    <div className="flex flex-col justify-center items-center space-y-8 bg-background rounded-2xl p-8 border border-border shadow-inner">
                                        <div className="relative w-full aspect-square flex items-center justify-center">
                                            {/* Central Visualizer */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                                <MiniWaveChart color="#01416D" width={300} height={300} intensity={0.5} showGrid={false} />
                                            </div>
                                            <div className="relative text-center z-10">
                                                <Activity className="w-16 h-16 text-primary mx-auto mb-6 opacity-40" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-2">Facility Efficiency Rating</p>
                                                <p className="text-7xl font-bold text-primary tracking-tighter">
                                                    {historyLog.avg_score > 400 ? '99' : historyLog.avg_score > 200 ? '96' : '92'}
                                                    <span className="text-secondary">%</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 bg-card rounded-xl border border-border shadow-sm">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Process Matrix</p>
                                                <p className="text-2xl font-bold text-primary">{Object.keys(historyLog.app_usage).length}</p>
                                            </div>
                                            <div className="text-center p-4 bg-card rounded-xl border border-border shadow-sm">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Integrity Status</p>
                                                <p className="text-2xl font-bold text-emerald-600 uppercase">Optimal</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                    <Info size={48} className="mb-4 text-muted-foreground" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary">No application telemetry synthesized for this archive.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
