import React, { useState, useEffect } from 'react';
import {
  Machine,
  MachinePhoto,
  MachineVideo,
  Baseline,
  AnalysisRecord,
  MaintenanceRecord,
} from './types';
import {
  getMachines,
  saveMachine,
  getBaselines,
  saveBaseline,
  getAnalyses,
  saveAnalysis,
  getMaintenanceRecords,
  saveMaintenanceRecord,
  resetDemoData,
} from './services/storage';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { MachineModal } from './components/MachineModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { UnifiedMediaUploaderModal } from './components/UnifiedMediaUploaderModal';
import { LayoutDashboard, Cpu, Mic2, Workflow, Menu, Box, Upload } from 'lucide-react';

// Views
import { SimpleUploadView } from './views/SimpleUploadView';
import { OverviewDashboard } from './views/OverviewDashboard';
import { MachineManagement } from './views/MachineManagement';
import { DigitalTwin3D } from './views/DigitalTwin3D';
import { AudioAnalysis } from './views/AudioAnalysis';
import { BaselineEngine } from './views/BaselineEngine';
import { ModelRepresentation } from './views/ModelRepresentation';
import { VibrationMonitoring } from './views/VibrationMonitoring';
import { MultimodalAnalysis } from './views/MultimodalAnalysis';
import { FewShotExperiment } from './views/FewShotExperiment';
import { PublicBenchmark } from './views/PublicBenchmark';
import { MaintenanceHistoryView } from './views/MaintenanceHistoryView';
import { ReportsView } from './views/ReportsView';
import { HackathonDemoScenario } from './views/HackathonDemoScenario';
import { ProductionReadiness } from './views/ProductionReadiness';
import { AuthView } from './views/AuthView';
import { AuthModal } from './components/AuthModal';
import { getCurrentUser, subscribeAuth } from './services/authService';
import { UserProfile } from './types';

export default function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  const [currentTab, setCurrentTab] = useState<NavTab>('simple_upload');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(true);

  // Modals
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);

  const [unifiedUploaderOpen, setUnifiedUploaderOpen] = useState(false);

  const reloadData = () => {
    const loadedMachines = getMachines();
    const loadedBaselines = getBaselines();
    const loadedAnalyses = getAnalyses();
    const loadedMaintenance = getMaintenanceRecords();

    setMachines(loadedMachines);
    setBaselines(loadedBaselines);
    setAnalyses(loadedAnalyses);
    setMaintenance(loadedMaintenance);

    if (!selectedMachineId && loadedMachines.length > 0) {
      setSelectedMachineId(loadedMachines[0].id);
    }
  };

  useEffect(() => {
    reloadData();
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSaveMachine = (m: Machine) => {
    saveMachine(m);
    reloadData();
  };

  const handleArchiveMachine = (id: string) => {
    const target = machines.find((m) => m.id === id);
    if (target) {
      target.archived = !target.archived;
      saveMachine(target);
      reloadData();
    }
  };

  const handleSaveMachinePhoto = (machineId: string, photo: MachinePhoto) => {
    const target = machines.find((m) => m.id === machineId);
    if (target) {
      const photos = target.photos || [];
      const updated: Machine = {
        ...target,
        photos: [photo, ...photos],
      };
      saveMachine(updated);
      reloadData();
    }
  };

  const handleSaveMachineVideo = (machineId: string, video: MachineVideo) => {
    const target = machines.find((m) => m.id === machineId);
    if (target) {
      const videos = target.videos || [];
      const updated: Machine = {
        ...target,
        videos: [video, ...videos],
      };
      saveMachine(updated);
      reloadData();
    }
  };

  const handleSaveBaseline = (b: Baseline) => {
    saveBaseline(b);
    reloadData();
  };

  const handleSaveAnalysis = (record: AnalysisRecord) => {
    saveAnalysis(record);
    reloadData();
  };

  const handleSaveMaintenance = (rec: MaintenanceRecord) => {
    saveMaintenanceRecord(rec);
    reloadData();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo machines, baselines, and test logs back to factory initial state?')) {
      resetDemoData();
      reloadData();
    }
  };

  const unresolvedAlertsCount = maintenance.filter(
    (m) => m.status === 'New Alert' || m.status === 'Inspection Pending'
  ).length;

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        onOpenHackathonDemo={() => {
          setCurrentTab('demo_scenario');
          setMobileNavOpen(false);
        }}
        onResetData={handleResetData}
        onOpenUnifiedUploader={() => setUnifiedUploaderOpen(true)}
        activeAlertsCount={unresolvedAlertsCount}
        mobileOpen={mobileNavOpen}
        onToggleMobileMenu={() => setMobileNavOpen((prev) => !prev)}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={() => setIsSimpleMode((prev) => !prev)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setMobileNavOpen(false);
          }}
          unresolvedAlertsCount={unresolvedAlertsCount}
          totalMachinesCount={machines.length}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          isSimpleMode={isSimpleMode}
          onToggleSimpleMode={() => setIsSimpleMode((prev) => !prev)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full">
          {currentTab === 'simple_upload' && (
            <SimpleUploadView
              machines={machines}
              baselines={baselines}
              onSaveMachinePhoto={handleSaveMachinePhoto}
              onSaveMachineVideo={handleSaveMachineVideo}
              onSaveAnalysis={handleSaveAnalysis}
              onNavigateTab={setCurrentTab}
              onSelectMachine={(m) => {
                setSelectedMachineId(m.id);
                setCurrentTab('audio_analysis');
              }}
            />
          )}

          {currentTab === 'overview' && (
            <OverviewDashboard
              machines={machines}
              analyses={analyses}
              maintenance={maintenance}
              onNavigateTab={setCurrentTab}
              onSelectMachine={(m) => {
                setSelectedMachineId(m.id);
                setCurrentTab('audio_analysis');
              }}
              onOpenMachineModal={() => {
                setEditingMachine(null);
                setMachineModalOpen(true);
              }}
            />
          )}

          {currentTab === 'machines' && (
            <MachineManagement
              machines={machines}
              onSelectMachineForAnalysis={(m) => {
                setSelectedMachineId(m.id);
                setCurrentTab('audio_analysis');
              }}
              onOpenAddModal={() => {
                setEditingMachine(null);
                setMachineModalOpen(true);
              }}
              onEditMachine={(m) => {
                setEditingMachine(m);
                setMachineModalOpen(true);
              }}
              onArchiveMachine={handleArchiveMachine}
            />
          )}

          {currentTab === 'digital_twin_3d' && (
            <DigitalTwin3D
              machines={machines}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'audio_analysis' && (
            <AudioAnalysis
              machines={machines}
              baselines={baselines}
              selectedMachineId={selectedMachineId}
              onSaveAnalysis={handleSaveAnalysis}
              onNavigateToMaintenance={() => setCurrentTab('maintenance')}
            />
          )}

          {currentTab === 'baseline_engine' && (
            <BaselineEngine
              machines={machines}
              baselines={baselines}
              onSaveBaseline={handleSaveBaseline}
            />
          )}

          {currentTab === 'model_representation' && (
            <ModelRepresentation />
          )}

          {currentTab === 'vibration' && (
            <VibrationMonitoring machines={machines} />
          )}

          {currentTab === 'multimodal' && (
            <MultimodalAnalysis machines={machines} />
          )}

          {currentTab === 'few_shot' && (
            <FewShotExperiment />
          )}

          {currentTab === 'benchmark' && (
            <PublicBenchmark />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceHistoryView
              maintenanceRecords={maintenance}
              onOpenNewTicketModal={() => {
                setEditingMaintenance(null);
                setMaintenanceModalOpen(true);
              }}
              onEditTicket={(rec) => {
                setEditingMaintenance(rec);
                setMaintenanceModalOpen(true);
              }}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              machines={machines}
              analyses={analyses}
              maintenance={maintenance}
            />
          )}

          {currentTab === 'demo_scenario' && (
            <HackathonDemoScenario
              onCompleteDemo={(record) => {
                handleSaveMaintenance(record);
              }}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'production_notes' && (
            <ProductionReadiness />
          )}

          {currentTab === 'auth' && (
            <AuthView
              onNavigateTab={setCurrentTab}
            />
          )}
        </main>
      </div>

      {/* Operator Authentication & Verification Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigateTab={setCurrentTab}
      />

      {/* Unified Media Uploader Modal (Audio, Video, Photo) */}
      <UnifiedMediaUploaderModal
        isOpen={unifiedUploaderOpen}
        onClose={() => setUnifiedUploaderOpen(false)}
        machines={machines}
        baselines={baselines}
        defaultMachineId={selectedMachineId}
        onSaveMachinePhoto={handleSaveMachinePhoto}
        onSaveMachineVideo={handleSaveMachineVideo}
        onSaveAnalysis={handleSaveAnalysis}
        onNavigateToTab={(tab) => {
          setCurrentTab(tab as NavTab);
          setUnifiedUploaderOpen(false);
        }}
      />

      {/* Machine Create/Edit Modal */}
      {machineModalOpen && (
        <MachineModal
          machine={editingMachine}
          onSave={handleSaveMachine}
          onClose={() => setMachineModalOpen(false)}
        />
      )}

      {/* Maintenance Create/Edit Modal */}
      {maintenanceModalOpen && (
        <MaintenanceModal
          record={editingMaintenance}
          machineId={selectedMachineId}
          machineName={machines.find((m) => m.id === selectedMachineId)?.name}
          onSave={handleSaveMaintenance}
          onClose={() => setMaintenanceModalOpen(false)}
        />
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 select-none">
        <button
          onClick={() => {
            setCurrentTab('simple_upload');
            setMobileNavOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'simple_upload' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          } btn-cyan-click`}
        >
          <div className="relative">
            <Upload className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <span className="text-[10px] mt-0.5">Upload</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('digital_twin_3d');
            setMobileNavOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'digital_twin_3d' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          } btn-cyan-click`}
        >
          <div className="relative">
            <Box className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">3D Twin</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('overview');
            setMobileNavOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'overview' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          } btn-cyan-click`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Overview</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('machines');
            setMobileNavOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'machines' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          } btn-cyan-click`}
        >
          <Cpu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Fleet</span>
        </button>

        <button
          onClick={() => setMobileNavOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            mobileNavOpen ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          } btn-cyan-click`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
}
