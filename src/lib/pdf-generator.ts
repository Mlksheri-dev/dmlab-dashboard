import { format } from 'date-fns';
import { apiFetch } from './api';
import * as XLSX from 'xlsx';

type ReportType = 'GLOBAL' | 'CITY' | 'LAB' | 'SYSTEM' | 'PC';

export async function generateDynamicReport(type: ReportType, data: any, context?: string) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');

        // Helper to get score safely
        const getScore = (item: any) => {
            const val = item.avg_performance ?? item.avg_score ?? item.cpu_score ?? 0;
            return parseFloat(String(val)) || 0;
        };

        // EXCEL DATA PREPARATION
        const workbook = XLSX.utils.book_new();
        let fileName = 'Audit_Report';

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            fileName = `Global_Level_Report_${fileTimestamp}`;

            const excelData = locations.map((loc: any) => ({
                "City / Region": loc.city,
                "Total Labs": loc.total_labs,
                "Total PCs": loc.total_pcs,
                "Online": loc.online,
                "Offline": loc.offline,
                "Performance Score (%)": getScore(loc).toFixed(1)
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(workbook, ws, "Regional_Distribution");
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';
            fileName = `City_Level_Report_${(cityName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;

            const excelData = labs.map((l: any) => ({
                "Lab Facility Name": l.lab_name,
                "Total PCs": l.total_pcs,
                "Online": l.online,
                "Offline": l.offline,
                "Performance Score Total": (getScore(l) * (l.total_pcs || 1)).toFixed(0),
                "Health (%)": getScore(l).toFixed(1)
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(workbook, ws, "Lab_Cluster_Details");
        }
        else if (type === 'LAB' || (type === 'SYSTEM' && data.devices)) {
            const devices = data.devices || [];
            const labName = context || data.lab || 'GLOBAL FLEET';
            fileName = `Lab_Level_Report_${(labName || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;
            if (type === 'SYSTEM') fileName = `All_Systems_Report_${fileTimestamp}`;

            // Prepare Summary Sheet
            const totalPcs = data.total_pcs ?? devices.length;
            const onlineCount = data.online ?? devices.filter((d: any) => d.status === 'online').length;
            const offlineCount = data.offline ?? (totalPcs - onlineCount);

            const summaryData = [{
                "Metric": "Total PCs", "Value": totalPcs
            }, {
                "Metric": "Online", "Value": onlineCount
            }, {
                "Metric": "Offline", "Value": offlineCount
            }];
            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, wsSummary, "Summary");

            // Prepare Inventory Sheet
            if (devices.length > 0) {
                const excelData = devices.map((d: any) => ({
                    "Station Name": d.pc_name || 'Station',
                    "Status": (d.status || 'offline').toUpperCase(),
                    "CPU Load (%)": getScore(d).toFixed(1),
                    "Last Seen": d.last_seen ? format(new Date(d.last_seen), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
                    "Application Usage": d.app_usage ? JSON.stringify(d.app_usage) : "{}"
                }));
                const ws = XLSX.utils.json_to_sheet(excelData);
                XLSX.utils.book_append_sheet(workbook, ws, "Node_Inventory");
            }
        }
        else if (type === 'PC') {
            const device = data;
            const history = data.history || [];
            fileName = `PC_Report_${(data.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;

            // Sheet 1: Profile
            const profileData = [{
                "Property": "System ID", "Value": device.system_id
            }, {
                "Property": "PC Name", "Value": device.pc_name
            }, {
                "Property": "Region", "Value": device.city?.toUpperCase() || 'N/A'
            }, {
                "Property": "Facility", "Value": device.lab_name?.toUpperCase() || 'N/A'
            }, {
                "Property": "Status", "Value": device.isOnline ? 'ONLINE' : 'OFFLINE'
            }, {
                "Property": "Health Score", "Value": `${getScore(device).toFixed(1)}%`
            }];
            const wsProfile = XLSX.utils.json_to_sheet(profileData);
            XLSX.utils.book_append_sheet(workbook, wsProfile, "Profile");

            // Sheet 2: App Usage
            if (device.app_usage) {
                const appUsageData = Object.entries(device.app_usage as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([app, secs]) => ({
                        "Application": app,
                        "Duration (Seconds)": secs,
                        "Duration (Formatted)": `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
                    }));
                const wsApps = XLSX.utils.json_to_sheet(appUsageData);
                XLSX.utils.book_append_sheet(workbook, wsApps, "App_Usage");
            }

            // Sheet 3: History
            const historyData = history.map((h: any) => ({
                "Date": h.history_date || format(new Date(h.start_time), 'yyyy-MM-dd'),
                "Avg Performance (%)": getScore(h).toFixed(1),
                "Runtime Minutes": h.runtime_minutes || 0,
                "Runtime (Hours)": ((h.runtime_minutes || 0) / 60).toFixed(2),
                "Raw App Usage Data": h.app_usage ? JSON.stringify(h.app_usage) : "{}"
            }));
            const wsHistory = XLSX.utils.json_to_sheet(historyData);
            XLSX.utils.book_append_sheet(workbook, wsHistory, "History_Archive");
        }

        // SAVE EXCEL
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error("Excel Generation Error:", error);
        throw error;
    }
}

export const generateDailyReport = (stats: any, locations: any[]) => generateDynamicReport('GLOBAL', { locations });

export async function generateCustomMultiLabReport(selectedData: { city: string, labs: string[], pcs?: Record<string, string[]> }[]) {
    try {
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
        const fileName = `Custom_Audit_Report_${fileTimestamp}`;

        // Prepare Excel Workbook
        const excelWorkbook = XLSX.utils.book_new();
        let hasExcelData = false;

        const excelRows: any[] = [];

        for (const cityData of selectedData) {
            for (const labName of cityData.labs) {

                // Fetch data for this specific lab
                const response = await apiFetch(`/devices?city=${cityData.city}&lab=${labName}`);
                let devices = response?.devices || [];

                // Filter by specific PCs if provided
                const selectedPcsForLab = cityData.pcs?.[labName];
                if (selectedPcsForLab && selectedPcsForLab.length > 0) {
                    devices = devices.filter((d: any) => selectedPcsForLab.includes(d.system_id));
                }

                // Fetch detailed history for each device
                const detailedDevices = await Promise.all(devices.map(async (d: any) => {
                    try {
                        const detail = await apiFetch(`/devices/${d.system_id}`);
                        return { ...d, history: detail?.history || [] };
                    } catch (e) {
                        return d;
                    }
                }));

                if (detailedDevices.length > 0) {
                    detailedDevices.forEach((d: any) => {
                        if (d.history && d.history.length > 0) {
                            // Sort history by date descending
                            const sortedHistory = [...d.history].sort((a: any, b: any) => {
                                return new Date(b.history_date || b.start_time).getTime() - new Date(a.history_date || a.start_time).getTime();
                            });

                            sortedHistory.forEach((h: any) => {
                                excelRows.push({
                                    "City": cityData.city,
                                    "Lab": labName,
                                    "PC Name": d.pc_name,
                                    "Hardware ID": d.hardware_id || d.id,
                                    "Date": h.history_date || format(new Date(h.start_time), 'yyyy-MM-dd'),
                                    "CPU Performance (%)": (parseFloat(h.avg_score) || 0).toFixed(1),
                                    "Runtime (Hours)": ((h.runtime_minutes || 0) / 60).toFixed(2),
                                    "App Usage Data": JSON.stringify(h.app_usage || {})
                                });
                            });
                        } else {
                            // Current Data Fallback
                            excelRows.push({
                                "City": cityData.city,
                                "Lab": labName,
                                "PC Name": d.pc_name,
                                "Hardware ID": d.hardware_id || d.id,
                                "Date": "Current (Live)",
                                "CPU Performance (%)": (parseFloat(d.avg_performance || d.cpu_score) || 0).toFixed(1),
                                "App Usage Data": JSON.stringify(d.app_usage || {})
                            });
                        }
                    });
                    hasExcelData = true;
                }
            }
        }

        if (hasExcelData) {
            const ws = XLSX.utils.json_to_sheet(excelRows);
            const safeSheetName = `Consolidated_Report`;
            XLSX.utils.book_append_sheet(excelWorkbook, ws, safeSheetName);
            XLSX.writeFile(excelWorkbook, `${fileName}.xlsx`);
        } else {
            console.warn("No data found to generate Excel report.");
        }

        return true;
    } catch (error) {
        console.error("Custom Excel Generation Error:", error);
        throw error;
    }
}
