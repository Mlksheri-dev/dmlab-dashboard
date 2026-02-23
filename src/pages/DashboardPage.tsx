import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const COLORS = [
    "#0070f3", // Vibrant Blue
    "#ff9900", // Vibrant Orange
    "#00e676", // Vibrant Green
    "#d500f9", // Vibrant Purple
    "#ff4081", // Vibrant Pink
    "#00bcd4", // Vibrant Cyan
    "#ffeb3b", // Vibrant Yellow
    "#7c4dff", // Vibrant Deep Purple
    "#ff1744", // Vibrant Red
    "#1de9b6", // Vibrant Teal
];

const CustomTooltip = ({ active, payload, centerViewMode }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (data.name === "No Data") return null;

        // Determine if this is a city entry (not one of the known status keys)
        const isCityEntry = !["Online Labs", "Offline Labs", "Online PCs", "Offline PCs"].includes(data.name);
        let valueSuffix = "";
        if (isCityEntry) {
            if (centerViewMode === 'pc') valueSuffix = " PCs";
            else if (centerViewMode === 'tehsil') valueSuffix = " Labs";
            else if (centerViewMode === 'labs') valueSuffix = " Labs";
            else valueSuffix = " Tehsils"; // district mode — show tehsils per district
        }

        return (
            <div className="bg-background/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ color: data.color, backgroundColor: data.color }}
                    />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {data.name}
                    </span>
                </div>
                <p className="text-4xl font-black text-white leading-none tracking-tight">
                    {data.value}{valueSuffix}
                </p>
            </div>
        );
    }
    return null;
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const { data, isLoading } = useQuery({
        queryKey: ["global-lab-stats"],
        queryFn: () => apiFetch("/stats/labs/all"),
        refetchInterval: 10000,
    });

    const centerViewMode = (searchParams.get('centerView') as 'district' | 'tehsil' | 'labs' | 'pc') || 'district';
    const viewMode = (searchParams.get('view') as 'status' | 'online' | 'offline') || 'status';
    const pcViewMode = (searchParams.get('pcView') as 'status' | 'online' | 'offline') || 'status';

    // Default values are handled in the variable assignments below
    // No need to force-update the URL, which causes re-render loops

    const setViewMode = (mode: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', mode);
        setSearchParams(newParams);
    };

    const setPcViewMode = (mode: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('pcView', mode);
        setSearchParams(newParams);
    };

    const setCenterViewMode = (mode: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('centerView', mode);
        setSearchParams(newParams);
    };

    const labs = (Array.isArray(data?.labs) ? data.labs : []).filter((l: any) => l && typeof l === 'object');

    // --- VIEW 1: LAB STATUS (Left) ---
    // --- VIEW 1: LAB UTILIZATION & STATUS (Center) ---
    const usedLabs = labs.filter((l: any) => {
        // A lab is "Used" if it's online and has at least 1 PC being actively used (>15% load)
        // Note: We need device-level data for perfect accuracy, but the aggregated 'labs' 
        // objects might not have this unless the backend provides it.
        // However, based on the previous LabsPage logic, we can try to estimate or 
        // we might need to fetch all devices here too.
        // For now, let's assume 'used' labs are those where the average performance of the lab is decent,
        // or if the backend provides 'active_used' count.
        return Number(l.online || 0) > 0 && (Number(l.active_used || 0) > 0 || Number(l.avg_performance || 0) > 15);
    });

    const idleLabs = labs.filter((l: any) => {
        return Number(l.online || 0) > 0 && !usedLabs.includes(l);
    });

    const offlineLabs = labs.filter((l: any) => Number(l.online || 0) === 0);

    const usedLabsVal = usedLabs.length;
    const idleLabsVal = idleLabs.length;
    const offlineLabsVal = offlineLabs.length;
    const totalLabs = labs.length;

    const statusChartData = [
        { name: "Online Labs", value: usedLabsVal + idleLabsVal, color: "#00e676" }, // Green for Online
        { name: "Offline Labs", value: offlineLabsVal, color: "#ff1744" }, // Red for Offline
    ];

    // --- VIEW 2: PC STATUS (Right) ---
    const totalPCs = labs.reduce((acc: number, l: any) => acc + Number(l.total_pcs || 0), 0);
    const onlinePCs = labs.reduce((acc: number, l: any) => acc + Number(l.online || 0), 0);
    const offlinePCs = totalPCs - onlinePCs;

    const pcStatusChartData = [
        { name: "Online PCs", value: onlinePCs, color: "#00e676" },
        { name: "Offline PCs", value: offlinePCs, color: "#ff1744" },
    ];

    // Safety checks
    const safeStatusChartData = totalLabs > 0 ? statusChartData : [{ name: "No Data", value: 1, color: "#1e293b" }];
    const safePcStatusChartData = totalPCs > 0 ? pcStatusChartData : [{ name: "No Data", value: 1, color: "#1e293b" }];

    // --- VIEW 3: DISTRIBUTION (Center) ---
    const statsMap = new Map<string, { labCount: number, pcCount: number, tehsilSet: Set<string> }>();
    const uniqueTehsils = new Set<string>();
    const cityStatsMap = new Map<string, any>();

    labs.forEach((l: any) => {
        const city = l.city || 'Unknown';
        const tehsil = l.tehsil || 'Unknown';
        uniqueTehsils.add(`${city}|${tehsil}`);
        cityStatsMap.set(city, true);

        const groupKey = centerViewMode === 'tehsil' ? tehsil : city;
        const current = statsMap.get(groupKey) || { labCount: 0, pcCount: 0, tehsilSet: new Set<string>() };
        current.tehsilSet.add(tehsil);
        statsMap.set(groupKey, {
            labCount: current.labCount + 1,
            pcCount: current.pcCount + Number(l.total_pcs || 0),
            tehsilSet: current.tehsilSet
        });
    });

    const totalCities = cityStatsMap.size;
    const totalTehsils = uniqueTehsils.size;

    const chartData = Array.from(statsMap.entries()).map(([name, stats], index) => ({
        name,
        value:
            centerViewMode === 'pc' ? stats.pcCount :
                centerViewMode === 'district' ? stats.tehsilSet.size :  // DISTRICT → tehsils per district
                    stats.labCount,                                          // labs / tehsil → lab count
        color: COLORS[index % COLORS.length]
    }));

    const safeCityChartData = chartData.length > 0 ? chartData : [{ name: "No Data", value: 1, color: "#1e293b" }];
    const centerDisplayTotal =
        centerViewMode === 'pc' ? totalPCs :
            (centerViewMode === 'labs' ? totalLabs :
                (centerViewMode === 'tehsil' ? totalTehsils : totalCities));
    const centerDisplayLabel =
        centerViewMode === 'pc' ? 'PCs' :
            (centerViewMode === 'labs' ? 'Labs' :
                (centerViewMode === 'tehsil' ? 'Tehsils' : 'Districts'));


    // --- LEFT CHART HANDLERS ---
    const handleLeftChartClick = (entry: any) => {
        if (entry.name === "Online Labs") {
            navigate('/dashboard/labs?status=online');
        } else if (entry.name === "Offline Labs") {
            navigate('/dashboard/labs?status=offline');
        }
    };

    // --- CENTER CHART HANDLERS ---
    const handleCenterChartClick = (entry: any) => {
        if (entry.name === "No Data") return;
        if (centerViewMode === 'pc') {
            navigate(`/dashboard/devices?city=${entry.name}`);
        } else if (centerViewMode === 'tehsil') {
            // Navigate to labs page filtered by this specific tehsil
            navigate(`/dashboard/labs?tehsil=${entry.name}`);
        } else {
            // For both 'district' and 'labs' view, show labs for that city
            navigate(`/dashboard/labs?city=${entry.name}`);
        }
    };

    // --- RIGHT CHART HANDLERS ---
    const handleRightChartClick = (entry: any) => {
        if (entry.name === "Online PCs") {
            navigate('/dashboard/devices?status=online');
        } else if (entry.name === "Offline PCs") {
            navigate('/dashboard/devices?status=offline');
        } else if (entry.name !== "No Data") {
            navigate('/dashboard/devices');
        }
    };

    if (isLoading) return <div className="h-full w-full p-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;



    return (
        <div className="h-[90vh] w-full p-4 md:p-8 flex flex-col items-center justify-start relative overflow-y-auto custom-scrollbar">
            {/* Ambient Background Glows */}
            <div className={`absolute -top-20 left-1/4 -translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${viewMode === 'offline' ? 'bg-[#ff1744]/10' :
                viewMode === 'online' ? 'bg-[#00e676]/10' :
                    'bg-[#2979ff]/10'
                }`} />

            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none bg-[#7c4dff]/10" />

            <div className={`absolute -top-20 right-1/4 translate-x-1/2 w-[600px] h-[500px] blur-[120px] rounded-full pointer-events-none transition-colors duration-1000 ${pcViewMode === 'offline' ? 'bg-[#ff1744]/10' :
                pcViewMode === 'online' ? 'bg-[#00e676]/10' :
                    'bg-[#2979ff]/10'
                }`} />

            <div className="relative z-10 w-full max-w-[1800px] -mt-4 grid grid-cols-1 xl:grid-cols-3 gap-8 justify-items-center pb-20">

                {/* --- LEFT: CITY DISTRIBUTION (Dynamic) --- */}
                <div className="flex flex-col items-center gap-8 w-full max-w-[400px]">
                    <div className="relative w-full aspect-square group shrink-0">
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.85] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={safeCityChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="75%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    onClick={handleCenterChartClick}
                                >
                                    {safeCityChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-c-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-500 hover:brightness-110 cursor-pointer filter drop-shadow-2xl hover:stroke-white hover:stroke-2"
                                            style={{ filter: `drop-shadow(0px 0px 10px ${entry.color}80)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip centerViewMode={centerViewMode} />} cursor={false} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text (Cities/Labs/PCs) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none fade-in">
                            <span className="text-7xl font-black text-[#7c4dff] tracking-tighter drop-shadow-[0_0_15px_rgba(124,77,255,0.5)] animate-in zoom-in-50 duration-300">
                                {centerDisplayTotal}
                            </span>
                            <span className="text-[10px] font-bold text-[#7c4dff]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                {centerDisplayLabel}
                            </span>
                        </div>
                    </div>

                    {/* City Controls */}
                    <div className="flex flex-col gap-4 w-full items-center mt-6">
                        <button
                            onClick={() => setCenterViewMode('district')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'district'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            DISTRICT
                        </button>
                        <button
                            onClick={() => setCenterViewMode('tehsil')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'tehsil'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            TEHSIL
                        </button>
                        <button
                            onClick={() => setCenterViewMode('labs')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'labs'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            LABS
                        </button>
                        <button
                            onClick={() => setCenterViewMode('pc')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${centerViewMode === 'pc'
                                ? 'bg-[#7c4dff] text-white border-[#7c4dff] shadow-[0_0_20px_rgba(124,77,255,0.4)] scale-105'
                                : 'bg-transparent text-[#7c4dff] border-[#7c4dff]/30 hover:border-[#7c4dff] hover:bg-[#7c4dff]/10'
                                }`}
                        >
                            PC
                        </button>
                    </div>
                </div>

                {/* --- CENTER: LAB STATUS --- */}
                <div className="flex flex-col items-center gap-8 w-full max-w-[400px] animate-in zoom-in-95 duration-700 delay-100">
                    <div className="relative w-full aspect-square group shrink-0">
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.85] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={
                                        viewMode === 'online' ? [{ name: "Online Labs", value: (usedLabsVal + idleLabsVal) || 1, color: "#00e676" }] :
                                            viewMode === 'offline' ? [{ name: "Offline Labs", value: offlineLabsVal || 1, color: "#ff1744" }] :
                                                statusChartData
                                    }
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="75%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    onClick={handleLeftChartClick}
                                >
                                    {(
                                        viewMode === 'online' ? [{ name: "Online Labs", value: (usedLabsVal + idleLabsVal), color: "#00e676" }] :
                                            viewMode === 'offline' ? [{ name: "Offline Labs", value: offlineLabsVal, color: "#ff1744" }] :
                                                statusChartData
                                    ).map((entry, index) => (
                                        <Cell
                                            key={`cell-l-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-500 hover:brightness-110 cursor-pointer filter drop-shadow-2xl hover:stroke-white hover:stroke-2"
                                            style={{ filter: `drop-shadow(0px 0px 10px ${entry.color}80)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip centerViewMode={centerViewMode} />} cursor={false} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text (Labs) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none fade-in">
                            {viewMode === 'online' ? (
                                <>
                                    <span className="text-7xl font-black text-[#00e676] tracking-tighter drop-shadow-[0_0_15px_rgba(0,230,118,0.5)] animate-in zoom-in-50 duration-300">
                                        {usedLabsVal + idleLabsVal}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#00e676]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                        Online Labs
                                    </span>
                                </>
                            ) : viewMode === 'offline' ? (
                                <>
                                    <span className="text-7xl font-black text-[#ff1744] tracking-tighter drop-shadow-[0_0_15px_rgba(255,23,68,0.5)] animate-in zoom-in-50 duration-300">
                                        {offlineLabsVal}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#ff1744]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                        Offline Labs
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl animate-in zoom-in-50 duration-300">
                                        {totalLabs}
                                    </span>
                                    <div className="flex gap-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <span className="text-[10px] font-bold text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">
                                            {usedLabsVal + idleLabsVal} ONLINE
                                        </span>
                                        <span className="text-[10px] font-bold text-[#ff1744] drop-shadow-[0_0_8px_rgba(255,23,68,0.5)]">
                                            {offlineLabsVal} OFFLINE
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Lab Controls */}
                    <div className="flex flex-col gap-4 w-full items-center mt-6">
                        <button
                            onClick={() => setViewMode('online')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${viewMode === 'online'
                                ? 'bg-[#00e676] text-black border-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.4)] scale-105'
                                : 'bg-transparent text-[#00e676] border-[#00e676]/30 hover:border-[#00e676] hover:bg-[#00e676]/10'
                                }`}
                        >
                            ONLINE
                        </button>
                        <button
                            onClick={() => setViewMode('offline')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${viewMode === 'offline'
                                ? 'bg-[#ff1744] text-white border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.4)] scale-105'
                                : 'bg-transparent text-[#ff1744] border-[#ff1744]/30 hover:border-[#ff1744] hover:bg-[#ff1744]/10'
                                }`}
                        >
                            OFFLINE
                        </button>
                        <button
                            onClick={() => setViewMode('status')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${viewMode === 'status'
                                ? 'bg-[#2979ff] text-white border-[#2979ff] shadow-[0_0_20px_rgba(41,121,255,0.4)] scale-105'
                                : 'bg-transparent text-[#2979ff] border-[#2979ff]/30 hover:border-[#2979ff] hover:bg-[#2979ff]/10'
                                }`}
                        >
                            TOTAL
                        </button>
                    </div>
                </div>

                {/* --- RIGHT: PC STATUS --- */}
                <div className="flex flex-col items-center gap-8 w-full max-w-[400px] animate-in slide-in-from-right-10 duration-700 delay-200">
                    <div className="relative w-full aspect-square group shrink-0">
                        <div className="absolute inset-0 rounded-full border border-white/5 scale-[0.85] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={
                                        pcViewMode === 'online' ? [{ name: "Online PCs", value: onlinePCs || 1, color: "#00e676" }] :
                                            pcViewMode === 'offline' ? [{ name: "Offline PCs", value: offlinePCs || 1, color: "#ff1744" }] :
                                                safePcStatusChartData
                                    }
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="75%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                    onClick={handleRightChartClick}
                                >
                                    {(
                                        pcViewMode === 'online' ? [{ name: "Online PCs", value: onlinePCs, color: "#00e676" }] :
                                            pcViewMode === 'offline' ? [{ name: "Offline PCs", value: offlinePCs, color: "#ff1744" }] :
                                                safePcStatusChartData
                                    ).map((entry, index) => (
                                        <Cell
                                            key={`cell-r-${index}`}
                                            fill={entry.color}
                                            className="transition-all duration-500 hover:brightness-110 cursor-pointer filter drop-shadow-2xl hover:stroke-white hover:stroke-2"
                                            style={{ filter: `drop-shadow(0px 0px 10px ${entry.color}80)` }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip centerViewMode={centerViewMode} />} cursor={false} />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text (PCs) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none fade-in">
                            {pcViewMode === 'online' ? (
                                <>
                                    <span className="text-7xl font-black text-[#00e676] tracking-tighter drop-shadow-[0_0_15px_rgba(0,230,118,0.5)] animate-in zoom-in-50 duration-300">
                                        {onlinePCs}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#00e676]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                        Online PCs
                                    </span>
                                </>
                            ) : pcViewMode === 'offline' ? (
                                <>
                                    <span className="text-7xl font-black text-[#ff1744] tracking-tighter drop-shadow-[0_0_15px_rgba(255,23,68,0.5)] animate-in zoom-in-50 duration-300">
                                        {offlinePCs}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#ff1744]/60 uppercase tracking-[0.4em] mt-2 ml-1">
                                        Offline PCs
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl animate-in zoom-in-50 duration-300">
                                        {totalPCs}
                                    </span>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mt-2 ml-1">
                                        Total PCs
                                    </span>
                                    <div className="flex gap-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <span className="text-[10px] font-bold text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">
                                            {onlinePCs} ONLINE
                                        </span>
                                        <span className="text-[10px] font-bold text-[#ff1744] drop-shadow-[0_0_8px_rgba(255,23,68,0.5)]">
                                            {offlinePCs} OFFLINE
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* PC Controls */}
                    <div className="flex flex-col gap-4 w-full items-center mt-6">
                        <button
                            onClick={() => setPcViewMode('online')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${pcViewMode === 'online'
                                ? 'bg-[#00e676] text-black border-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.4)] scale-105'
                                : 'bg-transparent text-[#00e676] border-[#00e676]/30 hover:border-[#00e676] hover:bg-[#00e676]/10'
                                }`}
                        >
                            ONLINE
                        </button>
                        <button
                            onClick={() => setPcViewMode('offline')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${pcViewMode === 'offline'
                                ? 'bg-[#ff1744] text-white border-[#ff1744] shadow-[0_0_20px_rgba(255,23,68,0.4)] scale-105'
                                : 'bg-transparent text-[#ff1744] border-[#ff1744]/30 hover:border-[#ff1744] hover:bg-[#ff1744]/10'
                                }`}
                        >
                            OFFLINE
                        </button>
                        <button
                            onClick={() => setPcViewMode('status')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm tracking-wider transition-all duration-300 border ${pcViewMode === 'status'
                                ? 'bg-[#2979ff] text-white border-[#2979ff] shadow-[0_0_20px_rgba(41,121,255,0.4)] scale-105'
                                : 'bg-transparent text-[#2979ff] border-[#2979ff]/30 hover:border-[#2979ff] hover:bg-[#2979ff]/10'
                                }`}
                        >
                            TOTAL
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
