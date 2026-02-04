import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft,
  Monitor,
  HardDrive,
  Activity,
  ShieldCheck,
  Cpu,
  MapPin,
  Beaker,
  Clock,
  Calendar,
  Sunrise,
  Timer,
  Save,
  X,
  Edit3,
  Trash2,
  Power,
  PowerOff,
  Layout,
  Smartphone,
  Info,
  History,
  Sunset
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import { toast } from 'sonner';
import { cn, formatAppName } from '@/lib/utils';

export default function PCDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ pc_name: '', city: '', lab_name: '' });
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['pc-detail', id],
    queryFn: () => apiFetch(`/devices/${id}`),
    refetchInterval: isEditing ? false : 30000,
    staleTime: 5000,
    gcTime: 60000
  });

  useEffect(() => {
    if (detail?.device) {
      setEditData({
        pc_name: detail.device.pc_name,
        city: detail.device.city,
        lab_name: detail.device.lab_name
      });
    }
  }, [detail]);

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/devices/manage?hid=${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success("System slot reset successfully");
      navigate('/dashboard');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pc-detail', id] });
      setIsEditing(false);
      toast.success("System identity updated");
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-screen rounded-[2.5rem]" /></div>;
  if (!detail?.device) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-6">
      <Monitor className="w-20 h-20 text-foreground opacity-5" />
      <h1 className="text-3xl font-black italic text-foreground uppercase tracking-tighter">System Offline / Not Found</h1>
      <Button onClick={() => navigate(-1)} className="premium-border glass-card px-8 text-foreground">Return to Fleet</Button>
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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in zoom-in-95 duration-700">
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
              {isEditing ? (
                <Input
                  className="text-4xl font-black italic tracking-tighter uppercase bg-muted border-primary h-14 rounded-2xl text-foreground px-6 focus:ring-primary/20"
                  value={editData.pc_name}
                  onChange={(e) => setEditData({ ...editData, pc_name: e.target.value })}
                />
              ) : (
                <h1 className="text-5xl font-black italic tracking-tighter uppercase text-foreground font-display leading-tight">{device.pc_name || "STATION"}</h1>
              )}
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic shadow-2xl",
                isOnline ? 'bg-cyan-500/20 text-cyan-400 glow-cyan border border-cyan-500/30' : 'bg-pink-500/20 text-pink-400 glow-pink border border-pink-500/30'
              )}>
                {isOnline ? "Live Stream Active" : "Telemetry Offline"}
              </div>
            </div>
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em] opacity-60">
              Network Identifier: <span className="text-foreground">{device.system_id}</span> • Architecture: <span className="text-foreground">x86_64</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isEditing ? (
            <>
              <Button variant="ghost" size="lg" onClick={() => setIsEditing(false)} className="font-black text-[10px] tracking-widest uppercase rounded-2xl px-6">
                <X className="w-4 h-4 mr-2" /> Abort
              </Button>
              <Button variant="default" size="lg" onClick={() => updateMutation.mutate(editData)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] tracking-widest uppercase rounded-2xl px-8 shadow-2xl glow-pink">
                <Save className="w-4 h-4 mr-3" /> Execute Update
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={async () => {
                  const toastId = toast.loading("Synthesizing node audit PDF...");
                  try {
                    const { generateDynamicReport } = await import('@/lib/pdf-generator');
                    await generateDynamicReport('PC', {
                      ...device,
                      isOnline,
                      session_count: detail?.session_count
                    }, device.system_id);
                    toast.success("Audit Generated Successfully", { id: toastId });
                  } catch (e) {
                    console.error(e);
                    toast.error("Failed to generate audit PDF", { id: toastId });
                  }
                }}
                className="bg-primary hover:bg-primary/90 text-white gap-2 px-6 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest transition-all group shadow-2xl glow-pink mr-4"
              >
                <Monitor size={16} className="text-white group-hover:scale-110 transition-transform" />
                generate system pdf
              </Button>


              <Button variant="ghost" size="lg" onClick={() => setIsEditing(true)} className="bg-muted border border-border hover:bg-muted/80 font-black text-[10px] tracking-widest uppercase rounded-2xl px-6 italic transition-all text-foreground">
                <Edit3 className="w-4 h-4 mr-3" /> Reconfigure
              </Button>

              <Button
                variant="destructive"
                size="lg"
                className="bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500 hover:text-white transition-all font-black text-[10px] tracking-widest uppercase rounded-2xl px-6 italic"
                onClick={() => {
                  if (window.confirm("CRITICAL: De-register this hardware from the network?")) deleteMutation.mutate();
                }}
              >
                <Trash2 className="w-4 h-4 mr-3" /> Terminate Node
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Intelligence Panel */}
        <div className="space-y-6">
          <Card className="glass-card premium-border rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-black tracking-[0.4em] text-primary uppercase italic opacity-80">Registry Core</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-4">
              <div className="p-5 rounded-[1.5rem] bg-muted border border-border transition-all hover:bg-muted/80 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:glow-pink transition-all">
                    <MapPin size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Node Region</p>
                    {isEditing ? (
                      <select
                        className="mt-2 w-full bg-black/40 border border-primary/40 text-white text-xs rounded-xl p-3 outline-none"
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      >
                        {["Ahmadpur East", "Ahmed Nager Chatha", "Ali Pur", "Arifwala", "Attock", "Bhalwal", "Bahawalnagar", "Bahawalpur", "Bhakkar", "Burewala", "Chillianwala", "Chakwal", "Chichawatni", "Chiniot", "Chishtian", "Daska", "Darya Khan", "Dera Ghazi Khan", "Dhaular", "Dina", "Dinga", "Dipalpur", "Faisalabad", "Fateh Jang", "Ghakhar Mandi", "Gojra", "Gujar Khan", "Gujranwala", "Gujrat", "Hafizabad", "Haroonabad", "Hasilpur", "Haveli Lakha", "Jauharabad", "Jhang", "Jhelum", "Kalabagh", "Karor Lal Esan", "Kasur", "Kamalia", "Kamoke", "Khanewal", "Khanpur", "Kharian", "Khushab", "Kot Adu", "Lahore", "Lalamusa", "Layyah", "Liaquat Pur", "Lodhran", "Malakwal", "Mamoori", "Mailsi", "Mandi Bahauddin", "Mian Channu", "Mianwali", "Multan", "Murree", "Muridke", "Mianwali Bangla", "Muzaffargarh", "Narowal", "Okara", "Renala Khurd", "Pakpattan", "Pattoki", "Pir Mahal", "Qila Didar Singh", "Rabwah", "Raiwind", "Rajanpur", "Rahim Yar Khan", "Rawalpindi", "Sadiqabad", "Safdarabad", "Sahiwal", "Sangla Hill", "Sarai Alamgir", "Sargodha", "Shakargarh", "Sheikhupura", "Sialkot", "Sohawa", "Soianwala", "Siranwali", "Talagang", "Taxila", "Toba Tek Singh", "Vehari", "Wah Cantonment", "Wazirabad"].sort().map(c => (
                          <option key={c} value={c} className="bg-popover text-foreground">{c}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-black text-xl italic uppercase tracking-tighter text-foreground mt-0.5">{device.city}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-[1.5rem] bg-muted border border-border transition-all hover:bg-muted/80 group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-secondary/10 text-secondary group-hover:glow-purple transition-all">
                    <Beaker size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Facility Cluster</p>
                    {isEditing ? (
                      <select
                        className="mt-2 w-full bg-background border border-secondary/40 text-foreground text-xs rounded-xl p-3 outline-none"
                        value={editData.lab_name}
                        onChange={(e) => setEditData({ ...editData, lab_name: e.target.value })}
                      >
                        {["ITU Main Campus", "ITU Barki Campus"].map(l => (
                          <option key={l} value={l} className="bg-popover text-foreground">{l}</option>
                        ))}

                      </select>
                    ) : (
                      <p className="font-black text-xl italic uppercase tracking-tighter text-foreground mt-0.5">{device.lab_name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-[1.5rem] bg-cyan-500/5 border border-cyan-500/10">
                  <Sunrise className="text-cyan-400 w-4 h-4 mb-3" />
                  <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">System Boot</p>
                  <p className="font-black text-lg italic text-foreground leading-tight">
                    {device.today_start_time ? new Date(device.today_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </p>
                </div>
                <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 shadow-2xl">
                  <Timer className="text-primary w-4 h-4 mb-3" />
                  <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Active Cycle</p>
                  <p className="font-black text-lg italic text-foreground leading-tight">
                    {(() => {
                      const mins = device.runtime_minutes || 0;
                      const hours = Math.floor(mins / 60);
                      const remMins = Math.floor(mins % 60);
                      return `${hours}H ${remMins}M`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-[1.5rem] bg-pink-500/5 border border-pink-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="text-pink-400 w-4 h-4" />
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Terminal Signal</p>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-pink-500 animate-pulse" />
                </div>
                <p className="font-black text-lg italic text-foreground mt-3 uppercase tracking-tighter">
                  {device.today_last_active ? new Date(device.today_last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TRACKING...'}
                </p>
              </div>

              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 to-secondary/5 border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Cpu size={32} className="text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-3">Live Telemetry Signal</p>

                {/* Large Detail Trace */}
                <div className="bg-background/40 rounded-2xl border border-border p-4 mb-4 flex justify-center">
                  <MiniWaveChart
                    color={isOnline ? "#00f2ff" : "#ff0080"}
                    width={280}
                    height={100}
                    intensity={isOnline ? 0.8 : 0.05}
                    showGrid={true}
                  />
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black italic tracking-tighter text-foreground text-glow-pink">
                      {device.cpu_score || 0}
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Load Units</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">Capture Frequency</p>
                    <p className="text-[10px] font-black text-foreground italic">60.0 Hz</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WELLBEING ANALYTICS */}
          <Card className="glass-card premium-border rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase italic opacity-80">Software Spectrum</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-2 space-y-6">
              {device.app_usage && Object.keys(device.app_usage).length > 0 ? (
                (() => {
                  const sortedApps = Object.entries(device.app_usage as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);
                  const totalSecs = Object.values(device.app_usage as Record<string, number>).reduce((acc, v) => acc + v, 0);

                  return (
                    <div className="space-y-5">
                      {sortedApps.map(([app, secs]) => {
                        const percent = Math.max(8, (secs / totalSecs) * 100);
                        const hrs = Math.floor(secs / 3600);
                        const mins = Math.floor((secs % 3600) / 60);
                        return (
                          <div key={app} className="space-y-2.5">
                            <div className="flex justify-between items-end px-1">
                              <span className="text-xs font-bold text-foreground uppercase tracking-wider truncate max-w-[200px]">{formatAppName(app)}</span>
                              <span className="text-[9px] font-black text-cyan-400 font-mono tracking-widest">{hrs > 0 ? `${hrs}H ` : ''}{mins}M</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="py-12 text-center bg-muted/20 rounded-[2rem] border border-dashed border-border opacity-40">
                  <Layout className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Telemetry Initialization...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History & Deep Data Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cn(
              "glass-card rounded-[2.5rem] premium-border transition-all",
              isOnline ? "bg-cyan-500/[0.03] border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]" : "bg-pink-500/[0.03] border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.1)]"
            )}>
              <CardContent className="p-8 flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 border",
                  isOnline ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 glow-cyan" : "bg-pink-500/10 text-pink-400 border-pink-500/20 glow-pink"
                )}>
                  {isOnline ? <Power size={32} /> : <PowerOff size={32} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Status Protocol</p>
                  <h2 className={cn(
                    "text-3xl font-black italic uppercase tracking-tighter leading-tight",
                    isOnline ? "text-cyan-400" : "text-pink-400"
                  )}>
                    {isOnline ? "Operational" : "Idle State"}
                  </h2>
                  <p className="text-[10px] font-bold opacity-40 mt-1">
                    LOG_X: {isOnline ? `NODE_BROADCAST_START @ ${new Date(device.today_start_time).toLocaleTimeString()}` : `LAST_KNOWN_SIGN @ ${new Date(device.last_seen || Date.now()).toLocaleTimeString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-[2.5rem] premium-border bg-purple-500/[0.03] border-purple-500/20">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 glow-purple">
                  <ShieldCheck size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Defense Matrix</p>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-tight text-foreground">
                    SECURED
                  </h2>
                  <p className="text-[10px] font-bold opacity-40 mt-1 uppercase">Authentication Verified • Crypt Lock Active</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card premium-border rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black tracking-[0.4em] text-foreground uppercase italic opacity-80">Telemetry Archives</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Rolling 7-Day Performance Insight</p>
              </div>
              <Calendar className="opacity-10 w-6 h-6" />
            </CardHeader>
            <CardContent className="p-8">
              {history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] italic">
                        <th className="px-6 pb-2">Temporal Index</th>
                        <th className="px-6 pb-2 text-right">Optimized Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.filter((h: any) => {
                        const rowDate = h.history_date ? h.history_date : new Date(h.start_time).toISOString().split('T')[0];
                        const serverDate = detail.server_time ? detail.server_time.split('T')[0] : new Date().toISOString().split('T')[0];
                        return rowDate < serverDate;
                      }).map((h: any) => {
                        const dateObj = h.history_date ? new Date(h.history_date) : new Date(h.start_time);
                        const rowDateStr = h.history_date ? h.history_date : new Date(h.start_time).toISOString().split('T')[0];

                        return (
                          <tr
                            key={h.id || h.history_date}
                            onClick={() => navigate(`/dashboard/pc/${id}/history/${rowDateStr}`)}
                            className="text-xs group hover:bg-muted/50 transition-all rounded-3xl cursor-pointer active:scale-[0.99]"
                          >
                            <td className="px-6 py-5 bg-muted/20 rounded-l-[1.5rem] border-y border-l border-border">
                              <div className="flex flex-col">
                                <span className="font-black italic text-foreground uppercase tracking-tighter text-sm">{dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</span>
                                <span className="text-[9px] font-bold opacity-60 uppercase racking-widest mt-0.5">Node Broadcast Archive</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 bg-muted/20 rounded-r-[1.5rem] border-y border-r border-border text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-black italic text-foreground leading-none">{h.avg_score || 0}</span>
                                <span className="text-[7px] font-black text-primary uppercase tracking-widest mt-1">UNITS</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20 opacity-40">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-black uppercase text-[10px] tracking-[0.3em] italic">No Historical Sequence Found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Detail Modal */}
      <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
        <DialogContent className="glass-card premium-border border-border bg-popover/95 backdrop-blur-3xl text-foreground rounded-[2.5rem] max-w-2xl p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />

          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <History size={24} />
              </div>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
                Archive Log: {selectedHistory ? new Date(selectedHistory.history_date || selectedHistory.start_time).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase() : ''}
              </DialogTitle>
            </div>
            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
              Detailed Software Spectrum & Telemetry Analytics
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-2 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-muted border border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Average Load</p>
                <p className="text-3xl font-black italic text-primary tracking-tighter">{selectedHistory?.avg_score || 0} <span className="text-xs uppercase ml-1">Units</span></p>
              </div>
              <div className="p-5 rounded-3xl bg-muted border border-border">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Duration</p>
                <p className="text-3xl font-black italic text-foreground tracking-tighter">
                  {selectedHistory?.runtime_minutes ? `${Math.floor(selectedHistory.runtime_minutes / 60)}H ${selectedHistory.runtime_minutes % 60}M` : '00H 00M'}
                </p>
              </div>
            </div>

            {/* Comprehensive App Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Info size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Full Software breakdown</span>
              </div>

              <div className="space-y-4 bg-muted/20 border border-border rounded-3xl p-6">
                {selectedHistory?.app_usage && Object.keys(selectedHistory.app_usage).length > 0 ? (
                  (() => {
                    const items = Object.entries(selectedHistory.app_usage as Record<string, number>)
                      .sort(([, a], [, b]) => b - a);
                    const totalS = Object.values(selectedHistory.app_usage as Record<string, number>).reduce((acc, v) => acc + v, 0);

                    return items.map(([app, secs]) => {
                      const percent = Math.max(5, (secs / totalS) * 100);
                      const h = Math.floor(secs / 3600);
                      const m = Math.floor((secs % 3600) / 60);
                      return (
                        <div key={app} className="space-y-2">
                          <div className="flex justify-between items-end px-1">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider truncate max-w-[300px]">{formatAppName(app)}</span>
                            <span className="text-[10px] font-mono text-cyan-400 font-bold">{h > 0 ? `${h}H ` : ''}{m}M</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <p className="text-center py-8 text-muted-foreground text-[10px] font-black uppercase tracking-widest">No detailed app data recorded for this session.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setSelectedHistory(null)}
                className="premium-border glass-card rounded-2xl px-8 font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all shadow-2xl"
              >
                Close Archive
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}