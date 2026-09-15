import React, { useState } from 'react';
import { Worker, UserProfile } from '../types';
import { store } from '../lib/supabaseStore';
import { formatMaskedDisplay } from '../lib/hash';
import {
  X,
  Lock,
  FileText,
  ShieldCheck,
  Award,
  HeartPulse,
  Ship,
  Anchor,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Briefcase,
  User,
  Building2,
  Calendar,
  CheckCheck,
  Receipt,
  Scale,
  DollarSign,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WorkerDetailModalProps {
  worker: Worker;
  currentUser: UserProfile;
  onClose: () => void;
  onWorkerUpdated: (updatedWorker: Worker) => void;
  onSelectForCheckin: (worker: Worker) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  worker: initialWorker,
  currentUser,
  onClose,
  onWorkerUpdated,
  onSelectForCheckin
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'edit_atribut' | 'mutasi' | 'timeline'>('ringkasan');
  const [worker, setWorker] = useState<Worker>(initialWorker);

  // Form State for editing worker attributes
  const [position, setPosition] = useState(worker.position || 'Kelasi / ABK');
  const [performanceRating, setPerformanceRating] = useState<'hijau' | 'kuning' | 'merah'>(worker.performance_rating || 'hijau');
  const [performanceNotes, setPerformanceNotes] = useState(worker.performance_notes || '');

  // PKL State
  const [pklNumber, setPklNumber] = useState(worker.pkl_number || '');
  const [pklStartDate, setPklStartDate] = useState(worker.pkl_start_date || '');
  const [pklExpiryDate, setPklExpiryDate] = useState(worker.pkl_expiry_date || '');
  const [pklCompanyName, setPklCompanyName] = useState(worker.pkl_company_name || worker.last_vessel_name ? `PT Pemilik ${worker.last_vessel_name}` : '');
  const [pklStatus, setPklStatus] = useState<'aktif' | 'kadaluarsa' | 'belum_ada'>(worker.pkl_status || 'aktif');

  // Certification State
  const [bstNumber, setBstNumber] = useState(worker.bst_number || '');
  const [bstExpiry, setBstExpiry] = useState(worker.bst_expiry || '');
  const [seamanBookNumber, setSeamanBookNumber] = useState(worker.seaman_book_number || '');
  const [seamanBookExpiry, setSeamanBookExpiry] = useState(worker.seaman_book_expiry || '');
  const [passportNumber, setPassportNumber] = useState(worker.passport_number || '');
  const [passportExpiry, setPassportExpiry] = useState(worker.passport_expiry || '');
  const [competencyCert, setCompetencyCert] = useState(worker.competency_cert || '');
  const [mcuStatus, setMcuStatus] = useState<'layak' | 'perlu_evaluasi' | 'tidak_layak' | 'belum_mcu'>(worker.mcu_status || 'layak');

  // BPJS State
  const [bpjsTkNumber, setBpjsTkNumber] = useState(worker.bpjs_tk_number || '');
  const [bpjsTkActive, setBpjsTkActive] = useState<boolean>(worker.bpjs_tk_active ?? true);
  const [bpjsKesNumber, setBpjsKesNumber] = useState(worker.bpjs_kes_number || '');
  const [bpjsKesActive, setBpjsKesActive] = useState<boolean>(worker.bpjs_kes_active ?? true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const workerEvents = store.getWorkerEvents(worker.id);
  const workerClearances = store.getWorkerClearanceRecords(worker.id);

  // Clearance Resolution & History State
  const [isResolvingClearance, setIsResolvingClearance] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showClearanceHistory, setShowClearanceHistory] = useState(false);

  const formatClearanceCategory = (cat?: string) => {
    switch (cat) {
      case 'kasbon_pinjaman': return 'Kasbon / Pinjaman Uang Muka';
      case 'alat_kapal': return 'Inventaris / Peralatan Kapal';
      case 'sengketa_kontrak': return 'Sengketa Kontrak / PKL';
      case 'gaji_bagi_hasil': return 'Penyesuaian Gaji / Bagi Hasil';
      case 'dokumen_kapal': return 'Dokumen / Kunci Inventaris';
      case 'lainnya': return 'Kewajiban Lainnya';
      default: return cat ? cat.replace(/_/g, ' ') : 'Kewajiban Tanggungan';
    }
  };

  const handleResolveClearance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setNotification({
        type: 'error',
        message: 'Mohon masukkan catatan penyelesaian atau bukti pelunasan/serah-terima kewajiban.'
      });
      return;
    }

    const res = store.resolveWorkerClearance(worker.id, resolutionNotes);
    if (res.success && res.worker) {
      setWorker(res.worker);
      onWorkerUpdated(res.worker);
      setIsResolvingClearance(false);
      setResolutionNotes('');
      setNotification({
        type: 'success',
        message: 'Status tanggungan berhasil diselesaikan! Pekerja kini Bebas Tanggungan & Bebas Transfer penuh.'
      });
      setTimeout(() => setNotification(null), 3500);
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'Gagal memperbarui status clearance.'
      });
    }
  };

  const handleSaveAttributes = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedData: Partial<Worker> = {
      position,
      performance_rating: performanceRating,
      performance_notes: performanceNotes,
      pkl_number: pklNumber,
      pkl_start_date: pklStartDate,
      pkl_expiry_date: pklExpiryDate,
      pkl_company_name: pklCompanyName,
      pkl_status: pklStatus,
      bst_number: bstNumber,
      bst_expiry: bstExpiry,
      seaman_book_number: seamanBookNumber,
      seaman_book_expiry: seamanBookExpiry,
      passport_number: passportNumber,
      passport_expiry: passportExpiry,
      competency_cert: competencyCert,
      mcu_status: mcuStatus,
      bpjs_tk_number: bpjsTkNumber,
      bpjs_tk_active: bpjsTkActive,
      bpjs_kes_number: bpjsKesNumber,
      bpjs_kes_active: bpjsKesActive
    };

    const res = store.updateWorkerAttributes(worker.id, updatedData);
    if (res.success && res.worker) {
      setWorker(res.worker);
      onWorkerUpdated(res.worker);
      setNotification({
        type: 'success',
        message: 'Atribut dan dokumen pekerja berhasil diperbarui!'
      });
      setTimeout(() => setNotification(null), 3000);
      setActiveTab('ringkasan');
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'Gagal memperbarui data.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                ID ABK: {worker.id}
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-400" />
                NIK: ****{worker.nik_last4}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                  worker.performance_rating === 'merah'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : worker.performance_rating === 'kuning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                Rating: {worker.performance_rating === 'merah' ? 'Merah (Pelanggaran)' : worker.performance_rating === 'kuning' ? 'Kuning (Tinjauan)' : 'Hijau (Baik)'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {worker.name}
              <span className="text-xs font-normal text-slate-400 font-sans">
                ({worker.position || 'Kelasi / ABK'})
              </span>
            </h2>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 pt-0.5">
              <span>Tgl Lahir: <strong className="text-white">{worker.dob}</strong></span>
              <span>HP: <strong className="text-white font-mono">{worker.phone}</strong></span>
              <span>Basis: <strong className="text-white">{worker.home_port}</strong></span>
              {worker.last_vessel_name && (
                <span>Kapal: <strong className="text-blue-300">{worker.last_vessel_name}</strong></span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Toast */}
        {notification && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 pt-3 flex gap-2 text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('ringkasan')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-1.5 ${
              activeTab === 'ringkasan'
                ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 border-t-blue-600 font-extrabold shadow-sm'
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Atribut & Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('edit_atribut')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-1.5 ${
              activeTab === 'edit_atribut'
                ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 border-t-blue-600 font-extrabold shadow-sm'
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Input / Update Atribut</span>
          </button>

          <button
            onClick={() => setActiveTab('mutasi')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-1.5 ${
              activeTab === 'mutasi'
                ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 border-t-blue-600 font-extrabold shadow-sm'
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Ship className="w-4 h-4 text-purple-600" />
            <span>Riwayat Mutasi Kapal</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-white text-blue-600 border-t-2 border-x border-slate-200 border-t-blue-600 font-extrabold shadow-sm'
                : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Timeline Manifest ({workerEvents.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
          {activeTab === 'ringkasan' && (
            <div className="space-y-5">
              {/* Status & Quick Action Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      worker.current_status === 'di_laut' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {worker.current_status === 'di_laut' ? <Ship className="w-6 h-6" /> : <Anchor className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Status Operasional Real-Time</div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {worker.current_status === 'di_laut' ? 'Sedang Melaut (Di Laut)' : 'Standby di Darat (Di Darat)'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Kapal: <span className="font-semibold text-slate-800">{worker.last_vessel_name || (worker.previous_vessel_name ? `Bebas Tugas (Eks ${worker.previous_vessel_name})` : 'Bebas Tugas (Tanpa Kapal)')}</span>
                      {worker.company_name ? (
                        <> | Perusahaan: <span className="font-semibold text-slate-800">{worker.company_name}</span></>
                      ) : worker.previous_company_name ? (
                        <> | Eks Perusahaan: <span className="font-semibold text-slate-600">{worker.previous_company_name}</span></>
                      ) : (
                        <> | Status Asosiasi: <span className="font-semibold text-emerald-700">Pool Bebas Lintas Armada</span></>
                      )} | Port: <span className="font-semibold text-slate-800">{worker.home_port}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectForCheckin(worker);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Ship className="w-4 h-4" />
                  <span>Proses Manifest</span>
                </button>
              </div>

              {/* Status Clearance Kepulangan & Tanggungan Lintas Armada (Bebas Transfer) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Status Clearance Kepulangan &amp; Bebas Transfer Lintas Armada
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Transparansi catatan kewajiban (kasbon/alat) saat tiba di darat untuk memastikan hak bebas transfer antar kapal asosiasi.
                    </p>
                  </div>
                  <div>
                    {worker.current_status === 'di_laut' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200 uppercase">
                        <Ship className="w-3 h-3" />
                        Aktif Berlayar (Belum Clearance)
                      </span>
                    ) : worker.clearance_status === 'ada_tanggungan' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-300 uppercase shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Ada Catatan Tanggungan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300 uppercase shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Bebas Tanggungan (Bebas Transfer)
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content based on clearance status */}
                {worker.current_status === 'di_laut' ? (
                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-blue-950">
                    <Ship className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold">Pekerja Saat Ini Masih Aktif di Laut ({worker.last_vessel_name || 'Kapal Terdaftar'})</div>
                      <p className="text-slate-600 text-[11px]">
                        Pekerja terkunci di kapal ini dan tidak dapat ditugaskan ke kapal lain sampai tiba di pelabuhan. Proses verifikasi clearance tanggungan (kasbon atau inventaris alat) akan dicatatkan pada Manifest Kedatangan.
                      </p>
                    </div>
                  </div>
                ) : worker.clearance_status === 'ada_tanggungan' ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                            Kewajiban / Tanggungan dari Kepulangan Terakhir
                          </div>
                          <div className="text-xs font-extrabold text-amber-950 mt-0.5">
                            {formatClearanceCategory(worker.tanggungan_category)}
                          </div>
                        </div>
                        {worker.tanggungan_amount && worker.tanggungan_amount > 0 ? (
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-amber-700">Nominal Kewajiban</div>
                            <div className="text-sm font-extrabold text-amber-900 font-mono">
                              Rp {worker.tanggungan_amount.toLocaleString('id-ID')}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/70 text-[11px]">
                        <div>
                          <span className="text-amber-700 block font-semibold">Kapal Terakhir:</span>
                          <span className="font-bold text-slate-800">{worker.clearance_by_vessel || worker.previous_vessel_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-amber-700 block font-semibold">Tanggal Kepulangan:</span>
                          <span className="font-medium text-slate-800">
                            {worker.clearance_updated_at ? new Date(worker.clearance_updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-amber-700 block font-semibold">Pencatat Manifest:</span>
                          <span className="font-medium text-slate-800">{worker.clearance_by_name || 'Nahkoda / PIC'}</span>
                        </div>
                      </div>

                      {worker.tanggungan_notes && (
                        <div className="bg-white/90 p-2.5 rounded border border-amber-200 text-[11px] text-amber-900">
                          <span className="font-bold">Keterangan Catatan: </span>
                          <span className="italic">&ldquo;{worker.tanggungan_notes}&rdquo;</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-amber-900">
                        <span className="flex items-center gap-1 font-semibold">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                          <span>Status: Bebas Transfer dengan Konfirmasi Tanggungan</span>
                        </span>
                        {(currentUser.role === 'company' || currentUser.role === 'admin') && !isResolvingClearance && (
                          <button
                            type="button"
                            onClick={() => setIsResolvingClearance(true)}
                            className="text-[11px] font-bold bg-amber-700 hover:bg-amber-800 text-white px-2.5 py-1 rounded transition shadow-2xs inline-flex items-center gap-1 self-start sm:self-auto"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Tandai Selesai (Clearance Bersih)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Form to Resolve Clearance */}
                    {isResolvingClearance && (
                      <form onSubmit={handleResolveClearance} className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-2.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 border-b pb-1.5">
                          <span>Konfirmasi Pelunasan / Penyelesaian Tanggungan ABK</span>
                          <button
                            type="button"
                            onClick={() => setIsResolvingClearance(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs"
                          >
                            Batal
                          </button>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Catatan Bukti Penyelesaian / Serah-Terima / Pelunasan:
                          </label>
                          <textarea
                            required
                            rows={2}
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Contoh: Sisa kasbon telah dipotong dari bagi hasil / telah diserahkan tunai kepada kasir kapal..."
                            className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsResolvingClearance(false)}
                            className="px-2.5 py-1 rounded border border-slate-300 text-slate-600 font-medium text-xs hover:bg-slate-100"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Konfirmasi Bebas Tanggungan</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Clearance Bersih — Tanpa Tanggungan
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          Pekerja berstatus Bebas Transfer Penuh tanpa catatan kasbon atau peralatan tertahan.
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Siap Ditugaskan Lintas Armada
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                      <div>
                        <span className="text-emerald-800 font-semibold block">Kapal Kepulangan Terakhir:</span>
                        <span className="font-bold text-slate-800">{worker.clearance_by_vessel || worker.previous_vessel_name || worker.last_vessel_name || 'Tidak Ada Data'}</span>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-semibold block">Catatan Clearance:</span>
                        <span className="text-slate-700 italic">{worker.tanggungan_notes || 'Peralatan lengkap dan hak kewajiban telah diselesaikan.'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical clearance audit records */}
                {workerClearances.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowClearanceHistory(!showClearanceHistory)}
                      className="flex items-center justify-between w-full text-left text-[11px] font-bold text-slate-600 hover:text-slate-900 transition"
                    >
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Riwayat Audit Clearance Kepulangan ({workerClearances.length} Log)</span>
                      </span>
                      {showClearanceHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showClearanceHistory && (
                      <div className="mt-2.5 space-y-2">
                        {workerClearances.map((c) => (
                          <div key={c.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{c.vessel_name} ({c.company_name})</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                c.status === 'ada_tanggungan'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : c.status === 'diselesaikan'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}>
                                {c.status === 'ada_tanggungan' ? 'Ada Tanggungan' : c.status === 'diselesaikan' ? 'Diselesaikan' : 'Bebas Tanggungan'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>Pelabuhan: {c.port}</span>
                              <span className="font-mono">{new Date(c.timestamp).toLocaleDateString('id-ID')}</span>
                            </div>

                            {c.category && (
                              <div className="text-[11px] text-slate-700">
                                <strong>Kategori:</strong> {formatClearanceCategory(c.category)} {c.amount ? `• Rp ${c.amount.toLocaleString('id-ID')}` : ''}
                              </div>
                            )}

                            {c.notes && (
                              <div className="text-[11px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-100">
                                &ldquo;{c.notes}&rdquo;
                              </div>
                            )}

                            {c.resolution_notes && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-1">
                                <strong>Penyelesaian:</strong> &ldquo;{c.resolution_notes}&rdquo;
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 text-right">
                              Dicatat oleh: {c.recorded_by_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid 1: Perjanjian Kerja Laut (PKL) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Perjanjian Kerja Laut (PKL) &amp; Kontrak Work
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase ${
                      worker.pkl_status === 'aktif'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : worker.pkl_status === 'kadaluarsa'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    PKL {worker.pkl_status === 'aktif' ? 'Aktif Terverifikasi' : worker.pkl_status === 'kadaluarsa' ? 'Kadaluarsa' : 'Belum Ada'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Nomor PKL</div>
                    <div className="font-mono font-bold text-slate-800">{worker.pkl_number || '-'}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Masa Berlaku Kontrak</div>
                    <div className="font-semibold text-slate-800">
                      {worker.pkl_start_date ? `${worker.pkl_start_date} s/d ${worker.pkl_expiry_date || 'N/A'}` : '-'}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Perusahaan Pembuat PKL</div>
                    <div className="font-semibold text-slate-800">{worker.pkl_company_name || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Sertifikasi & Buku Pelaut */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Sertifikasi &amp; Buku Pelaut (Seaman Book)
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      worker.mcu_status === 'layak'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    MCU: {worker.mcu_status === 'layak' ? 'Layak Laut' : 'Perlu Evaluasi'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">BST (Basic Safety Training)</div>
                    <div className="font-mono font-bold text-slate-800">{worker.bst_number || '-'}</div>
                    {worker.bst_expiry && <div className="text-[10px] text-slate-500 mt-0.5">Berlaku s/d: {worker.bst_expiry}</div>}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Buku Pelaut (Seaman Book)</div>
                    <div className="font-mono font-bold text-slate-800">{worker.seaman_book_number || '-'}</div>
                    {worker.seaman_book_expiry && <div className="text-[10px] text-slate-500 mt-0.5">Berlaku s/d: {worker.seaman_book_expiry}</div>}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Paspor Maritim</div>
                    <div className="font-mono font-bold text-slate-800">{worker.passport_number || '-'}</div>
                    {worker.passport_expiry && <div className="text-[10px] text-slate-500 mt-0.5">Berlaku s/d: {worker.passport_expiry}</div>}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 sm:col-span-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Sertifikat Kompetensi (ANKAPIN/SKK)</div>
                    <div className="font-bold text-slate-800">{worker.competency_cert || 'Belum diinput'}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Kesehatan (MCU)</div>
                    <div className="font-bold text-slate-800 uppercase">{worker.mcu_status || 'Belum MCU'}</div>
                  </div>
                </div>
              </div>

              {/* Grid 3: Jaminan Sosial (BPJS) & Kinerja */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BPJS Box */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Jaminan Sosial (BPJS)
                  </h3>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">BPJS Ketenagakerjaan</div>
                        <div className="font-mono font-bold text-slate-800">{worker.bpjs_tk_number || '-'}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          worker.bpjs_tk_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {worker.bpjs_tk_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">BPJS Kesehatan</div>
                        <div className="font-mono font-bold text-slate-800">{worker.bpjs_kes_number || '-'}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          worker.bpjs_kes_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {worker.bpjs_kes_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating & Evaluasi Kinerja */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs border-b border-slate-100 pb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Status Kinerja &amp; Kedisiplinan
                  </h3>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Rating Status Pekerja</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${
                            worker.performance_rating === 'merah'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : worker.performance_rating === 'kuning'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {worker.performance_rating === 'merah'
                            ? 'Merah (Indisipliner / Pelanggaran)'
                            : worker.performance_rating === 'kuning'
                            ? 'Kuning (Perlu Tinjauan)'
                            : 'Hijau (Sesuai Prosedur)'}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Catatan Evaluasi Syahbandar / Nahkoda</div>
                      <p className="text-xs text-slate-700 italic mt-0.5">
                        "{worker.performance_notes || 'Belum ada catatan khusus.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit_atribut' && (
            <form onSubmit={handleSaveAttributes} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 text-xs">
                <strong>Form Input / Update Atribut ABK:</strong> Perbarui data sertifikat, dokumen Perjanjian Kerja Laut (PKL), nomor BPJS, dan catatan evaluasi kinerja secara langsung.
              </div>

              {/* Section 1: Jabatan & Status Kinerja */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Jabatan &amp; Status Kinerja Pekerja
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jabatan di Kapal
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 font-semibold"
                    >
                      <option value="Nahkoda">Nahkoda</option>
                      <option value="Kepala Kamar Mesin (KKM)">Kepala Kamar Mesin (KKM)</option>
                      <option value="Masinis I">Masinis I</option>
                      <option value="Masinis II">Masinis II</option>
                      <option value="Juru Mudi">Juru Mudi</option>
                      <option value="Bosun / Mualim">Bosun / Mualim</option>
                      <option value="Kelasi / ABK Utama">Kelasi / ABK Utama</option>
                      <option value="ABK Keliling">ABK Keliling</option>
                      <option value="Koki Kapal">Koki Kapal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rating Kinerja / Evaluasi
                    </label>
                    <select
                      value={performanceRating}
                      onChange={(e) => setPerformanceRating(e.target.value as any)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 font-bold text-slate-800"
                    >
                      <option value="hijau">Hijau - Baik / Memenuhi Syarat</option>
                      <option value="kuning">Kuning - Perlu Tinjauan</option>
                      <option value="merah">Merah - Catatan Indisipliner / Pelanggaran</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan Evaluasi Kinerja
                    </label>
                    <textarea
                      rows={2}
                      value={performanceNotes}
                      onChange={(e) => setPerformanceNotes(e.target.value)}
                      placeholder="Masukkan catatan khusus rekam kedisiplinan atau riwayat pelayaran..."
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Perjanjian Kerja Laut (PKL) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Dokumen Perjanjian Kerja Laut (PKL)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor PKL</label>
                    <input
                      type="text"
                      value={pklNumber}
                      onChange={(e) => setPklNumber(e.target.value)}
                      placeholder="contoh: PKL/2025/001"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Status PKL</label>
                    <select
                      value={pklStatus}
                      onChange={(e) => setPklStatus(e.target.value as any)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 font-bold"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="kadaluarsa">Kadaluarsa</option>
                      <option value="belum_ada">Belum Ada PKL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Perusahaan Pembuat PKL</label>
                    <input
                      type="text"
                      value={pklCompanyName}
                      onChange={(e) => setPklCompanyName(e.target.value)}
                      placeholder="Nama PT / CV Pemilik Kapal"
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Mulai PKL</label>
                    <input
                      type="date"
                      value={pklStartDate}
                      onChange={(e) => setPklStartDate(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Selesai PKL</label>
                    <input
                      type="date"
                      value={pklExpiryDate}
                      onChange={(e) => setPklExpiryDate(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Sertifikasi & MCU */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b pb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Sertifikasi, Buku Pelaut &amp; MCU
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">No. BST (Basic Safety Training)</label>
                    <input
                      type="text"
                      value={bstNumber}
                      onChange={(e) => setBstNumber(e.target.value)}
                      placeholder="BST-XXXX-XXXX"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Masa Berlaku BST</label>
                    <input
                      type="date"
                      value={bstExpiry}
                      onChange={(e) => setBstExpiry(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">No. Buku Pelaut (Seaman Book)</label>
                    <input
                      type="text"
                      value={seamanBookNumber}
                      onChange={(e) => setSeamanBookNumber(e.target.value)}
                      placeholder="B-XXXXXX"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Masa Berlaku Buku Pelaut</label>
                    <input
                      type="date"
                      value={seamanBookExpiry}
                      onChange={(e) => setSeamanBookExpiry(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">No. Paspor Maritim</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="C-XXXXXXX"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Masa Berlaku Paspor</label>
                    <input
                      type="date"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sertifikat Kompetensi (ANKAPIN/SKK)</label>
                    <input
                      type="text"
                      value={competencyCert}
                      onChange={(e) => setCompetencyCert(e.target.value)}
                      placeholder="ANKAPIN I / ATKAPIN I / SKK 60 Mil"
                      className="w-full text-xs p-2 rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Kesehatan Laut (MCU)</label>
                    <select
                      value={mcuStatus}
                      onChange={(e) => setMcuStatus(e.target.value as any)}
                      className="w-full text-xs p-2 rounded border border-slate-300 bg-slate-50 font-bold"
                    >
                      <option value="layak">Layak Laut (Fit for Sea Duty)</option>
                      <option value="perlu_evaluasi">Perlu Evaluasi Medis</option>
                      <option value="tidak_layak">Tidak Layak Laut</option>
                      <option value="belum_mcu">Belum Ada MCU</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: BPJS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b pb-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  Jaminan Sosial Ketenagakerjaan &amp; Kesehatan (BPJS)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">No. BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      value={bpjsTkNumber}
                      onChange={(e) => setBpjsTkNumber(e.target.value)}
                      placeholder="13 digit nomor BPJS TK"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                    <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bpjsTkActive}
                        onChange={(e) => setBpjsTkActive(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">Status BPJS TK Aktif</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">No. BPJS Kesehatan</label>
                    <input
                      type="text"
                      value={bpjsKesNumber}
                      onChange={(e) => setBpjsKesNumber(e.target.value)}
                      placeholder="13 digit nomor BPJS Kesehatan"
                      className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    />
                    <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bpjsKesActive}
                        onChange={(e) => setBpjsKesActive(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-slate-700">Status BPJS Kesehatan Aktif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Submit Button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('ringkasan')}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Atribut</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'mutasi' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ringkasan Mobilitas Awak Kapal di Asosiasi
                  </span>
                  {(worker.transfer_count || 0) >= 2 && (
                    <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Sering Berpindah Kapal ({worker.transfer_count}x)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Riwayat mutasi resmi kru antar kapal dan perusahaan anggota asosiasi untuk mencegah manifest ganda dan memudahkan komunikasi bilateral.
                </p>
              </div>

              {store.getWorkerMobilityRecords(worker.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                  Belum ada catatan mutasi kapal untuk pekerja ini di lingkungan grup asosiasi.
                </div>
              ) : (
                <div className="space-y-3">
                  {store.getWorkerMobilityRecords(worker.id).map((rec) => (
                    <div key={rec.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">
                          {new Date(rec.transfer_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-semibold capitalize">
                          Alasan: {rec.reason.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Dari Kapal / Perusahaan:</div>
                          <div className="font-bold text-slate-800">{rec.from_vessel_name || 'Kru Baru'}</div>
                          <div className="text-slate-500 text-[11px]">{rec.from_company_name || 'Tidak ada data'}</div>
                        </div>

                        <div className="border-l border-slate-200 pl-3">
                          <div className="text-[10px] font-bold uppercase text-blue-600">Ke Kapal / Perusahaan:</div>
                          <div className="font-bold text-slate-900">{rec.to_vessel_name}</div>
                          <div className="text-slate-600 text-[11px]">{rec.to_company_name}</div>
                        </div>
                      </div>

                      {rec.notes && (
                        <div className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          Catatan: &ldquo;{rec.notes}&rdquo;
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                        <span>Pencatat: <strong>{rec.recorded_by_name}</strong></span>
                        <span>Pelepasan: <strong className={rec.clearance_status === 'disetujui' ? 'text-emerald-600' : 'text-amber-600'}>{rec.clearance_status.replace(/_/g, ' ')}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Riwayat Manifest Pelayaran ABK ({workerEvents.length} Record)
              </h3>

              {workerEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada riwayat manifest pelayaran tercatat untuk pekerja ini.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                  {workerEvents.map((evt) => (
                    <div key={evt.id} className="relative">
                      <div
                        className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          evt.event_type === 'keluar' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              evt.event_type === 'keluar'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {evt.event_type === 'keluar' ? 'KELUAR (BERANGKAT LAUT)' : 'MASUK (SANDAR DARAT)'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(evt.timestamp).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 mt-1">
                          Kapal: {evt.vessel_name}
                        </div>

                        <div className="text-xs text-slate-600 flex items-center justify-between">
                          <span>Pelabuhan: {evt.port}</span>
                          <span className="text-[10px] text-slate-400">Pencatat: {evt.recorded_by_name}</span>
                        </div>

                        {evt.notes && (
                          <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200 mt-1">
                            "{evt.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-right shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
