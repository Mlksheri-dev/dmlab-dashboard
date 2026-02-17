import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
    ArrowLeft,
    Clock,
    Activity,
    Calendar,
    Timer,
    Monitor,
    MousePointer,
    AlertCircle,
    CheckCircle2,
    LayoutGrid,
    Laptop,
    Hourglass,
    Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAppName, parseUTC } from '@/lib/utils';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PCHistoryDetailPage() {
    const { id, date } = useParams();
    const navigate = useNavigate();

    const { data: detail, isLoading } = useQuery({
        queryKey: ['pc-detail', id],
        queryFn: () => apiFetch(`/devices/${id}`),
    });

    if (isLoading) return <div className="p-8 bg-background min-h-screen"><Skeleton className="h-full w-full rounded-[2.5rem] bg-card/50" /></div>;

    if (!detail?.device) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center space-y-6">
            <AlertCircle className="w-20 h-20 text-muted-foreground/50" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Report Not Found</h1>
            <Button onClick={() => navigate(-1)} variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">Return</Button>
        </div>
    );

    const { device, history } = detail;
    const isToday = date === new Date().toISOString().split('T')[0];

    // Helper: Get previous date YYYY-MM-DD
    const getPreviousDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    };

    // Find the log for the requested date
    const historyLog = history?.find((h: any) => (h.history_date || h.start_time?.split('T')[0]) === date) || (isToday ? {
        history_date: date,
        avg_score: device.cpu_score,
        runtime_minutes: device.runtime_minutes,
        start_time: device.today_start_time,
        end_time: device.today_last_active,
        app_usage: device.app_usage || {}
    } : null);

    // Find Previous Log for Delta Calculation
    const prevDate = getPreviousDate(date);
    const prevLog = history?.find((h: any) => (h.history_date || h.start_time?.split('T')[0]) === prevDate);

    if (!historyLog) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center space-y-6">
            <Calendar className="w-20 h-20 text-muted-foreground/50" />
            <h1 className="text-3xl font-bold text-foreground tracking-tight">No Data Recorded</h1>
            <p className="text-muted-foreground">There is no activity log for {date}</p>
            <Button onClick={() => navigate(-1)} variant="outline" className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">Back to Device</Button>
        </div>
    );

    // --- DELTA CALCULATION LOGIC ---
    const rawRuntime = historyLog.runtime_minutes || 0;
    const prevRuntime = prevLog?.runtime_minutes || 0;

    // Calculate Net Runtime
    let netRuntimeMins = rawRuntime;

    // If raw is huge (> 24h), assume cumulative and try diff
    if (rawRuntime > 1450) { // 1440 + buffer
        if (prevLog && rawRuntime >= prevRuntime) {
            netRuntimeMins = rawRuntime - prevRuntime;
        } else {
            netRuntimeMins = Math.min(1440, rawRuntime);
        }
    }

    // Double clamp result to 24h to be safe for a Daily Report
    netRuntimeMins = Math.min(1440, netRuntimeMins);

    const startTime = historyLog.start_time || (isToday ? device.today_start_time : null);
    const endTime = historyLog.end_time || (isToday ? (device.today_last_active || device.last_seen) : null);

    const formatTime = (timeStr: string | null, fallback: string) => {
        if (!timeStr) return fallback;
        const d = parseUTC(timeStr);
        return isNaN(d.getTime()) ? fallback : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/30 pb-20 overflow-x-hidden">
            {/* Top Navigation Bar */}
            <div className="max-w-7xl mx-auto px-6 py-6 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                            Daily Activity Report
                            <Badge variant="outline" className="text-xs font-normal border-border text-muted-foreground">{date}</Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium tracking-wide">
                            {device.pc_name} • {device.lab_name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 transition-colors cursor-default">
                        {isToday ? 'Live Session' : 'Archived Log'}
                    </Badge>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* HERO STATS ROW - UPDATED TO 2 CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border backdrop-blur-sm p-6 flex flex-col justify-between group hover:bg-muted/50 transition-colors">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Monitoring Started</p>
                            <span className="text-4xl font-bold text-foreground tracking-tighter">{formatTime(startTime, '08:00 AM')}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span>First activity detected</span>
                        </div>
                    </Card>

                    <Card className="bg-card border-border backdrop-blur-sm p-6 flex flex-col justify-between group hover:bg-muted/50 transition-colors">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Monitoring Ended</p>
                            <span className="text-4xl font-bold text-foreground tracking-tighter">{formatTime(endTime, isToday ? 'Live' : 'Unknown')}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                            <span>Latest signal received</span>
                        </div>
                    </Card>
                </div>


                {/* MAIN CONTENT: APP USAGE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Visual Chart Column (Optional, can be smaller) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-card border-border flex flex-col overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-primary" />
                                    System Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 relative z-10">
                                <div className="relative w-48 h-48">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <MiniWaveChart color="#6366f1" width={180} height={100} intensity={1.2} showGrid={false} />
                                    </div>
                                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-border animate-[spin_60s_linear_infinite]" />
                                    <div className="absolute inset-4 rounded-full border border-border opacity-50" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2"> optimal</h3>
                                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                                        User activity patterns indicate normal usage behavior. No idle anomalies detected.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Logic Grid */}
                    <div className="lg:col-span-8">
                        <Card className="bg-card border-border min-h-[600px] flex flex-col">
                            <CardHeader className="border-b border-border pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                                            <LayoutGrid className="w-5 h-5 text-primary" />
                                            Application Usage Matrix
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">Detailed breakdown of time spent in active applications (24H View)</p>
                                    </div>
                                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                        {Object.keys(historyLog.app_usage || {}).length} APPS
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {historyLog.app_usage && Object.keys(historyLog.app_usage).length > 0 ? (
                                    <div className="grid grid-cols-1 gap-px bg-muted/20">
                                        {(() => {
                                            const appList = Object.entries(historyLog.app_usage as Record<string, number>)
                                                .map(([app, rawSecs]) => {
                                                    // --- CALC NET USAGE (DELTA) ---
                                                    const prevAppSecs = prevLog?.app_usage?.[app] || 0;
                                                    let netSecs = rawSecs;

                                                    // If lifetime usage increases, take the diff.
                                                    if (rawSecs >= prevAppSecs && prevAppSecs > 0) {
                                                        netSecs = rawSecs - prevAppSecs;
                                                    }

                                                    // Clamp to daily active limit
                                                    const dayActiveLimit = Math.max(1, (netRuntimeMins || 1440) * 60);
                                                    netSecs = Math.min(netSecs, dayActiveLimit);

                                                    return { app, netSecs, rawSecs };
                                                })
                                                // FILTER: Show only apps used for at least > 10s today
                                                .filter(item => item.netSecs > 10)
                                                .sort((a, b) => b.netSecs - a.netSecs);

                                            if (appList.length === 0) return <div className="col-span-2 p-12 text-center text-muted-foreground">No active application usage recorded for this date.</div>;

                                            return appList.map(({ app, netSecs }) => {
                                                // Calculate Bar Percentage relative to Active Time
                                                const dayActiveLimit = Math.max(1, (netRuntimeMins || 1440) * 60);
                                                const percent = (netSecs / dayActiveLimit) * 100;

                                                // Calculate HH:MM
                                                const h = Math.floor(netSecs / 3600);
                                                const m = Math.floor((netSecs % 3600) / 60);
                                                const s = Math.floor(netSecs % 60);

                                                // Format: "2 hr 15 min" or "45 min" or "30 sec"
                                                let timeString = "";
                                                if (h > 0) timeString += `${h} hr `;
                                                if (m > 0) timeString += `${m} min `;
                                                if (h === 0 && m === 0) timeString = `${s} sec`;

                                                return (
                                                    <div key={app} className="bg-transparent p-5 hover:bg-muted/10 transition-all border-b border-r border-border/40 group relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                                        <div className="flex items-start justify-between mb-3 gap-4">
                                                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                                                <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                                                    <Laptop className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-foreground truncate max-w-[180px] group-hover:text-primary transition-colors capitalize" title={app}>
                                                                        {formatAppName(app)}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 group-hover:text-foreground/70 truncate" title={app}>
                                                                        Process: {app.substring(0, 15)}...
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                                    {timeString}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full transition-all duration-1000 group-hover:brightness-125"
                                                                    style={{ width: `${Math.max(2, percent)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                                        <Monitor className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-sm font-medium">No active usage recorded.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
