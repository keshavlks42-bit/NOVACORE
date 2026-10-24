import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Edit2,
  Calendar,
  User,
  Camera,
  X,
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus } from '../types';

interface MaintenanceHistoryViewProps {
  maintenanceRecords: MaintenanceRecord[];
  onOpenNewTicketModal: () => void;
  onEditTicket: (record: MaintenanceRecord) => void;
}

export const MaintenanceHistoryView: React.FC<MaintenanceHistoryViewProps> = ({
  maintenanceRecords,
  onOpenNewTicketModal,
  onEditTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption: string } | null>(null);

  const filtered = maintenanceRecords.filter((rec) => {
    const matchesSearch =
      rec.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.technicianNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'New Alert':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Inspection Pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Inspection Completed':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Maintenance Required':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'No Issue Found':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Closed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Technician Audit Trail
            </span>
            <span className="text-xs text-slate-400">{maintenanceRecords.length} Total Logs</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Maintenance & Inspection History</h1>
          <p className="text-xs text-slate-400">
            Log physical technician inspections, link them to acoustic anomalies, and record verified machinery outcomes.
          </p>
        </div>

        <button
          onClick={onOpenNewTicketModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Log Physical Inspection
        </button>
      </div>

      {/* Distinction Banner */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-200">Scientific Operating Protocol: </strong>
          The ML anomaly detection result is recorded separately from the technician's physical inspection outcome. An acoustic anomaly is a statistical flag, while this ledger records whether real maintenance was required or if no issue was found (benign operating shift).
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records, tech name, notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'New Alert', 'Inspection Pending', 'Inspection Completed', 'Maintenance Required', 'No Issue Found', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List of Records */}
      <div className="space-y-3">
        {filtered.map((record) => {
          const badgeClass = getStatusBadge(record.status);
          const formattedDate = new Date(record.date).toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={record.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-amber-400">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{record.machineName}</h3>
                      <span className="text-[10px] font-mono text-slate-500">#{record.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" /> {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" /> {record.technicianName}
                      </span>
                      {record.associatedAnalysisId && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400 font-mono text-[11px]">
                            Ref: {record.associatedAnalysisId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border font-bold ${badgeClass}`}>
                    {record.status}
                  </span>
                  <button
                    onClick={() => onEditTicket(record)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Edit maintenance log"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-0.5">
                    Technician Notes
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {record.technicianNotes || 'No observation notes recorded.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-0.5">
                    Physical Outcome & Findings
                  </span>
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {record.inspectionOutcome || 'Pending physical evaluation.'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-0.5">
                    Maintenance Action & Parts
                  </span>
                  <div className="text-slate-300">
                    <div>{record.maintenanceAction || 'No maintenance performed.'}</div>
                    {record.partsReplaced && (
                      <div className="text-[11px] text-cyan-400 font-mono mt-1">
                        Parts: {record.partsReplaced}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attached Inspection Pictures */}
              {record.photos && record.photos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase font-semibold mb-2">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Attached Inspection Evidence ({record.photos.length})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {record.photos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setLightboxPhoto({ url: photo.url, caption: photo.caption })}
                        className="group relative w-24 h-16 rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-400 bg-slate-950 cursor-pointer shadow-sm transition-all hover:scale-105"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 p-0.5 bg-slate-900/90 text-[8px] text-slate-300 truncate text-center font-mono">
                          {photo.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500 font-mono">
            No maintenance records matching search filter.
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 truncate">
                {lightboxPhoto.caption || 'Equipment Inspection Photo'}
              </span>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors btn-cyan-click"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
