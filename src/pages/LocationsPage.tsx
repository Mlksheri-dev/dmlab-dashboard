import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MiniWaveChart } from '@/components/dashboard/MiniWaveChart';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function LocationsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['location-stats'],
        queryFn: () => apiFetch('/stats/locations'),
        refetchInterval: 10000,
        staleTime: 5000,
        gcTime: 30000
    });

    const locations = response?.locations || [];

    const handleRenameCity = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        const newName = prompt("Enter new name for city:", oldName);
        if (!newName || newName === oldName) return;
        try {
            await apiFetch('/stats/city/rename', {
                method: 'PATCH',
                body: JSON.stringify({ old_name: oldName, new_name: newName })
            });
            toast.success(`City renamed to ${newName}`);
            queryClient.invalidateQueries({ queryKey: ['location-stats'] });
        } catch (err) {
            toast.error("Failed to rename city");
        }
    };

    const handleDeleteCity = async (e: React.MouseEvent, cityName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${cityName}?`)) return;
        try {
            await apiFetch(`/stats/city/delete?city=${cityName}`, { method: 'DELETE' });
            toast.success(`${cityName} deleted.`);
            queryClient.invalidateQueries({ queryKey: ['location-stats'] });
        } catch (err) {
            toast.error("Failed to delete city");
        }
    };

    const filteredLocations = locations
        .filter((loc: any) =>
            loc.city.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a: any, b: any) => (b.total_pcs || 0) - (a.total_pcs || 0)); // Highest capacity first

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-foreground font-display">
                        CITY WISE <span className="text-primary text-glow-pink">SYSTEM</span>
                    </h1>

                    <p className="text-muted-foreground font-black mt-1 uppercase tracking-[0.3em] text-[10px]">
                        Global Infrastructure Distribution
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-glow-pink transition-all" />
                        <Input
                            placeholder="OPERATIONAL SEARCH..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-muted/50 border-border focus:border-primary/50 text-[10px] font-black uppercase tracking-[0.2em] h-12 rounded-2xl transition-all"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
                </div>
            ) : filteredLocations.length === 0 ? (
                <div className="p-20 text-center glass-card border-dashed border-border rounded-[3rem]">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-black italic text-foreground uppercase tracking-tighter">No Active Nodes</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredLocations.map((loc: any) => {
                        const total = loc.total_pcs || 0;
                        const online = loc.online || 0;
                        const onlinePercent = total > 0 ? (online / total) * 100 : 0;
                        const intensity = Math.max(0.1, onlinePercent / 100);

                        return (
                            <Card
                                key={loc.city}
                                onClick={() => navigate(`/dashboard/labs?city=${loc.city}`)}
                                className="group relative overflow-hidden glass-card cursor-pointer hover:border-primary/50 transition-all hover:translate-y-[-4px] premium-border rounded-[2rem] min-h-[220px]"
                            >
                                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2.5 rounded-xl bg-muted border border-border text-primary shrink-0">
                                                <MapPin size={16} />
                                            </div>
                                            <h2 className="text-base font-bold tracking-tight uppercase text-foreground group-hover:text-primary transition-colors truncate">
                                                {loc.city}
                                            </h2>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground/30 shrink-0">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-popover border-border backdrop-blur-xl rounded-xl p-1.5">
                                                <DropdownMenuItem onClick={(e) => handleRenameCity(e, loc.city)} className="gap-2 text-[9px] font-black uppercase p-2.5 rounded-lg">
                                                    <Edit2 size={12} /> Rename Hub
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDeleteCity(e, loc.city)} className="gap-2 text-pink-500 text-[9px] font-black uppercase p-2.5 rounded-lg">
                                                    <Trash2 size={12} /> Terminate Hub
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex justify-center flex-1 items-center">
                                        <MiniWaveChart
                                            color="#32ade6"
                                            width={180}
                                            height={50}
                                            intensity={intensity}
                                            showGrid={true}
                                        />
                                    </div>

                                    <div className="flex items-end justify-between border-t border-border pt-4">
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
