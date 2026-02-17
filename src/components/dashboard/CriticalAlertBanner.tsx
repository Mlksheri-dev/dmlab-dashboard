import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { AlertTriangle, WifiOff, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function CriticalAlertBanner() {
    const [closed, setClosed] = useState(false);

    const { data: response } = useQuery({
        queryKey: ['critical-devices'],
        queryFn: () => apiFetch('/devices?status=offline'),
        refetchInterval: 10000,
    });

    const offlineDevices = response?.devices || [];

    // Heuristic for "Critical" devices
    const criticalOffline = offlineDevices.filter((d: any) => {
        const name = (d.pc_name || "").toUpperCase();
        return name.includes('GM') ||
            name.includes('SERVER') ||
            name.includes('ADMIN') ||
            name.includes('MANAGER') ||
            name.includes('LEAD');
    });

    if (closed || criticalOffline.length === 0) return null;

    return (
        <div className="mx-4 mt-4 animate-in slide-in-from-top duration-500">
            <div className="relative overflow-hidden group">
                {/* Flashing Background Glow */}
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />

                <div className="relative glass-card border-red-500/30 bg-red-500/5 backdrop-blur-xl p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-bounce">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500">Critical Node Disconnect</h4>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-0.5">
                                {criticalOffline.length === 1
                                    ? `NODE [${criticalOffline[0].pc_name}] HAS TERMINATED SIGNAL`
                                    : `${criticalOffline.length} CRITICAL NODES ARE CURRENTLY IN DARK STATE`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setClosed(true)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
