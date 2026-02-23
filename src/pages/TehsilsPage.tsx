
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, Search, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TehsilsPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const city = searchParams.get('city');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: statsData, isLoading } = useQuery({
        queryKey: ['global-lab-stats'],
        queryFn: () => apiFetch('/stats/labs/all'),
        refetchInterval: 10000,
    });

    const tehsils = useMemo(() => {
        const labs = Array.isArray(statsData?.labs) ? statsData.labs : [];
        const cityLabs = labs.filter((l: any) => l.city?.toLowerCase() === city?.toLowerCase());

        const tehsilMap = new Map<string, any>();
        cityLabs.forEach((lab: any) => {
            const tehsilName = lab.tehsil || 'Unknown';
            if (!tehsilMap.has(tehsilName)) {
                tehsilMap.set(tehsilName, {
                    tehsil: tehsilName,
                    city: lab.city,
                    total_pcs: 0,
                    online: 0,
                    total_labs: 0
                });
            }
            const target = tehsilMap.get(tehsilName);
            target.total_pcs += Number(lab.total_pcs || 0);
            target.online += Number(lab.online || 0);
            target.total_labs += 1;
        });

        return Array.from(tehsilMap.values());
    }, [statsData, city]);

    const filteredTehsils = tehsils.filter((t: any) =>
        t.tehsil.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-right-4 duration-700 bg-background min-h-screen">
            <header className="pb-6 border-b border-border space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 rounded-lg bg-card border border-border text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-primary hover:border-primary transition-all font-display"
                            onClick={() => navigate('/dashboard/overview')}
                        >
                            <ArrowLeft className="w-3 h-3 mr-2" /> Back to Districts
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight uppercase text-white font-display leading-tight">
                                TEHSILS IN <span className="text-primary">{city}</span>
                            </h1>
                            <p className="text-white/40 font-bold uppercase tracking-wider text-[9px] mt-1">
                                Regional Hubs & Tehsil-level Infrastructure Breakdown
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <Input
                            placeholder="SEARCH BY TEHSIL NAME..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 bg-card border-border focus:ring-1 focus:ring-primary text-[10px] font-bold uppercase tracking-wider h-11 rounded-lg transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
            ) : filteredTehsils.length === 0 ? (
                <div className="p-20 text-center bg-card border border-dashed border-border rounded-2xl shadow-sm">
                    <Landmark className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-primary uppercase tracking-tight">No Tehsils Found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTehsils.map((t: any) => {
                        return (
                            <Card
                                key={t.tehsil}
                                onClick={() => navigate(`/dashboard/labs?city=${city}&tehsil=${t.tehsil}`)}
                                className="group relative overflow-hidden bg-card cursor-pointer border border-border hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-lg rounded-2xl"
                            >
                                <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-secondary text-white shadow-sm group-hover:bg-primary group-hover:text-black transition-colors">
                                            <Landmark size={20} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h2 className="text-lg font-bold tracking-tight uppercase text-white truncate">
                                                {t.tehsil}
                                            </h2>
                                            <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                                <MapPin size={10} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{t.city}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-white/20 group-hover:text-primary transition-colors" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Labs</p>
                                            <p className="text-xl font-bold text-white leading-none">{t.total_labs}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-muted/50 border border-border">
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Active</p>
                                            <p className="text-xl font-bold text-emerald-400 leading-none">{t.online}</p>
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
