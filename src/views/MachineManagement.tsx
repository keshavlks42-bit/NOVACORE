import React, { useState } from 'react';
import {
  Cpu,
  Plus,
  Search,
  MapPin,
  Gauge,
  ArrowRight,
  Edit2,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileAudio,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { Machine } from '../types';
import { PhotoGalleryModal } from '../components/PhotoGalleryModal';

interface MachineManagementProps {
  machines: Machine[];
  onSelectMachineForAnalysis: (machine: Machine) => void;
  onOpenAddModal: () => void;
  onEditMachine: (machine: Machine) => void;
  onArchiveMachine: (machineId: string) => void;
}

export const MachineManagement: React.FC<MachineManagementProps> = ({
  machines,
  onSelectMachineForAnalysis,
  onOpenAddModal,
  onEditMachine,
  onArchiveMachine,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [galleryMachine, setGalleryMachine] = useState<Machine | null>(null);

  const filtered = machines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchesArchived = showArchived ? true : !m.archived;
    return matchesSearch && matchesCategory && matchesArchived;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
              Fleet Management
            </span>
            <span className="text-xs text-slate-400">
              {machines.length} Units Enrolled
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Industrial Machinery Roster</h1>
          <p className="text-xs text-slate-400">
            Define operating conditions, link acoustic & vibration baselines, and monitor real-time health scores.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Register New Machine
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID or bay..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'Motor', 'Pump', 'Fan', 'Compressor', 'Conveyor'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              showArchived
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((machine) => {
          const statusBadge =
            machine.status === 'NORMAL'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : machine.status === 'ATTENTION'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

          return (
            <div
              key={machine.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all ${
                machine.archived
                  ? 'opacity-60 border-slate-800'
                  : 'border-slate-800 hover:border-slate-700 shadow-sm'
              }`}
            >
              {/* Machine Header with Optional Picture Thumbnail */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  {machine.imageUrl ? (
                    <div
                      onClick={() => setGalleryMachine(machine)}
                      className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shrink-0 cursor-pointer hover:border-cyan-400 transition-colors shadow-sm"
                      title="Click to view machine photo gallery"
                    >
                      <img
                        src={machine.imageUrl}
                        alt={machine.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 p-0.5 bg-slate-900/90 rounded-tl text-[8px] text-cyan-300">
                        <Camera className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => setGalleryMachine(machine)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 shrink-0 cursor-pointer hover:border-cyan-500/50"
                      title="Add machine picture"
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{machine.name}</h3>
                      {machine.isDemoMachine && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Demo Profile
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-[11px] text-cyan-400">{machine.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {machine.location}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${statusBadge}`}>
                  {machine.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                {machine.description || 'No description provided.'}
              </p>

              {/* Operating Parameters Pill */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-4 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">RPM</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {machine.operatingConditions.rpm}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Load</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {machine.operatingConditions.loadPercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Voltage</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {machine.operatingConditions.voltage || 400}V
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Temp</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {machine.operatingConditions.ambientTempC || 35}°C
                  </span>
                </div>
              </div>

              {/* Baseline Status & Score */}
              <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-slate-950/40 rounded-lg border border-slate-800/60 mb-4">
                <div className="flex items-center gap-2">
                  <FileAudio className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-400">Baseline Model:</span>
                  <span className="font-mono text-slate-200">
                    {machine.baselineId ? 'Trained (v1.2)' : 'Pending Calibration'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">Latest Score:</span>
                  <span
                    className={`font-bold ${
                      (machine.latestAnomalyScore || 0) > 0.6
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {machine.latestAnomalyScore?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGalleryMachine(machine)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all btn-cyan-click"
                    title="View & Add Equipment Pictures"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pictures ({machine.photos?.length || (machine.imageUrl ? 1 : 0)})</span>
                  </button>

                  <button
                    onClick={() => onEditMachine(machine)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors btn-cyan-click"
                    title="Edit machine profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onArchiveMachine(machine.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors btn-cyan-click"
                    title={machine.archived ? 'Restore machine' : 'Archive machine'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => onSelectMachineForAnalysis(machine)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-colors btn-cyan-click"
                >
                  Analyse Acoustic Signal <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Picture Gallery Modal */}
      {galleryMachine && (
        <PhotoGalleryModal
          machine={galleryMachine}
          onSaveMachine={(updated) => {
            onEditMachine(updated);
            setGalleryMachine(updated);
          }}
          onClose={() => setGalleryMachine(null)}
        />
      )}
    </div>
  );
};
