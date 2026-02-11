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
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div className="space-y-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all font-display"
                        onClick={() => navigate('/dashboard/cities')}
                    >
                        <ArrowLeft className="w-3 h-3 mr-2" /> RETURN TO REGIONS
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground font-display">
                            <span className="text-primary text-glow-pink">{city?.toUpperCase()}</span> CLUSTERS
                        </h1>
                        <p className="text-muted-foreground font-black mt-1 uppercase tracking-[0.3em] text-[10px]">
                            Internal Facility Infrastructure Environment
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-glow-pink transition-all" />
                    <Input
                        placeholder="SEARCH FACILITIES..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-muted/50 border-border focus:border-primary/50 text-[10px] font-black uppercase tracking-[0.2em] h-12 rounded-2xl transition-all"
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
                </div>
            ) : filteredLabs.length === 0 ? (
                <div className="p-20 text-center glass-card border-dashed border-border rounded-[3rem]">
                    <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-black italic text-foreground uppercase tracking-tighter">No Access Points Detected</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredLabs.map((lab: any) => {
                        const total = lab.total_pcs || 0;
                        const online = lab.online || 0;
                        const onlinePercent = total > 0 ? (online / total) * 100 : 0;
                        const intensity = Math.max(0.1, onlinePercent / 100);

                        return (
                            <Card
                                key={lab.lab_name}
                                onClick={() => navigate(`/dashboard/devices?city=${city}&lab=${lab.lab_name}`)}
                                className="group relative overflow-hidden glass-card cursor-pointer hover:border-primary/50 transition-all hover:translate-y-[-4px] premium-border rounded-[2rem] min-h-[220px]"
                            >
                                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                    {/* Name & Control */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2.5 rounded-xl bg-muted border border-border text-primary shrink-0">
                                                <Building2 size={16} />
                                            </div>
                                            <h2 className="text-sm md:text-base font-bold tracking-tight uppercase text-foreground group-hover:text-primary transition-colors truncate">
                                                {lab.lab_name}
                                            </h2>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground/30 shrink-0">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-popover border-border backdrop-blur-xl rounded-xl p-1.5">
                                                <DropdownMenuItem onClick={(e) => handleRenameLab(e, lab.lab_name)} className="gap-2 text-[9px] font-black uppercase p-2.5 rounded-lg">
                                                    <Edit2 size={12} /> Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDeleteLab(e, lab.lab_name)} className="gap-2 text-pink-500 text-[9px] font-black uppercase p-2.5 rounded-lg">
                                                    <Trash2 size={12} /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Minimal Graph */}
                                    <div className="flex justify-center flex-1 items-center">
                                        <MiniWaveChart
                                            color="#00ff9d"
                                            width={180}
                                            height={50}
                                            intensity={intensity}
                                            showGrid={true}
                                        />
                                    </div>

                                    {/* Numeric Readouts */}
                                    <div className="flex items-end justify-between border-t border-border/50 pt-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black italic text-foreground tracking-tighter">{total}</span>
                                            <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">Total</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black italic text-[#00ff9d] tracking-tighter text-glow-cyan">{online}</span>
                                            <span className="text-[8px] font-black text-[#00ff9d]/40 uppercase tracking-widest">Live</span>
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
