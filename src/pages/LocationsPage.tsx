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
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight uppercase text-white font-display">
                        CITYWISE <span className="text-white/80">SYSTEM</span>
                    </h1>

                    <p className="text-white font-bold mt-1 uppercase tracking-wider text-[10px]">
                        Distribution of Institutional Computing Resources
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY CITY..."
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
            ) : filteredLocations.length === 0 ? (
                <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Active Hubs Detected</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLocations.map((loc: any) => {
                        const total = loc.total_pcs || 0;
                        const online = loc.online || 0;
                        const onlinePercent = total > 0 ? (online / total) * 100 : 0;
                        const intensity = Math.max(0.1, onlinePercent / 100);

                        return (
                            <Card
                                key={loc.city}
                                onClick={() => navigate(`/dashboard/labs?city=${loc.city}`)}
                                className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl min-h-[200px]"
                            >
                                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2.5 rounded-lg bg-primary text-black shrink-0 shadow-sm">
                                                <MapPin size={16} />
                                            </div>
                                            <h2 className="text-lg font-bold tracking-tight uppercase text-white transition-colors truncate">
                                                {loc.city}
                                            </h2>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1.5 hover:bg-muted rounded transition-colors text-white/30 shrink-0">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border border-border rounded-lg p-1.5 shadow-xl">
                                                <DropdownMenuItem onClick={(e) => handleRenameCity(e, loc.city)} className="gap-2 text-[10px] font-bold uppercase p-2 rounded-md transition-colors text-white">
                                                    <Edit2 size={12} className="text-primary" /> Rename Hub
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDeleteCity(e, loc.city)} className="gap-2 text-red-600 text-[10px] font-bold uppercase p-2 rounded-md transition-colors">
                                                    <Trash2 size={12} /> Delete Hub
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="flex justify-center flex-1 items-center opacity-40">
                                        <MiniWaveChart
                                            color="#01416D"
                                            width={180}
                                            height={40}
                                            intensity={intensity}
                                            showGrid={false}
                                        />
                                    </div>

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
