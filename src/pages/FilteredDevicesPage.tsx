import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLabPCs } from '@/hooks/useLabPCs';
import { usePCSessions } from '@/hooks/usePCSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, parseUTC, formatDetailedDuration } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function FilteredDevicesPage() {
  const { filter } = useParams<{ filter: 'online' | 'offline' | 'all' }>();
  const navigate = useNavigate();
  const { data: devicesData, isLoading: loading } = useLabPCs();
  const devices = devicesData || [];

  const filteredDevices = devices.filter(device => {
    if (filter === 'online') return device.status === 'online';
    if (filter === 'offline') return device.status === 'offline';
    return true;
  });

  const getTitle = () => {
    switch (filter) {
      case 'online': return 'Online Devices';
      case 'offline': return 'Offline Devices';
      default: return 'All Devices';
    }
  };

  const getIcon = () => {
    switch (filter) {
      case 'online': return <Wifi className="w-6 h-6 text-success" />;
      case 'offline': return <WifiOff className="w-6 h-6 text-muted-foreground" />;
      default: return <Monitor className="w-6 h-6 text-primary" />;
    }
  };


  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-6 pb-6 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="rounded-lg bg-card border border-border hover:bg-primary/10 hover:text-primary transition-all group shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        </Button>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary text-black shadow-sm">
            {getIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white uppercase font-display">{getTitle()}</h1>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest opacity-60">System Network Audit Segment</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-sm">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Count:</span>
          <span className="text-sm font-bold text-white">{filteredDevices.length} Nodes</span>
        </div>
      </div>

      {/* Devices Table */}
      {filteredDevices.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-sm">
          <Monitor className="w-16 h-16 text-primary/10 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-primary uppercase tracking-tight mb-2">No {filter} nodes identified</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">All system nodes in this category are currently non-responsive or de-registered.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted border-b border-border">
                  <TableHead className="w-20 px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-primary/60">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-primary/60">Node Hostname</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-primary/60">Hardware ID (MAC)</TableHead>
                  {filter === 'online' && (
                    <TableHead className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-primary/60 text-right">Uptime Duration</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => {
                  const sessionStart = device.current_session?.start_time;
                  const isOnline = device.status === 'online';
                  return (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer hover:bg-primary/[0.02] transition-colors border-b border-border last:border-0"
                      onClick={() => navigate(`/dashboard/pc/${device.id}`)}
                    >
                      <TableCell className="px-8 py-5">
                        <div className="flex justify-center">
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full ring-4 ring-offset-0',
                            isOnline
                              ? 'bg-emerald-500 ring-emerald-500/10 animate-pulse'
                              : 'bg-gray-300 ring-gray-300/10'
                          )} />
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-white uppercase tracking-tight">{device.hostname}</span>
                          <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">Active Station</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded border border-border">
                          {device.mac_address}
                        </span>
                      </TableCell>
                      {filter === 'online' && (
                        <TableCell className="px-8 py-5 text-right">
                          <span className="font-bold text-emerald-500 text-sm">
                            {sessionStart ? formatDetailedDuration(sessionStart, device.server_time) : '—'}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}