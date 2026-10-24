/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Plus,
  Trash2,
  Tag,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Check,
  ZoomIn,
  ShieldAlert,
} from 'lucide-react';
import { Machine, MachinePhoto } from '../types';
import { INDUSTRIAL_PHOTO_PRESETS, fileToOptimizedDataUrl } from '../services/pictureLibrary';

interface PhotoGalleryModalProps {
  machine: Machine;
  onSaveMachine: (updatedMachine: Machine) => void;
  onClose: () => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  machine,
  onSaveMachine,
  onClose,
}) => {
  const [photos, setPhotos] = useState<MachinePhoto[]>(machine.photos || [
    ...(machine.imageUrl
      ? [
          {
            id: 'photo-primary',
            url: machine.imageUrl,
            caption: `${machine.name} Primary Equipment Photo`,
            category: 'overall' as const,
            timestamp: new Date().toISOString(),
          },
        ]
      : []),
  ]);
  const [primaryUrl, setPrimaryUrl] = useState<string>(machine.imageUrl || '');
  const [selectedPhoto, setSelectedPhoto] = useState<MachinePhoto | null>(
    photos[0] || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState<MachinePhoto['category']>('overall');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload (with downscale compression for fast localStorage)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await fileToOptimizedDataUrl(file, 1000, 0.85);

      const newPhoto: MachinePhoto = {
        id: `photo-${Date.now()}`,
        url: dataUrl,
        caption: newCaption.trim() || file.name.replace(/\.[^/.]+$/, ''),
        category: newCategory,
        timestamp: new Date().toISOString(),
      };

      const updatedPhotos = [newPhoto, ...photos];
      setPhotos(updatedPhotos);
      setSelectedPhoto(newPhoto);

      // Set as primary if no primary yet
      if (!primaryUrl) {
        setPrimaryUrl(dataUrl);
      }

      // Persist to machine
      const updatedMachine: Machine = {
        ...machine,
        imageUrl: primaryUrl || dataUrl,
        photos: updatedPhotos,
      };
      onSaveMachine(updatedMachine);

      setNewCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Failed to process image', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Select an industrial preset
  const handleAddPreset = (preset: typeof INDUSTRIAL_PHOTO_PRESETS[0]) => {
    const newPhoto: MachinePhoto = {
      id: `preset-${Date.now()}`,
      url: preset.url,
      caption: preset.caption,
      category: preset.category,
      timestamp: new Date().toISOString(),
    };

    const updatedPhotos = [newPhoto, ...photos];
    setPhotos(updatedPhotos);
    setSelectedPhoto(newPhoto);

    if (!primaryUrl) {
      setPrimaryUrl(preset.url);
    }

    const updatedMachine: Machine = {
      ...machine,
      imageUrl: primaryUrl || preset.url,
      photos: updatedPhotos,
    };
    onSaveMachine(updatedMachine);
  };

  // Set photo as primary
  const handleSetPrimary = (photo: MachinePhoto) => {
    setPrimaryUrl(photo.url);
    const updatedMachine: Machine = {
      ...machine,
      imageUrl: photo.url,
      photos,
    };
    onSaveMachine(updatedMachine);
  };

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId);
    setPhotos(updatedPhotos);

    let nextPrimary = primaryUrl;
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(updatedPhotos[0] || null);
    }
    if (primaryUrl === selectedPhoto?.url) {
      nextPrimary = updatedPhotos[0]?.url || '';
      setPrimaryUrl(nextPrimary);
    }

    const updatedMachine: Machine = {
      ...machine,
      imageUrl: nextPrimary,
      photos: updatedPhotos,
    };
    onSaveMachine(updatedMachine);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Visual Inspection & Picture Gallery
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {machine.name} • {machine.location}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors btn-cyan-click"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Photo Inspector View (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {selectedPhoto ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] flex items-center justify-center shadow-inner group">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption}
                    className="w-full h-full object-contain"
                  />

                  {/* Top Bar on Preview */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-mono font-bold text-cyan-300 uppercase pointer-events-auto shadow">
                      {selectedPhoto.category}
                    </span>
                    {primaryUrl === selectedPhoto.url && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 text-slate-950 text-xs font-bold font-mono pointer-events-auto flex items-center gap-1 shadow">
                        <Check className="w-3.5 h-3.5" /> Primary Cover
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Floating Bar */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {primaryUrl !== selectedPhoto.url && (
                      <button
                        onClick={() => handleSetPrimary(selectedPhoto)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-700 shadow-md transition-all btn-cyan-click"
                      >
                        Set as Primary Cover
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(selectedPhoto.id)}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-rose-500 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 shadow-md transition-all btn-rose-click"
                      title="Delete this photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Photo Meta & Caption */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">
                      {selectedPhoto.caption || 'Equipment Inspection Photo'}
                    </span>
                    <span className="font-mono text-[11px]">
                      {new Date(selectedPhoto.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span className="uppercase font-mono">{selectedPhoto.category}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Pictures Uploaded Yet</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Upload photos of this machine, thermal infrared scans, nameplates, or bearing inspection audits.
                </p>
              </div>
            )}

            {/* Thumbnail Carousel */}
            {photos.length > 0 && (
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-2">
                  All Machine Pictures ({photos.length})
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                  {photos.map((p) => {
                    const isSelected = selectedPhoto?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPhoto(p)}
                        className={`relative rounded-xl overflow-hidden shrink-0 w-20 h-16 border-2 transition-all ${
                          isSelected
                            ? 'border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                            : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={p.url}
                          alt={p.caption}
                          className="w-full h-full object-cover"
                        />
                        {primaryUrl === p.url && (
                          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Add Pictures Form & Presets (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'upload'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                } btn-cyan-click`}
              >
                Upload Photo
              </button>
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'presets'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                } btn-cyan-click`}
              >
                Industrial Presets
              </button>
            </div>

            {activeTab === 'upload' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-cyan-400" /> Add New Photo
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Upload from your device camera or disk (PNG, JPEG, WebP).
                  </p>
                </div>

                {/* Caption input */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Photo Description / Caption
                  </label>
                  <input
                    type="text"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="e.g. Drive-End Bearing Housing Inspection"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Category selector */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Inspection Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="overall">Overall Machine Profile</option>
                    <option value="bearing">Bearing / Shaft Inspection</option>
                    <option value="thermal">Thermal Infrared Scan</option>
                    <option value="nameplate">Motor Nameplate / Rating</option>
                    <option value="defect">Physical Defect / Spalling</option>
                    <option value="other">Other Visual Evidence</option>
                  </select>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Button */}
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 btn-cyan-click"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isUploading ? 'Compressing & Adding...' : 'Choose or Take Picture'}</span>
                </button>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 leading-normal">
                  Images are automatically optimized and cached in local database for offline fast loading.
                </div>
              </div>
            )}

            {activeTab === 'presets' && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Pre-Rendered Industrial Presets
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Click any preset to attach an instant diagnostic photo to this machine.
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {INDUSTRIAL_PHOTO_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleAddPreset(preset)}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center gap-3 group"
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-14 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {preset.caption}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-cyan-400 shrink-0 opacity-60 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 btn-cyan-click"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
