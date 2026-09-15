import React, { useState, useRef } from 'react';
import { Company, Vessel } from '../types';
import { store, INDONESIAN_PORTS } from '../lib/supabaseStore';
import * as XLSX from 'xlsx';
import { 
  Ship, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  FileText, 
  Layers
} from 'lucide-react';

interface AddVesselModalProps {
  isOpen: boolean;
  company: Company;
  initialMode?: 'single' | 'bulk';
  onClose: () => void;
  onSuccess: (addedCount: number, message: string) => void;
}

interface ParsedVesselRow {
  name: string;
  registration_number: string;
  gross_tonnage: number;
  home_port: string;
  captain_name: string;
  valid: boolean;
  error?: string;
}

export const AddVesselModal: React.FC<AddVesselModalProps> = ({
  isOpen,
  company,
  initialMode = 'single',
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>(initialMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single Form State
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [grossTonnage, setGrossTonnage] = useState<number>(45);
  const [homePort, setHomePort] = useState<string>(INDONESIAN_PORTS[0]);
  const [captainName, setCaptainName] = useState('');

  // Bulk State
  const [bulkList, setBulkList] = useState<ParsedVesselRow[]>([]);
  const [rawPastedText, setRawPastedText] = useState('');
  const [fileName, setFileName] = useState('');

  // Status
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync tab if initialMode changes
  React.useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Handle Single Submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Nama kapal perikanan wajib diisi minimal 2 karakter.');
      return;
    }

    setIsSubmitting(true);
    const result = store.addVessel({
      name: name.trim(),
      registration_number: regNumber.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
      gross_tonnage: Number(grossTonnage) || 30,
      company_id: company.id,
      home_port: homePort,
      captain_name: captainName.trim() || 'Capt. Belum Ditentukan'
    });

    setIsSubmitting(false);

    if (!result.success || !result.vessel) {
      setErrorMessage(result.error || 'Gagal menambahkan kapal.');
      return;
    }

    // Reset single form
    setName('');
    setRegNumber('');
    setCaptainName('');
    onSuccess(1, `Kapal "${result.vessel.name}" berhasil ditambahkan ke armada ${company.name}.`);
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const headers = ['Nama Kapal', 'Nomor SIPI / Pendaftaran', 'Tonase Kotor (GT)', 'Pelabuhan Pangkalan', 'Nama Nahkoda'];
    const sampleData = [
      headers,
      ['KM Samudera Prima 01', 'SIPI.881/KKP/2026', 45, 'Muara Baru, Jakarta', 'Capt. Hendro Subagio'],
      ['KM Samudera Prima 02', 'SIPI.882/KKP/2026', 60, 'Benoa, Bali', 'Capt. Agus Riyanto'],
      ['KM Samudera Perkasa 03', 'SIPI.883/KKP/2026', 85, 'Bitung, Sulawesi Utara', 'Capt. Rudi Hartono'],
      ['KM Samudera Raya 05', 'SIPI.884/KKP/2026', 50, 'Ambon, Maluku', 'Capt. Johan Silalahi']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    // Set column widths
    ws['!cols'] = [
      { wch: 28 }, // Nama Kapal
      { wch: 26 }, // SIPI
      { wch: 18 }, // GT
      { wch: 26 }, // Pelabuhan
      { wch: 26 }  // Nahkoda
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Kapal');
    XLSX.writeFile(wb, `Template_Armada_Kapal_${company.code}.xlsx`);
  };

  // Parse Excel file or CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length <= 1) {
          setErrorMessage('File Excel kosong atau hanya berisi baris header.');
          return;
        }

        // Parse rows starting from row 1 (row 0 is header)
        const parsed: ParsedVesselRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rowName = String(row[0] || '').trim();
          if (!rowName) continue; // Skip completely empty rows

          const rowReg = String(row[1] || '').trim();
          const rowGT = Number(row[2]) || 30;
          const rowPort = String(row[3] || '').trim() || INDONESIAN_PORTS[0];
          const rowCaptain = String(row[4] || '').trim() || 'Capt. Belum Ditentukan';

          parsed.push({
            name: rowName,
            registration_number: rowReg || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
            gross_tonnage: rowGT,
            home_port: rowPort,
            captain_name: rowCaptain,
            valid: rowName.length >= 2,
            error: rowName.length < 2 ? 'Nama kapal terlalu pendek' : undefined
          });
        }

        if (parsed.length === 0) {
          setErrorMessage('Tidak ada data kapal yang dapat dibaca dari file.');
          return;
        }

        setBulkList(parsed);
      } catch (err: any) {
        setErrorMessage('Gagal memproses file Excel: ' + (err.message || 'Format tidak dikenali'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Parse pasted tabular / CSV text
  const handleParsePastedText = () => {
    if (!rawPastedText.trim()) return;

    const lines = rawPastedText.trim().split('\n');
    const parsed: ParsedVesselRow[] = [];

    lines.forEach((line, idx) => {
      // Split by tab (Excel copy-paste) or comma / semicolon
      let parts = line.split('\t');
      if (parts.length <= 1) parts = line.split(',');
      if (parts.length <= 1) parts = line.split(';');

      const rowName = parts[0]?.trim() || '';
      if (!rowName) return;

      // Ignore header row if accidentally pasted
      if (idx === 0 && (rowName.toLowerCase().includes('nama') || rowName.toLowerCase().includes('kapal'))) {
        return;
      }

      const rowReg = parts[1]?.trim() || '';
      const rowGT = Number(parts[2]?.replace(/[^\d.]/g, '')) || 30;
      const rowPort = parts[3]?.trim() || INDONESIAN_PORTS[0];
      const rowCaptain = parts[4]?.trim() || 'Capt. Belum Ditentukan';

      parsed.push({
        name: rowName,
        registration_number: rowReg || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
        gross_tonnage: rowGT,
        home_port: rowPort,
        captain_name: rowCaptain,
        valid: rowName.length >= 2,
        error: rowName.length < 2 ? 'Nama terlalu pendek' : undefined
      });
    });

    if (parsed.length === 0) {
      setErrorMessage('Teks yang ditempel tidak mengandung baris data valid.');
      return;
    }

    setBulkList(prev => [...prev, ...parsed]);
    setRawPastedText('');
  };

  const handleRemoveBulkItem = (index: number) => {
    setBulkList(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearBulkList = () => {
    setBulkList([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Bulk List
  const handleBulkSubmit = () => {
    setErrorMessage('');
    const validItems = bulkList.filter(item => item.valid);

    if (validItems.length === 0) {
      setErrorMessage('Belum ada data kapal yang valid untuk di-import.');
      return;
    }

    setIsSubmitting(true);
    const res = store.addVesselsBulk(company.id, validItems);
    setIsSubmitting(false);

    if (!res.success && res.errors.length > 0) {
      setErrorMessage(res.errors.join(' | '));
      return;
    }

    const count = res.addedVessels.length;
    let msg = `Berhasil meng-import ${count} kapal baru ke armada ${company.name}.`;
    if (res.errors.length > 0) {
      msg += ` (${res.errors.length} baris dilewati karena duplikat/tidak valid).`;
    }

    handleClearBulkList();
    onSuccess(count, msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded font-mono">
                  {company.code}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[280px]">
                  {company.name}
                </span>
              </div>
              <h2 className="font-bold text-base sm:text-lg text-white mt-0.5">
                Registrasi Armada Kapal Perikanan
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('single');
              setErrorMessage('');
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'single'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg border-t border-x border-b-white -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Satu Persatu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('bulk');
              setErrorMessage('');
            }}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'bulk'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg border-t border-x border-b-white -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Bulk Import via Excel / Spreadsheet</span>
            {bulkList.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {bulkList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SATU PERSATU */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                Menambahkan kapal perikanan tunggal langsung ke dalam armada milik <strong>{company.name}</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kapal Perikanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Contoh: KM Samudera Perkasa 02"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Registrasi / SIPI KKP
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="Contoh: SIPI.512/KKP/2026"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dibuat otomatis bila dikosongkan</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tonase Kotor (Gross Tonnage / GT)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={grossTonnage}
                    onChange={(e) => setGrossTonnage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Pangkalan / Home Port
                  </label>
                  <select
                    value={homePort}
                    onChange={(e) => setHomePort(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {INDONESIAN_PORTS.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Nahkoda Kapal
                  </label>
                  <input
                    type="text"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    placeholder="Contoh: Capt. Bambang Irawan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kapal'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BULK EXCEL IMPORT */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              {/* Instructions & Template Action */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Import Sekaligus dari File Excel / CSV</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed max-w-md">
                    Unggah daftar armada kapal menggunakan format template resmi atau salin langsung dari tabel spreadsheet Anda.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm shrink-0 self-start sm:self-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Excel (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center bg-slate-50/60 transition group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-vessel-upload"
                />
                <label
                  htmlFor="excel-vessel-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="p-3 bg-white group-hover:bg-emerald-50 rounded-full border border-slate-200 group-hover:border-emerald-300 text-emerald-600 shadow-sm transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                      Klik untuk Pilih File Excel (.xlsx, .xls) atau CSV
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {fileName ? `File terpilih: ${fileName}` : 'Maksimal ukuran file 10MB'}
                    </div>
                  </div>
                </label>
              </div>

              {/* Alternative: Paste Tabular / CSV Data */}
              <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Atau Tempel / Copy-Paste Data dari Spreadsheet (Opsional):
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder="Tempel baris dari Excel di sini (Kolom: Nama Kapal | SIPI | Tonase GT | Pelabuhan | Nahkoda)..."
                    className="flex-1 p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={!rawPastedText.trim()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shrink-0 self-end transition"
                  >
                    Muat Teks
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              {bulkList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      <span>Pratinjau Data Kapal Siap Di-import ({bulkList.length} kapal)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearBulkList}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kosongkan List</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">No</th>
                          <th className="p-2.5">Nama Kapal</th>
                          <th className="p-2.5">Nomor SIPI</th>
                          <th className="p-2.5">Tonase (GT)</th>
                          <th className="p-2.5">Pangkalan</th>
                          <th className="p-2.5">Nahkoda</th>
                          <th className="p-2.5 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {bulkList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2 font-mono text-slate-600">{item.registration_number}</td>
                            <td className="p-2 text-slate-700">{item.gross_tonnage} GT</td>
                            <td className="p-2 text-slate-600">{item.home_port}</td>
                            <td className="p-2 text-slate-600">{item.captain_name}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bulk Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2.5">
                <span className="text-[11px] text-slate-500">
                  Target Perusahaan: <strong className="text-slate-800">{company.name}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkSubmit}
                    disabled={isSubmitting || bulkList.length === 0}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Meng-import...'
                        : `Import ${bulkList.length} Kapal Sekaligus`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
