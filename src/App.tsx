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
import { Users, UserCheck, ShieldAlert, Copy, Check } from 'lucide-react';
import { SQL_RLS_FIX } from './lib/sqlSchema';

export default function App() {
  const storeVersion = useStoreVersion();
  const [currentUser, setCurrentUser] = useState<UserProfile>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [copiedRls, setCopiedRls] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedWorkerForModal, setSelectedWorkerForModal] = useState<Worker | null>(null);

  const isRlsBlocked = store.getIsRlsBlocked();

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(SQL_RLS_FIX);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
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
        key={`navbar-${storeVersion}`}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* RLS Policy Warning Banner if Blocked by Supabase */}
      {isRlsBlocked && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium border-b border-amber-600 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-950" />
            <span>
              <strong>Perhatian Supabase:</strong> Fitur Row-Level Security (RLS) di Supabase masih membatasi akses multi-device. Jalankan skrip 1-klik di SQL Editor Supabase agar semua gadget dapat membaca dan menulis data secara bersamaan.
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" key={`view-${storeVersion}`}>
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
