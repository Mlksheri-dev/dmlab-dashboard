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
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          {getIcon()}
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{getTitle()}</h1>
        </div>
        <span className="ml-auto text-sm font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
          {filteredDevices.length} devices
        </span>
      </div>

      {/* Devices Table */}
      {filteredDevices.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Monitor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No {filter} devices</h3>
          <p className="text-muted-foreground">Devices will appear here when available.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-4 md:p-6">
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Hostname</TableHead>
                  <TableHead className="whitespace-nowrap">MAC Address</TableHead>
                  {filter === 'online' && (
                    <TableHead className="whitespace-nowrap">Online Since</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => {
                  const sessionStart = device.current_session?.start_time;
                  return (
                    <TableRow
                      key={device.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/dashboard/pc/${device.id}`)}
                    >
                      <TableCell>
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          device.status === 'online' ? 'bg-success animate-pulse-online' : 'bg-muted-foreground'
                        )} />
                      </TableCell>
                      <TableCell className="font-medium">{device.hostname}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {device.mac_address}
                      </TableCell>
                      {filter === 'online' && (
                        <TableCell className="font-mono text-sm text-success">
                          {sessionStart ? formatDetailedDuration(sessionStart, device.server_time) : '—'}
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