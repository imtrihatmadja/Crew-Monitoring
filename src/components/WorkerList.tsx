import React, { useState } from 'react';
import { Worker, UserProfile, Company, Vessel } from '../types';
import { store } from '../lib/supabaseStore';
import { WorkerDetailModal } from './WorkerDetailModal';
import { 
  Search, 
  Users, 
  Ship, 
  Anchor, 
  X, 
  Lock, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  Building2, 
  ArrowRightLeft,
  Phone
} from 'lucide-react';

interface WorkerListProps {
  currentUser: UserProfile;
  onSelectWorkerForCheckin: (worker: Worker) => void;
  onNavigateRegister: () => void;
  onNavigateToMobility?: () => void;
}

export const WorkerList: React.FC<WorkerListProps> = ({
  currentUser,
  onSelectWorkerForCheckin,
  onNavigateRegister,
  onNavigateToMobility
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'di_darat' | 'di_laut'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [highMobilityOnly, setHighMobilityOnly] = useState<boolean>(false);
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<Worker | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const companies: Company[] = store.getCompanies();

  // Filter workers based on search, status, company, and high-mobility
  const workers = store.searchWorkers(searchQuery).filter(w => {
    if (statusFilter !== 'all' && w.current_status !== statusFilter) {
      return false;
    }

    if (companyFilter !== 'all') {
      const matchCompany = 
        w.pkl_company_name === companyFilter || 
        w.company_name === companyFilter;
      if (!matchCompany) return false;
    }

    if (highMobilityOnly) {
      const isHighMobility = (w.transfer_count || 0) >= 2;
      if (!isHighMobility) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Daftar Pekerja Awak Kapal (ABK) Asosiasi</span>
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {workers.length} ABK
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data terpadu awak kapal antar-perusahaan anggota asosiasi. NIK disamarkan sesuai UU PDP (UU No. 27/2022).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToMobility && (
            <button
              onClick={onNavigateToMobility}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              <span>Riwayat Mutasi Kapal</span>
            </button>
          )}

          <button
            onClick={onNavigateRegister}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrasi / Import Excel</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / 4 digit NIK / kapal..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Perusahaan Anggota</option>
              {companies.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs (Pill Style) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 rounded font-semibold transition text-center ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('di_darat')}
              className={`flex-1 py-1.5 rounded font-semibold transition text-center ${
                statusFilter === 'di_darat' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Di Darat
            </button>
            <button
              onClick={() => setStatusFilter('di_laut')}
              className={`flex-1 py-1.5 rounded font-semibold transition text-center ${
                statusFilter === 'di_laut' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Di Laut
            </button>
          </div>

          {/* High Mobility Filter Toggle */}
          <div>
            <button
              onClick={() => setHighMobilityOnly(!highMobilityOnly)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                highMobilityOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${highMobilityOnly ? 'text-amber-700' : 'text-slate-400'}`} />
              <span>Sering Pindah Kapal (&ge; 2x)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Nama Pekerja &amp; Jabatan</th>
                <th className="py-3.5 px-4">NIK (4 Digit Masking)</th>
                <th className="py-3.5 px-4">Kapal &amp; Perusahaan Saat Ini</th>
                <th className="py-3.5 px-4">Status Dokumen &amp; Rating</th>
                <th className="py-3.5 px-4">Status Lokasi</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada data pekerja yang cocok dengan filter pencarian ini.
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const isHighMobility = (worker.transfer_count || 0) >= 2;
                  return (
                    <tr key={worker.id} className="hover:bg-slate-50 transition">
                      {/* Name & Position */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <button
                          onClick={() => setSelectedWorkerForDetail(worker)}
                          className="hover:text-blue-600 hover:underline text-left block font-bold text-sm"
                        >
                          {worker.name}
                        </button>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                            {worker.position || 'Kelasi / ABK'}
                          </span>
                          {isHighMobility && (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Pindah {worker.transfer_count}x
                            </span>
                          )}
                        </div>
                      </td>

                      {/* NIK 4 Digit */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Lock className="w-3 h-3 text-blue-600" />
                          •••• •••• •••• {worker.nik_last4}
                        </span>
                      </td>

                      {/* Current Vessel & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Ship className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{worker.last_vessel_name || 'Belum Ditempatkan'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{worker.pkl_company_name || worker.company_name || 'Perusahaan Mandiri'}</span>
                        </div>
                      </td>

                      {/* Documents & Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {/* Rating Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                              worker.performance_rating === 'merah'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : worker.performance_rating === 'kuning'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Rating: {worker.performance_rating === 'merah' ? 'Merah' : worker.performance_rating === 'kuning' ? 'Kuning' : 'Hijau'}
                          </span>

                          {/* PKL Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              worker.pkl_status === 'aktif'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : worker.pkl_status === 'kadaluarsa'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            PKL: {worker.pkl_status === 'aktif' ? 'Aktif' : worker.pkl_status === 'kadaluarsa' ? 'Kadaluarsa' : 'Belum Ada'}
                          </span>
                        </div>
                      </td>

                      {/* Location Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                            worker.current_status === 'di_laut'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {worker.current_status === 'di_laut' ? (
                            <>
                              <Ship className="w-3 h-3 text-amber-700" /> DI LAUT
                            </>
                          ) : (
                            <>
                              <Anchor className="w-3 h-3 text-emerald-700" /> DI DARAT
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedWorkerForDetail(worker)}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                          title="Lihat &amp; Update Dokumen / Atribut Pekerja"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>Detail &amp; Dokumen</span>
                        </button>

                        <button
                          onClick={() => onSelectWorkerForCheckin(worker)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Manifest</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Detail Modal */}
      {selectedWorkerForDetail && (
        <WorkerDetailModal
          worker={selectedWorkerForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedWorkerForDetail(null)}
          onWorkerUpdated={(updatedWorker) => {
            setSelectedWorkerForDetail(updatedWorker);
            setRefreshTrigger(prev => prev + 1);
          }}
          onSelectForCheckin={(worker) => {
            setSelectedWorkerForDetail(null);
            onSelectWorkerForCheckin(worker);
          }}
        />
      )}
    </div>
  );
};
