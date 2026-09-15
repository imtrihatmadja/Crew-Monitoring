import React, { useState } from 'react';
import { store } from '../lib/supabaseStore';
import { WorkerMobilityRecord, Worker, Vessel, Company, UserProfile } from '../types';
import { 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Ship, 
  Phone, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';

interface MobilityTrackerViewProps {
  currentUser: UserProfile;
  onNavigateToWorkerDetail?: (workerId: string) => void;
}

export const MobilityTrackerView: React.FC<MobilityTrackerViewProps> = ({
  currentUser,
  onNavigateToWorkerDetail
}) => {
  const [records, setRecords] = useState<WorkerMobilityRecord[]>(store.getMobilityRecords());
  const [workers] = useState<Worker[]>(store.getWorkers());
  const [vessels] = useState<Vessel[]>(store.getVessels());
  const [companies] = useState<Company[]>(store.getCompanies());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterHighMobilityOnly, setFilterHighMobilityOnly] = useState(false);
  const [filterCompany, setFilterCompany] = useState('all');

  // Contact Modal state
  const [selectedContactCompany, setSelectedContactCompany] = useState<Company | null>(null);

  // New Transfer Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [targetVesselId, setTargetVesselId] = useState('');
  const [transferReason, setTransferReason] = useState<'selesai_kontrak' | 'mutasi_armada' | 'permintaan_pribadi' | 'rotasi_kru' | 'lainnya'>('selesai_kontrak');
  const [transferNotes, setTransferNotes] = useState('');
  const [clearanceStatus, setClearanceStatus] = useState<'disetujui' | 'menunggu_klarifikasi'>('disetujui');
  const [formMsg, setFormMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Identify high-mobility workers (transferred >= 2 times)
  const workerTransferCountMap = new Map<string, number>();
  records.forEach(r => {
    workerTransferCountMap.set(r.worker_id, (workerTransferCountMap.get(r.worker_id) || 0) + 1);
  });
  workers.forEach(w => {
    if (w.transfer_count && w.transfer_count > (workerTransferCountMap.get(w.id) || 0)) {
      workerTransferCountMap.set(w.id, w.transfer_count);
    }
  });

  const highMobilityWorkerIds = new Set(
    Array.from(workerTransferCountMap.entries())
      .filter(([_, count]) => count >= 2)
      .map(([id]) => id)
  );

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.worker_nik_last4.includes(searchTerm) ||
      (record.from_vessel_name && record.from_vessel_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.to_vessel_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHighMobility = filterHighMobilityOnly ? highMobilityWorkerIds.has(record.worker_id) : true;

    const matchesCompany = filterCompany === 'all' || 
      record.from_company_name === filterCompany || 
      record.to_company_name === filterCompany;

    return matchesSearch && matchesHighMobility && matchesCompany;
  });

  const handleOpenContact = (companyName?: string) => {
    if (!companyName) return;
    const comp = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    if (comp) {
      setSelectedContactCompany(comp);
    }
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !targetVesselId) {
      setFormMsg({ type: 'error', text: 'Pilih pekerja dan kapal tujuan terlebih dahulu.' });
      return;
    }

    const res = store.transferWorkerVessel({
      workerId: selectedWorkerId,
      toVesselId: targetVesselId,
      reason: transferReason,
      notes: transferNotes.trim(),
      clearanceStatus: clearanceStatus
    });

    if (!res.success) {
      setFormMsg({ type: 'error', text: res.error || 'Gagal memproses mutasi kapal' });
      return;
    }

    setRecords(store.getMobilityRecords());
    setIsTransferModalOpen(false);
    setSelectedWorkerId('');
    setTargetVesselId('');
    setTransferNotes('');
    setFormMsg({ type: 'success', text: 'Perpindahan kapal kru berhasil dicatat ke dalam buku mobilitas asosiasi.' });
    setTimeout(() => setFormMsg(null), 4000);
  };

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const targetVessel = vessels.find(v => v.id === targetVesselId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Pelacakan Perpindahan Awak Kapal (Mobility Tracker)
                </h1>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Grup Asosiasi
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Mencatat riwayat mutasi kru antar kapal dan perusahaan anggota asosiasi secara transparan, memudahkan komunikasi bilateral jika ada kru yang sering berpindah kapal.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormMsg(null);
              setIsTransferModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Mutasi / Pindah Kapal</span>
          </button>
        </div>
      </div>

      {formMsg && (
        <div className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
          formMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {formMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{formMsg.text}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Mutasi Tercatat</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{records.length}</div>
          <p className="text-xs text-slate-500 mt-1">Perpindahan kapal dalam grup asosiasi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kru Mobilitas Tinggi</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{highMobilityWorkerIds.size}</div>
          <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
            <span>●</span> Berpindah kapal &ge; 2 kali (Perlu koordinasi antar-PIC)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perusahaan Anggota</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{companies.length}</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Terhubung dalam sistem monitoring bersama</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama ABK, 4 digit NIK, atau kapal..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="all">Semua Perusahaan Anggota</option>
              {companies.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* High-Mobility Toggle */}
          <div className="flex items-center">
            <button
              onClick={() => setFilterHighMobilityOnly(!filterHighMobilityOnly)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border ${
                filterHighMobilityOnly
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${filterHighMobilityOnly ? 'text-amber-700' : 'text-slate-400'}`} />
              <span>Hanya Kru Sering Pindah Kapal ({highMobilityWorkerIds.size})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobility Records List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Riwayat Perpindahan Kapal Awak Kapal ({filteredRecords.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Sesuai UU PDP No. 27/2022 (NIK 4 Digit)
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Tidak ditemukan riwayat perpindahan dengan kriteria pencarian ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRecords.map(record => {
              const isHighMobility = highMobilityWorkerIds.has(record.worker_id);
              return (
                <div key={record.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {record.worker_name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{record.worker_name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                            •••• •••• •••• {record.worker_nik_last4}
                          </span>
                          {isHighMobility && (
                            <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Sering Pindah Kapal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Tanggal Mutasi: {new Date(record.transfer_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 capitalize self-start sm:self-center">
                      Alasan: {record.reason.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Transfer Route Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    {/* From Ship */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Kapal &amp; Perusahaan Asal</span>
                      <div className="font-bold text-slate-800 flex items-center gap-1 text-sm">
                        <Ship className="w-3.5 h-3.5 text-slate-500" />
                        {record.from_vessel_name || 'Kru Baru / Rekrutmen Bebas'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {record.from_company_name || 'Tidak tercatat dalam grup'}
                      </div>

                      {record.from_company_name && (
                        <button
                          onClick={() => handleOpenContact(record.from_company_name)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          <Phone className="w-3 h-3" />
                          Hubungi PIC Perusahaan Asal ({record.from_company_name.split(' ')[1] || 'PIC'})
                        </button>
                      )}
                    </div>

                    {/* To Ship */}
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                      <span className="text-[10px] uppercase font-bold text-blue-600">Kapal &amp; Perusahaan Tujuan</span>
                      <div className="font-bold text-slate-900 flex items-center gap-1 text-sm">
                        <Ship className="w-3.5 h-3.5 text-blue-600" />
                        {record.to_vessel_name}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {record.to_company_name}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Dicatat oleh: <strong>{record.recorded_by_name}</strong>
                      </div>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                      <strong>Keterangan / Catatan Evaluasi:</strong> {record.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Status Pelepasan: <strong className={record.clearance_status === 'disetujui' ? 'text-emerald-600' : 'text-amber-600'}>{record.clearance_status.replace(/_/g, ' ')}</strong>
                    </span>

                    {onNavigateToWorkerDetail && (
                      <button
                        onClick={() => onNavigateToWorkerDetail(record.worker_id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Lihat Profil &amp; PKL &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: New Transfer / Mutasi */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Form Mutasi / Perpindahan Kapal Awak</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              {/* Select Worker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Awak Kapal (ABK): <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Pekerja Berdasarkan Nama &amp; 4 Digit NIK --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (NIK: •••• •••• •••• {w.nik_last4}) — {w.last_vessel_name || 'Belum ada kapal'} [{w.current_status === 'di_laut' ? 'DI LAUT' : 'DI DARAT'}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorker && (
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 space-y-1">
                  <div className="font-bold text-blue-900">{selectedWorker.name}</div>
                  <div className="text-slate-600">
                    Kapal Saat Ini: <strong>{selectedWorker.last_vessel_name || 'Tidak ada'}</strong> ({selectedWorker.company_name || 'Belum terikat'})
                  </div>
                  <div className="text-slate-600">
                    Status Lokasi: <span className={selectedWorker.current_status === 'di_laut' ? 'text-blue-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {selectedWorker.current_status === 'di_laut' ? '⚠️ Sedang Di Laut' : '✓ Siap / Di Darat'}
                    </span>
                  </div>
                  {highMobilityWorkerIds.has(selectedWorker.id) && (
                    <div className="text-amber-800 text-[11px] font-bold flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Pekerja ini memiliki riwayat sering berpindah kapal dalam grup.
                    </div>
                  )}
                </div>
              )}

              {/* Select Target Vessel */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Kapal Tujuan: <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={targetVesselId}
                  onChange={(e) => setTargetVesselId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Kapal Tujuan --</option>
                  {vessels.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.company_name}) - {v.gross_tonnage} GT [{v.status === 'di_laut' ? 'Melaut' : 'Sandar'}]
                    </option>
                  ))}
                </select>
              </div>

              {targetVessel && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                  Perusahaan Pemilik Kapal Tujuan: <strong>{targetVessel.company_name}</strong> (Pelabuhan: {targetVessel.home_port})
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alasan Perpindahan: <span className="text-rose-600">*</span>
                </label>
                <select
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="selesai_kontrak">Selesai Masa Kontrak PKL</option>
                  <option value="mutasi_armada">Mutasi / Rolling Kru Internal Armada</option>
                  <option value="permintaan_pribadi">Permintaan Pribadi Pekerja</option>
                  <option value="rotasi_kru">Rotasi Jadwal Berlayar</option>
                  <option value="lainnya">Lainnya / Kesepakatan Khusus</option>
                </select>
              </div>

              {/* Clearance Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Surat Pelepasan (Clearance) Kapal Asal:
                </label>
                <select
                  value={clearanceStatus}
                  onChange={(e) => setClearanceStatus(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="disetujui">Disetujui Resmi oleh PIC Perusahaan Asal</option>
                  <option value="menunggu_klarifikasi">Menunggu Konfirmasi / Klarifikasi Lanjutan</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Evaluasi &amp; Keterangan:
                </label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Misal: Telah dikonfirmasi PIC SBI, kru dipindahkan untuk mengisi kekosongan juru mudi."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Simpan Perpindahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Contact PIC Company */}
      {selectedContactCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Kontak PIC Perusahaan</h3>
              </div>
              <button
                onClick={() => setSelectedContactCompany(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-medium">Perusahaan Anggota:</label>
                <div className="text-slate-900 font-bold text-sm">{selectedContactCompany.name}</div>
                <div className="text-slate-500 text-[11px]">Izin: {selectedContactCompany.license_number}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Penanggung Jawab (PIC)</div>
                  <div className="text-slate-900 font-bold text-sm">{selectedContactCompany.pic_name}</div>
                  <div className="text-slate-600">{selectedContactCompany.pic_role}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <a
                    href={`https://wa.me/62${selectedContactCompany.pic_phone.replace(/\D/g, '').replace(/^0/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 text-xs transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat WhatsApp PIC ({selectedContactCompany.pic_phone})
                  </a>

                  <a
                    href={`tel:${selectedContactCompany.pic_phone}`}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-md flex items-center justify-center gap-2 text-xs transition"
                  >
                    <Phone className="w-4 h-4" />
                    Telepon Langsung
                  </a>

                  <a
                    href={`mailto:${selectedContactCompany.pic_email}?subject=Konfirmasi Riwayat Kerja Awak Kapal - Asosiasi`}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-md flex items-center justify-center gap-2 text-xs transition"
                  >
                    <Mail className="w-4 h-4 text-slate-600" />
                    Kirim Email ({selectedContactCompany.pic_email})
                  </a>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Alamat: {selectedContactCompany.address}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedContactCompany(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
