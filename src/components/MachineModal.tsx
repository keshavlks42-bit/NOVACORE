import React, { useState, useRef } from 'react';
import { X, Cpu, MapPin, Gauge, FileText, Camera, Upload, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Machine, MachineCategory, MachinePhoto } from '../types';
import { fileToOptimizedDataUrl, INDUSTRIAL_PHOTO_PRESETS } from '../services/pictureLibrary';

interface MachineModalProps {
  machine?: Machine | null;
  onSave: (machine: Machine) => void;
  onClose: () => void;
}

export const MachineModal: React.FC<MachineModalProps> = ({ machine, onSave, onClose }) => {
  const [name, setName] = useState(machine?.name || '');
  const [category, setCategory] = useState<MachineCategory>(machine?.category || 'Motor');
  const [location, setLocation] = useState(machine?.location || '');
  const [description, setDescription] = useState(machine?.description || '');
  const [rpm, setRpm] = useState(machine?.operatingConditions.rpm || 1500);
  const [loadPercentage, setLoadPercentage] = useState(machine?.operatingConditions.loadPercentage || 80);
  const [voltage, setVoltage] = useState(machine?.operatingConditions.voltage || 400);
  const [ambientTempC, setAmbientTempC] = useState(machine?.operatingConditions.ambientTempC || 35);
  const [maintenanceNotes, setMaintenanceNotes] = useState(machine?.maintenanceNotes || '');
  const [imageUrl, setImageUrl] = useState<string>(machine?.imageUrl || '');
  const [photos, setPhotos] = useState<MachinePhoto[]>(machine?.photos || []);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessingPhoto(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 900, 0.85);
      setImageUrl(dataUrl);

      const newPhoto: MachinePhoto = {
        id: `photo-${Date.now()}`,
        url: dataUrl,
        caption: `${name || 'Equipment'} Profile Photo`,
        category: 'overall',
        timestamp: new Date().toISOString(),
      };
      setPhotos((prev) => [newPhoto, ...prev.filter((p) => p.url !== dataUrl)]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSelectPreset = (presetUrl: string, presetName: string) => {
    setImageUrl(presetUrl);
    const newPhoto: MachinePhoto = {
      id: `preset-${Date.now()}`,
      url: presetUrl,
      caption: presetName,
      category: 'overall',
      timestamp: new Date().toISOString(),
    };
    setPhotos((prev) => [newPhoto, ...prev.filter((p) => p.url !== presetUrl)]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Machine name is required');
      return;
    }
    if (!location.trim()) {
      setError('Location is required');
      return;
    }

    const savedMachine: Machine = {
      id: machine?.id || `mach-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      dateRegistered: machine?.dateRegistered || new Date().toISOString().split('T')[0],
      operatingConditions: {
        rpm: Number(rpm),
        loadPercentage: Number(loadPercentage),
        voltage: Number(voltage),
        ambientTempC: Number(ambientTempC),
      },
      status: machine?.status || 'NORMAL',
      baselineId: machine?.baselineId,
      vibrationBaselineId: machine?.vibrationBaselineId,
      latestAnomalyScore: machine?.latestAnomalyScore,
      lastAnalysisTimestamp: machine?.lastAnalysisTimestamp,
      maintenanceNotes: maintenanceNotes.trim(),
      isDemoMachine: machine?.isDemoMachine ?? false,
      archived: machine?.archived ?? false,
      imageUrl: imageUrl.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    onSave(savedMachine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {machine ? 'Edit Machine Profile' : 'Register New Machine'}
              </h2>
              <p className="text-xs text-slate-400">Configure machine parameters for baseline tracking</p>
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
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Machine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Slurry Pump #3 (Babcock)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MachineCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Motor">Electric Motor</option>
                <option value="Pump">Centrifugal Pump</option>
                <option value="Fan">Industrial Fan / Blower</option>
                <option value="Compressor">Air Compressor</option>
                <option value="Conveyor">Conveyor Drive</option>
                <option value="Gearbox">Gearbox / Transmission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Physical Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 4, Line B"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 15 kW 3-phase induction motor with roller bearings..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Gauge className="w-4 h-4" /> Operating Baseline Conditions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Nominal RPM</span>
                <input
                  type="number"
                  value={rpm}
                  onChange={(e) => setRpm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Load %</span>
                <input
                  type="number"
                  value={loadPercentage}
                  onChange={(e) => setLoadPercentage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Voltage (V)</span>
                <input
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Ambient °C</span>
                <input
                  type="number"
                  value={ambientTempC}
                  onChange={(e) => setAmbientTempC(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Equipment Picture & Visual Evidence */}
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-cyan-400" /> Machine Picture / Visual Evidence
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remove Picture
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-20 h-16 object-cover rounded-lg border border-slate-700 bg-slate-950 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">Photo Attached</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Ready to attach to machine profile
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Replace with new picture
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all active:scale-95 btn-cyan-click"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessingPhoto ? 'Compressing...' : 'Upload from Device / Camera'}</span>
                  </button>

                  <span className="text-[11px] text-slate-500">or pick preset:</span>
                </div>

                {/* Fast Presets Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {INDUSTRIAL_PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.url, p.name)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-lg text-left transition-all flex items-center gap-2"
                    >
                      <img src={p.url} alt={p.name} className="w-8 h-8 rounded object-cover shrink-0" />
                      <span className="text-[10px] text-slate-300 font-medium truncate leading-tight">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Maintenance Notes
            </label>
            <div className="relative">
              <input
                type="text"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="e.g. Scheduled for quarterly bearing relubrication in Nov"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <FileText className="w-4 h-4 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
            >
              Save Machine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
