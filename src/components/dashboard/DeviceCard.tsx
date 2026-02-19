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

  // Persistent defective check
  const isCurrentlyDefective = (() => {
    try {
      const defectiveDevices = JSON.parse(localStorage.getItem('defective_devices') || '[]');
      return device.is_defective || defectiveDevices.includes(device.system_id);
    } catch (e) {
      return device.is_defective || false;
    }
  })();

  const lastActiveText = lastSeenDate ?
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit'
    }).format(lastSeenDate) : '---';

  const currentCpu = device.app_usage?.['__current_cpu__'] || device.cpu_score || 0;
  const cpuIntensity = Math.min(1, currentCpu / 100) || 0.1;

  return (
    <Card
      onClick={() => navigate(`/dashboard/pc/${device.system_id}`)}
      className={cn(
        "group relative overflow-hidden bg-card hover:bg-card/90 transition-all cursor-pointer border border-border hover:border-primary/40 rounded-xl shadow-sm hover:shadow-md",
        isOnline ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-muted"
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
            )}>
              <Monitor size={18} />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase truncate">
                {device.pc_name || "STATION"}
              </h3>
              <p className="text-[9px] text-white font-mono font-bold opacity-60">
                SN: {device.system_id}
              </p>
              <p className="text-[7px] text-primary/80 font-mono font-black uppercase tracking-[0.1em] mt-0.5">
                HID: {device.hardware_id || device.hwid || "N/A"}
              </p>
              {isCurrentlyDefective && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded-[4px] bg-red-500 text-[7px] font-black uppercase text-white shadow-sm animate-pulse">
                  Defective Unit
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1.5 hover:bg-muted rounded text-muted-foreground/40 transition-colors">
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-border rounded-lg p-1 shadow-lg">
              <DropdownMenuItem onClick={handleRenamePC} className="gap-2 text-[10px] font-bold uppercase p-2 rounded-md">
                <Edit2 size={12} className="text-primary" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeletePC} className="gap-2 text-red-600 text-[10px] font-bold uppercase p-2 rounded-md">
                <Trash2 size={12} /> Reset Slot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Technical Telemetry Graph */}
        <div className="bg-background rounded-xl border border-border p-3 flex flex-col items-center gap-2">
          <MiniWaveChart
            color={isOnline ? "#01416D" : "#9CA3AF"}
            width={160}
            height={30}
            intensity={isOnline ? cpuIntensity : 0.05}
            showGrid={false}
            isOnline={isOnline || false}
          />
          <div className="w-full flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-white/60">
            <span>TELEMETRY</span>
            <div className="flex items-center gap-1.5">
              <span className={cn(isOnline ? "text-emerald-600" : "text-gray-400")}>{isOnline ? "LINKED" : "OFFLINE"}</span>
              <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-emerald-600 animate-pulse" : "bg-gray-300")} />
            </div>
          </div>
        </div>

        {/* Compute & Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background border border-border p-2 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1 opacity-60">
              <div className="flex items-center gap-1">
                <Cpu size={10} className="text-primary" />
                <span className="text-[7px] font-bold uppercase text-white/70 tracking-tight">CPU LOAD</span>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={cn("text-sm font-bold tracking-tight leading-none", isOnline ? "text-white" : "text-white/60")}>
                  {device.app_usage?.['__current_cpu__'] || 0}%
                </p>
                <p className="text-[6px] font-bold uppercase text-muted-foreground mt-0.5">Current</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tracking-tight leading-none text-white/50">
                  {device.cpu_score || 0}%
                </p>
                <p className="text-[6px] font-bold uppercase text-muted-foreground mt-0.5">Avg</p>
              </div>
            </div>
          </div>
          <div className="bg-background border border-border p-2 rounded-lg">
            <div className="flex items-center gap-1 mb-1 opacity-60">
              <MapPin size={10} className="text-secondary" />
              <span className="text-[8px] font-bold uppercase text-white/70 tracking-tight">Node</span>
            </div>
            <p className="text-xs font-bold text-white/90 truncate uppercase">{device.city || 'N/A'}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[8px] font-bold uppercase text-white/40 tracking-widest">UNIT_PROTOCOL</span>
          <div className={cn(
            "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
            isOnline ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-muted text-white/60 border border-border"
          )}>
            {isOnline ? "ACTIVE" : `${lastActiveText}`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}