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
      <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">System Offline / Not Found</h1>
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
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
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
              System ID: <span className="text-white/80">{device.system_id}</span> • Architecture: <span className="text-white/80">x64_INSTRUMENTATION</span>
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
                onClick={async () => {
                  const toastId = toast.loading("Synthesizing node audit PDF...");
                  try {
                    const { generateDynamicReport } = await import('@/lib/pdf-generator');
                    await generateDynamicReport('PC', {
                      ...device,
                      isOnline,
                      session_count: detail?.session_count,
                      history: detail?.history
                    }, device.system_id);
                    toast.success("Audit Generated Successfully", { id: toastId });
                  } catch (e) {
                    console.error(e);
                    toast.error("Failed to generate audit PDF", { id: toastId });
                  }
                }}
                className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
              >
                <Monitor size={16} className="text-black" />
                Generate Audit Report
              </Button>


              <Button variant="ghost" size="lg" onClick={() => setIsEditing(true)} className="bg-card border border-border hover:bg-muted font-bold text-[10px] tracking-widest uppercase rounded-lg px-6 h-10 transition-all text-white shadow-sm hover:text-primary">
                <Edit3 className="w-4 h-4 mr-3" /> Reconfigure
              </Button>

              <Button
                variant="destructive"
                size="lg"
                className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all font-bold text-[10px] tracking-widest uppercase rounded-lg px-6 h-10 shadow-sm"
                onClick={() => {
                  if (window.confirm("CONFIRMATION: Delete this system from the institutional network?")) deleteMutation.mutate();
                }}
              >
                <Trash2 className="w-4 h-4 mr-3" /> Remove Unit
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
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Assigned Region</p>
                    {isEditing ? (
                      <select
                        className="mt-2 w-full bg-card border border-border text-primary text-xs rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      >
                        {["Ahmadpur East", "Ahmed Nager Chatha", "Ali Pur", "Arifwala", "Attock", "Bhalwal", "Bahawalnagar", "Bahawalpur", "Bhakkar", "Burewala", "Chillianwala", "Chakwal", "Chichawatni", "Chiniot", "Chishtian", "Daska", "Darya Khan", "Dera Ghazi Khan", "Dhaular", "Dina", "Dinga", "Dipalpur", "Faisalabad", "Fateh Jang", "Ghakhar Mandi", "Gojra", "Gujar Khan", "Gujranwala", "Gujrat", "Hafizabad", "Haroonabad", "Hasilpur", "Haveli Lakha", "Jauharabad", "Jhang", "Jhelum", "Kalabagh", "Karor Lal Esan", "Kasur", "Kamalia", "Kamoke", "Khanewal", "Khanpur", "Kharian", "Khushab", "Kot Adu", "Lahore", "Lalamusa", "Layyah", "Liaquat Pur", "Lodhran", "Malakwal", "Mamoori", "Mailsi", "Mandi Bahauddin", "Mian Channu", "Mianwali", "Multan", "Murree", "Muridke", "Mianwali Bangla", "Muzaffargarh", "Narowal", "Okara", "Renala Khurd", "Pakpattan", "Pattoki", "Pir Mahal", "Qila Didar Singh", "Rabwah", "Raiwind", "Rajanpur", "Rahim Yar Khan", "Rawalpindi", "Sadiqabad", "Safdarabad", "Sahiwal", "Sangla Hill", "Sarai Alamgir", "Sargodha", "Shakargarh", "Sheikhupura", "Sialkot", "Sohawa", "Soianwala", "Siranwali", "Talagang", "Taxila", "Toba Tek Singh", "Vehari", "Wah Cantonment", "Wazirabad"].sort().map(c => (
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
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Facility Cluster</p>
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
                      const hours = Math.floor(mins / 60);
                      const remMins = Math.floor(mins % 60);
                      return `${hours}H ${remMins}M`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sunset className="text-secondary w-4 h-4" />
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Last Transmission</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="font-bold text-lg text-primary mt-3 uppercase tracking-tight">
                  {device.today_last_active ? new Date(device.today_last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ESTABLISHING...'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Cpu size={48} className="text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-4">Real-time Telemetry</p>

                {/* Large Detail Trace */}
                <div className="bg-muted rounded-xl border border-border p-4 mb-4 flex justify-center opacity-40">
                  <MiniWaveChart
                    color="#01416D"
                    width={280}
                    height={80}
                    intensity={isOnline ? 0.8 : 0.05}
                    showGrid={false}
                  />
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tighter text-primary">
                      {device.cpu_score || 0}
                    </span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">CPU LOAD %</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Update Rate</p>
                    <p className="text-[10px] font-bold text-primary">60S / SYNC</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WELLBEING ANALYTICS */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">Software Utilization Spectrum</CardTitle>
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
                          <div key={app} className="space-y-2">
                            <div className="flex justify-between items-end px-1">
                              <span className="text-xs font-bold text-primary uppercase tracking-tight truncate max-w-[200px]">{formatAppName(app)}</span>
                              <span className="text-[9px] font-bold text-secondary tracking-widest">{hrs > 0 ? `${hrs}H ` : ''}{mins}M</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                              <div
                                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-sm"
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
                <div className="py-12 text-center bg-muted rounded-xl border border-dashed border-border opacity-40">
                  <Layout className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No Usage Data Recieved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History & Deep Data Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={cn(
              "bg-card rounded-2xl border transition-all shadow-sm",
              isOnline ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-gray-300"
            )}>
              <CardContent className="p-8 flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                  isOnline ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"
                )}>
                  {isOnline ? <Power size={28} /> : <PowerOff size={28} />}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Operational State</p>
                  <h2 className={cn(
                    "text-2xl font-bold uppercase tracking-tight text-primary leading-tight",
                    isOnline ? "text-emerald-600" : "text-gray-400"
                  )}>
                    {isOnline ? "Operational" : "Idle State"}
                  </h2>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">
                    {isOnline ? `Handshake established at ${new Date(device.today_start_time).toLocaleTimeString()}` : `Terminal signal lost at ${new Date(device.last_seen || Date.now()).toLocaleTimeString()}`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card rounded-2xl border border-border border-l-4 border-l-secondary shadow-sm">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 shadow-sm border border-orange-500/20">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Infrastructure Hub</p>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-primary leading-tight">
                    SECURED
                  </h2>
                  <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-wider">Authentication Persistent • Node Verified</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-bold tracking-widest text-primary uppercase opacity-60">Node Usage History</CardTitle>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Institutional performance archives (Rolling 7-Day)</p>
              </div>
              <Calendar className="text-primary opacity-20 w-5 h-5" />
            </CardHeader>
            <CardContent className="p-8">
              {history && history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                        <th className="px-6 pb-4 border-b border-border">Session Temporal Index</th>
                        <th className="px-6 pb-4 border-b border-border text-right">Avg Load Factor</th>
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
                            className="text-xs group hover:bg-muted transition-all cursor-pointer active:scale-[0.99]"
                          >
                            <td className="px-6 py-5 border-b border-border">
                              <div className="flex flex-col">
                                <span className="font-bold text-primary uppercase tracking-tight text-sm">{dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}</span>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Archive Log Sync</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 border-b border-border text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-primary leading-none">{h.avg_score || 0}%</span>
                                <span className="text-[7px] font-bold text-secondary uppercase tracking-widest mt-1">CPU INDEX</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center border border-dashed border-border rounded-xl bg-muted opacity-40">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No Archived Handshakes Found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Detail Modal */}
      <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
        <DialogContent className="bg-card border border-border text-primary rounded-2xl max-w-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-1 bg-primary w-full" />

          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary text-black shadow-sm">
                <History size={24} />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight uppercase">
                Session Audit: {selectedHistory ? new Date(selectedHistory.history_date || selectedHistory.start_time).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase() : ''}
              </DialogTitle>
            </div>
            <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Verification of System Performance & Application Lifecycle
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-2 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-muted border border-border shadow-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Average Consumption</p>
                <p className="text-3xl font-bold text-primary tracking-tight">{selectedHistory?.avg_score || 0}% <span className="text-[10px] uppercase ml-1 opacity-60">Load</span></p>
              </div>
              <div className="p-5 rounded-xl bg-primary text-black shadow-md">
                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mb-1">Operational Duty</p>
                <p className="text-3xl font-bold text-black tracking-tight">
                  {selectedHistory?.runtime_minutes ? `${Math.floor(selectedHistory.runtime_minutes / 60)}H ${selectedHistory.runtime_minutes % 60}M` : '00H 00M'}
                </p>
              </div>
            </div>

            {/* Comprehensive App Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Info size={14} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Software Distribution Matrix</span>
              </div>

              <div className="space-y-4 bg-muted border border-border rounded-xl p-6 shadow-sm">
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
                            <span className="text-xs font-bold text-primary uppercase tracking-tight truncate max-w-[350px]">{formatAppName(app)}</span>
                            <span className="text-[10px] font-bold text-secondary">{h > 0 ? `${h}H ` : ''}{m}M</span>
                          </div>
                          <div className="h-1 w-full bg-card rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <p className="text-center py-8 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">No software telemetry available for this temporal index.</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={() => setSelectedHistory(null)}
                className="bg-background border border-border rounded-lg text-primary px-8 h-10 font-bold text-[10px] uppercase tracking-widest hover:bg-muted transition-all shadow-sm"
              >
                Close Audit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}