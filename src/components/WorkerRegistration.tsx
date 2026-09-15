import React, { useState, useRef } from 'react';
import { UserProfile, Worker } from '../types';
import { store, INDONESIAN_PORTS } from '../lib/supabaseStore';
import { validateNikFormat, formatMaskedDisplay } from '../lib/hash';
import { UserCheck, ShieldCheck, AlertCircle, CheckCircle2, Lock, ArrowRight, UserPlus, FileSpreadsheet, Download, Upload, Check, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface WorkerRegistrationProps {
  currentUser: UserProfile;
  onWorkerRegistered: (worker: Worker) => void;
  onCancel: () => void;
}

interface ParsedWorkerRow {
  rowNum: number;
  name: string;
  nikRaw: string;
  cleanNik: string;
  dob: string;
  phone: string;
  homePort: string;
  isValid: boolean;
  errorMsg?: string;
}

export const WorkerRegistration: React.FC<WorkerRegistrationProps> = ({
  currentUser,
  onWorkerRegistered,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Registration Form State
  const [name, setName] = useState('');
  const [nikRaw, setNikRaw] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [homePort, setHomePort] = useState(currentUser.port || INDONESIAN_PORTS[0]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successWorker, setSuccessWorker] = useState<Worker | null>(null);

  // Bulk Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedWorkerRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Clean NIK to digits only (Single Form)
  const cleanNik = nikRaw.replace(/\D/g, '');
  const isNikLengthValid = cleanNik.length === 16;
  const nikLast4 = cleanNik.length >= 4 ? cleanNik.slice(-4) : '****';

  // Single Worker Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessWorker(null);

    // Validations
    if (!name.trim()) {
      setErrorMsg('Nama lengkap pekerja wajib diisi.');
      return;
    }

    const nikCheck = validateNikFormat(cleanNik);
    if (!nikCheck.valid) {
      setErrorMsg(nikCheck.message || 'NIK tidak valid.');
      return;
    }

    if (!dob) {
      setErrorMsg('Tanggal lahir wajib diisi.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Nomor telepon/HP wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await store.registerWorker({
        name,
        nikRaw: cleanNik,
        dob,
        phone,
        home_port: homePort
      });

      setLoading(false);

      if (res.success && res.worker) {
        setSuccessWorker(res.worker);
        onWorkerRegistered(res.worker);
        // Reset form
        setName('');
        setNikRaw('');
        setDob('');
        setPhone('');
      } else {
        setErrorMsg(res.error || 'Gagal mendaftarkan pekerja.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Budi Santoso',
        'NIK (16 Digit)': '3201011505900001',
        'Tanggal Lahir (YYYY-MM-DD)': '1990-05-15',
        'Nomor HP / WhatsApp': '081234567890',
        'Pelabuhan Basis': 'Pelabuhan Perikanan Samudera Nizam Zachman Jakarta'
      },
      {
        'Nama Lengkap': 'Ahmad Hidayatullah',
        'NIK (16 Digit)': '3302022008880002',
        'Tanggal Lahir (YYYY-MM-DD)': '1988-08-20',
        'Nomor HP / WhatsApp': '081987654321',
        'Pelabuhan Basis': 'Pelabuhan Perikanan Samudera Cilacap'
      },
      {
        'Nama Lengkap': 'Suharto Wibowo',
        'NIK (16 Digit)': '3501011010920003',
        'Tanggal Lahir (YYYY-MM-DD)': '1992-10-10',
        'Nomor HP / WhatsApp': '085712345678',
        'Pelabuhan Basis': 'Pelabuhan Perikanan Samudera Bitung'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Nama
      { wch: 22 }, // NIK
      { wch: 25 }, // DOB
      { wch: 20 }, // Phone
      { wch: 55 }  // Port
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Registrasi ABK');
    XLSX.writeFile(workbook, 'Template_Registrasi_ABK_SIMAK.xlsx');
  };

  // Process Uploaded File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    setIsParsing(true);
    setErrorMsg('');
    setBulkSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File Excel / CSV kosong atau format tidak dikenali.');
          setIsParsing(false);
          return;
        }

        // Parse and validate rows
        const parsed: ParsedWorkerRow[] = rawJson.map((row, idx) => {
          // Normalize key names (handling variants in headers)
          const nameVal = String(
            row['Nama Lengkap'] || row['Nama'] || row['nama'] || row['Name'] || ''
          ).trim();

          const rawNikVal = String(
            row['NIK (16 Digit)'] || row['NIK'] || row['nik'] || row['No NIK'] || ''
          ).trim();

          const dobVal = String(
            row['Tanggal Lahir (YYYY-MM-DD)'] || row['Tanggal Lahir'] || row['dob'] || row['Tgl Lahir'] || ''
          ).trim();

          const phoneVal = String(
            row['Nomor HP / WhatsApp'] || row['No HP'] || row['Phone'] || row['Telepon'] || row['HP'] || ''
          ).trim();

          let portVal = String(
            row['Pelabuhan Basis'] || row['Pelabuhan'] || row['Port'] || ''
          ).trim();

          if (!portVal || !INDONESIAN_PORTS.includes(portVal)) {
            portVal = currentUser.port || INDONESIAN_PORTS[0];
          }

          const cNik = rawNikVal.replace(/\D/g, '');
          const nikValidation = validateNikFormat(cNik);

          let isValid = true;
          let error = '';

          if (!nameVal) {
            isValid = false;
            error = 'Nama kosong';
          } else if (!nikValidation.valid) {
            isValid = false;
            error = nikValidation.message || 'NIK harus 16 digit angka';
          }

          return {
            rowNum: idx + 2, // 1-based index including header
            name: nameVal,
            nikRaw: rawNikVal,
            cleanNik: cNik,
            dob: dobVal || '1990-01-01',
            phone: phoneVal || '-',
            homePort: portVal,
            isValid,
            errorMsg: error
          };
        });

        setParsedRows(parsed);
        setIsParsing(false);
      } catch (err: any) {
        setErrorMsg('Gagal membaca file Excel/CSV: ' + (err?.message || 'Format tidak didukung'));
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Bulk Import Handler
  const handleProcessBulkImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada baris data valid yang siap diimpor.');
      return;
    }

    setBulkImportLoading(true);
    setErrorMsg('');
    let successCount = 0;
    let lastRegisteredWorker: Worker | null = null;

    for (const r of validRows) {
      try {
        const res = await store.registerWorker({
          name: r.name,
          nikRaw: r.cleanNik,
          dob: r.dob,
          phone: r.phone,
          home_port: r.homePort
        });

        if (res.success && res.worker) {
          successCount++;
          lastRegisteredWorker = res.worker;
          onWorkerRegistered(res.worker);
        }
      } catch (err) {
        console.error('Error importing row:', r, err);
      }
    }

    setBulkImportLoading(false);
    setBulkSuccessMsg(
      `Berhasil mengimpor ${successCount} dari ${validRows.length} pekerja awak kapal! Seluruh NIK telah di-hash SHA-256 secara otomatis sesuai UU PDP.`
    );
    setParsedRows([]);
    setBulkFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (lastRegisteredWorker) {
      setSuccessWorker(lastRegisteredWorker);
    }
  };

  const validRowsCount = parsedRows.filter(r => r.isValid).length;
  const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Mode Tabs */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm border-t-4 border-t-blue-600 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-md shrink-0 border border-blue-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Form Registrasi Pekerja Awak Kapal (ABK)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pendaftaran identitas awal awak kapal perikanan berbasis NIK terenkripsi.
                Tercatat resmi oleh {currentUser.name} ({currentUser.role.toUpperCase()}).
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('single');
              setErrorMsg('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-xs transition ${
              activeTab === 'single'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrasi Satuan (1 ABK)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('bulk');
              setErrorMsg('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold text-xs transition ${
              activeTab === 'bulk'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Bulk Import dari Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Success Banners */}
      {bulkSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 text-emerald-950 space-y-2 shadow-sm flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-emerald-900">
              Bulk Import Berhasil!
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {bulkSuccessMsg}
            </p>
          </div>
        </div>
      )}

      {successWorker && activeTab === 'single' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 text-emerald-950 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-base text-emerald-900">
                Pekerja Berhasil Terdaftar!
              </h3>
              <p className="text-xs text-emerald-800">
                Data NIK telah di-hash dengan SHA-256 dan disimpan aman sesuai UU PDP.
              </p>
            </div>
          </div>

          <div className="bg-white/90 rounded-md p-3 border border-emerald-200 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Pekerja:</span>
              <span className="font-bold text-slate-900">{successWorker.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NIK (Masked UI):</span>
              <span className="font-bold text-blue-800">{formatMaskedDisplay(successWorker.nik_last4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelabuhan Basis:</span>
              <span className="font-bold text-slate-900">{successWorker.home_port}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Awal:</span>
              <span className="font-bold text-emerald-700 uppercase">BERADA DI DARAT (STANDBY)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setSuccessWorker(null)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-md text-xs transition"
            >
              + Tambah Pekerja Lain
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-md text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Single Worker Form */}
      {activeTab === 'single' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-5">
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nama Lengkap Pekerja (Sesuai KTP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Sukarman Setiawan"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                required
              />
            </div>

            {/* NIK Input with Real-time Hashing Preview */}
            <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  Nomor Induk Kependudukan (NIK - 16 Digit) <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isNikLengthValid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cleanNik.length} / 16 Digit
                </span>
              </div>

              <input
                type="text"
                value={nikRaw}
                maxLength={16}
                onChange={(e) => setNikRaw(e.target.value)}
                placeholder="Masukkan 16 digit NIK"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono tracking-wider text-slate-900"
                required
              />

              {/* Live Masking & Privacy Indicator */}
              <div className="bg-white p-2.5 rounded border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> Preview Masking Display:
                  </span>
                  <span className="font-mono font-bold text-blue-800">
                    {formatMaskedDisplay(nikLast4)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * Sesuai UU PDP No. 27/2022, NIK di-hash SHA-256. Aplikasi hanya menampilkan 4 digit terakhir.
                </p>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tanggal Lahir <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
                required
              />
            </div>

            {/* Home Port */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Pelabuhan Basis / Domisili Layar <span className="text-rose-500">*</span>
              </label>
              <select
                value={homePort}
                onChange={(e) => setHomePort(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white font-medium"
              >
                {INDONESIAN_PORTS.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !isNikLengthValid}
              className={`px-5 py-2 rounded-md font-bold text-xs shadow-sm transition flex items-center gap-1.5 ${
                loading || !isNikLengthValid
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <span>Memproses Hash NIK...</span>
              ) : (
                <>
                  <span>Daftarkan Pekerja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Bulk Import Excel / CSV */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Step 1: Template Download Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                1. Unduh Template Excel / CSV
              </h3>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Gunakan format kolom baku untuk menghindari kesalahan validasi: <br />
                <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-blue-950 font-semibold border border-blue-200">
                  Nama Lengkap | NIK (16 Digit) | Tanggal Lahir | Nomor HP | Pelabuhan Basis
                </code>
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-md text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Template Excel</span>
            </button>
          </div>

          {/* Step 2: Upload File Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Unggah File Excel (.xlsx / .xls) / CSV
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-lg p-6 text-center cursor-pointer transition space-y-2"
            >
              <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mx-auto text-blue-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {bulkFileName ? (
                    <span className="text-blue-700 font-mono">File Terpilih: {bulkFileName}</span>
                  ) : (
                    'Klik atau tarik file Excel / CSV ke area ini'
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mendukung format .xlsx, .xls, dan .csv (Maks. 500 baris per unggahan)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="p-4 bg-slate-100 rounded-md text-center text-slate-600 text-xs font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memproses &amp; memvalidasi baris Excel...</span>
            </div>
          )}

          {/* Step 3: Parsed Data Inspection & Validation Table */}
          {parsedRows.length > 0 && !isParsing && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    3. Hasil Validasi Pre-Import ({parsedRows.length} Data)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sistem memverifikasi kelengkapan nama dan panjang 16 digit NIK sebelum di-hash SHA-256
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold border border-emerald-200">
                    Valid: {validRowsCount} ABK
                  </span>
                  {invalidRowsCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded font-bold border border-rose-200">
                      Error: {invalidRowsCount} Baris
                    </span>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200 sticky top-0">
                      <th className="py-2 px-3">Baris</th>
                      <th className="py-2 px-3">Nama Pekerja</th>
                      <th className="py-2 px-3">NIK Raw</th>
                      <th className="py-2 px-3">Pelabuhan Basis</th>
                      <th className="py-2 px-3">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNum}
                        className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 text-slate-400 font-bold">#{r.rowNum}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{r.name || '(Kosong)'}</td>
                        <td className="py-2 px-3 text-slate-700">{r.nikRaw || '-'}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{r.homePort}</td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" /> SIAP IMPORT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> {r.errorMsg}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bulk Submit Action Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[10px] text-slate-500 italic">
                  * Hanya baris bertanda SIAP IMPORT yang akan didaftarkan ke sistem database.
                </p>

                <button
                  type="button"
                  onClick={handleProcessBulkImport}
                  disabled={validRowsCount === 0 || bulkImportLoading}
                  className={`px-5 py-2 rounded-md font-bold text-xs shadow-sm transition flex items-center gap-2 ${
                    validRowsCount === 0 || bulkImportLoading
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {bulkImportLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengimpor &amp; Enkripsi NIK...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Proses Import {validRowsCount} ABK Valid</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

