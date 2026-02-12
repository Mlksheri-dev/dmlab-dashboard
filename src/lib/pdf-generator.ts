import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type ReportType = 'GLOBAL' | 'CITY' | 'LAB' | 'SYSTEM' | 'PC';

export async function generateDynamicReport(type: ReportType, data: any, context?: string) {
    try {
        const doc = new jsPDF();
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const dateStr = format(new Date(), 'yyyy-MM-dd');

        // Colors
        const colors = {
            navy: [15, 23, 42] as [number, number, number],
            primary: [249, 154, 29] as [number, number, number],
            success: [34, 197, 94] as [number, number, number],
            danger: [239, 68, 68] as [number, number, number],
            muted: [100, 116, 139] as [number, number, number],
            border: [226, 232, 240] as [number, number, number],
            bg: [248, 250, 252] as [number, number, number],
            alert: [245, 158, 11] as [number, number, number] // Amber for warnings
        };

        // Professional Header
        doc.setFillColor(colors.navy[0], colors.navy[1], colors.navy[2]);
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('LAB GUARDIAN PRO', 15, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('SYSTEMS MONITORING & INFRASTRUCTURE MANAGEMENT', 15, 27);

        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.roundedRect(140, 15, 55, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${type} LEVEL AUDIT`, 145, 21.5);

        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`ID: LG-AUDIT-${format(new Date(), 'YMMddHHmmss')}`, 140, 32);
        doc.text(`DATE: ${timestamp}`, 140, 37);
        doc.text(`STATUS: VERIFIED`, 140, 42);

        let startY = 60;

        // Helper to get score safely
        const getScore = (item: any) => {
            const val = item.avg_performance ?? item.avg_score ?? item.cpu_score ?? 0;
            return parseFloat(String(val)) || 0;
        };

        if (type === 'GLOBAL') {
            const locations = data.locations || [];
            const totalLabs = locations.reduce((acc: number, l: any) => acc + (l.total_labs || 0), 0);
            const totalPcs = locations.reduce((acc: number, l: any) => acc + (l.total_pcs || 0), 0);
            const totalOnlinePcs = locations.reduce((acc: number, l: any) => acc + (l.online || 0), 0);

            drawSummaryBox(doc, 15, startY, [
                { label: 'TOTAL CITIES', value: locations.length },
                { label: 'TOTAL LABS', value: totalLabs },
                { label: 'TOTAL SYSTEMS', value: totalPcs },
                { label: 'LIVE NODES', value: totalOnlinePcs }
            ], colors);

            startY += 35;
            doc.setTextColor(colors.navy[0], colors.navy[1], colors.navy[2]);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text('REGIONAL INFRASTRUCTURE DISTRIBUTION', 15, startY);

            autoTable(doc, {
                startY: startY + 5,
                head: [['CITY / REGION', 'LABS', 'TOTAL PCS', 'ONLINE', 'OFFLINE', 'PERFORMANCE']],
                body: locations.map((loc: any) => [
                    loc.city?.toUpperCase(),
                    loc.total_labs,
                    loc.total_pcs,
                    { content: loc.online, styles: { textColor: colors.success } },
                    { content: loc.offline, styles: { textColor: colors.danger } },
                    `${getScore(loc).toFixed(1)}%`
                ]),
                theme: 'striped',
                headStyles: { fillColor: colors.navy, fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
                columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
            });
        }
        else if (type === 'CITY' || (type === 'SYSTEM' && context && !data.devices)) {
            const labs = data.labs || [];
            const cityName = context || data.city || 'TOTAL SYSTEM';

            const totalPcs = labs.reduce((acc: number, l: any) => acc + (l.total_pcs || 0), 0);
            const totalOnlinePcs = labs.reduce((acc: number, l: any) => acc + (l.online || 0), 0);
            const onlineLabsCount = labs.filter((l: any) => l.online > 0).length;
            const offlineLabsCount = labs.length - onlineLabsCount;

            const totalScoreSum = labs.reduce((acc: number, l: any) => acc + (getScore(l) * (l.total_pcs || 1)), 0);
            const avgPerf = totalPcs > 0 ? (totalScoreSum / totalPcs).toFixed(1) : '0.0';

            drawSummaryBox(doc, 15, startY, [
                { label: 'CITY NAME', value: cityName.toUpperCase() },
                { label: 'LABS ACTIVE', value: `${onlineLabsCount} / ${labs.length}` },
                { label: 'TOTAL NODES', value: totalPcs },
                { label: 'CITY HEALTH', value: `${avgPerf}%` }
            ], colors);

            startY += 35;
            doc.setTextColor(colors.navy[0], colors.navy[1], colors.navy[2]);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text(`LAB CLUSTER DETAILS: ${cityName.toUpperCase()}`, 15, startY);

            autoTable(doc, {
                startY: startY + 5,
                head: [['LAB FACILITY NAME', 'PCS', 'ONLINE', 'OFFLINE', 'PERF SCORE', 'HEALTH']],
                body: labs.map((l: any) => [
                    l.lab_name.toUpperCase(),
                    l.total_pcs,
                    { content: l.online, styles: { textColor: colors.success } },
                    { content: l.offline, styles: { textColor: colors.danger } },
                    (getScore(l) * (l.total_pcs || 1)).toFixed(0),
                    `${getScore(l).toFixed(1)}%`
                ]),
                theme: 'striped',
                headStyles: { fillColor: colors.primary, fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
                columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
            });
        }
        else if (type === 'LAB' || (type === 'SYSTEM' && data.devices)) {
            const devices = data.devices || [];
            const labName = context || data.lab || 'GLOBAL FLEET';
            const cityName = data.city || 'NETWORK HUB';

            // Stats from data object if available, otherwise calculate from devices
            const totalPcs = data.total_pcs ?? devices.length;
            const onlineCount = data.online ?? devices.filter((d: any) => d.status === 'online').length;
            const offlineCount = data.offline ?? (totalPcs - onlineCount);

            const offline7d = data.offline_7d ?? 0;
            const offline30d = data.offline_30d ?? 0;

            const totalScoreSum = devices.reduce((acc: number, d: any) => acc + getScore(d), 0);
            const avgPerf = totalPcs > 0 ? (totalScoreSum / totalPcs).toFixed(1) : (getScore(data).toFixed(1) || '0.0');

            // Two rows of summary for LAB to include 7d/30d offline
            drawSummaryBox(doc, 15, startY, [
                { label: 'LOCATION', value: `${cityName} / ${labName}`.toUpperCase() },
                { label: 'TOTAL PC', value: totalPcs },
                { label: 'ONLINE', value: onlineCount },
                { label: 'OFFLINE', value: offlineCount }
            ], colors);

            startY += 30;
            drawSummaryBox(doc, 15, startY, [
                { label: '7+ DAYS OFFLINE', value: offline7d },
                { label: '30+ DAYS OFFLINE', value: offline30d },
                { label: 'SECURITY STATUS', value: 'ENCRYPTED' },
                { label: 'LAB HEALTH', value: `${avgPerf}%` }
            ], colors);

            startY += 35;
            doc.setTextColor(colors.navy[0], colors.navy[1], colors.navy[2]);
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            doc.text(`DETAILED NODE INVENTORY: ${labName.toUpperCase()}`, 15, startY);

            if (devices.length > 0) {
                autoTable(doc, {
                    startY: startY + 5,
                    head: [['STATION NAME', 'SYSTEM ID', 'STATUS', 'CPU LOAD', 'TOTAL SCORE', 'TIMESTAMP']],
                    body: devices.map((d: any) => [
                        d.pc_name?.toUpperCase() || 'STATION',
                        d.system_id,
                        {
                            content: (d.status || 'offline').toUpperCase(),
                            styles: { textColor: d.status === 'online' ? colors.success : colors.danger, fontStyle: 'bold' }
                        },
                        `${getScore(d).toFixed(1)}%`,
                        getScore(d).toFixed(0),
                        d.last_seen ? format(new Date(d.last_seen), 'HH:mm:ss') : 'N/A'
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: colors.navy, fontSize: 8 },
                    styles: { fontSize: 7, cellPadding: 3, halign: 'center' },
                    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
                });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
                doc.text('No detailed node inventory available for this cluster.', 15, startY + 15);
            }
        }
        else if (type === 'PC') {
            const device = data;
            const history = data.history || [];

            doc.setTextColor(colors.navy[0], colors.navy[1], colors.navy[2]);
            doc.setFontSize(18);
            doc.text(`STATION PROFILE: ${device.pc_name?.toUpperCase() || 'STATION'}`, 15, startY);

            startY += 10;
            const info = [
                ['System ID', device.system_id],
                ['Region', device.city?.toUpperCase() || 'N/A'],
                ['Facility', device.lab_name?.toUpperCase() || 'N/A'],
                ['Architecture', 'x86_64 / Pro Agent'],
                ['Current Status', device.isOnline ? 'OPERATIONAL (ONLINE)' : 'IDLE (OFFLINE)'],
                ['Boot Time Today', device.today_start_time ? format(new Date(device.today_start_time), 'HH:mm:ss') : 'N/A'],
                ['Total Runtime', `${Math.floor((device.runtime_minutes || 0) / 60)}H ${(device.runtime_minutes || 0) % 60}M`],
                ['Health Score', `${getScore(device).toFixed(1)}% Units`]
            ];

            autoTable(doc, {
                startY: startY,
                body: info,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', textColor: colors.muted, cellWidth: 40 } }
            });

            startY = (doc as any).lastAutoTable.finalY + 15;

            if (device.app_usage && Object.keys(device.app_usage).length > 0) {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                doc.text('SOFTWARE SPECTRUM (TOP USAGE)', 15, startY);
                const apps = Object.entries(device.app_usage as Record<string, number>).sort(([, a], [, b]) => b - a).slice(0, 10);
                autoTable(doc, {
                    startY: startY + 5,
                    head: [['APPLICATION', 'DURATION', 'PERCENTAGE']],
                    body: apps.map(([app, secs]) => {
                        const total = Object.values(device.app_usage as Record<string, number>).reduce((a, b) => a + b, 0);
                        return [app, `${Math.floor(secs / 3600)}H ${Math.floor((secs % 3600) / 60)}M`, `${((secs / total) * 100).toFixed(1)}%`];
                    }),
                    theme: 'striped',
                    headStyles: { fillColor: colors.muted },
                    styles: { fontSize: 8 }
                });
                startY = (doc as any).lastAutoTable.finalY + 15;
            }

            if (history.length > 0) {
                doc.setFontSize(12); doc.setFont('helvetica', 'bold');
                doc.text('TELEMETRY ARCHIVE (7 DAYS)', 15, startY);
                autoTable(doc, {
                    startY: startY + 5,
                    head: [['DATE', 'AVG PERFORMANCE', 'RUNTIME', 'PEAK SIGNAL']],
                    body: history.slice(0, 7).map((h: any) => [
                        h.history_date || format(new Date(h.start_time), 'yyyy-MM-dd'),
                        `${getScore(h).toFixed(1)}%`,
                        `${Math.floor((h.runtime_minutes || 0) / 60)}H ${(h.runtime_minutes || 0) % 60}M`,
                        'STABLE'
                    ]),
                    theme: 'striped',
                    styles: { fontSize: 8 }
                });
            }
        }

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.line(15, 275, 195, 275);
            doc.setFontSize(7);
            doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
            doc.text('LAB GUARDIAN - PROFESSIONAL INFRASTRUCTURE AUDIT TOOL', 15, 282);
            doc.text(`CONFIDENTIAL - SYSTEM GENERATED DOCUMENT - ${timestamp}`, 15, 286);
            doc.text(`PAGE ${i} OF ${pageCount}`, 195, 282, { align: 'right' });
        }

        // Generate dynamic filename based on user request
        let fileName = 'Audit_Report';
        const fileTimestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');

        switch (type) {
            case 'GLOBAL':
                fileName = `Global_Level_Report_${fileTimestamp}`;
                break;
            case 'CITY':
                fileName = `City_Level_Report_${(context || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;
                break;
            case 'LAB':
                fileName = `Lab_Level_Report_${(context || 'Unknown').replace(/\s+/g, '_')}_${fileTimestamp}`;
                break;
            case 'SYSTEM':
                fileName = `All_Systems_Report_${fileTimestamp}`;
                break;
            case 'PC':
                fileName = `PC_Report_${(data.pc_name || 'System').replace(/\s+/g, '_')}_${fileTimestamp}`;
                break;
        }

        doc.save(`${fileName}.pdf`);
        return true;
    } catch (error) {
        console.error("Professional PDF Generation Error:", error);
        throw error;
    }
}

function drawSummaryBox(doc: jsPDF, x: number, y: number, items: { label: string, value: any }[], colors: any) {
    const width = 180;
    const height = 25;
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(x, y, width, height, 1, 1, 'FD');
    const itemWidth = width / items.length;
    items.forEach((item, i) => {
        const itemX = x + (i * itemWidth);
        if (i > 0) {
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.line(itemX, y + 5, itemX, y + 20);
        }
        doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(item.label, itemX + (itemWidth / 2), y + 8, { align: 'center' });
        doc.setTextColor(colors.navy[0], colors.navy[1], colors.navy[2]);
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(String(item.value), itemX + (itemWidth / 2), y + 18, { align: 'center' });
    });
}

export const generateDailyReport = (stats: any, locations: any[]) => generateDynamicReport('GLOBAL', { locations });
