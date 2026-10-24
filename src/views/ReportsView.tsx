import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Cpu,
} from 'lucide-react';
import { AnalysisRecord, Machine, MaintenanceRecord } from '../types';

interface ReportsViewProps {
  machines: Machine[];
  analyses: AnalysisRecord[];
  maintenance: MaintenanceRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  machines,
  analyses,
  maintenance,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Filter analyses
  const filteredAnalyses = analyses.filter((a) => {
    const matchesMachine = selectedMachineId === 'ALL' || a.machineId === selectedMachineId;
    const matchesSeverity = severityFilter === 'ALL' || a.alertLevel === severityFilter;
    return matchesMachine && matchesSeverity;
  });

  // Calculate real values derived strictly from stored records
  const totalAnalyzed = filteredAnalyses.length;
  const totalAnomalies = filteredAnalyses.filter((a) => a.alertLevel === 'ANOMALY').length;
  const totalReviews = filteredAnalyses.filter((a) => a.alertLevel === 'REVIEW').length;
  const totalNormals = filteredAnalyses.filter((a) => a.alertLevel === 'NORMAL').length;

  const relevantMaintenance = maintenance.filter(
    (m) => selectedMachineId === 'ALL' || m.machineId === selectedMachineId
  );
  const completedInspections = relevantMaintenance.filter(
    (m) => m.status === 'Inspection Completed' || m.status === 'Closed'
  ).length;
  const maintenanceRequiredCount = relevantMaintenance.filter(
    (m) => m.status === 'Maintenance Required' || (m.maintenanceAction && m.maintenanceAction !== 'None')
  ).length;
  const noIssueFoundCount = relevantMaintenance.filter(
    (m) => m.status === 'No Issue Found' || m.inspectionOutcome.toLowerCase().includes('no issue')
  ).length;

  // Export Analyses as CSV
  const exportAnalysesCsv = () => {
    const headers = [
      'Analysis ID',
      'Machine ID',
      'Machine Name',
      'Timestamp',
      'Filename',
      'Duration (s)',
      'Raw Anomaly Score',
      'Display Score (0-100)',
      'Threshold',
      'Alert Level',
      'RMS Energy',
      'Spectral Centroid (Hz)',
      'Zero Crossing Rate',
      'Spectral Rolloff (Hz)',
    ];

    const rows = filteredAnalyses.map((a) => [
      `"${a.id}"`,
      `"${a.machineId}"`,
      `"${a.machineName}"`,
      `"${a.timestamp}"`,
      `"${a.filename}"`,
      a.durationSeconds,
      a.rawScore,
      a.displayScore,
      a.threshold,
      `"${a.alertLevel}"`,
      a.features.rmsEnergy,
      a.features.spectralCentroid,
      a.features.zeroCrossingRate,
      a.features.spectralRolloff,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `machinesentry_analyses_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  // Export Maintenance as CSV
  const exportMaintenanceCsv = () => {
    const headers = [
      'Ticket ID',
      'Machine ID',
      'Machine Name',
      'Date',
      'Associated Analysis ID',
      'Status',
      'Technician',
      'Technician Notes',
      'Action Taken',
      'Parts Replaced',
      'Physical Outcome',
    ];

    const rows = relevantMaintenance.map((m) => [
      `"${m.id}"`,
      `"${m.machineId}"`,
      `"${m.machineName}"`,
      `"${m.date}"`,
      `"${m.associatedAnalysisId || ''}"`,
      `"${m.status}"`,
      `"${m.technicianName}"`,
      `"${m.technicianNotes.replace(/"/g, '""')}"`,
      `"${m.maintenanceAction.replace(/"/g, '""')}"`,
      `"${m.partsReplaced || ''}"`,
      `"${m.inspectionOutcome.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `machinesentry_maintenance_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Factory Compliance & Export
            </span>
            <span className="text-xs text-slate-400">CSV Export Enabled</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Audit Reports & Data Export</h1>
          <p className="text-xs text-slate-400">
            Export comprehensive condition monitoring histories, anomaly records, and physical inspection outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAnalysesCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Analyses (CSV)
          </button>
          <button
            onClick={exportMaintenanceCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Maintenance (CSV)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Filter Machine:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Monitored Fleet</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="NORMAL">Normal Only</option>
              <option value="REVIEW">Review Recommended</option>
              <option value="ANOMALY">Anomaly Alerts Only</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Showing {filteredAnalyses.length} analyses • {relevantMaintenance.length} maintenance records
        </div>
      </div>

      {/* Aggregate Report Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Analysed Recordings</span>
          <span className="text-2xl font-bold font-mono text-slate-100">{totalAnalyzed}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Calculated from ledger</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Detected Anomalies</span>
          <span className="text-2xl font-bold font-mono text-rose-400">{totalAnomalies}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Scores &gt; threshold</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Completed Inspections</span>
          <span className="text-2xl font-bold font-mono text-cyan-400">{completedInspections}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Physical tech audits</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Verified Action Taken</span>
          <span className="text-2xl font-bold font-mono text-amber-400">{maintenanceRequiredCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Real repair/greasing done</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">No Issue Found</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{noIssueFoundCount}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Benign operational drift</span>
        </div>
      </div>

      {/* Financial Savings Disclaimer Note as required by spec Section 16 */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <Info className="w-4 h-4" /> Cost & ROI Transparency Note:
        </div>
        <p className="text-slate-400 leading-relaxed">
          Per engineering standards, MachineSentry does not display arbitrary financial savings amounts without user-provided equipment downtime cost data. In industrial settings, early anomaly detection prevents secondary cascading damages (e.g., catching bearing spalling before shaft seizure). Actual cost savings depend on hourly production line value, spare part lead times, and labor rates.
        </p>
      </div>

      {/* Analysis Records Table Preview */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center justify-between">
          <span>Analysis History Ledger Preview</span>
          <span className="text-[10px] font-mono text-slate-400">Last 10 Records</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Machine</th>
                <th className="py-2.5 px-3">Input Source</th>
                <th className="py-2.5 px-3">Raw Score</th>
                <th className="py-2.5 px-3">Index</th>
                <th className="py-2.5 px-3">Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAnalyses.slice(0, 10).map((a) => (
                <tr key={a.id} className="hover:bg-slate-950/40">
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(a.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200 font-sans">{a.machineName}</td>
                  <td className="py-2.5 px-3 text-slate-400">{a.inputSource}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{a.rawScore}</td>
                  <td className="py-2.5 px-3 text-slate-200">{a.displayScore}%</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold border ${
                        a.alertLevel === 'ANOMALY'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : a.alertLevel === 'REVIEW'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {a.alertLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
