import React, { useState } from 'react';
import { store } from '../lib/supabaseStore';
import { ManifestType, Worker, Vessel } from '../types';
import {
  Ship,
  Anchor,
  Search,
  Lock,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  ArrowRight,
  UserCheck,
  Plus,
  X,
  UserMinus,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Download,
  HelpCircle,
  Building2,
  Briefcase
} from 'lucide-react';

export const ManifestLog: React.FC = () => {
  const currentUser = store.getCurrentUser();
  const [vessels, setVessels] = useState(() => store.getVessels());
  const [allWorkers, setAllWorkers] = useState(() => store.getWorkers());

  // Form State
  const [manifestType, setManifestType] = useState<ManifestType>('keberangkatan');
  const [selectedVesselId, setSelectedVesselId] = useState<string>(vessels[0]?.id || '');
  const [port, setPort] = useState<string>(currentUser.port);
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Vessel Modal State (Single & Bulk Excel)
  const [isAddVesselModalOpen, setIsAddVesselModalOpen] = useState<boolean>(false);
  const [vesselModalTab, setVesselModalTab] = useState<'single' | 'bulk'>('single');
  const [newVesselName, setNewVesselName] = useState<string>('');
  const [newVesselRegistration, setNewVesselRegistration] = useState<string>('');
  const [newVesselGt, setNewVesselGt] = useState<string>('30');
  const [newVesselCompany, setNewVesselCompany] = useState<string>('');
  const [vesselModalError, setVesselModalError] = useState<string>('');

  // Bulk Excel State
  const [bulkExcelText, setBulkExcelText] = useState<string>('');
  const [bulkImportReport, setBulkImportReport] = useState<{ success: boolean; count: number; errors: string[] } | null>(null);

  // Clearance State for workers arriving ashore
  const [clearanceMap, setClearanceMap] = useState<Record<string, {
    status: 'bebas_tanggungan' | 'ada_tanggungan';
    category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
    amount?: number;
    notes?: string;
  }>>({});
  const [clearanceModalWorker, setClearanceModalWorker] = useState<Worker | null>(null);
  const [modalClearanceStatus, setModalClearanceStatus] = useState<'bebas_tanggungan' | 'ada_tanggungan'>('bebas_tanggungan');
  const [modalClearanceCategory, setModalClearanceCategory] = useState<'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya'>('kasbon_pinjaman');
  const [modalClearanceAmount, setModalClearanceAmount] = useState<string>('');
  const [modalClearanceNotes, setModalClearanceNotes] = useState<string>('');

  // Assign Worker Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState<string>('');
  const [showTransferCandidates, setShowTransferCandidates] = useState<boolean>(false);

  // Unassign Modal State (Lepas Tugas dari Kapal & Perusahaan)
  const [unassignModalData, setUnassignModalData] = useState<{
    workerId: string;
    workerName: string;
    nikLast4: string;
    vesselName: string;
    companyName: string;
    reason: 'selesai_kontrak' | 'rotasi_kru' | 'permintaan_pribadi' | 'mutasi_armada' | 'lainnya';
    notes: string;
  } | null>(null);

  // In-app Modal Confirmation for Crew Mutation & Clearance Warning
  const [mutationConfirmData, setMutationConfirmData] = useState<{
    workerId: string;
    workerName: string;
    currentVesselName: string;
    targetVesselName: string;
  } | null>(null);

  const [clearanceWarningAssignData, setClearanceWarningAssignData] = useState<{
    workerId: string;
    workerName: string;
    category?: string;
    amount?: number;
    notes?: string;
    vesselName: string;
  } | null>(null);

  // Workers selected for departure or arrival
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());

  // Arrival specific state: Departure Manifest reference
  const [departureManifestId, setDepartureManifestId] = useState<string>('');

  // Disembarked status mapping for arrival (workerId -> boolean disembarked)
  const [disembarkedMap, setDisembarkedMap] = useState<Record<string, boolean>>({});

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Selected vessel object
  const selectedVessel = vessels.find(v => v.id === selectedVesselId);

  // Filter workers ONLY for selected vessel (strict anti-duplication: only workers assigned to this vessel)
  const vesselWorkers = selectedVesselId ? store.getWorkersByVessel(selectedVesselId) : [];

  // Filter workers based on search query inside the vessel list
  const filteredWorkers = vesselWorkers.filter(w => {
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.nik_last4.includes(q);
  });

  // Assign worker to current selected vessel
  const handleAssignWorker = (workerId: string) => {
    if (!selectedVesselId) return;
    const res = store.assignWorkerToVessel(workerId, selectedVesselId);
    if (res.success && res.worker) {
      setAllWorkers(store.getWorkers());
      setVessels(store.getVessels());
      setNotification({
        type: 'success',
        message: `Pekerja "${res.worker.name}" berhasil ditugaskan ke kapal ${selectedVessel?.name}!`
      });
      setIsAssignModalOpen(false);
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'Gagal menugaskan pekerja.'
      });
    }
  };

  // Open Unassign Modal (Lepas Hubungan Kerja & Kapal)
  const handleOpenUnassignModal = (worker: Worker) => {
    setUnassignModalData({
      workerId: worker.id,
      workerName: worker.name,
      nikLast4: worker.nik_last4,
      vesselName: selectedVessel?.name || worker.last_vessel_name || 'Kapal Ini',
      companyName: selectedVessel?.company_name || worker.company_name || worker.pkl_company_name || 'Perusahaan Pemilik',
      reason: 'selesai_kontrak',
      notes: ''
    });
  };

  // Confirm Unassign Action: worker no longer belongs to this vessel and company
  const handleConfirmUnassign = () => {
    if (!unassignModalData) return;
    const { workerId, workerName, vesselName, companyName, reason, notes } = unassignModalData;
    const res = store.unassignWorkerFromVessel(workerId, reason, notes);
    if (res.success) {
      setAllWorkers(store.getWorkers());
      setVessels(store.getVessels());
      setSelectedWorkerIds(prev => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
      setNotification({
        type: 'success',
        message: `Pekerja "${workerName}" telah resmi dilepas dari kapal ${vesselName} dan perusahaan ${companyName}. Status kini Bebas Tugas di Darat (Bebas Transfer Lintas Armada).`
      });
      setUnassignModalData(null);
    } else {
      setNotification({
        type: 'error',
        message: res.error || 'Gagal melepas penugasan pekerja.'
      });
    }
  };

  // Handle Select All / Deselect All
  const toggleSelectAll = () => {
    if (selectedWorkerIds.size === filteredWorkers.length) {
      setSelectedWorkerIds(new Set());
    } else {
      const newSet = new Set<string>();
      filteredWorkers.forEach(w => newSet.add(w.id));
      setSelectedWorkerIds(newSet);
    }
  };

  const toggleWorkerSelection = (workerId: string) => {
    const next = new Set(selectedWorkerIds);
    if (next.has(workerId)) {
      next.delete(workerId);
    } else {
      next.add(workerId);
    }
    setSelectedWorkerIds(next);
  };

  const handleToggleDisembarked = (workerId: string) => {
    setDisembarkedMap(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  // --- CLEARANCE HANDLERS (Laut ke Darat) ---
  const handleOpenClearanceModal = (worker: Worker) => {
    const currentClr = clearanceMap[worker.id] || { status: 'bebas_tanggungan' };
    setClearanceModalWorker(worker);
    setModalClearanceStatus(currentClr.status);
    setModalClearanceCategory(currentClr.category || 'kasbon_pinjaman');
    setModalClearanceAmount(currentClr.amount ? String(currentClr.amount) : '');
    setModalClearanceNotes(currentClr.notes || '');
  };

  const handleSaveClearanceModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearanceModalWorker) return;

    setClearanceMap(prev => ({
      ...prev,
      [clearanceModalWorker.id]: {
        status: modalClearanceStatus,
        category: modalClearanceStatus === 'ada_tanggungan' ? modalClearanceCategory : undefined,
        amount: modalClearanceStatus === 'ada_tanggungan' && modalClearanceAmount ? Number(modalClearanceAmount) : undefined,
        notes: modalClearanceNotes.trim()
      }
    }));

    setClearanceModalWorker(null);
  };

  const handleSetAllClearanceClean = () => {
    const next = { ...clearanceMap };
    selectedWorkerIds.forEach(id => {
      next[id] = {
        status: 'bebas_tanggungan',
        notes: 'Peralatan lengkap, kasbon beres, siap transfer.'
      };
    });
    setClearanceMap(next);
    setNotification({
      type: 'success',
      message: `Semua (${selectedWorkerIds.size}) ABK yang dipilih telah disetel status Bebas Tanggungan (Bebas Transfer).`
    });
  };

  // --- SINGLE VESSEL REGISTRATION ---
  const handleRegisterVessel = (e: React.FormEvent) => {
    e.preventDefault();
    setVesselModalError('');

    if (!newVesselName.trim()) {
      setVesselModalError('Nama kapal perikanan wajib diisi.');
      return;
    }
    if (!newVesselRegistration.trim()) {
      setVesselModalError('Nomor registrasi SIPI/KKP wajib diisi.');
      return;
    }

    const res = store.registerVessel({
      name: newVesselName.trim(),
      registration_number: newVesselRegistration.trim(),
      gross_tonnage: Number(newVesselGt) || 30,
      company_name: newVesselCompany.trim() || 'PT Samudera Bahari Indonesia'
    });

    if (res.success && res.vessel) {
      setVessels(store.getVessels());
      setSelectedVesselId(res.vessel.id);
      setIsAddVesselModalOpen(false);
      setNewVesselName('');
      setNewVesselRegistration('');
      setNewVesselGt('30');
      setNewVesselCompany('');
      setNotification({
        type: 'success',
        message: `Kapal Perikanan baru "${res.vessel.name}" (${res.vessel.registration_number}) berhasil didaftarkan dan langsung dipilih!`
      });
    } else {
      setVesselModalError(res.error || 'Gagal mendaftarkan kapal.');
    }
  };

  // --- BULK EXCEL PARSING & REGISTRATION ---
  interface ParsedBulkRow {
    name: string;
    registration_number: string;
    gross_tonnage: number;
    company_name: string;
    home_port: string;
    isValid: boolean;
    validationError?: string;
  }

  const parseExcelBulkData = (rawText: string, existingVessels: Vessel[]): ParsedBulkRow[] => {
    if (!rawText.trim()) return [];

    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const results: ParsedBulkRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip header row if present
      if (i === 0 && (line.toLowerCase().includes('nama kapal') || line.toLowerCase().includes('registrasi') || line.toLowerCase().includes('tonnage'))) {
        continue;
      }

      // Split by tab (native Excel copy-paste) or comma or semicolon
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else {
        parts = line.split(',');
      }

      const name = parts[0]?.trim() || '';
      const registration_number = parts[1]?.trim() || '';
      const gross_tonnage = Number(parts[2]?.trim()) || 30;
      const company_name = parts[3]?.trim() || 'PT Samudera Bahari Indonesia';
      const home_port = parts[4]?.trim() || 'PPS Nizam Zachman Jakarta';

      let isValid = true;
      let validationError: string | undefined = undefined;

      if (!name) {
        isValid = false;
        validationError = 'Nama kapal wajib diisi';
      } else if (existingVessels.some(v => v.name.toLowerCase() === name.toLowerCase())) {
        isValid = false;
        validationError = 'Nama kapal sudah ada di database';
      } else if (registration_number && existingVessels.some(v => v.registration_number.toLowerCase() === registration_number.toLowerCase())) {
        isValid = false;
        validationError = 'No registrasi sudah terdaftar';
      }

      results.push({
        name,
        registration_number: registration_number || `SIPI-${Date.now().toString().slice(-4)}-${i + 1}`,
        gross_tonnage,
        company_name,
        home_port,
        isValid,
        validationError
      });
    }

    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBulkExcelText(text);
        setBulkImportReport(null);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    const sample = `Nama Kapal\tNomor Registrasi SIPI\tGross Tonnage (GT)\tPerusahaan Pemilik\tPelabuhan Pangkalan
KM Samudera Mandiri 01\tSIPI.501/KKP/2026\t45\tPT Samudera Bahari Indonesia\tPPS Nizam Zachman Jakarta
KM Bahari Perkasa 08\tSIPI.502/KKP/2026\t60\tPT Mina Jaya Lautan\tPPS Cilacap
KM Bintang Samudera IX\tSIPI.503/KKP/2026\t35\tCV Sinar Nusantara Maritime\tPPS Bitung
KM Mina Abadi 05\tSIPI.504/KKP/2026\t50\tPT Samudera Bahari Indonesia\tPelabuhan Benoa Bali`;
    setBulkExcelText(sample);
    setBulkImportReport(null);
  };

  const handleExecuteBulkImport = () => {
    const parsed = parseExcelBulkData(bulkExcelText, vessels);
    const validRows = parsed.filter(p => p.isValid);

    if (validRows.length === 0) {
      setBulkImportReport({
        success: false,
        count: 0,
        errors: ['Tidak ada data kapal valid yang dapat diimpor. Mohon periksa baris yang ditandai merah.']
      });
      return;
    }

    const res = store.registerVesselsBulk(validRows.map(r => ({
      name: r.name,
      registration_number: r.registration_number,
      gross_tonnage: r.gross_tonnage,
      company_name: r.company_name,
      home_port: r.home_port
    })));

    if (res.success) {
      const updated = store.getVessels();
      setVessels(updated);
      if (res.vessels[0]) {
        setSelectedVesselId(res.vessels[0].id);
      }
      setBulkImportReport({
        success: true,
        count: res.count,
        errors: res.errors
      });
      setBulkExcelText('');
      setNotification({
        type: 'success',
        message: `Berhasil mengimpor ${res.count} kapal perikanan baru secara massal dari Excel/CSV!`
      });
    } else {
      setBulkImportReport({
        success: false,
        count: 0,
        errors: res.errors
      });
    }
  };

  const handleSubmitManifest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVesselId) {
      setNotification({ type: 'error', message: 'Silakan pilih kapal perikanan terlebih dahulu.' });
      return;
    }

    if (selectedWorkerIds.size === 0) {
      setNotification({ type: 'error', message: 'Pilih setidaknya 1 pekerja (ABK) untuk dimasukkan ke dalam manifest.' });
      return;
    }

    const workerList = Array.from(selectedWorkerIds).map((id: string) => {
      const isDisembarked = manifestType === 'kedatangan' ? Boolean(disembarkedMap[id] ?? true) : true;
      const clr = clearanceMap[id] || { status: 'bebas_tanggungan' };

      return {
        worker_id: id,
        disembarked: isDisembarked,
        clearance_status: manifestType === 'kedatangan' && isDisembarked ? clr.status : undefined,
        tanggungan_category: manifestType === 'kedatangan' && isDisembarked && clr.status === 'ada_tanggungan' ? clr.category : undefined,
        tanggungan_amount: manifestType === 'kedatangan' && isDisembarked && clr.status === 'ada_tanggungan' ? clr.amount : undefined,
        tanggungan_notes: manifestType === 'kedatangan' && isDisembarked && clr.status === 'ada_tanggungan' ? clr.notes : undefined
      };
    });

    try {
      const newManifest = store.createManifest({
        vessel_id: selectedVesselId,
        type: manifestType,
        departure_manifest_id: manifestType === 'kedatangan' ? departureManifestId : undefined,
        port,
        notes,
        workers: workerList
      });

      setAllWorkers(store.getWorkers());
      setVessels(store.getVessels());

      setNotification({
        type: 'success',
        message: manifestType === 'kedatangan'
          ? `Manifest Kedatangan #${newManifest.manifest_number} berhasil diterbitkan! ABK yang turun telah diperiksa clearancenya dan kini berstatus Bebas Transfer lintas perusahaan.`
          : `Manifest Keberangkatan #${newManifest.manifest_number} berhasil diterbitkan dengan ${workerList.length} kru kapal!`
      });

      // Reset form
      setSelectedWorkerIds(new Set());
      setClearanceMap({});
      setNotes('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan manifest.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400">PENCATATAN KOLEKTIF MANIFEST</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ship className="w-5 h-5 text-blue-600" />
            Terbitkan Manifest Kapal Perikanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mencatat kru kapal (ABK) secara sekaligus per pelayaran sesuai standar Syahbandar
          </p>
        </div>

        {/* Manifest Type Switcher Tabs (Tabler Pill Style) */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setManifestType('keberangkatan');
              setSelectedWorkerIds(new Set());
            }}
            className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              manifestType === 'keberangkatan'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            Manifest Keberangkatan (Laut)
          </button>
          <button
            type="button"
            onClick={() => {
              setManifestType('kedatangan');
              setSelectedWorkerIds(new Set());
            }}
            className={`px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
              manifestType === 'kedatangan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            Manifest Kedatangan (Darat)
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg border text-xs font-bold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : notification.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline text-[11px] cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmitManifest} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3): Flight & Vessel Metadata */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 border-t-4 border-t-blue-600 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Metadata Pelayaran Kapal
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Kapal Perikanan <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setVesselModalTab('single');
                    setIsAddVesselModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition shadow-xs"
                  title="Tambah satu per satu kapal baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Kapal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVesselModalTab('bulk');
                    setIsAddVesselModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition shadow-xs"
                  title="Impor banyak kapal sekaligus melalui Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Impor Excel</span>
                </button>
              </div>
            </div>
            <select
              value={selectedVesselId}
              onChange={(e) => {
                if (e.target.value === 'ADD_NEW_VESSEL') {
                  setVesselModalTab('single');
                  setIsAddVesselModalOpen(true);
                } else if (e.target.value === 'ADD_BULK_EXCEL') {
                  setVesselModalTab('bulk');
                  setIsAddVesselModalOpen(true);
                } else {
                  setSelectedVesselId(e.target.value);
                  setSelectedWorkerIds(new Set());
                }
              }}
              className="w-full text-xs rounded-md border-slate-300 border p-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registration_number}) - {v.company_name}
                </option>
              ))}
              <option value="ADD_NEW_VESSEL" className="font-bold text-blue-600 bg-blue-50">
                + Tambah Kapal Satu per Satu...
              </option>
              <option value="ADD_BULK_EXCEL" className="font-bold text-emerald-600 bg-emerald-50">
                📊 Impor Banyak Kapal via Excel / CSV...
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pelabuhan Terbit *
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full text-xs rounded-md border-slate-300 border p-2 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pencatat Resmi *
            </label>
            <div className="p-2 bg-slate-100 rounded border border-slate-200 text-xs font-semibold text-slate-800">
              {currentUser.name} ({currentUser.role.toUpperCase()})
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Instruksi Pelayaran
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan dokumen SPB, cuaca, atau lokasi perairan..."
              className="w-full text-xs rounded-md border-slate-300 border p-2 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2.5 rounded-md font-bold text-xs text-white shadow transition flex items-center justify-center gap-2 ${
                manifestType === 'keberangkatan'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Terbitkan Manifest {manifestType.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Right Column (2/3): Worker Checkbox Selection */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                ABK Terdaftar: {selectedVessel?.name || 'Kapal Perikanan'}
              </h2>
              <p className="text-xs text-slate-500">
                Menampilkan {vesselWorkers.length} pekerja terdaftar pada kapal ini ({selectedWorkerIds.size} dipilih)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded border border-blue-200 transition flex items-center gap-1 shadow-sm"
                title="Tugaskan pekerja lain dari database umum ke kapal ini"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Tugaskan ABK</span>
              </button>

              {manifestType === 'kedatangan' && selectedWorkerIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleSetAllClearanceClean}
                  className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded border border-emerald-200 transition flex items-center gap-1 shadow-xs"
                  title="Tandai semua kru yang dipilih bebas tanggungan sehingga langsung bebas transfer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Setel Semua Bebas Tanggungan</span>
                </button>
              )}

              <div className="relative w-40">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ABK kapal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300"
                />
              </div>

              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded border border-slate-300 font-semibold"
              >
                {selectedWorkerIds.size === filteredWorkers.length && filteredWorkers.length > 0 ? 'Batal Semua' : 'Pilih Semua'}
              </button>
            </div>
          </div>

          {/* Workers Selection Table */}
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold sticky top-0 bg-slate-100 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">Pilih</th>
                  <th className="p-3">Nama ABK</th>
                  <th className="p-3">NIK (Masked)</th>
                  <th className="p-3">Status Terakhir</th>
                  {manifestType === 'kedatangan' && <th className="p-3 text-center">Turun Kapal?</th>}
                  {manifestType === 'kedatangan' && <th className="p-3">Pemeriksaan Clearance (Tanggungan)</th>}
                  <th className="p-3 text-center w-28">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={manifestType === 'kedatangan' ? 7 : 5} className="text-center py-10 px-4">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Ship className="w-8 h-8 text-slate-300" />
                        <p className="text-xs font-bold text-slate-700">
                          {searchQuery
                            ? 'Tidak ada ABK yang cocok dengan pencarian.'
                            : `Belum ada ABK yang terdaftar khusus pada ${selectedVessel?.name || 'kapal ini'}.`}
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-sm">
                          {searchQuery
                            ? 'Coba gunakan kata kunci nama atau NIK lain.'
                            : 'Setiap kapal hanya menampilkan krunya sendiri. Gunakan tombol "+ Tugaskan ABK" untuk menambahkan pekerja dari database umum ke kapal ini.'}
                        </p>
                        {!searchQuery && (
                          <button
                            type="button"
                            onClick={() => setIsAssignModalOpen(true)}
                            className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded shadow-sm transition inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tugaskan ABK ke Kapal Ini</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isSelected = selectedWorkerIds.has(worker.id);
                    return (
                      <tr
                        key={worker.id}
                        className={`hover:bg-slate-50 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                        onClick={() => toggleWorkerSelection(worker.id)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleWorkerSelection(worker.id)}
                            className="text-slate-600 hover:text-blue-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </td>

                        <td className="p-3 font-bold text-slate-900">{worker.name}</td>

                        <td className="p-3 font-mono text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-[11px]">
                            ****{worker.nik_last4}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                              worker.current_status === 'di_laut'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {worker.current_status === 'di_laut' ? 'DI LAUT' : 'DI DARAT'}
                          </span>
                        </td>

                        {manifestType === 'kedatangan' && (
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <button
                                type="button"
                                onClick={() => handleToggleDisembarked(worker.id)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                  (disembarkedMap[worker.id] ?? true)
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {(disembarkedMap[worker.id] ?? true) ? 'YA (TURUN)' : 'TIDAK (TETAP)'}
                              </button>
                            ) : (
                              <span className="text-slate-300 text-[10px]">-</span>
                            )}
                          </td>
                        )}

                        {manifestType === 'kedatangan' && (
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            {isSelected && (disembarkedMap[worker.id] ?? true) ? (
                              (() => {
                                const clr = clearanceMap[worker.id] || { status: 'bebas_tanggungan' };
                                if (clr.status === 'ada_tanggungan') {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenClearanceModal(worker)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition shadow-xs text-left"
                                      title="Ada catatan tanggungan. Klik untuk memeriksa atau mengubah."
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                      <div>
                                        <div className="font-bold leading-tight flex items-center gap-1">
                                          <span>Ada Tanggungan</span>
                                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded">Edit</span>
                                        </div>
                                        <div className="text-[9px] text-amber-800 font-normal truncate max-w-[140px]">
                                          {clr.category ? clr.category.replace('_', ' ') : 'Catatan'} {clr.amount ? `• Rp ${clr.amount.toLocaleString('id-ID')}` : ''}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenClearanceModal(worker)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300 hover:bg-emerald-200/80 transition shadow-xs text-left"
                                      title="Bebas Tanggungan (Bebas Transfer). Klik jika ingin mencatat kasbon/alat."
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <div>
                                        <div className="font-bold leading-tight flex items-center gap-1">
                                          <span>Bebas Tanggungan</span>
                                          <span className="text-[9px] text-emerald-600 font-normal underline">Ubah</span>
                                        </div>
                                        <div className="text-[9px] text-emerald-700 font-normal">Bebas Transfer Lintas Kapal</div>
                                      </div>
                                    </button>
                                  );
                                }
                              })()
                            ) : isSelected ? (
                              <span className="text-[10px] text-slate-400 italic">Tetap di laut</span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">-</span>
                            )}
                          </td>
                        )}

                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {worker.current_status === 'di_laut' ? (
                            <span
                              className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-not-allowed"
                              title="Tidak dapat dilepas saat pekerja aktif di laut"
                            >
                              Di Laut
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenUnassignModal(worker)}
                              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded border border-rose-200 transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Lepas hubungan kerja dari kapal & perusahaan ini"
                            >
                              <UserMinus className="w-3 h-3" />
                              <span>Lepas Tugas</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      {/* Modal Registrasi Kapal Perikanan (Satu per Satu ATAU Bulk Excel) */}
      {isAddVesselModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-lg w-full shadow-2xl border border-slate-200 overflow-hidden transition-all ${
            vesselModalTab === 'bulk' ? 'max-w-2xl' : 'max-w-md'
          }`}>
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-md">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Registrasi &amp; Penambahan Kapal Perikanan</h3>
                  <p className="text-[11px] text-slate-400">Pilih metode pendaftaran kapal: manual satu per satu atau impor massal via data Excel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddVesselModalOpen(false);
                  setBulkImportReport(null);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setVesselModalTab('single')}
                className={`flex-1 py-2.5 px-4 text-center flex items-center justify-center gap-2 border-b-2 transition ${
                  vesselModalTab === 'single'
                    ? 'border-blue-600 bg-white text-blue-700 shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Tambah Satu per Satu</span>
              </button>
              <button
                type="button"
                onClick={() => setVesselModalTab('bulk')}
                className={`flex-1 py-2.5 px-4 text-center flex items-center justify-center gap-2 border-b-2 transition ${
                  vesselModalTab === 'bulk'
                    ? 'border-emerald-600 bg-white text-emerald-700 shadow-xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>📊 Impor Bulk via Excel / CSV</span>
              </button>
            </div>

            {/* TAB 1: Single Vessel Registration Form */}
            {vesselModalTab === 'single' && (
              <form onSubmit={handleRegisterVessel} className="p-5 space-y-4 text-xs">
                {vesselModalError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{vesselModalError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Nama Kapal Perikanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: KM Sinar Laut 09"
                    value={newVesselName}
                    onChange={(e) => setNewVesselName(e.target.value)}
                    className="w-full text-xs rounded-md border-slate-300 border p-2 focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Nomor Registrasi SIPI / KKP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: SIPI.412/KKP/2026"
                    value={newVesselRegistration}
                    onChange={(e) => setNewVesselRegistration(e.target.value)}
                    className="w-full text-xs rounded-md border-slate-300 border p-2 font-mono focus:ring-2 focus:ring-blue-500 text-slate-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Gross Tonnage (GT)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newVesselGt}
                      onChange={(e) => setNewVesselGt(e.target.value)}
                      className="w-full text-xs rounded-md border-slate-300 border p-2 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Perusahaan Pemilik
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Samudera Bahari"
                      value={newVesselCompany}
                      onChange={(e) => setNewVesselCompany(e.target.value)}
                      className="w-full text-xs rounded-md border-slate-300 border p-2 text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVesselModalOpen(false)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan Kapal Baru</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Bulk Excel / CSV Import */}
            {vesselModalTab === 'bulk' && (() => {
              const parsedRows = parseExcelBulkData(bulkExcelText, vessels);
              const validRows = parsedRows.filter(r => r.isValid);
              const invalidRows = parsedRows.filter(r => !r.isValid);

              return (
                <div className="p-5 space-y-4 text-xs">
                  {/* Instructions & Tools */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                        <span>Impor Massal Kapal dari Excel / Spreadsheet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadSampleData}
                          className="text-[11px] bg-white hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded border border-emerald-300 transition shadow-2xs inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Contoh Format Excel</span>
                        </button>
                        <label className="cursor-pointer text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded transition shadow-2xs inline-flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Pilih File (.csv / .txt)</span>
                          <input
                            type="file"
                            accept=".csv,.txt,.tsv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Salin (copy-paste) kolom tabel langsung dari Microsoft Excel atau Google Sheets ke kotak teks di bawah. Format kolom berurutan:
                      <br />
                      <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px] text-emerald-900">
                        Nama Kapal [Tab] Nomor SIPI [Tab] Gross Tonnage [Tab] Perusahaan [Tab] Pelabuhan Pangkalan
                      </code>
                    </p>
                  </div>

                  {/* Textarea Paste */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                      <span>Tempel Data Excel (Teks Terpisah Tab / Koma):</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {parsedRows.length} baris terdeteksi ({validRows.length} valid, {invalidRows.length} tidak valid)
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      value={bulkExcelText}
                      onChange={(e) => {
                        setBulkExcelText(e.target.value);
                        setBulkImportReport(null);
                      }}
                      placeholder="Contoh:&#10;KM Samudera Mandiri 01	SIPI.501/KKP/2026	45	PT Samudera Bahari	PPS Nizam Zachman Jakarta&#10;KM Bahari Perkasa 08	SIPI.502/KKP/2026	60	PT Mina Jaya Lautan	PPS Cilacap"
                      className="w-full text-xs font-mono rounded-md border-slate-300 border p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Real-time Parsed Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                        <span>Pratinjau Data Kapal yang Akan Diimpor:</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Siap diimpor: {validRows.length} Kapal
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px] sticky top-0 bg-slate-100 z-10">
                            <tr>
                              <th className="p-2 w-8 text-center">#</th>
                              <th className="p-2">Nama Kapal</th>
                              <th className="p-2">No SIPI</th>
                              <th className="p-2 w-12 text-center">GT</th>
                              <th className="p-2">Perusahaan</th>
                              <th className="p-2">Pangkalan</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedRows.map((row, idx) => (
                              <tr
                                key={idx}
                                className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/60 text-rose-900'}
                              >
                                <td className="p-2 text-center font-mono text-[10px] text-slate-500">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900">{row.name || <span className="italic text-rose-500">Kosong</span>}</td>
                                <td className="p-2 font-mono text-slate-600">{row.registration_number}</td>
                                <td className="p-2 text-center font-semibold">{row.gross_tonnage}</td>
                                <td className="p-2 text-slate-700 truncate max-w-[120px]">{row.company_name}</td>
                                <td className="p-2 text-slate-600 truncate max-w-[120px]">{row.home_port}</td>
                                <td className="p-2 text-center">
                                  {row.isValid ? (
                                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Valid
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-rose-700 font-bold text-[9px] bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200"
                                      title={row.validationError}
                                    >
                                      <AlertCircle className="w-3 h-3 text-rose-600" />
                                      {row.validationError}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Report notification */}
                  {bulkImportReport && (
                    <div className={`p-3 rounded-lg border text-xs ${
                      bulkImportReport.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        {bulkImportReport.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{bulkImportReport.success ? `Berhasil mengimpor ${bulkImportReport.count} kapal perikanan!` : 'Gagal mengimpor data kapal.'}</span>
                      </div>
                      {bulkImportReport.errors.length > 0 && (
                        <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-700 mt-1">
                          {bulkImportReport.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Footer Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      Perusahaan pemilik kapal yang belum ada otomatis akan dibuatkan profilnya di database asosiasi.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAddVesselModalOpen(false)}
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                      >
                        Tutup
                      </button>
                      <button
                        type="button"
                        disabled={validRows.length === 0}
                        onClick={handleExecuteBulkImport}
                        className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Impor {validRows.length} Kapal ke Sistem</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Pemeriksaan Clearance Kepulangan ABK (Laut ke Darat) */}
      {clearanceModalWorker && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Proses Clearance Kepulangan ABK</h3>
                  <p className="text-[11px] text-slate-400">
                    Pemeriksaan status tanggungan untuk <strong className="text-white">{clearanceModalWorker.name}</strong> (****{clearanceModalWorker.nik_last4})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClearanceModalWorker(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body & Rules Guidance */}
            <form onSubmit={handleSaveClearanceModal} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 space-y-1">
                <div className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Ketentuan Clearance Asosiasi:</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Saat status pekerja berubah dari <strong>DI LAUT</strong> menjadi <strong>DI DARAT</strong>, pekerja akan menjadi <strong>Bebas Transfer</strong> (bisa berlayar dengan kapal/perusahaan manapun). Pastikan apakah pekerja memiliki kewajiban/tanggungan yang belum diselesaikan sebelum disahkan.
                </p>
              </div>

              {/* Status Radio Choice */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hasil Pemeriksaan Clearance <span className="text-rose-500">*</span>
                </label>

                {/* Option 1: Bebas Tanggungan */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    modalClearanceStatus === 'bebas_tanggungan'
                      ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearance_status"
                    checked={modalClearanceStatus === 'bebas_tanggungan'}
                    onChange={() => setModalClearanceStatus('bebas_tanggungan')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Bebas Tanggungan (Bebas Transfer Penuh)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Pekerja tidak memiliki pinjaman/kasbon, peralatan kapal lengkap, hak bagi hasil telah disepakati, dan bebas dikontrak oleh kapal/perusahaan manapun.
                    </p>
                  </div>
                </label>

                {/* Option 2: Ada Tanggungan */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    modalClearanceStatus === 'ada_tanggungan'
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearance_status"
                    checked={modalClearanceStatus === 'ada_tanggungan'}
                    onChange={() => setModalClearanceStatus('ada_tanggungan')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Ada Tanggungan (Catat Kewajiban / Tanggungan)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Pekerja memiliki tanggungan kasbon, alat kapal yang hilang/rusak, atau sengketa yang perlu diketahui perusahaan baru sebelum menerima penugasan.
                    </p>
                  </div>
                </label>
              </div>

              {/* Extended Details when Ada Tanggungan */}
              {modalClearanceStatus === 'ada_tanggungan' && (
                <div className="p-4 bg-amber-50/60 rounded-lg border border-amber-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kategori Tanggungan *
                      </label>
                      <select
                        value={modalClearanceCategory}
                        onChange={(e: any) => setModalClearanceCategory(e.target.value)}
                        className="w-full text-xs rounded border-slate-300 p-2 bg-white"
                      >
                        <option value="kasbon_pinjaman">Kasbon / Pinjaman Uang Muka</option>
                        <option value="alat_kapal">Inventaris / Alat Tangkap Kapal</option>
                        <option value="sengketa_kontrak">Sengketa Kontrak / PKL</option>
                        <option value="gaji_bagi_hasil">Kompensasi Gaji / Bagi Hasil</option>
                        <option value="dokumen_kapal">Dokumen / Buku Pelaut</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nominal Tanggungan (Rp)
                      </label>
                      <input
                        type="number"
                        placeholder="Contoh: 1500000"
                        value={modalClearanceAmount}
                        onChange={(e) => setModalClearanceAmount(e.target.value)}
                        className="w-full text-xs rounded border-slate-300 p-2 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan &amp; Rincian Tanggungan *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan secara objektif rincian tanggungan (contoh: Kasbon operasional Rp 1.5jt belum dipotong bagi hasil; jaring trawl 1 set hilang)"
                      value={modalClearanceNotes}
                      onChange={(e) => setModalClearanceNotes(e.target.value)}
                      className="w-full text-xs rounded border-slate-300 p-2 bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Optional Notes for Bebas Tanggungan */}
              {modalClearanceStatus === 'bebas_tanggungan' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Clearance (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Semua peralatan lengkap, kasbon telah lunas dipotong bagi hasil."
                    value={modalClearanceNotes}
                    onChange={(e) => setModalClearanceNotes(e.target.value)}
                    className="w-full text-xs rounded border-slate-300 p-2 bg-white text-slate-900"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClearanceModalWorker(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Simpan Status Clearance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penugasan ABK ke Kapal Terpilih */}
      {isAssignModalOpen && (() => {
        // Strict Anti-Duplication Filtering:
        // Workers already on this vessel or assigned to other vessels, or at sea, do not appear in the assignment list!
        const assignableWorkers = allWorkers.filter(w => {
          // 1. Never show workers already assigned to THIS vessel
          if (w.last_vessel_id === selectedVesselId) {
            return false;
          }

          // 2. Strict Filter: If worker is assigned to another vessel or currently at sea,
          // hide them from the default list to prevent duplicate manifest assignments!
          if (!showTransferCandidates) {
            const isAssignedElsewhere = Boolean(w.last_vessel_id && w.last_vessel_id !== selectedVesselId);
            const isAtSea = w.current_status === 'di_laut';
            if (isAssignedElsewhere || isAtSea) {
              return false;
            }
          }

          // 3. Search query filter
          if (assignSearchQuery.trim()) {
            const q = assignSearchQuery.toLowerCase();
            return w.name.toLowerCase().includes(q) || w.nik_last4.includes(q);
          }

          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-600 text-white rounded-md">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Tugaskan ABK ke Kapal</h3>
                    <p className="text-[11px] text-slate-400">
                      Pilih pekerja bebas tugas untuk ditugaskan ke <span className="text-blue-300 font-bold">{selectedVessel?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Anti-Duplication Protection Banner */}
              <div className="p-3 bg-blue-50/90 border-b border-blue-200 flex items-start gap-2.5 text-xs text-blue-900 shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px]">Proteksi Anti-Manifest Ganda &amp; Clearance Lintas Armada</p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Hanya ABK yang berada <strong>di darat</strong> yang dapat ditugaskan. Status clearance dari kepulangan terakhir langsung ditampilkan untuk memastikan transparansi tanggungan kasbon/alat.
                  </p>
                </div>
              </div>

              {/* Modal Search & Toggle Controls */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau 4 digit NIK pekerja..."
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Tersedia <strong className="text-slate-900">{assignableWorkers.length}</strong> ABK siap penugasan
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 hover:text-slate-900 select-none">
                    <input
                      type="checkbox"
                      checked={showTransferCandidates}
                      onChange={(e) => setShowTransferCandidates(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Tampilkan ABK kapal lain (Opsi Mutasi)</span>
                  </label>
                </div>
              </div>

              {/* List of Workers */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {assignableWorkers.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-2">
                    <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400">
                      <Ship className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xs text-slate-700">
                      {assignSearchQuery 
                        ? 'Tidak ada pekerja yang cocok dengan pencarian.'
                        : 'Tidak ada ABK bebas tugas yang siap ditugaskan saat ini.'}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      {assignSearchQuery
                        ? 'Gunakan kata kunci pencarian nama atau 4 digit NIK lain.'
                        : 'Semua ABK lainnya saat ini telah bertugas di kapal masing-masing atau sedang berlayar di laut.'}
                    </p>
                    {!showTransferCandidates && !assignSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setShowTransferCandidates(true)}
                        className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded border border-slate-300 transition"
                      >
                        Lihat ABK Kapal Lain untuk Mutasi Resmi
                      </button>
                    )}
                  </div>
                ) : (
                  assignableWorkers.map(worker => {
                    const isAssignedToOther = Boolean(worker.last_vessel_id && worker.last_vessel_id !== selectedVesselId);
                    const isAtSea = worker.current_status === 'di_laut';

                    return (
                      <div
                        key={worker.id}
                        className={`p-3 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                          isAtSea
                            ? 'bg-rose-50/40 border-rose-200 opacity-80'
                            : isAssignedToOther
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {worker.name}
                            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              ****{worker.nik_last4}
                            </span>
                            {worker.position && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                • {worker.position}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {isAtSea ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                <Lock className="w-3 h-3" />
                                Sedang Berlayar di Laut: {worker.last_vessel_name}
                              </span>
                            ) : isAssignedToOther ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                <Anchor className="w-3 h-3" />
                                Terdaftar di: {worker.last_vessel_name} ({worker.company_name || 'Armada Lain'})
                              </span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {worker.clearance_status === 'ada_tanggungan' ? (
                                  <span
                                    className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[10px]"
                                    title={worker.tanggungan_notes || 'Ada catatan tanggungan dari kepulangan terakhir'}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                                    Ada Tanggungan {worker.tanggungan_category ? `(${worker.tanggungan_category.replace('_', ' ')})` : ''} {worker.tanggungan_amount ? `• Rp ${worker.tanggungan_amount.toLocaleString('id-ID')}` : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Bebas Transfer (Bebas Tanggungan)
                                  </span>
                                )}
                                <span className="text-slate-400 text-[10px]">({worker.home_port || 'Pangkalan'})</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isAtSea ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled
                                className="bg-slate-200 text-slate-400 font-bold px-2.5 py-1.5 rounded text-[11px] cursor-not-allowed border border-slate-300"
                                title="Pekerja sedang aktif di laut pada kapal lain. Harus tiba di manifest kedatangan terlebih dahulu."
                              >
                                Terkunci (Di Laut)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const sourceVessel = vessels.find(v => v.id === worker.last_vessel_id);
                                  store.createDuplicateAlert({
                                    worker_id: worker.id,
                                    worker_name: worker.name,
                                    worker_nik_last4: worker.nik_last4,
                                    worker_phone: worker.phone,
                                    primary_vessel_id: worker.last_vessel_id || 'v-unknown',
                                    primary_vessel_name: worker.last_vessel_name || 'Kapal Asal',
                                    primary_company_name: sourceVessel?.company_name || worker.company_name || 'Perusahaan Asal',
                                    conflicting_vessel_id: selectedVesselId,
                                    conflicting_vessel_name: selectedVessel?.name || 'Kapal Tujuan',
                                    conflicting_company_name: selectedVessel?.company_name || 'Perusahaan Pemohon',
                                    conflict_type: 'at_sea_conflict',
                                    resolution_notes: `Klaim pendaftaran diajukan oleh ${selectedVessel?.name} (${selectedVessel?.company_name}) saat pekerja masih terdata aktif berlayar di ${worker.last_vessel_name}.`
                                  });
                                  setIsAssignModalOpen(false);
                                  setNotification({
                                    type: 'info',
                                    message: `⚠️ Benturan manifest dilaporkan! Peringatan duplikasi untuk ${worker.name} telah diterbitkan ke Halaman Anti-Duplikasi untuk dikoordinasikan bersama PIC ${worker.last_vessel_name}.`
                                  });
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold px-2 py-1.5 rounded text-[10px] shadow-xs transition cursor-pointer"
                                title="Laporkan klaim benturan manifest ke Halaman Anti-Duplikasi untuk koordinasi PIC"
                              >
                                Laporkan Benturan PIC
                              </button>
                            </div>
                          ) : isAssignedToOther ? (
                            <button
                              type="button"
                              onClick={() => {
                                setMutationConfirmData({
                                  workerId: worker.id,
                                  workerName: worker.name,
                                  currentVesselName: worker.last_vessel_name || 'Kapal Lain',
                                  targetVesselName: selectedVessel?.name || 'Kapal Ini'
                                });
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow-sm transition"
                            >
                              Mutasi ke Kapal Ini
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (worker.clearance_status === 'ada_tanggungan') {
                                  setClearanceWarningAssignData({
                                    workerId: worker.id,
                                    workerName: worker.name,
                                    category: worker.tanggungan_category,
                                    amount: worker.tanggungan_amount,
                                    notes: worker.tanggungan_notes,
                                    vesselName: selectedVessel?.name || 'Kapal Ini'
                                  });
                                } else {
                                  handleAssignWorker(worker.id);
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-[11px] shadow-sm transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tugaskan ke Kapal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 text-right shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
                >
                  Selesai / Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL KONFIRMASI PELEPASAN HUBUNGAN KERJA & KAPAL (LEPAS TUGAS) */}
      {unassignModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-rose-50/90 px-5 py-4 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">
                    Konfirmasi Pelepasan Hubungan Kerja &amp; Kapal
                  </h3>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Mencabut penugasan kru dari kapal dan perusahaan asosiasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnassignModalData(null)}
                className="text-rose-400 hover:text-rose-700 p-1 rounded-md transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Target Worker Info Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-[11px]">Nama ABK:</span>
                  <span className="font-bold text-slate-900 text-xs">{unassignModalData.workerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-[11px]">NIK (Tersamar UU PDP):</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold text-[11px]">
                    ****{unassignModalData.nikLast4}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-[11px]">Kapal Saat Ini:</span>
                  <span className="font-bold text-blue-700">{unassignModalData.vesselName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-[11px]">Perusahaan Pemilik:</span>
                  <span className="font-semibold text-slate-800">{unassignModalData.companyName}</span>
                </div>
              </div>

              {/* Consequence Alert */}
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Dampak Pelepasan Hubungan Kerja:</span>
                </div>
                <p className="text-amber-800 leading-relaxed pl-5">
                  Pekerja ini <strong>tidak lagi bekerja</strong> di kapal <strong>{unassignModalData.vesselName}</strong> dan perusahaan <strong>{unassignModalData.companyName}</strong>. Status pekerja akan kembali menjadi <strong>Bebas Tugas di Darat</strong> (Bebas Transfer Lintas Armada) dan dapat ditugaskan atau direkrut oleh armada kapal lain dalam asosiasi.
                </p>
              </div>

              {/* Form Input: Alasan & Catatan */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Alasan Pelepasan Hubungan Kerja / Status Akhir PKL:
                  </label>
                  <select
                    value={unassignModalData.reason}
                    onChange={(e) => setUnassignModalData({
                      ...unassignModalData,
                      reason: e.target.value as any
                    })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
                  >
                    <option value="selesai_kontrak">Selesai Kontrak Kerja Laut (PKL Berakhir Resmi)</option>
                    <option value="rotasi_kru">Rotasi Awak Kapal / Istirahat Pangkalan</option>
                    <option value="permintaan_pribadi">Pengunduran Diri / Permintaan Pribadi ABK</option>
                    <option value="mutasi_armada">Pemindahan / Pelepasan untuk Armada Lain</option>
                    <option value="lainnya">Alasan Operasional / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catatan / Berita Acara Pelepasan (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={unassignModalData.notes}
                    onChange={(e) => setUnassignModalData({
                      ...unassignModalData,
                      notes: e.target.value
                    })}
                    placeholder="Contoh: Sisa hak bagi hasil telah diselesaikan, surat pelepasan kapal telah diserahkan..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUnassignModalData(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnassign}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>Ya, Lepas dari Kapal &amp; Perusahaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI MUTASI KE KAPAL INI */}
      {mutationConfirmData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Konfirmasi Mutasi Awak Kapal</h3>
                  <p className="text-[11px] text-amber-800">Perpindahan penugasan antar kapal asosiasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMutationConfirmData(null)}
                className="text-amber-400 hover:text-amber-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Pekerja <strong className="text-slate-900">{mutationConfirmData.workerName}</strong> saat ini tercatat di kapal <strong className="text-amber-800">{mutationConfirmData.currentVesselName}</strong>.
              </p>
              <p className="text-slate-600 text-[11px]">
                Apakah Anda ingin memutasi pekerja ini ke kapal <strong className="text-blue-700">{mutationConfirmData.targetVesselName}</strong>? Histori mutasi kru akan dicatat secara otomatis pada log asosiasi.
              </p>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setMutationConfirmData(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAssignWorker(mutationConfirmData.workerId);
                  setMutationConfirmData(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
              >
                Konfirmasi Mutasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERINGATAN CATATAN TANGGUNGAN SEBELUM PENUGASAN */}
      {clearanceWarningAssignData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Pemberitahuan Catatan Tanggungan</h3>
                  <p className="text-[11px] text-amber-800">Transparansi kewajiban kepulangan sebelumnya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClearanceWarningAssignData(null)}
                className="text-amber-400 hover:text-amber-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-[11px] text-amber-950">
                <div className="font-bold text-slate-800 text-xs">
                  {clearanceWarningAssignData.workerName}
                </div>
                <div>
                  <strong>Kategori:</strong> {clearanceWarningAssignData.category ? clearanceWarningAssignData.category.replace(/_/g, ' ') : 'Kewajiban Tanggungan'}
                </div>
                {clearanceWarningAssignData.amount && clearanceWarningAssignData.amount > 0 ? (
                  <div>
                    <strong>Nominal:</strong> Rp {clearanceWarningAssignData.amount.toLocaleString('id-ID')}
                  </div>
                ) : null}
                {clearanceWarningAssignData.notes && (
                  <div className="italic bg-white p-2 rounded border border-amber-200">
                    &ldquo;{clearanceWarningAssignData.notes}&rdquo;
                  </div>
                )}
              </div>

              <p className="text-slate-600 text-[11px]">
                Apakah pihak kapal <strong className="text-blue-700">{clearanceWarningAssignData.vesselName}</strong> telah mengetahui catatan ini dan tetap menyetujui penugasan pekerja?
              </p>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setClearanceWarningAssignData(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAssignWorker(clearanceWarningAssignData.workerId);
                  setClearanceWarningAssignData(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
              >
                Tetap Tugaskan ke Kapal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

