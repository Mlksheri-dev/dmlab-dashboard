import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type ReportType = 'GLOBAL' | 'CITY' | 'LAB' | 'SYSTEM' | 'PC';

interface ReportData {
    title: string;
    headers: string[][];
    body: any[][];
    fileName: string;
}

export async function generateDynamicReport(type: ReportType, data: any, context?: string) {
    try {
        const doc = new jsPDF();
        const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

        // Styles
        const navy = [15, 23, 42];

        // Header
        doc.setFillColor(navy[0], navy[1], navy[2]);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('LAB GUARDIAN - SYSTEM REPORT', 15, 18);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`GENERATED ON: ${timestamp}`, 15, 28);
        doc.text(`AUDIT TYPE: ${type} VIEW ${context ? `(${context})` : ''}`, 15, 33);

        const report: ReportData = {
            title: '',
            headers: [[]],
            body: [],
            fileName: ''
        };

        if (type === 'GLOBAL') {
            report.title = 'CityWiseLab';
            report.headers = [['Total City', 'TOTAL LABS', 'TOTAL PCS', 'ONLINE PCS', 'OFFLINE PCS', 'CPU PERFORMANCE']];
            report.body = (data.locations || []).map((loc: any) => [
                loc.city?.toUpperCase(),
                loc.total_labs,
                loc.total_pcs,
                loc.online,
                loc.offline,
                `${(loc.avg_performance || 0).toFixed(2)}%`
            ]);
            report.fileName = 'Global_Audit';
        }
        else if (type === 'CITY') {
            const labs = data.labs || [];
            const totalLabs = labs.length;
            const totalOnline = labs.reduce((acc: number, l: any) => acc + (l.online || 0), 0);
            const totalOffline = labs.reduce((acc: number, l: any) => acc + (l.offline || 0), 0);
            const totalPcs = labs.reduce((acc: number, l: any) => acc + (l.total_pcs || 0), 0);

            // Calculate true city performance (Weighted average across all PCs)
            const totalCityScore = labs.reduce((acc: number, l: any) => acc + ((l.avg_performance || 0) * (l.total_pcs || 0)), 0);
            const avgPerf = totalPcs > 0 ? (totalCityScore / totalPcs).toFixed(2) : "0.00";

            report.title = `CityWiseLab: ${context}`;

            report.headers = [['Total Labs', 'TOTAL PCS', 'ONLINE PCS', 'OFFLINE PCS', 'CPU PERFORMANCE']];
            report.body = [[
                totalLabs,
                totalPcs,
                totalOnline,
                totalOffline,
                `${avgPerf}%`
            ]];
            report.fileName = `City_Audit_${context}`;
        }
        else if (type === 'LAB') {
            report.title = `LabName: ${context}`;
            report.headers = [['Lab Name', 'TOTAL PCS', 'ONLINE PCS', 'OFFLINE PCS', 'CPU PERFORMANCE']];
            report.body = [[
                context?.toUpperCase(),
                data.total_pcs || 0,
                data.online || 0,
                data.offline || 0,
                `${(data.avg_performance || 0).toFixed(2)}%`
            ]];
            report.fileName = `Lab_Audit_${context}`;
        }

        else if (type === 'PC') {
            report.title = `System Name: ${data.pc_name || context || 'UNKNOWN'}`;

            report.headers = [['System Name', 'STATUS', 'CPU PERFORMANCE']];
            report.body = [[
                data.pc_name || context || 'UKNOWN',
                data.isOnline ? 'ONLINE' : 'OFFLINE',
                `${(parseFloat(data.cpu_score) || 0).toFixed(2)}%`
            ]];
            report.fileName = `PC_Audit_${context}`;
        }
        else if (type === 'SYSTEM') {

            const devices = data.devices || [];
            const total = devices.length;
            const online = devices.filter((d: any) => d._is_online || d.status === 'online').length;
            const offline = total - online;
            const totalCpu = devices.reduce((acc: number, d: any) => acc + (parseFloat(d.cpu_score) || 0), 0);
            const avgPerf = total > 0 ? (totalCpu / total).toFixed(2) : "0.00";

            report.title = 'Total System Audit';
            report.headers = [['Total System', 'ONLINE', 'OFFLINE', 'CPU PERFORMANCE']];
            report.body = [[
                total,
                online,
                offline,
                `${avgPerf}%`
            ]];
            report.fileName = 'Total_System_Audit';
        }


        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(report.title, 15, 55);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 58, 195, 58);

        autoTable(doc, {
            startY: 65,
            head: report.headers,
            body: report.body,
            theme: 'grid',
            headStyles: { fillColor: navy, textColor: 255, fontSize: 10, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9, cellPadding: 4, valign: 'middle', halign: 'center' },
            columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Confidential - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        doc.save(`Lab_Guardian_${report.fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        return true;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        throw error;
    }
}

export const generateDailyReport = (stats: any, locations: any[]) => generateDynamicReport('GLOBAL', { locations });
