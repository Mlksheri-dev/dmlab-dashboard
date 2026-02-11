import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu } from "lucide-react";
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
    labCount: { label: "Registered Labs", color: "#3b82f6" },
    total_pcs: { label: "PC Units", color: "#eab308" },
};

const LabDashboard = () => {
    const navigate = useNavigate();
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

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
        .sort((a, b) => b.labCount - a.labCount) // Highest labs first
        .filter(city => city.labCount > 0 || !selectedCity); // Keep only active ones or all if global view is needed (actually filtering might be better to remove empty ones)

    const drillDownData = cityLabs.map((l: any) => ({
        lab_name: l.lab_name,
        total_pcs: l.total_pcs,
    })).sort((a, b) => b.total_pcs - a.total_pcs); // Highest PCs first

    const maxLabs = Math.max(...liveChartData.map(d => d.labCount), 10);
    const maxDrill = Math.max(...drillDownData.map(d => d.total_pcs), 10);

    return (
        <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden relative">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Back Button Overlay - Top Left */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                {selectedCity && (
                    <Button
                        onClick={() => setSelectedCity(null)}
                        className="bg-primary/20 hover:bg-primary/40 border border-primary/40 text-foreground rounded-full px-4 md:px-6 h-10 md:h-12 flex items-center gap-2 md:gap-3 backdrop-blur-xl transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="font-black italic text-[9px] md:text-xs uppercase tracking-widest">Global View</span>
                    </Button>
                )}
                <div className="p-3 md:p-4 bg-muted/40 backdrop-blur-xl border border-border rounded-xl md:rounded-2xl shrink-0 text-foreground">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_hsl(var(--primary))]" />
                        <h1 className="text-sm md:text-xl font-black italic uppercase tracking-tighter leading-none whitespace-nowrap">
                            {selectedCity ? `TotalcitywiseLab: ${selectedCity}` : "CITY WISE LAB"}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Technical Detail Overlay - Top Right */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex items-center gap-4">
                <Button
                    onClick={async () => {
                        const { generateDynamicReport } = await import('@/lib/pdf-generator');
                        if (selectedCity) {
                            await generateDynamicReport('CITY', { labs: cityLabs }, selectedCity);
                        } else {
                            await generateDynamicReport('GLOBAL', { locations });
                        }
                    }}
                    className="bg-muted hover:bg-muted/80 border border-border text-foreground gap-2 px-4 md:px-6 rounded-xl md:rounded-2xl h-10 md:h-12 text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all group backdrop-blur-xl"
                >
                    <Cpu size={14} className="text-primary group-hover:scale-110 transition-transform" />
                    generate dailybasePDF
                </Button>
                <div className="p-3 md:p-4 bg-muted/40 backdrop-blur-xl border border-border rounded-xl md:rounded-2xl flex flex-col items-end shrink-0 max-w-[120px] md:max-w-none text-foreground">

                    <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                        <Cpu size={10} className="text-primary hidden md:block" />
                        <span className="text-[7px] md:text-[10px] font-black opacity-30 uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono italic truncate">Analysis Engine</span>
                    </div>
                    <span className="text-[7px] md:text-[10px] font-black uppercase opacity-60 tracking-widest">V4.0-AUTH</span>
                </div>
            </div>



            {/* FULL SCREEN GRAPH AREA */}
            <div className="flex-1 w-full overflow-hidden flex flex-col pt-32">
                <div className="flex-1 w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                    <div
                        style={{
                            minWidth: selectedCity
                                ? (drillDownData.length < 10 ? "100%" : `${drillDownData.length * 160}px`)
                                : "5000px",
                            height: "100%"
                        }}
                        className="flex flex-col justify-end pb-4 px-12"
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
                                        selectedCity && drillDownData.length < 10 && "max-w-4xl mx-auto"
                                    )}
                                >
                                    <BarChart
                                        data={selectedCity ? drillDownData : liveChartData}
                                        margin={{ top: 20, right: 60, left: 40, bottom: 40 }}
                                        barCategoryGap={selectedCity ? "45%" : "25%"}
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
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            </linearGradient>
                                            <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#eab308" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#eab308" stopOpacity={0.15} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="currentColor" opacity={0.1} strokeDasharray="5 5" />
                                        <XAxis
                                            dataKey={selectedCity ? "lab_name" : "city"}
                                            axisLine={{ stroke: 'currentColor', strokeWidth: 2, opacity: 0.1 }}
                                            tickLine={false}
                                            tick={{ fill: "currentColor", fontSize: 13, fontWeight: 900, opacity: 0.8 }}
                                            dy={20}
                                            interval={0}
                                        />
                                        <YAxis
                                            axisLine={{ stroke: 'currentColor', strokeWidth: 2, opacity: 0.1 }}
                                            tickLine={false}
                                            tick={{ fill: "currentColor", fontSize: 18, fontWeight: 950, opacity: 0.6 }}
                                            domain={selectedCity ? [0, Math.ceil(maxDrill / 10) * 10 + 10] : [0, Math.ceil(maxLabs / 5) * 5 + 5]}
                                            dx={-15}
                                        />
                                        <ChartTooltip
                                            cursor={{ fill: 'currentColor', opacity: 0.05 }}
                                            content={<ChartTooltipContent
                                                className="border-border bg-popover/98 backdrop-blur-3xl shadow-2xl p-4 scale-150 text-foreground"
                                            />}
                                        />
                                        <Bar
                                            dataKey={selectedCity ? "total_pcs" : "labCount"}
                                            radius={[8, 8, 0, 0]}
                                            barSize={selectedCity ? 120 : 65}
                                            className="cursor-pointer"
                                        >
                                            {(selectedCity ? drillDownData : liveChartData).map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={selectedCity ? "url(#yellowGradient)" : "url(#blueGradient)"}
                                                    style={{ filter: `drop-shadow(0 0 20px ${selectedCity ? 'rgba(234, 179, 8, 0.6)' : 'rgba(59, 130, 246, 0.6)'})` }}
                                                    className="transition-all duration-300 hover:brightness-150 opacity-100"
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
