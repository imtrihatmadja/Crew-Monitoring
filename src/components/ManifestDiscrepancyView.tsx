import React, { useState } from 'react';
import { store } from '../lib/supabaseStore';
import { ManifestDiscrepancy } from '../types';
import { AlertOctagon, Ship, Anchor, CheckCircle2, XCircle, Search, ShieldAlert, Lock, UserCheck, MessageSquare } from 'lucide-react';

export const ManifestDiscrepancyView: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const discrepancies = store.getDiscrepancies();
  const vessels = store.getVessels();

  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<ManifestDiscrepancy | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'diverifikasi_aman' | 'dalam_penyelidikan'>('diverifikasi_aman');
  const [filterType, setFilterType] = useState<'all' | 'unresolved' | 'resolved'>('all');

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (filterType === 'unresolved') return d.status === 'perlu_tinjauan';
    if (filterType === 'resolved') return d.status !== 'perlu_tinjauan';
    return true;
  });

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancy) return;

    store.resolveDiscrepancy(
      selectedDiscrepancy.id,
      resolutionStatus,
      `${investigationNotes} [Diverifikasi oleh: ${currentUser.name} - ${currentUser.role.toUpperCase()}]`
    );

    setSelectedDiscrepancy(null);
    setInvestigationNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-rose-600 tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4" />
            Sistem Deteksi Otomatis &bull; Syahbandar Admin Panel
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Anomali &amp; Selisih Manifest Kapal Perikanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pekerja terdeteksi berbeda antara manifest keberangkatan dan kedatangan. Penyelidikan tidak otomatis menghukum pekerja.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded transition ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            Semua ({discrepancies.length})
          </button>
          <button
            onClick={() => setFilterType('unresolved')}
            className={`px-3 py-1.5 rounded transition ${
              filterType === 'unresolved' ? 'bg-rose-600 text-white shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            Perlu Verifikasi ({discrepancies.filter(d => d.status === 'perlu_tinjauan').length})
          </button>
          <button
            onClick={() => setFilterType('resolved')}
            className={`px-3 py-1.5 rounded transition ${
              filterType === 'resolved' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            Selesai ({discrepancies.filter(d => d.status !== 'perlu_tinjauan').length})
          </button>
        </div>
      </div>

      {/* Discrepancies Grid (Tabler Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDiscrepancies.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
            Tidak ada catatan anomali manifest yang sesuai dengan filter.
          </div>
        ) : (
          filteredDiscrepancies.map((disc) => {
            const vessel = vessels.find((v) => v.id === disc.vessel_id);
            const isUnresolved = disc.status === 'perlu_tinjauan';

            return (
              <div
                key={disc.id}
                className={`bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3 relative border-t-4 ${
                  isUnresolved ? 'border-t-rose-500' : 'border-t-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        disc.type === 'overdue_at_sea'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {disc.type === 'overdue_at_sea'
                        ? 'Overdue di Laut'
                        : 'Tidak Ada di Manifest Awal'
                      }
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(disc.detected_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      disc.status === 'perlu_tinjauan'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : disc.status === 'diverifikasi_aman'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {disc.status === 'perlu_tinjauan' ? 'Perlu Tinjauan' : disc.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span>{disc.worker_name}</span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      ****{disc.worker_nik_last4}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kapal: <strong>{vessel?.name || 'Kapal'}</strong></span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Pelabuhan: {disc.port}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Uraian Kasus:</strong> {disc.notes}
                </div>

                {isUnresolved && currentUser.role === 'syahbandar' && (
                  <div className="pt-2">
                    <button
                      onClick={() => setSelectedDiscrepancy(disc)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded transition shadow-sm"
                    >
                      Verifikasi &amp; Tinjau Kasus
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="text-[10px] text-rose-400 font-mono font-bold">SYAHBANDAR VERIFICATION FORM</div>
                <h2 className="text-base font-bold">Verifikasi Anomali Manifest</h2>
              </div>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleResolve} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{selectedDiscrepancy.worker_name}</div>
                <div className="text-slate-500">NIK: ****{selectedDiscrepancy.worker_nik_last4} &bull; Pelabuhan: {selectedDiscrepancy.port}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Penyelesaian:</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold"
                >
                  <option value="diverifikasi_aman">Diverifikasi Aman (Data sah / surat izin terkonfirmasi)</option>
                  <option value="dalam_penyelidikan">Dalam Penyelidikan Lanjut (Dugaan pelanggaran / ketiadaan dokumen)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Hasil Pemeriksaan &amp; Keterangan Nahkoda:</label>
                <textarea
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Masukkan keterangan dari klarifikasi nahkoda, perusahaan pemilik kapal, dan pekerja bersangkutan..."
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiscrepancy(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-sm"
                >
                  Simpan Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
