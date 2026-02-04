import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Monitor, MapPin, ArrowRight, MoreVertical, Edit2, Trash2, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { MiniWaveChart } from './MiniWaveChart';

interface DeviceCardProps {
  device: any;
  serverTime?: string;
}

export function DeviceCard({ device, serverTime }: DeviceCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRenamePC = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("Enter new PC name:", device.pc_name);
    if (!newName || newName === device.pc_name) return;
    try {
      await apiFetch(`/devices/${device.system_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pc_name: newName })
      });
      toast.success("PC renamed successfully");
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
    } catch (err) {
      toast.error("Failed to rename PC");
    }
  };

  const handleDeletePC = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${device.pc_name}?`)) return;
    try {
      await apiFetch(`/devices/manage?hid=${device.system_id}`, { method: 'DELETE' });
      toast.success("PC slot reset successfully");
      queryClient.invalidateQueries({ queryKey: ['devices-list'] });
    } catch (err) {
      toast.error("Failed to reset PC slot");
    }
  };

  const lastSeenDate = device.last_seen ? new Date(device.last_seen) : null;
  const referenceTime = serverTime ? new Date(serverTime) : new Date();
  const isOnline = device.status === 'online' &&
    lastSeenDate &&
    (referenceTime.getTime() - lastSeenDate.getTime() < 60 * 1000);

  const lastActiveText = lastSeenDate ?
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit'
    }).format(lastSeenDate) : '---';

  const cpuIntensity = Math.min(1, (device.cpu_score || 0) / 100) || 0.1;

  return (
    <Card
      onClick={() => navigate(`/dashboard/pc/${device.system_id}`)}
      className={cn(
        "group relative overflow-hidden glass-card transition-all cursor-pointer premium-border rounded-[2rem]",
        isOnline ? "glow-cyan hover:border-cyan-500/50" : "glow-pink hover:border-pink-500/50"
      )}
    >
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl shadow-lg",
              isOnline ? "bg-cyan-500/10 text-cyan-400 glow-cyan" : "bg-pink-500/10 text-pink-400 glow-pink"
            )}>
              <Monitor size={18} />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-black italic tracking-tighter text-foreground uppercase truncate">
                {device.pc_name || "STATION"}
              </h3>
              <p className="text-[9px] text-muted-foreground font-mono font-bold opacity-70">
                SN: {device.system_id}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground/50 transition-colors">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border backdrop-blur-xl rounded-xl p-1">
              <DropdownMenuItem onClick={handleRenamePC} className="gap-2 text-[10px] font-black uppercase p-2.5 rounded-lg">
                <Edit2 size={12} /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeletePC} className="gap-2 text-pink-500 text-[10px] font-black uppercase p-2.5 rounded-lg">
                <Trash2 size={12} /> Terminate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Technical Telemetry Graph */}
        <div className="bg-background/50 rounded-2xl border border-border p-4 flex flex-col items-center gap-3">
          <MiniWaveChart
            color={isOnline ? "#00f2ff" : "#ff0080"}
            width={160}
            height={40}
            intensity={isOnline ? cpuIntensity : 0.05}
            showGrid={true}
          />
          <div className="w-full flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
            <span>LIVE TELEMETRY</span>
            <div className="flex items-center gap-1.5">
              <span className={cn(isOnline ? "text-cyan-400" : "text-pink-400")}>{isOnline ? "LINKED" : "OFFLINE"}</span>
              <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-cyan-400 animate-pulse" : "bg-pink-400")} />
            </div>
          </div>
        </div>

        {/* Compute & Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted p-3 rounded-xl border border-border">
            <div className="flex items-center gap-1.5 mb-1 opacity-60">
              <Cpu size={10} className="text-muted-foreground" />
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Load Units</span>
            </div>
            <p className={cn(
              "text-lg font-black italic",
              isOnline ? "text-cyan-400" : "text-foreground"
            )}>{device.cpu_score || 0}</p>
          </div>
          <div className="bg-muted p-3 rounded-xl border border-border">
            <div className="flex items-center gap-1.5 mb-1 opacity-60">
              <MapPin size={10} className="text-muted-foreground" />
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Node Base</span>
            </div>
            <p className="text-xs font-black text-foreground italic truncate uppercase">{device.city || 'N/A'}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[9px] font-black uppercase text-muted-foreground/30 italic tracking-widest">STATION PROTOCOL</span>
          <div className={cn(
            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
            isOnline ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]" : "bg-muted text-muted-foreground border border-border"
          )}>
            {isOnline ? "ACTIVE" : `LAST: ${lastActiveText}`}
          </div>
        </div>
      </CardContent>

      {/* Hover Action Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <ArrowRight size={14} className="absolute bottom-4 right-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Card>
  );
}