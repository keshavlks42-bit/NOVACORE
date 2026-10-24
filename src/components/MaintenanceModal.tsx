import React, { useState, useRef } from 'react';
import { X, Wrench, CheckCircle, AlertTriangle, ShieldCheck, Camera, Upload, Trash2, Plus } from 'lucide-react';
import { MaintenanceRecord, MaintenanceStatus, MachinePhoto } from '../types';
import { fileToOptimizedDataUrl, INDUSTRIAL_PHOTO_PRESETS } from '../services/pictureLibrary';

interface MaintenanceModalProps {
  record?: MaintenanceRecord | null;
  machineId?: string;
  machineName?: string;
  associatedAnalysisId?: string;
  onSave: (record: MaintenanceRecord) => void;
  onClose: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  record,
  machineId,
  machineName,
  associatedAnalysisId,
  onSave,
  onClose,
}) => {
  const [status, setStatus] = useState<MaintenanceStatus>(record?.status || 'Inspection Pending');
  const [technicianName, setTechnicianName] = useState(record?.technicianName || 'Marcus Vance');
  const [technicianNotes, setTechnicianNotes] = useState(record?.technicianNotes || '');
  const [maintenanceAction, setMaintenanceAction] = useState(record?.maintenanceAction || '');
  const [partsReplaced, setPartsReplaced] = useState(record?.partsReplaced || '');
  const [inspectionOutcome, setInspectionOutcome] = useState(record?.inspectionOutcome || 'Pending physical inspection');
  const [photos, setPhotos] = useState<MachinePhoto[]>(record?.photos || []);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 900, 0.85);
      const newPhoto: MachinePhoto = {
        id: `maint-photo-${Date.now()}`,
        url: dataUrl,
        caption: `Inspection Evidence: ${file.name.replace(/\.[^/.]+$/, '')}`,
        category: 'defect',
        timestamp: new Date().toISOString(),
      };
      setPhotos((prev) => [newPhoto, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleAddPreset = (preset: typeof INDUSTRIAL_PHOTO_PRESETS[0]) => {
    const newPhoto: MachinePhoto = {
      id: `maint-preset-${Date.now()}`,
      url: preset.url,
      caption: preset.name,
      category: preset.category,
      timestamp: new Date().toISOString(),
    };
    setPhotos((prev) => [newPhoto, ...prev]);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedRecord: MaintenanceRecord = {
      id: record?.id || `maint-${Date.now().toString().slice(-5)}`,
      machineId: record?.machineId || machineId || 'unknown',
      machineName: record?.machineName || machineName || 'General Equipment',
      date: record?.date || new Date().toISOString(),
      associatedAnalysisId: record?.associatedAnalysisId || associatedAnalysisId,
      status,
      technicianName: technicianName.trim() || 'Technician',
      technicianNotes: technicianNotes.trim(),
      maintenanceAction: maintenanceAction.trim(),
      partsReplaced: partsReplaced.trim(),
      inspectionOutcome: inspectionOutcome.trim(),
      photos: photos.length > 0 ? photos : undefined,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {record ? 'Update Maintenance Record' : 'Log Physical Inspection'}
              </h2>
              <p className="text-xs text-slate-400">
                {record?.machineName || machineName || 'Equipment'} • Audit & Outcome Log
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Important Scientific Distiction Banner */}
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-xs text-cyan-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <span className="font-semibold text-cyan-200">Engineering Protocol: </span>
              An acoustic anomaly detection flag indicates statistical divergence from baseline, not proof of mechanical failure. The inspection outcome records your certified physical finding.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="New Alert">New Alert</option>
                <option value="Inspection Pending">Inspection Pending</option>
                <option value="Inspection Completed">Inspection Completed</option>
                <option value="Maintenance Required">Maintenance Required</option>
                <option value="No Issue Found">No Issue Found (False Alarm)</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Assigned Technician
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Technician name"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Technician Observation Notes
            </label>
            <textarea
              rows={3}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Bearing housing temperature 64°C, slight grease degradation, belts tensioned to 65Hz..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Physical Inspection Outcome
            </label>
            <input
              type="text"
              value={inspectionOutcome}
              onChange={(e) => setInspectionOutcome(e.target.value)}
              placeholder="e.g. Bearing re-greased; foundation bolt torqued; no inner race spalling"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Maintenance Action Taken
              </label>
              <input
                type="text"
                value={maintenanceAction}
                onChange={(e) => setMaintenanceAction(e.target.value)}
                placeholder="e.g. Lubricated bearing"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Parts Replaced (if any)
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. None or 6205-2RS Bearing"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Attached Inspection Pictures */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-cyan-400" /> Attached Inspection Pictures ({photos.length})
              </label>
              <button
                type="button"
                disabled={isProcessingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors btn-cyan-click"
              >
                <Plus className="w-3.5 h-3.5" /> Add Photo
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video shadow-sm"
                  >
                    <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-1 right-1 p-1 bg-slate-950/90 text-rose-400 rounded-md hover:bg-rose-500 hover:text-white transition-colors opacity-90 group-hover:opacity-100"
                      title="Remove picture"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 p-1 bg-slate-950/90 text-[9px] text-slate-300 truncate font-mono">
                      {p.caption}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Attach photo evidence of bearing wear, grease degradation, or thermal scans:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPreset(INDUSTRIAL_PHOTO_PRESETS[3])}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 transition-colors flex items-center gap-1.5 btn-cyan-click"
                  >
                    <img src={INDUSTRIAL_PHOTO_PRESETS[3].url} alt="Preset" className="w-4 h-4 rounded object-cover" />
                    Attach Bearing Defect Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset(INDUSTRIAL_PHOTO_PRESETS[2])}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 transition-colors flex items-center gap-1.5 btn-cyan-click"
                  >
                    <img src={INDUSTRIAL_PHOTO_PRESETS[2].url} alt="Preset" className="w-4 h-4 rounded object-cover" />
                    Attach Thermal Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors btn-cyan-click"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-colors btn-cyan-click"
            >
              Update Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
