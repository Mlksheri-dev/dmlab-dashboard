import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { FileText, Loader2, ChevronRight, Globe, Beaker, Monitor } from "lucide-react";
import { toast } from "sonner";
import { generateCustomMultiLabReport } from "@/lib/pdf-generator";
import { cn } from "@/lib/utils";

const punjabCities = [
    { name: "Abdul Hakeem" }, { name: "Ahmadpur East" }, { name: "Ahmadpur Sial" }, { name: "Ahmed Nager Chatha" },
    { name: "Alipur" }, { name: "Alipur Chatha" }, { name: "Arifwala" }, { name: "Athara Hazari" },
    { name: "Attock" }, { name: "Baddomalhi" }, { name: "Bahawalnagar" }, { name: "Bahawalpur" },
    { name: "Bhalwal" }, { name: "Bhakkar" }, { name: "Bhawana" }, { name: "Bhera" },
    { name: "Burewala" }, { name: "Chak Azam Saffar" }, { name: "Chak Jhumra" }, { name: "Chakwal" },
    { name: "Chichawatni" }, { name: "Chiniot" }, { name: "Chishtian" }, { name: "Choa Saidan Shah" },
    { name: "Dahr Ranwan" }, { name: "Darya Khan" }, { name: "Daska" }, { name: "Dera Ghazi Khan" },
    { name: "Dhaular" }, { name: "Dina" }, { name: "Dinga" }, { name: "Dipalpur" },
    { name: "Dunyapur" }, { name: "Faisalabad" }, { name: "Fateh Jang" }, { name: "Fazilpur" },
    { name: "Fort Abbas" }, { name: "Ghakhar Mandi" }, { name: "Gojra" }, { name: "Gujar Khan" },
    { name: "Gujranwala" }, { name: "Gujrat" }, { name: "Hadali" }, { name: "Hafizabad" },
    { name: "Harnoli" }, { name: "Haroonabad" }, { name: "Hasilpur" }, { name: "Hassan Abdal" },
    { name: "Haveli Lakha" }, { name: "Hazro" }, { name: "Hujra Shah Muqeem" }, { name: "Islampur" },
    { name: "Jahanian" }, { name: "Jalalpur Jattan" }, { name: "Jalalpur Pirwala" }, { name: "Jampur" },
    { name: "Jand" }, { name: "Jandanwala" }, { name: "Jaranwala" }, { name: "Jauharabad" },
    { name: "Jhang" }, { name: "Jhelum" }, { name: "Kabirwala" }, { name: "Kahror Pacca" },
    { name: "Kalabagh" }, { name: "Kalaswala" }, { name: "Kallar Kahar" }, { name: "Kallar Syedan" },
    { name: "Kalur Kot" }, { name: "Kamalia" }, { name: "Kamoke" }, { name: "Karor Lal Esan" },
    { name: "Kashmor" }, { name: "Kasur" }, { name: "Khairpur Tamewali" }, { name: "Khanewal" },
    { name: "Khangarh" }, { name: "Khanpur" }, { name: "Kharian" }, { name: "Khewra" },
    { name: "Khurrianwala" }, { name: "Khushab" }, { name: "Kot Adu" }, { name: "Kot Mithan" },
    { name: "Kot Momin" }, { name: "Kot Radha Kishan" }, { name: "Kot Samaba" }, { name: "Kot Sultan" },
    { name: "Kunda" }, { name: "Kunjah" }, { name: "Ladhewala Waraich" }, { name: "Lahore" },
    { name: "Lalamusa" }, { name: "Lalian" }, { name: "Layyah" }, { name: "Liaquat Pur" },
    { name: "Lodhran" }, { name: "Ludhewala" }, { name: "Mailsi" }, { name: "Malakwal" },
    { name: "Mamoori" }, { name: "Mandi Bahauddin" }, { name: "Mandi Warburton" }, { name: "Mankera" },
    { name: "Mari" }, { name: "Mian Channu" }, { name: "Mianwali" }, { name: "Minchanabad" },
    { name: "Mitha Tiwana" }, { name: "Multan" }, { name: "Muridke" }, { name: "Murree" },
    { name: "Mustafabad" }, { name: "Muzaffargarh" }, { name: "Nankana Sahib" }, { name: "Narang" },
    { name: "Narowal" }, { name: "Naushera" }, { name: "Noorpur Thal" }, { name: "Nowshera Virkan" },
    { name: "Okara" }, { name: "Pakpattan" }, { name: "Pasrur" }, { name: "Pattoki" },
    { name: "Phalia" }, { name: "Pindi Bhattian" }, { name: "Pindi Gheb" }, { name: "Pir Mahal" },
    { name: "Qila Didar Singh" }, { name: "Qila Sobha Singh" }, { name: "Rabwah" }, { name: "Raiwind" },
    { name: "Rajanpur" }, { name: "Rahim Yar Khan" }, { name: "Rawalpindi" }, { name: "Renala Khurd" },
    { name: "Rojhan" }, { name: "Sadiqabad" }, { name: "Safdarabad" }, { name: "Sahiwal" },
    { name: "Samberial" }, { name: "Sangla Hill" }, { name: "Sarai Alamgir" }, { name: "Sarai Sidhu" },
    { name: "Sargodha" }, { name: "Shahkot" }, { name: "Shahpur" }, { name: "Shakargarh" },
    { name: "Sheikhupura" }, { name: "Sher Shah" }, { name: "Shorkot" }, { name: "Shujaabad" },
    { name: "Sialkot" }, { name: "Sillanwali" }, { name: "Sohawa" }, { name: "Soianwala" },
    { name: "Tandlianwala" }, { name: "Talagang" }, { name: "Taranda Aurat" }, { name: "Taunsa Sharif" },
    { name: "Taxila" }, { name: "Tiba Sultanpur" }, { name: "Toba Tek Singh" }, { name: "Tulamba" },
    { name: "Uch Sharif" }, { name: "Vehari" }, { name: "Wah Cantonment" }, { name: "Wazirabad" },
    { name: "Yazman" }, { name: "Zafarwal" }, { name: "Zahir Pir" }
];

export function GeneratePDFDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [labsByCity, setLabsByCity] = useState<Record<string, any[]>>({});
    const [selectedLabs, setSelectedLabs] = useState<Record<string, string[]>>({});
    const [fetchingLabs, setFetchingLabs] = useState<string[]>([]);
    const [pcsByLab, setPcsByLab] = useState<Record<string, any[]>>({});
    const [selectedPCs, setSelectedPCs] = useState<Record<string, string[]>>({}); // Keyed by lab_name
    const [fetchingPCs, setFetchingPCs] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            fetchCities();
        }
    }, [open]);

    const fetchCities = async () => {
        try {
            const response = await apiFetch("/stats/locations");
            const apiCities = response.locations || [];

            // Merge punjabCities with API data to show lab counts where available
            const mergedCities = punjabCities.map(pc => {
                const apiMatch = apiCities.find((ac: any) => ac.city.toLowerCase() === pc.name.toLowerCase());
                return {
                    city: pc.name,
                    total_labs: apiMatch ? apiMatch.total_labs : 0
                };
            }).sort((a, b) => b.total_labs - a.total_labs); // Show cities with labs at top

            setCities(mergedCities);
        } catch (error) {
            console.error("Failed to fetch cities", error);
            // Fallback to static list if API fails
            setCities(punjabCities.map(pc => ({ city: pc.name, total_labs: 0 })));
        }
    };

    const toggleCity = async (cityName: string) => {
        const isSelected = selectedCities.includes(cityName);
        if (isSelected) {
            setSelectedCities(prev => prev.filter(c => c !== cityName));
            const newSelectedLabs = { ...selectedLabs };
            delete newSelectedLabs[cityName];
            setSelectedLabs(newSelectedLabs);
        } else {
            setSelectedCities(prev => [...prev, cityName]);
            if (!labsByCity[cityName]) {
                fetchLabsForCity(cityName);
            }
        }
    };

    const fetchLabsForCity = async (cityName: string) => {
        setFetchingLabs(prev => [...prev, cityName]);
        try {
            const response = await apiFetch(`/stats/city/${cityName}/labs`);
            setLabsByCity(prev => ({ ...prev, [cityName]: response.labs || [] }));
            // Auto select all labs by default when a city is selected
            setSelectedLabs(prev => ({
                ...prev,
                [cityName]: (response.labs || []).map((l: any) => l.lab_name)
            }));
        } catch (error) {
            toast.error(`Failed to fetch labs for ${cityName}`);
        } finally {
            setFetchingLabs(prev => prev.filter(c => c !== cityName));
        }
    };

    const toggleLab = (cityName: string, labName: string) => {
        const currentLabs = selectedLabs[cityName] || [];
        const isSelected = currentLabs.includes(labName);

        if (isSelected) {
            setSelectedLabs(prev => ({
                ...prev,
                [cityName]: currentLabs.filter(l => l !== labName)
            }));
            // Clear PC selection for this lab
            const newSelectedPCs = { ...selectedPCs };
            delete newSelectedPCs[labName];
            setSelectedPCs(newSelectedPCs);
        } else {
            setSelectedLabs(prev => ({
                ...prev,
                [cityName]: [...currentLabs, labName]
            }));
            // Fetch PCs for this lab if not already fetched
            if (!pcsByLab[labName]) {
                fetchPCsForLab(cityName, labName);
            }
        }
    };

    const fetchPCsForLab = async (cityName: string, labName: string) => {
        setFetchingPCs(prev => [...prev, labName]);
        try {
            const response = await apiFetch(`/devices?city=${cityName}&lab=${labName}`);
            const devices = response.devices || [];
            setPcsByLab(prev => ({ ...prev, [labName]: devices }));
            // Auto select all PCs by default when a lab is selected
            setSelectedPCs(prev => ({
                ...prev,
                [labName]: devices.map((d: any) => d.system_id)
            }));
        } catch (error) {
            toast.error(`Failed to fetch PCs for ${labName}`);
        } finally {
            setFetchingPCs(prev => prev.filter(l => l !== labName));
        }
    };

    const togglePC = (labName: string, pcId: string) => {
        const currentPCs = selectedPCs[labName] || [];
        if (currentPCs.includes(pcId)) {
            setSelectedPCs(prev => ({
                ...prev,
                [labName]: currentPCs.filter(id => id !== pcId)
            }));
        } else {
            setSelectedPCs(prev => ({
                ...prev,
                [labName]: [...currentPCs, pcId]
            }));
        }
    };

    const handleSelectAllPCsForLab = (labName: string) => {
        const allPCsInLab = (pcsByLab[labName] || []).map((d: any) => d.system_id);
        const currentSelected = selectedPCs[labName] || [];

        if (currentSelected.length === allPCsInLab.length) {
            setSelectedPCs(prev => ({ ...prev, [labName]: [] }));
        } else {
            setSelectedPCs(prev => ({ ...prev, [labName]: allPCsInLab }));
        }
    };

    const handleSelectAllCities = () => {
        if (selectedCities.length === cities.length) {
            setSelectedCities([]);
            setSelectedLabs({});
        } else {
            const allCityNames = cities.map(c => c.city);
            setSelectedCities(allCityNames);
            allCityNames.forEach(city => {
                if (!labsByCity[city]) {
                    fetchLabsForCity(city);
                }
            });
        }
    };

    const handleSelectAllLabsForCity = (cityName: string) => {
        const allLabsInCity = (labsByCity[cityName] || []).map(l => l.lab_name);
        const currentSelected = selectedLabs[cityName] || [];

        if (currentSelected.length === allLabsInCity.length) {
            setSelectedLabs(prev => ({ ...prev, [cityName]: [] }));
        } else {
            setSelectedLabs(prev => ({ ...prev, [cityName]: allLabsInCity }));
        }
    };

    const handleGenerate = async () => {
        if (selectedCities.length === 0) {
            toast.error("Please select at least one city");
            return;
        }

        const reportData = selectedCities
            .map(city => {
                const cityLabs = selectedLabs[city] || [];
                // Filter labs to only include those that have at least one PC selected
                const filteredLabs = cityLabs.filter(labName => {
                    const pcs = selectedPCs[labName];
                    return pcs && pcs.length > 0;
                });

                return {
                    city,
                    labs: filteredLabs,
                    pcs: selectedPCs
                };
            })
            .filter(item => item.labs.length > 0);

        if (reportData.length === 0) {
            toast.error("Please select at least one lab");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Generating customized Excel report...");
        try {
            await generateCustomMultiLabReport(reportData);
            toast.success("Excel Report Generated Successfully", { id: toastId });
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Excel report", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-xs font-black text-white bg-secondary hover:bg-secondary/90 transition-all duration-300 shadow-xl group border border-secondary/20">
                    <FileText className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>GENERATE EXCEL</span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] bg-card border-border text-white p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-muted/30 border-b border-border">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        Bulk Generate Reports
                    </DialogTitle>
                </DialogHeader>

                <div className="flex h-[450px]">
                    {/* Cities Column */}
                    <div className="w-1/3 border-r border-border flex flex-col">
                        <div className="p-4 bg-muted/10 border-b border-border flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Select City
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7 px-2 font-bold hover:bg-primary/10 hover:text-primary"
                                onClick={handleSelectAllCities}
                            >
                                {selectedCities.length === cities.length ? "DESELECT ALL" : "SELECT ALL"}
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-1">
                                {cities.map((city) => (
                                    <div
                                        key={city.city}
                                        className={cn(
                                            "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer group",
                                            selectedCities.includes(city.city)
                                                ? "bg-primary/10 border border-primary/20"
                                                : "hover:bg-muted/50 border border-transparent"
                                        )}
                                        onClick={() => toggleCity(city.city)}
                                    >
                                        <Checkbox
                                            checked={selectedCities.includes(city.city)}
                                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase tracking-wide">{city.city}</p>
                                            <p className="text-[9px] text-muted-foreground font-medium">{city.total_labs} Facilities</p>
                                        </div>
                                        {selectedCities.includes(city.city) && (
                                            <ChevronRight className="w-3 h-3 text-primary animate-pulse" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Labs Column */}
                    <div className="w-1/3 border-r border-border flex flex-col bg-background/50">
                        <div className="p-4 bg-muted/10 border-b border-border flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Beaker className="w-3 h-3" /> Select Labs
                            </span>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            {selectedCities.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 p-8 text-center">
                                    <Globe className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Select a city to explore facilities</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedCities.map(cityName => (
                                        <div key={cityName} className="space-y-2">
                                            <div className="flex items-center justify-between px-2 pt-2">
                                                <h4 className="text-[10px] font-black text-primary uppercase tracking-tighter">{cityName}</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-1 text-[8px] font-bold"
                                                    onClick={() => handleSelectAllLabsForCity(cityName)}
                                                >
                                                    {(selectedLabs[cityName]?.length || 0) === (labsByCity[cityName]?.length || 0) ? "NONE" : "ALL"}
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                {fetchingLabs.includes(cityName) ? (
                                                    <div className="flex items-center gap-2 p-3 opacity-50">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        <span className="text-[10px] font-bold">Fetching Clusters...</span>
                                                    </div>
                                                ) : (
                                                    labsByCity[cityName]?.map((lab) => (
                                                        <div
                                                            key={lab.lab_name}
                                                            className={cn(
                                                                "flex items-center space-x-3 p-2.5 rounded-lg transition-all cursor-pointer",
                                                                selectedLabs[cityName]?.includes(lab.lab_name)
                                                                    ? "bg-secondary/10 border border-secondary/20"
                                                                    : "hover:bg-muted/50 border border-transparent"
                                                            )}
                                                            onClick={() => toggleLab(cityName, lab.lab_name)}
                                                        >
                                                            <Checkbox
                                                                checked={selectedLabs[cityName]?.includes(lab.lab_name)}
                                                                className="border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-black"
                                                            />
                                                            <div>
                                                                <p className="text-[11px] font-bold uppercase tracking-tight text-white">{lab.lab_name}</p>
                                                                <p className="text-[8px] text-muted-foreground font-medium">{lab.total_pcs} PC Assets</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* PCs Column */}
                    <div className="w-1/3 flex flex-col bg-background/30">
                        <div className="p-4 bg-muted/10 border-b border-border flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Monitor className="w-3 h-3" /> Select System
                            </span>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            {Object.values(selectedLabs).flat().length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 p-8 text-center">
                                    <Beaker className="w-10 h-10 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Select facilities to analyze nodes</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(selectedLabs).map(([cityName, labs]) => (
                                        labs.map(labName => (
                                            <div key={`${cityName}-${labName}`} className="space-y-2">
                                                <div className="flex items-center justify-between px-2 pt-2">
                                                    <h4 className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[150px]">{labName}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-1 text-[8px] font-bold"
                                                        onClick={() => handleSelectAllPCsForLab(labName)}
                                                    >
                                                        {(selectedPCs[labName]?.length || 0) === (pcsByLab[labName]?.length || 0) ? "NONE" : "ALL"}
                                                    </Button>
                                                </div>
                                                <div className="space-y-1">
                                                    {fetchingPCs.includes(labName) ? (
                                                        <div className="flex items-center gap-2 p-3 opacity-50">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            <span className="text-[10px] font-bold">Syncing Nodes...</span>
                                                        </div>
                                                    ) : (
                                                        pcsByLab[labName]?.map((pc) => (
                                                            <div
                                                                key={pc.system_id}
                                                                className={cn(
                                                                    "flex items-center space-x-3 p-2 rounded-lg transition-all cursor-pointer",
                                                                    selectedPCs[labName]?.includes(pc.system_id)
                                                                        ? "bg-primary/10 border border-primary/20"
                                                                        : "hover:bg-muted/50 border border-transparent"
                                                                )}
                                                                onClick={() => togglePC(labName, pc.system_id)}
                                                            >
                                                                <Checkbox
                                                                    checked={selectedPCs[labName]?.includes(pc.system_id)}
                                                                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                                                />
                                                                <div className="truncate">
                                                                    <p className="text-[10px] font-bold uppercase tracking-tight truncate">{pc.pc_name || "Station"}</p>
                                                                    <p className="text-[7px] text-muted-foreground font-medium">{pc.system_id}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t border-border flex items-center justify-between sm:justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Selected Entities</span>
                        <span className="text-xs font-bold text-white">
                            {selectedCities.length} Cities / {Object.values(selectedLabs).flat().length} Labs / {Object.values(selectedPCs).flat().length} Nodes
                        </span>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || selectedCities.length === 0}
                        className="bg-secondary hover:bg-secondary/90 text-black font-black text-[10px] uppercase tracking-widest px-8 h-11 rounded-xl shadow-xl transition-all active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                GENERATE REPORT
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
