import React, { useState } from 'react';
import { store } from '../lib/supabaseStore';
import { CrewDuplicationAlert, Company, UserProfile } from '../types';
import { 
  AlertOctagon, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Ship, 
  Building2, 
  ExternalLink, 
  UserX, 
  ShieldAlert, 
  Info, 
  Check, 
  Clock, 
  MessageSquare,
  ArrowRight,
  RotateCcw,
  HelpCircle
} from 'lucide-react';

interface AntiDuplicationViewProps {
  currentUser: UserProfile;
  onNavigateToManifest: (vesselId?: string) => void;
  onNavigateToWorkerDetail?: (workerId: string) => void;
}

export const AntiDuplicationView: React.FC<AntiDuplicationViewProps> = ({
  currentUser,
  onNavigateToManifest,
  onNavigateToWorkerDetail
}) => {
  const [alerts, setAlerts] = useState<CrewDuplicationAlert[]>(store.getDuplicateAlerts());
  const [companies] = useState<Company[]>(store.getCompanies());
  const [selectedContactCompany, setSelectedContactCompany] = useState<Company | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<CrewDuplicationAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeAlerts = alerts.filter(a => a.status === 'aktif');
  const resolvedAlerts = alerts.filter(a => a.status === 'diselesaikan');

  const handleOpenContact = (companyName: string) => {
    const comp = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    if (comp) {
      setSelectedContactCompany(comp);
    }
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolutionNotes.trim()) return;

    store.resolveDuplicateAlert(resolvingAlert.id, resolutionNotes.trim());
    setAlerts(store.getDuplicateAlerts());
    setResolvingAlert(null);
    setResolutionNotes('');
    setSuccessMsg(`Konflik duplikasi untuk ${resolvingAlert.worker_name} berhasil diselesaikan.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Pencegahan Duplikasi Manifest Crew Kapal
                </h1>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {activeAlerts.length} Perlu Tindakan
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Sistem mendeteksi secara otomatis kru yang didaftarkan pada lebih dari satu kapal atau masih aktif di laut pada kapal anggota lain, mencegah pelanggaran manifest ganda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                store.resetDuplicateAlertsToDefault();
                setAlerts(store.getDuplicateAlerts());
                setSuccessMsg('Contoh kasus duplikasi aktif berhasil dimuat ulang untuk pengujian koordinasi PIC.');
                setTimeout(() => setSuccessMsg(''), 4000);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Muat ulang data sampel konflik duplikasi"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Muat Ulang Kasus Uji Coba</span>
            </button>
            <button
              onClick={() => onNavigateToManifest()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Ship className="w-4 h-4" />
              <span>Buka Log Manifest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Educational Guide Box */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-800/40 rounded-xl p-4 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-blue-300 mb-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Alur Sistem: Dari Mana Data Duplikasi Dihasilkan &amp; Bedanya dengan Tombol Mutasi?</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>⚠️ Kasus Duplikasi (Halaman Ini)</span>
            </div>
            <p className="text-slate-400">
              Dihasilkan secara otomatis saat terjadi <strong>anomali atau klaim ganda</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>Pekerja masih berstatus <strong>aktif di laut</strong> pada kapal lama, namun namanya diajukan dalam manifest kapal baru.</li>
              <li>Dua perusahaan berbeda secara bersamaan mengajukan NIK pekerja yang sama ke otoritas pelabuhan.</li>
              <li>Pekerja pindah sepihak tanpa surat pelepasan resmi (discharge) atau masih ada sengketa tanggungan/kasbon.</li>
            </ul>
            <p className="text-blue-300 font-medium pt-1">
              &rarr; Memerlukan klarifikasi langsung antar-PIC sebelum kru boleh diberangkatkan.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>🔄 Tombol "Mutasi Armada" (Di Log Manifest)</span>
            </div>
            <p className="text-slate-400">
              Digunakan untuk prosedur <strong>resmi, sah, dan damai</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-300">
              <li>Pekerja <strong>sudah berada di darat</strong> (telah selesai pelayaran sebelumnya).</li>
              <li>Perekrutan dilakukan terbuka dengan persetujuan atau pelepasan hak antar-perusahaan anggota ATLI.</li>
              <li>Histori perpindahan langsung tercatat ke dalam rekam jejak mobilitas kru asosiasi.</li>
            </ul>
            <p className="text-emerald-300 font-medium pt-1">
              &rarr; Alur normal antar-anggota grup tanpa sengketa manifest.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konflik Manifest Aktif</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeAlerts.length}</div>
          <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
            <span>●</span> Membutuhkan klarifikasi PIC antar-perusahaan
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konflik Berlayar di Laut</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {activeAlerts.filter(a => a.conflict_type === 'at_sea_conflict').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Kru masih tercatat di kapal yang sedang melaut</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terselesaikan & Klarifikasi</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{resolvedAlerts.length}</div>
          <p className="text-xs text-emerald-600 mt-1 font-medium">Telah disetujui / dipindahkan secara resmi</p>
        </div>
      </div>

      {/* Active Conflict Alerts Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Daftar Kru Terdeteksi Duplikasi / Konflik Jadwal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungi PIC perusahaan pemilik kapal asal untuk verifikasi surat pelepasan (discharge) sebelum memberangkatkan kru.
            </p>
          </div>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Konflik Duplikasi Kru Saat Ini</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Seluruh manifest kru kapal di lingkungan asosiasi bersih dan tidak ditemukan pekerja yang terdaftar ganda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="p-5 hover:bg-slate-50/80 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{alert.worker_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                          NIK: •••• •••• •••• {alert.worker_nik_last4}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Terdeteksi: {new Date(alert.detected_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 self-start sm:self-center">
                    {alert.conflict_type === 'at_sea_conflict' ? '⚠️ Sedang Di Laut' : 'Double Booking Manifest'}
                  </span>
                </div>

                {/* Conflict Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  {/* Primary / Registered Ship */}
                  <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-2 md:pb-0 md:pr-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Kapal Asal Terdaftar (Aktif)
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Ship className="w-4 h-4 text-blue-600" />
                      {alert.primary_vessel_name}
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alert.primary_company_name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenContact(alert.primary_company_name)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      <Phone className="w-3 h-3" />
                      Hubungi PIC Perusahaan Asal
                    </button>
                  </div>

                  {/* Conflicting Ship */}
                  <div className="space-y-1.5 pt-2 md:pt-0 md:pl-2">
                    <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                      Kapal yang Mengajukan Manifest Baru
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Ship className="w-4 h-4 text-rose-600" />
                      {alert.conflicting_vessel_name}
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alert.conflicting_company_name}</span>
                    </div>
                    <button
                      onClick={() => handleOpenContact(alert.conflicting_company_name)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      <Phone className="w-3 h-3" />
                      Hubungi PIC Perusahaan Pemohon
                    </button>
                  </div>
                </div>

                {alert.resolution_notes && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <strong>Catatan Sistem:</strong> {alert.resolution_notes}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setResolvingAlert(alert)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Klarifikasi &amp; Selesaikan</span>
                  </button>

                  {onNavigateToWorkerDetail && (
                    <button
                      onClick={() => onNavigateToWorkerDetail(alert.worker_id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                    >
                      Lihat Dokumen &amp; PKL
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved History Section */}
      {resolvedAlerts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Riwayat Duplikasi yang Telah Diklarifikasi &amp; Diselesaikan ({resolvedAlerts.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
                <div>
                  <div className="font-semibold text-slate-800">
                    {alert.worker_name} (NIK: •••• •••• •••• {alert.worker_nik_last4})
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {alert.primary_vessel_name} ({alert.primary_company_name}) &rarr; {alert.conflicting_vessel_name} ({alert.conflicting_company_name})
                  </div>
                  {alert.resolution_notes && (
                    <div className="text-slate-600 mt-1 italic">
                      &ldquo;{alert.resolution_notes}&rdquo;
                    </div>
                  )}
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 text-[11px] self-start sm:self-center">
                  ✓ Diselesaikan
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Association SOP & UU PDP Compliance Card */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 text-slate-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <h4 className="font-bold text-blue-900 text-sm">
              Standar Operasional Prosedur (SOP) Asosiasi Terkait Duplikasi Awak Kapal
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 leading-relaxed">
              <li>
                <strong>Pencegahan Pelanggaran Hukum Maritim:</strong> Seorang awak kapal tidak boleh memiliki manifest aktif di dua kapal yang berbeda dalam kurun waktu pelayaran yang sama.
              </li>
              <li>
                <strong>Kepatuhan UU PDP (UU No. 27/2022):</strong> NIK seluruh pekerja wajib disamarkan (hanya 4 digit terakhir) pada tampilan bersama untuk menjaga kerahasiaan identitas kependudukan awak kapal.
              </li>
              <li>
                <strong>Hak Jawab &amp; Verifikasi Berimbang:</strong> Sebelum membatalkan atau menandai pelanggaran, PIC perusahaan baru wajib mengontak PIC perusahaan lama guna memastikan apakah masa kontrak (PKL) pekerja memang telah selesai.
              </li>
            </ul>
          </div>
        </div>
      </div>

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
                    href={`mailto:${selectedContactCompany.pic_email}?subject=Konfirmasi Status Kru Kapal - Asosiasi Perusahaan`}
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

      {/* Modal: Resolve Duplicate Alert */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Penyelesaian Klarifikasi Duplikasi Kru</h3>
              </div>
              <button
                onClick={() => setResolvingAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{resolvingAlert.worker_name}</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  NIK: •••• •••• •••• {resolvingAlert.worker_nik_last4}
                </div>
                <div className="text-slate-600 text-[11px] mt-1">
                  Konflik: {resolvingAlert.primary_vessel_name} ({resolvingAlert.primary_company_name}) &rarr; {resolvingAlert.conflicting_vessel_name} ({resolvingAlert.conflicting_company_name})
                </div>
              </div>

              <form onSubmit={handleResolve} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Catatan Hasil Klarifikasi &amp; Kesepakatan Antar-Perusahaan: <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Contoh: Telah dikonfirmasi dengan PIC PT Samudera Bahari. Pekerja telah menandatangani surat discharge resmi dan diizinkan berlayar dengan KM Mina Jaya."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-[11px] flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    Catatan ini akan tersimpan permanen di Audit Log Asosiasi atas nama: <strong>{currentUser.name}</strong>.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingAlert(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Simpan &amp; Selesaikan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
