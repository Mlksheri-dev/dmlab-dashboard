import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Search, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

export default function LabsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const tehsil = searchParams.get('tehsil');
    const [searchTerm, setSearchTerm] = useState('');

    const handleRenameLab = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        const newName = prompt("Enter new name for lab:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await apiFetch('/stats/lab/rename', {
                method: 'PATCH',
                body: JSON.stringify({ city, old_name: oldName, new_name: newName })
            });
            toast.success(`Lab renamed to ${newName}`);
            queryClient.invalidateQueries({ queryKey: ['all-devices-for-labs'] });
        } catch (err) {
            toast.error("Failed to rename lab");
        }
    };

    const handleDeleteLab = async (e: React.MouseEvent, labName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${labName}?`)) return;
        try {
            await apiFetch(`/stats/lab/delete?city=${city}&lab=${labName}`, { method: 'DELETE' });
            toast.success(`${labName} deleted.`);
            queryClient.invalidateQueries({ queryKey: ['all-devices-for-labs'] });
        } catch (err) {
            toast.error("Failed to delete lab");
        }
    };

    // --- NEW LOGIC: FETCH ALL DEVICES TO CALCULATE UTILIZATION ---
    // The user wants to distinguish between "ON but IDLE" and "ON and DRIVING".
    // We fetch raw device data and aggregate it ourselves.

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['global-lab-stats'],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const labs = useMemo(() => {
        const allLabs = Array.isArray(statsData?.labs) ? statsData.labs : [];
        let filtered = allLabs;
        if (city) {
            filtered = filtered.filter((l: any) => l.city?.toLowerCase() === city.toLowerCase());
        }
        if (tehsil) {
            filtered = filtered.filter((l: any) => l.tehsil?.toLowerCase() === tehsil.toLowerCase());
        }
        return filtered;
    }, [statsData, city, tehsil]);

    const status = searchParams.get('status');

    const filteredLabs = useMemo(() => {
        return labs.filter((lab: any) => {
            const matchesSearch = (lab.lab_name || lab.lab || '').toLowerCase().includes(searchTerm.toLowerCase());
            let matchesStatus = true;
            if (status === 'online') {
                matchesStatus = (lab.online || 0) > 0;
            } else if (status === 'offline') {
                matchesStatus = (lab.online || 0) === 0;
            }
            return matchesSearch && matchesStatus;
        }).sort((a: any, b: any) => (b.total_pcs || 0) - (a.total_pcs || 0));
    }, [labs, searchTerm, status]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="pb-6 border-b border-border space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary transition-all font-display"
                            onClick={() => navigate(tehsil ? `/dashboard/tehsils?city=${city}` : city ? '/dashboard/cities' : '/dashboard')}
                        >
                            <ArrowLeft className="w-3 h-3 mr-2" /> {tehsil ? 'Back to Tehsils' : city ? 'Back to Districts' : 'Back to Dashboard'}
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                                {tehsil ? `${tehsil.toUpperCase()} LABS` : city ? `${city.toUpperCase()} SYSTEM` : status ? `${status.toUpperCase()} LABS` : 'LABWISE SYSTEM'}
                            </h1>
                            <p className="text-white/40 font-bold uppercase tracking-wider text-[9px] mt-1">
                                {tehsil ? `Facilities within ${tehsil} tehsil` : city ? 'Regional Lab Clusters & Facility Inventory' : 'Consolidated Facility Inventory & Management'}
                            </p>
                        </div>
                    </div>

                    {city && (
                        <Button
                            onClick={async () => {
                                const toastId = toast.loading(`Synthesizing ${city} infrastructure audit...`);
                                try {
                                    const { generateDynamicReport } = await import('@/lib/pdf-generator');
                                    await generateDynamicReport('CITY', { labs, city }, city!);
                                    toast.success("City Audit Excel Generated", { id: toastId });
                                } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to generate audit", { id: toastId });
                                }
                            }}
                            className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shrink-0"
                        >
                            <Building2 size={16} className="text-black" />
                            Generate City Audit (Excel)
                        </Button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY LAB NAME OR CITY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-11 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header >

            {
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" >
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                        }
                    </div >
                ) : filteredLabs.length === 0 ? (
                    <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                        <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Access Points Detected</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLabs.map((lab: any) => {
                            const total = lab.total_pcs || 0;
                            const online = lab.online || 0;
                            const onlinePercent = total > 0 ? (online / total) * 100 : 0;
                            const intensity = Math.max(0.1, onlinePercent / 100);

                            return (
                                <Card
                                    key={lab.lab_name}
                                    onClick={() => navigate(`/dashboard/lab-summary/${encodeURIComponent(city || lab.city || '')}/${encodeURIComponent(lab.lab_name)}`)}
                                    className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px]"
                                >
                                    <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                        {/* Name & Control */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2.5 rounded-lg bg-primary text-black shrink-0 shadow-sm">
                                                    <Building2 size={16} />
                                                </div>
                                                <h2 className="text-lg font-bold tracking-tight uppercase text-white group-hover:text-white/80 transition-colors truncate">
                                                    {lab.lab_name || lab.lab}
                                                </h2>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <button className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground/30 shrink-0">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border border-border rounded-lg p-1.5 shadow-xl">
                                                    <DropdownMenuItem onClick={(e) => handleRenameLab(e, lab.lab_name)} className="gap-2 text-[10px] font-bold uppercase p-2 rounded-md transition-colors">
                                                        <Edit2 size={12} className="text-primary" /> Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => handleDeleteLab(e, lab.lab_name)} className="gap-2 text-red-600 text-[10px] font-bold uppercase p-2 rounded-md transition-colors">
                                                        <Trash2 size={12} /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>


                                        {/* Numeric Readouts */}
                                        <div className="space-y-3 border-t border-border pt-4">
                                            <div className="flex items-end justify-between">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
                                                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Total System</span>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                                    <span className="text-xl font-bold text-emerald-400 tracking-tight">{online}</span>
                                                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                                </div>
                                            </div>

                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )
            }
        </div >
    );
}
