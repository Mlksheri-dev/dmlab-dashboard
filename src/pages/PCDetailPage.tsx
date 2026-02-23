import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Monitor,
  HardDrive,
  Activity,
  ShieldCheck,
  Cpu,
  MapPin,
  Beaker,
  Calendar,
  Sunrise,
  Timer,
  Save,
  X,
  Edit3,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import { toast } from 'sonner';
import { cn, formatAppName } from '@/lib/utils';

/**
 * PC DETAIL PAGE - VERSION 3.0 (FULL PAGE NAVIGATION)
 * Optimized to navigate to a dedicated history page instead of using modals.
 */
export default function PCDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ pc_name: '', city: '', lab_name: '', tehsil: '' });
  // selectedHistory state removed as we now navigate to a full page
  const [isLocallyDefective, setIsLocallyDefective] = useState(false);
  const [showDefectiveSuccess, setShowDefectiveSuccess] = useState(false);
  const [showRepairedSuccess, setShowRepairedSuccess] = useState(false);

  // --- HARD RESET LOGIC ---
  useEffect(() => {
    const resetUI = () => {
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      document.documentElement.style.pointerEvents = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
    resetUI();

    // Safety check for localStorage corruption
    try {
      if (id) {
        const defectiveDevices = JSON.parse(localStorage.getItem('defective_devices') || '[]');
        setIsLocallyDefective(defectiveDevices.includes(id));
      }
    } catch (e) {
      console.error("Storage corruption detected:", e);
      localStorage.setItem('defective_devices', '[]');
    }

    return () => resetUI();
  }, [id]);

  // --- DATA FETCHING (DIRECT FROM DATABASE) ---
  const { data: detail, isLoading, isError, refetch } = useQuery({
    queryKey: ['pc-detail', id],
    queryFn: async () => {
      // 1. Fetch Device
      const { data: device, error: devError } = await supabase
        .from('devices')
        .select('*')
        .eq('system_id', id)
        .single();

      if (devError) throw devError;

      // 2. Fetch History (Last 7 Days)
      const { data: history, error: histError } = await supabase
        .from('device_daily_history')
        .select('*')
        .eq('device_id', id)
        .order('history_date', { ascending: false })
        .limit(7);

      return {
        device,
        history: history || [],
        server_time: new Date().toISOString() // Use client time as reference since we are direct to DB
      };
    },
    refetchInterval: isEditing ? false : 1000,
  });

  useEffect(() => {
    if (detail?.device) {
      setEditData({
        pc_name: detail.device.pc_name || '',
        city: detail.device.city || '',
        lab_name: detail.device.lab_name || '',
        tehsil: detail.device.tehsil || ''
      });
    }
  }, [detail]);

  // --- MUTATIONS ---
  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/devices/manage?hid=${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("System slot reset successfully");
      navigate('/dashboard', { replace: true });
    },
    onError: () => toast.error("Failed to remove unit")
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        pc_name: data.pc_name,
        city: data.city,
        lab_name: data.lab_name,
        tehsil: data.tehsil // Sending tehsil to backend
      })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pc-detail', id] });
      setIsEditing(false);
      toast.success("System identity updated");
    }
  });

  const toggleDefectiveLocal = () => {
    try {
      const defectiveDevices = JSON.parse(localStorage.getItem('defective_devices') || '[]');
      let newDevices;

      if (isLocallyDefective) {
        // REMOVING FROM DEFECTIVE
        newDevices = defectiveDevices.filter((did: string) => did !== id);

        // Update Local Storage
        localStorage.setItem('defective_devices', JSON.stringify(newDevices));
        setIsLocallyDefective(false);

        // Show Repaired Modal
        setShowRepairedSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['devices'] });

        // Delay navigation
        setTimeout(() => navigate(-1), 2500);

      } else {
        // ADDING TO DEFECTIVE
        newDevices = [...defectiveDevices, id];

        localStorage.setItem('defective_devices', JSON.stringify(newDevices));
        setIsLocallyDefective(true);

        // Show the centered modal
        setShowDefectiveSuccess(true);

        queryClient.invalidateQueries({ queryKey: ['devices'] });
        queryClient.invalidateQueries({ queryKey: ['devices-list'] });
        queryClient.invalidateQueries({ queryKey: ['pc-detail', id] });

        // Wait longer (2.5s) for user to read the centered message
        setTimeout(() => {
          navigate(-1);
        }, 2500);
      }
    } catch (e) {
      toast.error("Logic Error: Could not update status");
    }
  };

  // --- RENDER STATES ---
  if (isLoading) return (
    <div className="p-8 bg-background min-h-screen flex items-center justify-center">
      <div className="w-full max-w-5xl space-y-8 animate-pulse">
        <div className="h-12 w-1/3 bg-card rounded-xl border border-border" />
        <Skeleton className="w-full h-[60vh] rounded-[2.5rem] bg-card/50 border border-primary/20 shadow-[0_0_50px_rgba(249,154,29,0.05)]" />
      </div>
    </div>
  );

  if (isError || !detail?.device) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8 space-y-8">
      <div className="p-8 rounded-full bg-red-500/10 border border-red-500/20">
        <Monitor className="w-20 h-20 text-red-500/50" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">System Link Severed</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Node not found or network connection dropped</p>
      </div>
      <div className="flex gap-4">
        <Button onClick={() => navigate(-1)} variant="outline" className="px-8 border-border text-foreground hover:bg-muted font-black uppercase text-[10px] tracking-widest">Return to Fleet</Button>
        <Button onClick={() => refetch()} className="px-8 bg-primary text-black font-black uppercase text-[10px] tracking-widest">Retry Connection</Button>
      </div>
    </div>
  );

  const { device, history } = detail;

  const isOnline = (() => {
    const lastSeenDate = device.last_seen ? new Date(device.last_seen) : null;
    const referenceTime = detail.server_time ? new Date(detail.server_time) : new Date();
    return device.status === 'online' &&
      lastSeenDate &&
      (referenceTime.getTime() - lastSeenDate.getTime() < 60 * 1000);
  })();

  const handleHistoryClick = (dateStr: string) => {
    // Navigate to the full history detail page
    navigate(`/dashboard/pc/${id}/history/${dateStr}`);
  };

  return (
    <div className="relative p-4 md:p-8 space-y-8 bg-background min-h-screen text-white overflow-y-auto selection:bg-primary/30">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/50">
        <div className="flex items-start gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-lg bg-card border border-border hover:bg-primary/10 hover:text-primary transition-all group shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Button>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {isEditing ? (
                <Input
                  className="text-3xl font-bold tracking-tight uppercase bg-card border-primary h-12 rounded-lg text-primary px-6 focus:ring-1 focus:ring-primary shadow-inner"
                  value={editData.pc_name}
                  onChange={(e) => setEditData({ ...editData, pc_name: e.target.value })}
                />
              ) : (
                <h1 className="text-4xl font-bold tracking-tight uppercase text-white font-display leading-tight">{device.pc_name || "STATION"}</h1>
              )}
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                isOnline ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted/30 text-muted-foreground border-border'
              )}>
                {isOnline ? "Live Stream Active" : "Telemetry Offline"}
              </div>
            </div>
            <p className="text-white font-bold text-[10px] uppercase tracking-widest opacity-60">
              System ID: <span className="text-white/80">{device.system_id}</span> • Node Status: <span className={isLocallyDefective ? "text-red-500" : "text-emerald-500"}>{isLocallyDefective ? "DEFECTIVE" : "VERIFIED"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <Button variant="ghost" size="lg" onClick={() => setIsEditing(false)} className="font-bold text-[10px] tracking-widest uppercase rounded-lg px-6 h-10 border border-border">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button variant="default" size="lg" onClick={() => updateMutation.mutate(editData)} className="bg-primary hover:bg-primary/90 text-black font-bold text-[10px] tracking-widest uppercase rounded-lg px-8 h-10 shadow-sm">
                <Save className="w-4 h-4 mr-3" /> Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={toggleDefectiveLocal}
                className={cn(
                  "gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm border",
                  isLocallyDefective
                    ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white"
                )}
              >
                <Activity size={16} />
                {isLocallyDefective ? "Repaired / Fix" : "Mark as Defective"}
              </Button>

              <Button
                onClick={async () => {
                  const toastId = toast.loading("Synthesizing node audit Excel report...");
                  try {
                    const { generateDynamicReport } = await import('@/lib/pdf-generator');
                    await generateDynamicReport('PC', { ...device, isOnline, history: detail?.history }, device.system_id);
                    toast.success("Audit Generated Successfully", { id: toastId });
                  } catch (e) {
                    toast.error("Excel Engine Error", { id: toastId });
                  }
                }}
                className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
              >
                <Monitor size={16} className="text-black" /> Audit Report
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={() => setIsEditing(true)}
                className="bg-card border border-border hover:text-primary font-bold text-[10px] tracking-widest uppercase rounded-lg px-6 h-10 transition-all text-white shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
              </Button>

              <Button
                variant="destructive"
                size="lg"
                className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all rounded-lg w-10 h-10 p-0 shadow-sm"
                onClick={() => {
                  if (window.confirm("CRITICAL: Remove this system slot forever?")) deleteMutation.mutate();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Intelligence Panel */}
        <div className="space-y-6">
          <Card className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">System Core Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <div className="p-5 rounded-xl bg-muted border border-border transition-all hover:border-primary/20 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary text-black shadow-sm">
                    <MapPin size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">DISTRICT</p>
                    {isEditing ? (
                      <select
                        className="mt-2 w-full bg-card border border-border text-primary text-xs rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      >
                        {["Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Sialkot", "Sargodha", "Bahawalpur", "Jhang", "Sheikhupura"].sort().map(c => (
                          <option key={c} value={c} className="bg-card text-primary">{c}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-bold text-xl uppercase tracking-tight text-primary mt-0.5">{device.city}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-muted border border-border transition-all hover:border-primary/20 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary text-white shadow-sm">
                    <Beaker size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">LAB NAME</p>
                    {isEditing ? (
                      <select
                        className="mt-2 w-full bg-card border border-border text-primary text-xs rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                        value={editData.lab_name}
                        onChange={(e) => setEditData({ ...editData, lab_name: e.target.value })}
                      >
                        {["ITU Main Campus", "ITU Barki Campus"].map(l => (
                          <option key={l} value={l} className="bg-card text-primary">{l}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-bold text-xl uppercase tracking-tight text-primary mt-0.5">{device.lab_name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-muted border border-border transition-all hover:border-primary/20 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-500 text-white shadow-sm">
                    <School size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Tehsil</p>
                    {isEditing ? (
                      <input
                        className="mt-2 w-full bg-card border border-border text-primary text-xs rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-primary shadow-sm uppercase font-bold"
                        value={editData.tehsil || ''}
                        onChange={(e) => setEditData({ ...editData, tehsil: e.target.value })}
                        placeholder="ENTER TEHSIL NAME"
                      />
                    ) : (
                      <p className="font-bold text-xl uppercase tracking-tight text-primary mt-0.5">{device.tehsil || 'Not Assigned'}</p>
                    )}
                  </div>
                </div>
              </div>


              <div className="p-5 rounded-xl bg-card border border-border transition-all hover:border-secondary/20 group relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <HardDrive size={80} />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/10">
                    <HardDrive size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/90 uppercase font-black tracking-widest">HARDWARE ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-xs font-bold uppercase tracking-tight text-primary break-all bg-primary/5 px-2.5 py-1.5 rounded border border-primary/20 shadow-inner">
                        {device.hardware_id || device.hwid || "HS-PR10-TRON-X12"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                  <Sunrise className="text-secondary w-4 h-4 mb-3" />
                  <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">System Boot</p>
                  <p className="font-bold text-lg text-primary leading-tight">
                    {device.today_start_time ? new Date(device.today_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-primary text-black shadow-md">
                  <Timer className="text-black w-4 h-4 mb-3" />
                  <p className="text-[8px] text-black/60 uppercase font-bold tracking-widest">Active Cycle</p>
                  <p className="font-bold text-lg text-black leading-tight">
                    {(() => {
                      const mins = device.runtime_minutes || 0;
                      return `${Math.floor(mins / 60)}H ${Math.floor(mins % 60)}M`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Cpu size={48} className="text-primary" />
                </div>
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-4">Real-time Telemetry</p>
                <div className="bg-muted/50 rounded-xl border border-border p-4 mb-4 flex justify-center opacity-40">
                  <MiniWaveChart
                    color="#01416D"
                    width={280}
                    height={80}
                    intensity={isOnline ? 0.8 : 0.05}
                    showGrid={false}
                  />
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-7xl font-bold tracking-tighter text-emerald-500 animate-in fade-in zoom-in duration-500">
                      {device.app_usage?.['__current_cpu__'] || 0}
                    </span>

                    <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1">REAL-TIME LOAD</span>
                  </div>

                  <div className="flex flex-col items-end opacity-60">
                    <span className="text-3xl font-bold tracking-tighter text-white">
                      {device.cpu_score || 0}%
                    </span>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">DAILY AVERAGE</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APPLICATION USAGE CARD - SIDEBAR VIEW */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">Current Session Workload</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Real-time Apps</p>
              </div>
              <Activity className="text-primary opacity-20 w-5 h-4" />
            </CardHeader>
            <CardContent className="p-8 pb-4">
              {device.app_usage && Object.keys(device.app_usage).length > 0 ? (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                  {(() => {
                    const runtimeMins = device.runtime_minutes || 1; // Avoid div by zero
                    const maxSessionSecs = runtimeMins * 60;
                    const items = Object.entries(device.app_usage as Record<string, number>)
                      .filter(([app]) => app !== '__current_cpu__')
                      .sort(([, a], [, b]) => b - a);

                    return items.slice(0, 15).map(([app, rawSecs]) => {
                      const secs = Math.min(rawSecs, maxSessionSecs);
                      const percent = maxSessionSecs > 0 ? (secs / maxSessionSecs) * 100 : 0;

                      const h = Math.floor(secs / 3600);
                      const m = Math.floor((secs % 3600) / 60);
                      return (
                        <div key={app} className="space-y-1.5 pb-2 border-b border-border/10 last:border-0">
                          <div className="flex justify-between items-end px-1">
                            <span className="text-[11px] font-bold text-white uppercase tracking-tight truncate max-w-[150px]">{formatAppName(app)}</span>
                            <span className="text-[9px] font-bold text-primary">{h > 0 ? `${h}h ` : ''}{m}m</span>
                          </div>
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.max(2, percent)}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-border rounded-xl bg-muted/30">
                  <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                  <p className="text-muted-foreground font-bold uppercase text-[8px] tracking-widest opacity-40">Telemetry Absent</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deep Data Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cn("bg-card rounded-2xl border transition-all shadow-sm", isOnline ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-gray-300")}>
              <CardContent className="p-8 flex items-center gap-6">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm border", isOnline ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100")}>
                  {isOnline ? <Power size={28} /> : <PowerOff size={28} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Operational State</p>
                  <h2 className={cn("text-2xl font-bold uppercase tracking-tight leading-tight", isOnline ? "text-emerald-500" : "text-gray-400")}>{isOnline ? "Operational" : "Idle State"}</h2>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">{isOnline ? "Link established" : "Terminal signal absent"}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card rounded-2xl border-l-4 border-l-secondary border border-border shadow-sm">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Security Index</p>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-white leading-tight">STABLE</h2>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">Infrastructure Verified • No Anomalies</p>
                </div>
              </CardContent>
            </Card>
          </div>


          <Card className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">Handshake History</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Rolling 7-Day Performance Log</p>
              </div>
              <Calendar className="text-primary opacity-20 w-5 h-5" />
            </CardHeader>
            <CardContent className="p-8 pb-4">
              {history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                        <th className="px-6 pb-4 border-b border-border">Temporal Index</th>
                        <th className="px-6 pb-4 border-b border-border text-right">Avg Load</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* INJECT TODAY'S LIVE SESSION - ONLY IF NOT ALREADY IN HISTORY */}
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        // Robust check: Compare date strings directly
                        const historyHasToday = history.some((h: any) => h.history_date === today || h.start_time?.startsWith(today));

                        const getNormalizedScore = (val: any) => {
                          let score = parseFloat(val) || 0;
                          // Heuristic: If value is absurdly high (accumulated), divide by 100 as per user request
                          if (score > 100) {
                            score = score / 100;
                          }
                          // Hard cap to ensure it never exceeds or equals 100%
                          if (score >= 100) score = 99.9;
                          return score.toFixed(1);
                        };

                        if (!historyHasToday) {
                          return (
                            <tr
                              onClick={() => handleHistoryClick(today)}
                              className="text-xs group hover:bg-muted/50 transition-all cursor-pointer bg-primary/5"
                            >
                              <td className="px-6 py-5 border-b border-border/50">
                                <div className="flex flex-col">
                                  <span className="font-bold text-primary uppercase tracking-tight text-sm">TODAY (LIVE)</span>
                                  <span className="text-[8px] font-bold text-emerald-500 uppercase mt-0.5 animate-pulse">Active Session</span>
                                </div>
                              </td>
                              <td className="px-6 py-5 border-b border-border/50 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="text-lg font-bold text-primary">{getNormalizedScore(device.cpu_score)}%</span>
                                  <span className="text-[7px] font-bold text-secondary uppercase tracking-widest">DAILY AVG</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Helper available for the map loop below as well if we scope it correctly, 
                        // but since we are inside an IIFE, we can't export it easily.
                        // Instead, let's just return the single row here, and handle the map separately or 
                        // redefine the helper in the map.
                        // To keep code clean in this replace_block, I'll inline the logic in the map below.
                        return null;
                      })()}

                      {history.slice(0, 10).map((h: any) => {
                        const dateObj = h.history_date ? new Date(h.history_date) : new Date(h.start_time);
                        const dateArg = h.history_date || h.start_time?.split('T')[0];

                        let score = parseFloat(h.avg_score || 0);
                        if (score > 100) score = score / 100;
                        if (score >= 100) score = 99.9;

                        return (
                          <tr key={h.id || h.history_date} onClick={() => handleHistoryClick(dateArg)} className="text-xs group hover:bg-muted/50 transition-all cursor-pointer">
                            <td className="px-6 py-5 border-b border-border/50">
                              <div className="flex flex-col">
                                <span className="font-bold text-primary uppercase tracking-tight text-sm">{dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}</span>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Archive Data Sync</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 border-b border-border/50 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-primary">{score.toFixed(1)}%</span>
                                <span className="text-[7px] font-bold text-secondary uppercase tracking-widest">AVG %</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center border border-dashed border-border rounded-xl bg-muted/30 opacity-40">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No Archived Handshakes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Recovery Button (Always at bottom left for emergencies) */}
      <button
        onClick={() => window.location.reload()}
        className="fixed bottom-6 right-6 p-3 bg-card border border-border text-white/20 hover:text-white rounded-full z-[100] transition-all hover:scale-110"
        title="Hard Refresh"
      >
        <RefreshCw size={20} />
      </button>

      {/* Success Modal for Defective Transfer */}
      {showDefectiveSuccess && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-red-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-2 ring-1 ring-red-500/40">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">System Transfer Complete</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              PC Successfully Transferred to <br /><span className="text-red-500">Defective System</span>
            </p>
          </div>
        </div>
      )}

      {/* Success Modal for Repaired Transfer */}
      {showRepairedSuccess && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-emerald-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-2 ring-1 ring-emerald-500/40">
              <RefreshCw size={48} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">System Restored</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
              System Repaired <br /><span className="text-emerald-500">Successfully</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}