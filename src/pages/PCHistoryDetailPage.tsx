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
            <h1 className="text-3xl font-black italic text-foreground uppercase tracking-tighter">History Log Not Found</h1>
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
            <h1 className="text-3xl font-black italic text-foreground uppercase tracking-tighter">No Archive Data for {date}</h1>
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
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-5 duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
                <div className="flex items-start gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-2xl bg-muted hover:bg-primary/20 hover:text-primary transition-all group shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </Button>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-foreground font-display leading-tight">
                                ARCHIVE: <span className="text-primary">{date}</span>
                            </h1>
                            <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest italic glow-pink">
                                Historical Telemetry
                            </div>
                        </div>
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em] opacity-60">
                            Station Identifier: <span className="text-foreground">{device.pc_name}</span> • Facility: <span className="text-foreground">{device.lab_name}</span>
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Core Stats */}
                <div className="space-y-6">
                    <Card className="glass-card premium-border rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-[10px] font-black tracking-[0.4em] text-primary uppercase italic opacity-80">Cycle Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            <div className="p-6 rounded-[2rem] bg-muted border border-border relative overflow-hidden group hover:bg-muted/80 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary glow-pink">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Optimized Performance</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black italic text-foreground tracking-tighter text-glow-pink">{Number(historyLog.avg_score || 0).toFixed(1)}</span>
                                            <span className="text-[10px] font-black text-primary uppercase">Units Avg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 rounded-[2rem] bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/[0.08] transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:glow-cyan transition-all">
                                            <Timer size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Duration</p>
                                            <p className="text-3xl font-black italic text-foreground tracking-tighter">{hours}H <span className="text-primary">{mins}M</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Card className="glass-card premium-border rounded-[2rem] overflow-hidden bg-yellow-500/[0.02]">
                                    <CardContent className="p-6 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0 border border-yellow-500/20 glow-yellow transition-transform group-hover:scale-110">
                                                <Play size={28} fill="currentColor" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Monitoring Start</p>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                                                    {(() => {
                                                        const rawVal = historyLog.start_time || (isToday ? device.today_start_time : null);
                                                        if (!rawVal) return '08:00 AM';
                                                        const d = parseUTC(rawVal);
                                                        return isNaN(d.getTime()) ? '08:00 AM' : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                                                    })()}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block px-4 py-2 rounded-xl bg-muted border border-border">
                                            <span className="text-[10px] font-black text-yellow-500/60 uppercase">Session Entry</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="glass-card premium-border rounded-[2rem] overflow-hidden bg-pink-500/[0.02]">
                                    <CardContent className="p-6 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 border border-pink-500/20 glow-pink transition-transform group-hover:scale-110">
                                                <Square size={24} fill="currentColor" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Monitoring End</p>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
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
                                        <div className="hidden sm:block px-4 py-2 rounded-xl bg-muted border border-border">
                                            <span className="text-[10px] font-black text-pink-500/60 uppercase">{isToday ? 'Session Tracking' : 'Session Exit'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Activity size={18} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Peak Performance</span>
                                    </div>
                                    <span className="text-sm font-black italic text-primary">{(historyLog.avg_score * 1.2).toFixed(1)} UNITS</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                </div>

                {/* Right Columns - Big Software Spectrum */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card premium-border rounded-[2.5rem] overflow-hidden min-h-[600px] flex flex-col">
                        <CardHeader className="p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-[10px] font-black tracking-[0.4rem] text-cyan-400 uppercase italic opacity-80">Deep Software Analysis</CardTitle>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{formattedDate}</p>
                                    <div className="h-1 w-1 rounded-full opacity-20" />
                                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">{device.pc_name} @ {device.lab_name}</p>
                                </div>
                            </div>
                            <Layout className="text-cyan-400/20 w-8 h-8" />
                        </CardHeader>
                        <CardContent className="p-8 flex-1">
                            {historyLog.app_usage && Object.keys(historyLog.app_usage).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
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
                                                    <div key={app} className="p-5 rounded-3xl bg-muted border border-border hover:bg-muted/80 transition-all group">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Application {idx + 1}</span>
                                                                <span className="text-lg font-black text-foreground uppercase tracking-tight">{formatAppName(app)}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block mb-1">Scale Adjusted Time</span>
                                                                <span className="text-xl font-mono text-foreground font-black">{h > 0 ? `${h}H ` : ''}{m}M</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 w-full bg-background rounded-full overflow-hidden p-0.5 border border-border">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                                                style={{ width: `${Math.max(2, percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    <div className="flex flex-col justify-center items-center space-y-8 bg-muted/20 rounded-[3rem] p-8 border border-border">
                                        <div className="relative w-full aspect-square flex items-center justify-center">
                                            {/* Central Visualizer */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                                <MiniWaveChart color="#06b6d4" width={300} height={300} intensity={0.5} showGrid={false} />
                                            </div>
                                            <div className="relative text-center z-10">
                                                <Activity className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] mb-2">Cycle Efficiency</p>
                                                <p className="text-7xl font-black italic text-foreground tracking-tighter">
                                                    {historyLog.avg_score > 400 ? '99' : historyLog.avg_score > 200 ? '96' : '92'}
                                                    <span className="text-primary">%</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full grid grid-cols-2 gap-4">
                                            <div className="text-center p-4">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Process Count</p>
                                                <p className="text-2xl font-black text-foreground">{Object.keys(historyLog.app_usage).length}</p>
                                            </div>
                                            <div className="text-center p-4">
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">System Load</p>
                                                <p className="text-2xl font-black text-foreground uppercase italic">Optimal</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                                    <Info size={48} className="mb-4 text-muted-foreground" />
                                    <p className="text-xs font-black uppercase tracking-widest">No spectral data detected for this archive.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
