import React, { useState, useRef } from 'react';
import { Company, Vessel } from '../types';
import { store, INDONESIAN_PORTS } from '../lib/supabaseStore';
import * as XLSX from 'xlsx';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Ship, 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin, 
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Layers
} from 'lucide-react';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCompany: Company, newVessel?: Vessel, bulkCount?: number) => void;
}

interface ParsedVesselRow {
  name: string;
  registration_number: string;
  gross_tonnage: number;
  home_port: string;
  captain_name: string;
  valid: boolean;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [address, setAddress] = useState('');

  // PIC Form State
  const [picName, setPicName] = useState('');
  const [picRole, setPicRole] = useState('Manajer Personalia & Crewing');
  const [picPhone, setPicPhone] = useState('');
  const [picEmail, setPicEmail] = useState('');

  // Vessel Registration Mode: 'none' | 'single' | 'bulk'
  const [vesselMode, setVesselMode] = useState<'none' | 'single' | 'bulk'>('single');

  // Single Vessel Fields
  const [vesselName, setVesselName] = useState('');
  const [vesselReg, setVesselReg] = useState('');
  const [vesselGT, setVesselGT] = useState<number>(45);
  const [vesselPort, setVesselPort] = useState<string>(INDONESIAN_PORTS[0]);
  const [captainName, setCaptainName] = useState('');

  // Bulk Vessel Fields
  const [bulkList, setBulkList] = useState<ParsedVesselRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [pastedText, setPastedText] = useState('');

  // Error & Status State
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-suggest code when company name changes (e.g., "PT Samudera Bahari" -> "SB")
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!code || code.length <= 4) {
      const words = val
        .replace(/^(PT\.?|CV\.?|UD\.?)\s+/i, '')
        .split(/\s+/)
        .filter(Boolean);
      const suggested = words.map(w => w[0]?.toUpperCase()).join('').slice(0, 4);
      if (suggested) {
        setCode(suggested);
      }
    }
  };

  // Download Sample Template for Excel
  const handleDownloadTemplate = () => {
    const headers = ['Nama Kapal', 'Nomor SIPI / Pendaftaran', 'Tonase Kotor (GT)', 'Pelabuhan Pangkalan', 'Nama Nahkoda'];
    const sampleData = [
      headers,
      ['KM Samudera Prima 01', 'SIPI.881/KKP/2026', 45, 'Muara Baru, Jakarta', 'Capt. Hendro Subagio'],
      ['KM Samudera Prima 02', 'SIPI.882/KKP/2026', 60, 'Benoa, Bali', 'Capt. Agus Riyanto'],
      ['KM Samudera Perkasa 03', 'SIPI.883/KKP/2026', 75, 'Bitung, Sulawesi Utara', 'Capt. Rudi Hartono']
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 28 }, { wch: 26 }, { wch: 18 }, { wch: 26 }, { wch: 26 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Kapal');
    XLSX.writeFile(wb, `Template_Armada_${code.trim() || 'Perusahaan'}.xlsx`);
  };

  // Handle Excel Upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (rows.length <= 1) {
          setErrorMessage('File Excel kosong atau hanya berisi judul kolom.');
          return;
        }

        const parsed: ParsedVesselRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rowName = String(row[0] || '').trim();
          if (!rowName) continue;

          parsed.push({
            name: rowName,
            registration_number: String(row[1] || '').trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
            gross_tonnage: Number(row[2]) || 30,
            home_port: String(row[3] || '').trim() || INDONESIAN_PORTS[0],
            captain_name: String(row[4] || '').trim() || 'Capt. Belum Ditentukan',
            valid: rowName.length >= 2
          });
        }

        if (parsed.length === 0) {
          setErrorMessage('Tidak ada baris data kapal yang dapat dibaca.');
          return;
        }

        setBulkList(parsed);
      } catch (err: any) {
        setErrorMessage('Gagal memproses file Excel: ' + (err.message || 'Format tidak dikenali'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Pasted Text
  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText.trim().split('\n');
    const parsed: ParsedVesselRow[] = [];

    lines.forEach((line, idx) => {
      let parts = line.split('\t');
      if (parts.length <= 1) parts = line.split(',');
      if (parts.length <= 1) parts = line.split(';');

      const rowName = parts[0]?.trim() || '';
      if (!rowName) return;
      if (idx === 0 && (rowName.toLowerCase().includes('nama') || rowName.toLowerCase().includes('kapal'))) {
        return;
      }

      parsed.push({
        name: rowName,
        registration_number: parts[1]?.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
        gross_tonnage: Number(parts[2]?.replace(/[^\d.]/g, '')) || 30,
        home_port: parts[3]?.trim() || INDONESIAN_PORTS[0],
        captain_name: parts[4]?.trim() || 'Capt. Belum Ditentukan',
        valid: rowName.length >= 2
      });
    });

    if (parsed.length === 0) {
      setErrorMessage('Teks tidak mengandung baris data yang valid.');
      return;
    }

    setBulkList(prev => [...prev, ...parsed]);
    setPastedText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 3) {
      setErrorMessage('Nama perusahaan wajib diisi minimal 3 karakter.');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Kode anggota perusahaan wajib diisi (misal: SBI, MJL).');
      return;
    }

    if (!picName.trim()) {
      setErrorMessage('Nama penanggung jawab (PIC) wajib diisi untuk koordinasi antar-anggota.');
      return;
    }

    if (!picPhone.trim()) {
      setErrorMessage('Nomor kontak WhatsApp/telepon PIC wajib diisi.');
      return;
    }

    if (vesselMode === 'single' && !vesselName.trim()) {
      setErrorMessage('Nama kapal wajib diisi jika mode tambah kapal satu persatu aktif.');
      return;
    }

    if (vesselMode === 'bulk' && bulkList.length === 0) {
      setErrorMessage('Pilih file Excel atau tempel data kapal jika mode bulk import aktif.');
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedLicense = licenseNumber.trim() || `SIUP-KKP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Initial company registration
      const result = store.addCompany({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        license_number: generatedLicense,
        pic_name: picName.trim(),
        pic_role: picRole.trim() || 'Staf Operasional & Crewing',
        pic_phone: picPhone.trim(),
        pic_email: picEmail.trim() || `ops@${code.trim().toLowerCase()}.id`,
        address: address.trim() || 'Kawasan Pelabuhan Perikanan',
        initialVessel: vesselMode === 'single' && vesselName.trim() ? {
          name: vesselName.trim(),
          registration_number: vesselReg.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
          gross_tonnage: Number(vesselGT) || 30,
          home_port: vesselPort,
          captain_name: captainName.trim() || 'Capt. Belum Ditentukan'
        } : undefined
      });

      if (!result.success || !result.company) {
        setErrorMessage(result.error || 'Gagal mendaftarkan perusahaan.');
        setIsSubmitting(false);
        return;
      }

      let bulkCount = 0;
      // If bulk mode was selected, insert the bulk list
      if (vesselMode === 'bulk' && bulkList.length > 0) {
        const bulkRes = store.addVesselsBulk(result.company.id, bulkList);
        bulkCount = bulkRes.addedVessels.length;
      }

      onSuccess(result.company, result.vessel, bulkCount);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                  Grup Asosiasi
                </span>
                <span className="text-[10px] text-slate-400">
                  Kepatuhan Administrasi
                </span>
              </div>
              <h2 className="font-bold text-base sm:text-lg text-white mt-0.5">
                Pendaftaran Perusahaan Anggota Baru
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Profil & Legalitas Badan Usaha */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Profil &amp; Legalitas Badan Usaha</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Resmi Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  required
                  placeholder="Contoh: PT Samudera Perkasa Bahari"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Anggota <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                  required
                  placeholder="SPB"
                  className="w-full px-3 py-2 text-xs uppercase font-mono font-bold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Maksimal 6 huruf singkatan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor SIUP-KKP / Izin Usaha Perikanan
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="Contoh: SIUP-KKP-2026-7890"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Dapat dikosongkan (dibuat otomatis oleh sistem)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Kantor / Pelabuhan Pangkalan
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Kompleks Pelabuhan Benoa Blok B-2, Bali"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kontak Penanggung Jawab (PIC) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Penanggung Jawab Personil &amp; Kru (PIC)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  required
                  placeholder="Contoh: Hendra Gunawan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan / Posisi PIC
                </label>
                <input
                  type="text"
                  value={picRole}
                  onChange={(e) => setPicRole(e.target.value)}
                  placeholder="Contoh: Manajer Personalia & Crewing"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    required
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Resmi
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={picEmail}
                    onChange={(e) => setPicEmail(e.target.value)}
                    placeholder="crewing@perusahaan.co.id"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pendaftaran Armada Kapal Perusahaan (Satu Persatu atau Bulk Excel) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Ship className="w-4 h-4 text-blue-600" />
                <span>3. Pendaftaran Armada Kapal (Opsional)</span>
              </div>
              <span className="text-[11px] text-slate-400">Pilih metode pendaftaran</span>
            </div>

            {/* Mode Toggle Buttons */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVesselMode('single')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  vesselMode === 'single'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Satu Persatu</span>
              </button>

              <button
                type="button"
                onClick={() => setVesselMode('bulk')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  vesselMode === 'bulk'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulk via Excel</span>
                {bulkList.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {bulkList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVesselMode('none')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  vesselMode === 'none'
                    ? 'bg-white text-slate-700 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Lewati Dulu</span>
              </button>
            </div>

            {/* Option A: Satu Persatu Form */}
            {vesselMode === 'single' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span>Formulir Armada Kapal Perdana</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Kapal Perikanan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={vesselName}
                      onChange={(e) => setVesselName(e.target.value)}
                      placeholder="Contoh: KM Samudera Raya 01"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor SIPI / Pendaftaran Kapal
                    </label>
                    <input
                      type="text"
                      value={vesselReg}
                      onChange={(e) => setVesselReg(e.target.value)}
                      placeholder="Contoh: SIPI.429/KKP/2026"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tonase Kotor (Gross Tonnage / GT)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      value={vesselGT}
                      onChange={(e) => setVesselGT(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pelabuhan Pangkalan
                    </label>
                    <select
                      value={vesselPort}
                      onChange={(e) => setVesselPort(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {INDONESIAN_PORTS.map((port) => (
                        <option key={port} value={port}>
                          {port}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
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
              </div>
            )}

            {/* Option B: Bulk via Excel / CSV */}
            {vesselMode === 'bulk' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Upload Berkas Excel (.xlsx, .xls) / CSV</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template Excel</span>
                  </button>
                </div>

                {/* File Dropzone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-white transition group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    className="hidden"
                    id="modal-bulk-upload"
                  />
                  <label
                    htmlFor="modal-bulk-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                      {bulkFileName ? `File Terpilih: ${bulkFileName}` : 'Klik untuk Pilih Berkas Excel (.xlsx / .csv)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Format kolom: Nama Kapal, Nomor SIPI, Tonase GT, Pelabuhan Pangkalan, Nahkoda
                    </div>
                  </label>
                </div>

                {/* Paste alternative */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Atau Tempel Baris dari Excel / Spreadsheet:
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Tempel baris Excel di sini..."
                      className="flex-1 p-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      disabled={!pastedText.trim()}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shrink-0 self-end transition cursor-pointer"
                    >
                      Muat Baris
                    </button>
                  </div>
                </div>

                {/* Preview List */}
                {bulkList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pratinjau Armada ({bulkList.length} kapal)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkList([]);
                          setBulkFileName('');
                        }}
                        className="text-rose-600 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus List</span>
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {bulkList.map((item, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between text-xs hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-900">{item.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">{item.registration_number}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({item.gross_tonnage} GT)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setBulkList(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option C: Lewati */}
            {vesselMode === 'none' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                Pendaftaran armada kapal dilewati untuk saat ini. Anda dapat menambahkan kapal sewaktu-waktu melalui halaman Direktori Asosiasi.
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perusahaan & Armada'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
