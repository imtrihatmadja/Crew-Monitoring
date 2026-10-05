import React, { useState } from 'react';
import { UserProfile, Worker, NavTab } from './types';
import { store, useStoreVersion } from './lib/supabaseStore';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ManifestLog } from './components/ManifestLog';
import { ManifestDiscrepancyView } from './components/ManifestDiscrepancyView';
import { AntiDuplicationView } from './components/AntiDuplicationView';
import { MobilityTrackerView } from './components/MobilityTrackerView';
import { AssociationDirectory } from './components/AssociationDirectory';
import { WorkerRegistration } from './components/WorkerRegistration';
import { WorkerList } from './components/WorkerList';
import { LogHistory } from './components/LogHistory';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { UserSwitchModal } from './components/UserSwitchModal';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Copy, 
  Check, 
  AlertTriangle, 
  CloudUpload, 
  RefreshCw, 
  CheckCircle2, 
  Database,
  ExternalLink
} from 'lucide-react';
import { SQL_RLS_FIX, SQL_SCHEMA_TEXT } from './lib/sqlSchema';

export default function App() {
  const storeVersion = useStoreVersion();
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [copiedRls, setCopiedRls] = useState(false);
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedWorkerForModal, setSelectedWorkerForModal] = useState<Worker | null>(null);

  const isRlsBlocked = store.getIsRlsBlocked();
  const tablesMissing = store.getTablesMissing();
  const isPushingLocal = store.getIsPushingLocal();
  const localWorkersCount = store.getWorkers().length;
  const localVesselsCount = store.getVessels().length;

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(SQL_RLS_FIX);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2500);
  };

  const handleManualSyncNow = async () => {
    setIsManualSyncing(true);
    setSyncStatusMsg({ type: 'info', text: 'Menghubungi Supabase Cloud & menarik data terkini...' });
    try {
      const res = await store.refreshFromSupabase(false);
      if (res.success) {
        setSyncStatusMsg({ type: 'success', text: res.message });
      } else {
        setSyncStatusMsg({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setSyncStatusMsg({ type: 'error', text: e?.message || 'Gagal sinkronisasi data cloud.' });
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const handlePushLocalDataNow = async () => {
    setIsManualSyncing(true);
    setSyncStatusMsg({ type: 'info', text: 'Mengunggah data lokal ke Supabase Cloud...' });
    try {
      const pushRes = await store.pushLocalDataToSupabase();
      if (pushRes.success) {
        setSyncStatusMsg({ type: 'success', text: pushRes.message });
      } else {
        setSyncStatusMsg({ type: 'error', text: pushRes.message });
      }
    } catch (e: any) {
      setSyncStatusMsg({ type: 'error', text: e?.message || 'Gagal mengunggah data ke Cloud.' });
    } finally {
      setIsManualSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    store.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleSelectWorkerForCheckin = (_worker: Worker) => {
    setActiveTab('manifest-log');
  };

  const handleOpenWorkerDetailById = (workerId: string) => {
    const w = store.getWorkerById(workerId);
    if (w) {
      setSelectedWorkerForModal(w);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Missing Tables Banner if Tables Not Created in Supabase */}
      {tablesMissing && tablesMissing.length > 0 && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium border-b border-rose-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span>
              <strong>Tabel Belum Dibuat di Supabase:</strong> Tabel <code className="bg-rose-800 px-1 py-0.5 rounded text-white">{tablesMissing.join(', ')}</code> belum ada di database cloud project Anda. Salin skrip SQL di bawah lalu jalankan di SQL Editor Supabase agar semua gadget bisa tersambung serempak.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyDdl}
              className="bg-white hover:bg-slate-100 text-rose-900 font-bold px-3 py-1 rounded text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copiedDdl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Skrip SQL Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-rose-700" />
                  <span>Salin Skrip DDL 1-Klik</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold px-2.5 py-1 rounded text-xs transition"
            >
              Buka Petunjuk
            </button>
          </div>
        </div>
      )}

      {/* RLS Policy Warning Banner if Blocked by Supabase */}
      {isRlsBlocked && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium border-b border-amber-600 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-950" />
            <span>
              <strong>Perhatian Supabase (RLS):</strong> Fitur Row-Level Security di Supabase masih membatasi akses multi-device. Jalankan skrip 1-klik di SQL Editor Supabase agar semua gadget & mode incognito dapat membaca dan menulis data secara bersamaan.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyRlsFix}
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copiedRls ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Skrip SQL Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Salin Skrip Buka Akses RLS</span>
                </>
              )}
            </button>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded text-xs transition"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* Multi-Device Sync Action & Feedback Toast */}
      {syncStatusMsg && (
        <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 border-b shadow-xs transition-all ${
          syncStatusMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : syncStatusMsg.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-300'
            : 'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {syncStatusMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {syncStatusMsg.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />}
            <span>{syncStatusMsg.text}</span>
          </div>
          <button 
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Quick Sync Toolbar for Multi-Device Connectivity */}
      <div className="bg-slate-900/90 text-slate-300 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-medium text-slate-200">Sinkronisasi Cloud Supabase:</span>
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700">
            {localWorkersCount} ABK &bull; {localVesselsCount} Kapal
          </span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold hidden md:inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime Aktif (Multi-Device)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {localWorkersCount > 0 && (
            <button
              onClick={handlePushLocalDataNow}
              disabled={isManualSyncing || isPushingLocal}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1 rounded text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Unggah data di gadget ini ke Cloud Supabase agar langsung tampil di gadget lain & incognito"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isPushingLocal ? 'animate-bounce' : ''}`} />
              <span>{isPushingLocal ? 'Mengunggah...' : 'Unggah Data Lokal ke Cloud'}</span>
            </button>
          )}

          <button
            onClick={handleManualSyncNow}
            disabled={isManualSyncing}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1 rounded text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Tarik data terbaru dari Supabase ke gadget ini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
            <span>Tarik Data Terbaru</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            setActiveTab={setActiveTab}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
            onOpenWorkerDetail={handleOpenWorkerDetailById}
          />
        )}

        {/* Anti-Duplication & Conflict Resolver View */}
        {activeTab === 'anti-duplication' && (
          <AntiDuplicationView
            currentUser={currentUser}
            onNavigateToManifest={(_vesselId) => setActiveTab('manifest-log')}
            onNavigateToWorkerDetail={handleOpenWorkerDetailById}
          />
        )}

        {/* Worker Mobility & Transfer Audit View */}
        {activeTab === 'mobility' && (
          <MobilityTrackerView
            currentUser={currentUser}
            onNavigateToWorkerDetail={handleOpenWorkerDetailById}
          />
        )}

        {/* Vessel & Crew Manifest Log View */}
        {activeTab === 'manifest-log' && (
          <ManifestLog />
        )}

        {/* Association Directory (Companies & Fleets) */}
        {activeTab === 'directory' && (
          <AssociationDirectory
            currentUser={currentUser}
            onNavigateToManifest={(_vesselId) => setActiveTab('manifest-log')}
          />
        )}

        {/* Discrepancy & Anomali View */}
        {activeTab === 'anomali-admin' && (
          <ManifestDiscrepancyView />
        )}

        {/* Workers Section: List & Registration Child Menus */}
        {(activeTab === 'workers' || activeTab === 'register') && (
          <div className="space-y-4">
            {/* Child Sub-Navigation Header under Parent 'Pekerja' */}
            <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('workers')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  activeTab === 'workers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Daftar Pekerja Awak Kapal (ABK)</span>
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Registrasi NIK &amp; Bulk Import Excel</span>
              </button>
            </div>

            {activeTab === 'register' ? (
              <WorkerRegistration
                currentUser={currentUser}
                onWorkerRegistered={() => setActiveTab('workers')}
                onCancel={() => setActiveTab('workers')}
              />
            ) : (
              <WorkerList
                currentUser={currentUser}
                onSelectWorkerForCheckin={handleSelectWorkerForCheckin}
                onNavigateRegister={() => setActiveTab('register')}
                onNavigateToMobility={() => setActiveTab('mobility')}
              />
            )}
          </div>
        )}

        {/* Audit Log History */}
        {activeTab === 'history' && (
          <LogHistory currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-200">
              CREW SISTEM - ATLI &bull; ASOSIASI TUNA LONGLINE INDONESIA
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Pencegahan Duplikasi Manifest &amp; Perlindungan Data Pribadi NIK (UU No. 27/2022) Antar-Perusahaan Anggota
            </div>
          </div>
          <div className="flex items-center gap-4 text-cyan-400 text-[11px]">
            <button onClick={() => setIsSqlModalOpen(true)} className="hover:underline">
              Skema DDL &amp; RLS Supabase
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsUserModalOpen(true)} className="hover:underline">
              Ganti Akun Perusahaan ({currentUser.name})
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <UserSwitchModal
        isOpen={isUserModalOpen}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onClose={() => setIsUserModalOpen(false)}
      />

      {/* Global Worker Detail Modal */}
      {selectedWorkerForModal && (
        <WorkerDetailModal
          worker={selectedWorkerForModal}
          currentUser={currentUser}
          onClose={() => setSelectedWorkerForModal(null)}
          onWorkerUpdated={(updated) => {
            setSelectedWorkerForModal(updated);
          }}
          onSelectForCheckin={(worker) => {
            setSelectedWorkerForModal(null);
            handleSelectWorkerForCheckin(worker);
          }}
        />
      )}
    </div>
  );
}
