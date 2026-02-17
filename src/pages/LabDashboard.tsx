import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Cpu, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const punjabCities = [
    { name: "Lahore", short: "LHR" }, { name: "Faisalabad", short: "FSD" }, { name: "Rawalpindi", short: "RWP" },
    { name: "Gujranwala", short: "GRW" }, { name: "Multan", short: "MUL" }, { name: "Bahawalpur", short: "BWP" },
    { name: "Sargodha", short: "SGD" }, { name: "Sialkot", short: "SKT" }, { name: "Sheikhupura", short: "SKP" },
    { name: "Rahim Yar Khan", short: "RYK" }, { name: "Jhang", short: "JNG" }, { name: "Dera Ghazi Khan", short: "DGK" },
    { name: "Gujrat", short: "GJT" }, { name: "Sahiwal", short: "SWL" }, { name: "Wah Cantonment", short: "WAH" },
    { name: "Kasur", short: "KSR" }, { name: "Okara", short: "OKA" }, { name: "Chiniot", short: "CHT" },
    { name: "Kamoke", short: "KMK" }, { name: "Hafizabad", short: "HFD" }, { name: "Sadiqabad", short: "SDA" },
    { name: "Burewala", short: "BWL" }, { name: "Khanewal", short: "KHL" }, { name: "Muzaffargarh", short: "MZG" },
    { name: "Jhelum", short: "JHL" }, { name: "Mandi Bahauddin", short: "MBD" }, { name: "Pakpattan", short: "PKP" },
    { name: "Bahawalnagar", short: "BWN" }, { name: "Muridke", short: "MRK" }, { name: "Gojra", short: "GJR" },
    { name: "Taxila", short: "TXR" }, { name: "Khushab", short: "KSB" }, { name: "Mianwali", short: "MWL" },
    { name: "Lodhran", short: "LDN" }, { name: "Bhakkar", short: "BKR" }, { name: "Chakwal", short: "CKW" },
    { name: "Layyah", short: "LYH" }, { name: "Attock", short: "ATK" }, { name: "Vehari", short: "VHR" },
    { name: "Nankana Sahib", short: "NKS" }, { name: "Narowal", short: "NRW" }
];

const chartConfig = {
    labCount: { label: "Registered Labs", color: "#01416D" },
    total_pcs: { label: "PC Units", color: "#f99a1d" },
};

const LabDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCity = searchParams.get('city');

    const setSelectedCity = (city: string | null) => {
        if (city) {
            setSearchParams({ city });
        } else {
            setSearchParams({});
        }
    };

    const { data: locResponse } = useQuery({
        queryKey: ['location-stats'],
        queryFn: () => apiFetch('/stats/locations'),
        refetchInterval: 5000,
    });

    const { data: labsResponse, isLoading: labsLoading } = useQuery({
        queryKey: ['city-labs', selectedCity],
        queryFn: () => apiFetch(`/stats/city/${selectedCity}/labs`),
        enabled: !!selectedCity,
        refetchInterval: 5000,
    });

    const locations = locResponse?.locations || [];
    const cityLabs = labsResponse?.labs || [];

    const liveChartData = punjabCities.map(city => {
        const cityStats = locations.find((l: any) => l.city.toLowerCase() === city.name.toLowerCase());
        return {
            city: city.short,
            fullName: city.name,
            labCount: cityStats ? cityStats.total_labs : 0,
        };
    })
        .sort((a, b) => b.labCount - a.labCount)
        .filter(city => city.labCount > 0 || !selectedCity);

    const drillDownData = cityLabs.map((l: any) => ({
        lab_name: l.lab_name,
        total_pcs: l.total_pcs,
    })).sort((a, b) => b.total_pcs - a.total_pcs);

    const maxLabs = Math.max(...liveChartData.map(d => d.labCount), 10);
    const maxDrill = Math.max(...drillDownData.map(d => d.total_pcs), 10);

    return (
        <div className="bg-background h-screen w-full flex flex-col overflow-hidden relative font-sans select-none animate-in fade-in duration-1000">
            {/* Header / Navigation Overlay */}
            <div className="absolute top-6 left-6 z-50 flex flex-col md:flex-row items-center gap-4">
                {selectedCity && (
                    <Button
                        onClick={() => setSelectedCity(null)}
                        className="bg-card/90 hover:bg-muted border border-border text-primary rounded-xl px-5 h-10 flex items-center gap-2 transition-all shadow-xl backdrop-blur-md font-bold text-[10px] uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Institutional Reset
                    </Button>
                )}
                <div className="px-5 py-3 bg-card/80 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(249,154,29,0.5)]" />
                    <h1 className="text-sm md:text-base font-black uppercase tracking-widest text-white font-display leading-none">
                        {selectedCity ? `Regional Hub: ${selectedCity}` : "Institutional Distribution Matrix"}
                    </h1>
                </div>
            </div>

            {/* Actions Overlay */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
                <Button
                    onClick={async () => {
                        const { generateDynamicReport } = await import('@/lib/pdf-generator');
                        if (selectedCity) {
                            await generateDynamicReport('CITY', { labs: cityLabs }, selectedCity);
                        } else {
                            await generateDynamicReport('GLOBAL', { locations });
                        }
                    }}
                    className="bg-white hover:bg-white/90 text-black gap-3 px-6 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl border border-primary/20"
                >
                    <Cpu size={18} />
                    Synthesize Audit
                </Button>
                <div className="hidden xl:flex px-5 py-3 bg-card/80 backdrop-blur-xl border border-border/10 rounded-2xl shadow-xl flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[9px] font-black text-white/90 uppercase tracking-widest leading-none">V4.0-S</span>
                    </div>
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">LGP CORE</span>
                </div>
            </div>

            {/* FULL SCREEN GRAPH AREA */}
            <div className="flex-1 w-full overflow-hidden flex flex-col pt-24 pb-8">
                <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar px-4">
                    <div
                        style={{
                            minWidth: selectedCity
                                ? `${drillDownData.length * 80}px`
                                : `${liveChartData.length * 50}px`,
                            height: "100%"
                        }}
                        className="flex flex-col justify-end"
                    >
                        {labsLoading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
                            </div>
                        ) : (
                            <div className="h-full w-full flex justify-center">
                                <ChartContainer
                                    config={chartConfig}
                                    className={cn(
                                        "h-full w-full",
                                        selectedCity && drillDownData.length < 10 && "max-w-2xl mx-auto"
                                    )}
                                >
                                    <BarChart
                                        data={selectedCity ? drillDownData : liveChartData}
                                        margin={{ top: 40, right: 60, left: 40, bottom: 60 }}
                                        barCategoryGap={10}
                                        onClick={(data) => {
                                            if (data && data.activePayload) {
                                                const payload = data.activePayload[0].payload;
                                                if (!selectedCity) {
                                                    setSelectedCity(payload.fullName);
                                                } else {
                                                    navigate(`/dashboard/lab-summary/${selectedCity}/${payload.lab_name}`);
                                                }
                                            }
                                        }}
                                    >
                                        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey={selectedCity ? "lab_name" : "city"}
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                            tickLine={false}
                                            tick={{ fill: "#f99a1d", fontSize: 11, fontWeight: 700 }}
                                            dy={20}
                                            interval={0}
                                        />
                                        <YAxis
                                            axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                            tickLine={false}
                                            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 800 }}
                                            domain={selectedCity ? [0, Math.ceil(maxDrill / 10) * 10 + 10] : [0, Math.ceil(maxLabs / 5) * 5 + 5]}
                                            dx={-15}
                                        />
                                        <ChartTooltip
                                            cursor={{ fill: 'rgba(249,154,29,0.05)' }}
                                            content={<ChartTooltipContent
                                                className="border-border bg-card text-primary shadow-2xl p-4 scale-110 rounded-xl"
                                            />}
                                        />
                                        <Bar
                                            dataKey={selectedCity ? "total_pcs" : "labCount"}
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                            className="cursor-pointer"
                                        >
                                            {(selectedCity ? drillDownData : liveChartData).map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill="#f99a1d"
                                                    className="transition-all duration-500 hover:opacity-100 opacity-80"
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
