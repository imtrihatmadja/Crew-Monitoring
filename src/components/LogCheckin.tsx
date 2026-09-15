import React, { useState, useEffect } from 'react';
import { UserProfile, Worker, Vessel } from '../types';
import { store, INDONESIAN_PORTS } from '../lib/supabaseStore';
import { ArrowLeftRight, Ship, Anchor, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface LogCheckinProps {
  currentUser: UserProfile;
  initialWorker?: Worker | null;
  onEventLogged: () => void;
  onCancel: () => void;
}

export const LogCheckin: React.FC<LogCheckinProps> = ({
  currentUser,
  initialWorker,
  onEventLogged,
  onCancel
}) => {
  const workers = store.getWorkers();
  const vessels = store.getVessels();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    initialWorker ? initialWorker.id : (workers[0]?.id || '')
  );
  const [selectedVesselId, setSelectedVesselId] = useState<string>(vessels[0]?.id || '');

  // Determine intelligent default event type based on selected worker's status
  const currentWorker = workers.find(w => w.id === selectedWorkerId);
  const suggestedEventType: 'keluar' | 'masuk' = currentWorker?.current_status === 'di_darat' ? 'keluar' : 'masuk';

  const [eventType, setEventType] = useState<'keluar' | 'masuk'>(suggestedEventType);
  const [port, setPort] = useState<string>(currentUser.port || INDONESIAN_PORTS[0]);
  const [timestamp, setTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16) // Format for datetime-local
  );
  const [notes, setNotes] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Update suggested event type when worker changes
  useEffect(() => {
    if (currentWorker) {
      setEventType(currentWorker.current_status === 'di_darat' ? 'keluar' : 'masuk');
    }
  }, [selectedWorkerId]);

  // Check sequence validity
  const isSequenceValid = currentWorker ? (
    (eventType === 'keluar' && currentWorker.current_status === 'di_darat') ||
    (eventType === 'masuk' && currentWorker.current_status === 'di_laut')
  ) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedWorkerId) {
      setErrorMsg('Pilih pekerja terlebih dahulu.');
      return;
    }

    if (!selectedVesselId) {
      setErrorMsg('Pilih kapal perikanan terlebih dahulu.');
      return;
    }

    if (!isSequenceValid) {
      setErrorMsg(
        eventType === 'masuk'
          ? `Validasi Gagal: ${currentWorker?.name} saat ini tercatat DI DARAT. Tidak dapat mencatat MASUK dua kali.`
          : `Validasi Gagal: ${currentWorker?.name} saat ini tercatat DI LAUT. Tidak dapat mencatat KELUAR dua kali.`
      );
      return;
    }

    const res = store.logCheckinEvent({
      worker_id: selectedWorkerId,
      vessel_id: selectedVesselId,
      event_type: eventType,
      port,
      timestamp: new Date(timestamp).toISOString(),
      notes: notes.trim()
    });

    if (res.success) {
      setSuccessMsg(
        `Berhasil dicatat! Pekerja ${currentWorker?.name} telah tercatat ${
          eventType === 'keluar' ? 'KELUAR (Melaut)' : 'MASUK (Sandar)'
        } di ${port}.`
      );
      setNotes('');
      onEventLogged();
    } else {
      setErrorMsg(res.error || 'Gagal mencatat event.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-cyan-100 text-cyan-800 rounded-xl shrink-0 border border-cyan-200">
          <ArrowLeftRight className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Pencatatan Log Keluar-Masuk Pelabuhan
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Verifikasi fisik keberangkatan dan kedatangan pekerja awak kapal di pelabuhan.
            Sistem mencegah duplikasi urutan event (validasi alur keluar-masuk).
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-xs text-emerald-700 hover:underline font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Select Worker */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Pekerja Awak Kapal (ABK) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 text-sm font-semibold text-slate-900 bg-white"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — (NIK: ****{w.nik_last4}) — Status: [{w.current_status === 'di_laut' ? 'DI LAUT' : 'DI DARAT'}]
                </option>
              ))}
            </select>

            {/* Current Worker Status Badge */}
            {currentWorker && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Status Terakhir Pekerja:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold uppercase text-[11px] ${
                    currentWorker.current_status === 'di_laut'
                      ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {currentWorker.current_status === 'di_laut' ? 'SEDANG DI LAUT' : 'SEDANG DI DARAT'}
                </span>
              </div>
            )}
          </div>

          {/* Select Vessel */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Kapal Perikanan <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedVesselId}
              onChange={(e) => setSelectedVesselId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 text-sm font-semibold text-slate-900 bg-white"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registration_number}) — GT: {v.gross_tonnage} &bull; {v.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Toggle with Sequence Validation */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Jenis Event Keluar / Masuk <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEventType('keluar')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                  eventType === 'keluar'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-6 h-6 text-amber-600" />
                <span className="text-sm">KELUAR (LEPAS LAYAR)</span>
                <span className="text-[10px] text-slate-500 font-normal">Pekerja berangkat melaut</span>
              </button>

              <button
                type="button"
                onClick={() => setEventType('masuk')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${
                  eventType === 'masuk'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                <span className="text-sm">MASUK (SANDAR PELABUHAN)</span>
                <span className="text-[10px] text-slate-500 font-normal">Pekerja tiba kembali ke darat</span>
              </button>
            </div>

            {/* Sequence Warning Alert */}
            {!isSequenceValid && currentWorker && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Peringatan Validasi Alur:</strong> Pekerja saat ini tercatat{' '}
                  <span className="uppercase font-extrabold">{currentWorker.current_status}</span>. Pilihan event{' '}
                  <span className="uppercase font-extrabold">{eventType}</span> berpotensi menimbulkan data ganda.
                  Rekomendasi sistem: Pilih event{' '}
                  <strong className="underline uppercase">{suggestedEventType}</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tanggal & Waktu WIB <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 text-sm font-medium text-slate-900"
              required
            />
          </div>

          {/* Port */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pelabuhan Keberangkatan/Kedatangan <span className="text-rose-500">*</span>
            </label>
            <select
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 text-sm text-slate-900 bg-white"
            >
              {INDONESIAN_PORTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Info */}
          <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-600">Petugas Pencatat:</span>
            <span className="font-bold text-slate-900">
              {currentUser.name} ({currentUser.role.toUpperCase()})
            </span>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Catatan Operasional (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Tangkap tuna WPP-573, dokumen lengkap, kondisi sehat."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 text-sm text-slate-900"
            ></textarea>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition flex items-center gap-2"
          >
            Simpan Event
          </button>
        </div>
      </form>
    </div>
  );
};
