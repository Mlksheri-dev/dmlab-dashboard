import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Building2, Search, MoreVertical, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
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

export default function LabsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['lab-stats', city],
        queryFn: () => apiFetch(`/stats/city/${city}/labs`),
        enabled: !!city,
        refetchInterval: 10000,
        staleTime: 5000,
        gcTime: 30000
    });

    const labs = response?.labs || [];

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
            queryClient.invalidateQueries({ queryKey: ['lab-stats'] });
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
            queryClient.invalidateQueries({ queryKey: ['lab-stats'] });
        } catch (err) {
            toast.error("Failed to delete lab");
        }
    };

    const filteredLabs = labs
        .filter((lab: any) =>
            lab.lab_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a: any, b: any) => (b.total_pcs || 0) - (a.total_pcs || 0)); // Highest capacity first

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-4 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary transition-all font-display"
                        onClick={() => navigate('/dashboard/cities')}
                    >
                        <ArrowLeft className="w-3 h-3 mr-2" /> Back to Regions
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display">
                            {city?.toUpperCase()} <span className="text-white/80">SYSTEM</span>
                        </h1>
                        <p className="text-white font-bold mt-1 uppercase tracking-wider text-[10px]">
                            Regional Lab Clusters & Facility Inventory
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <Button
                        onClick={async () => {
                            const toastId = toast.loading(`Synthesizing ${city} infrastructure audit...`);
                            try {
                                const { generateDynamicReport } = await import('@/lib/pdf-generator');
                                await generateDynamicReport('CITY', { labs, city }, city!);
                                toast.success("City Audit Generated", { id: toastId });
                            } catch (e) {
                                console.error(e);
                                toast.error("Failed to generate audit", { id: toastId });
                            }
                        }}
                        className="bg-white hover:bg-white/90 text-black gap-2 px-6 rounded-lg h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Building2 size={16} className="text-black" />
                        Generate City Audit
                    </Button>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH FACILITIES..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-10 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
                </div>
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
                                onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab.lab_name}`)}
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
                                                {lab.lab_name}
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

                                    {/* Minimal Graph */}
                                    <div className="flex justify-center flex-1 items-center opacity-40">
                                        <MiniWaveChart
                                            color="#01416D"
                                            width={180}
                                            height={40}
                                            intensity={intensity}
                                            showGrid={false}
                                        />
                                    </div>

                                    {/* Numeric Readouts */}
                                    <div className="flex items-end justify-between border-t border-border pt-4">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-white tracking-tight">{total}</span>
                                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">Total Units</span>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                                            <span className="text-xl font-bold text-emerald-400 tracking-tight">{online}</span>
                                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
