import React, { useState } from 'react';
import { store } from '../lib/supabaseStore';
import { Company, Vessel, UserProfile } from '../types';
import { 
  Building2, 
  Ship, 
  Phone, 
  Mail, 
  MessageSquare, 
  Anchor, 
  MapPin, 
  Users, 
  ExternalLink,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { AddCompanyModal } from './AddCompanyModal';
import { AddVesselModal } from './AddVesselModal';

interface AssociationDirectoryProps {
  currentUser: UserProfile;
  onNavigateToManifest?: (vesselId: string) => void;
}

export const AssociationDirectory: React.FC<AssociationDirectoryProps> = ({
  currentUser,
  onNavigateToManifest
}) => {
  const [companies, setCompanies] = useState<Company[]>(() => store.getCompanies());
  const [vessels, setVessels] = useState<Vessel[]>(() => store.getVessels());
  const workers = store.getWorkers();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddVesselModalOpen, setIsAddVesselModalOpen] = useState<boolean>(false);
  const [vesselModalMode, setVesselModalMode] = useState<'single' | 'bulk'>('single');
  const [toastMessage, setToastMessage] = useState<string>('');

  const activeCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const companyVessels = vessels.filter(v => v.company_id === activeCompany?.id);

  const filteredCompanies = companies.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.pic_name.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term)
    );
  });

  const handleCompanyAdded = (newCompany: Company, newVessel?: Vessel, bulkCount?: number) => {
    const updatedCompanies = store.getCompanies();
    const updatedVessels = store.getVessels();
    setCompanies(updatedCompanies);
    setVessels(updatedVessels);
    setSelectedCompanyId(newCompany.id);

    let msg = `Perusahaan "${newCompany.name}" (${newCompany.code}) berhasil ditambahkan ke direktori asosiasi.`;
    if (bulkCount && bulkCount > 0) {
      msg += ` Bersama ${bulkCount} armada kapal terdaftar via Excel.`;
    } else if (newVessel) {
      msg += ` Kapal perdana "${newVessel.name}" juga berhasil didaftarkan.`;
    }
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 6000);
  };

  const handleVesselAdded = (addedCount: number, message: string) => {
    const updatedVessels = store.getVessels();
    setVessels(updatedVessels);
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-300">
                Grup Asosiasi Perusahaan
              </span>
              <span className="text-[11px] text-slate-400">
                {companies.length} Badan Usaha Terdaftar
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Direktori Perusahaan Anggota Asosiasi &amp; Armada Kapal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Daftar resmi perusahaan pemilik kapal perikanan dalam grup asosiasi, kontak person penanggung jawab (PIC) personil, dan data armada aktif.
            </p>
          </div>
        </div>

        {/* Primary Action: Tambah Perusahaan */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-sm shrink-0 self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Perusahaan</span>
        </button>
      </div>

      {/* Main Grid: Companies list + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Perusahaan Anggota ({filteredCompanies.length})
            </h2>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1 border border-blue-200"
              title="Tambah Perusahaan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>

          {/* Quick Search in Company List */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama perusahaan, kode, atau PIC..."
              className="w-full pl-8 pr-7 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filteredCompanies.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                <Building2 className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Tidak ada perusahaan ditemukan.</p>
                <p className="text-slate-400 text-[11px]">Silakan ubah kata kunci pencarian atau tambah perusahaan baru.</p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Perusahaan Baru</span>
                </button>
              </div>
            ) : (
              filteredCompanies.map(company => {
                const isSelected = company.id === activeCompany?.id;
                const vCount = vessels.filter(v => v.company_id === company.id).length;
                return (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {company.code}
                        </span>
                        <div className="font-bold text-slate-900 text-sm mt-1">{company.name}</div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                          DIPILIH
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Armada: <strong>{vCount} Kapal</strong></span>
                      <span className="truncate max-w-[140px]">PIC: {company.pic_name}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Company Details & Vessels */}
        <div className="lg:col-span-2 space-y-5">
          {activeCompany ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
              {/* Company Info */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Kode Anggota: {activeCompany.code}
                  </span>
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Izin Usaha: {activeCompany.license_number}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mt-2.5">{activeCompany.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{activeCompany.address}</span>
                </p>
              </div>

              {/* PIC Contact Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Penanggung Jawab Kru &amp; Operasional (PIC)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">Siap Dihubungi Antar-Anggota</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{activeCompany.pic_name}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{activeCompany.pic_role}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://wa.me/62${activeCompany.pic_phone.replace(/\D/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat WhatsApp ({activeCompany.pic_phone})
                    </a>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${activeCompany.pic_phone}`}
                        className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Telepon
                      </a>
                      <a
                        href={`mailto:${activeCompany.pic_email}?subject=Koordinasi Kru Kapal - Asosiasi Perusahaan`}
                        className="flex-1 py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        Email
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vessels List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <span>Armada Kapal Terdaftar ({companyVessels.length})</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVesselModalMode('single');
                        setIsAddVesselModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kapal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVesselModalMode('bulk');
                        setIsAddVesselModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Import Excel (Bulk)</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {companyVessels.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                      <Ship className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="font-semibold text-slate-700">Belum ada armada kapal yang terdaftar untuk perusahaan ini.</div>
                      <p className="text-slate-400 max-w-sm mx-auto">
                        Tambahkan kapal perikanan satu persatu atau unggah daftar armada kapal sekaligus melalui berkas data Excel (.xlsx / .csv).
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVesselModalMode('single');
                            setIsAddVesselModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Kapal Satu Persatu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVesselModalMode('bulk');
                            setIsAddVesselModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Bulk via Excel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    companyVessels.map(v => {
                      const vWorkers = workers.filter(w => w.last_vessel_id === v.id);
                      return (
                        <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{v.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                v.status === 'di_laut'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {v.status === 'di_laut' ? 'Sedang Di Laut' : 'Sandar di Pelabuhan'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                              <span>Reg: <strong>{v.registration_number}</strong></span>
                              <span>Tonase: <strong>{v.gross_tonnage} GT</strong></span>
                              <span>Pangkalan: {v.home_port}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded font-medium">
                              {vWorkers.length} ABK Terdaftar
                            </span>
                            {onNavigateToManifest && (
                              <button
                                onClick={() => onNavigateToManifest(v.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              >
                                <span>Manifest</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-base">Belum Ada Perusahaan Dipilih</div>
              <p className="text-xs text-slate-500 mt-1">Pilih salah satu perusahaan di sebelah kiri atau tambah perusahaan baru.</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Perusahaan Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah Perusahaan */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCompanyAdded}
      />

      {/* Modal Tambah Kapal (Satu Persatu atau Bulk Excel) */}
      {activeCompany && (
        <AddVesselModal
          isOpen={isAddVesselModalOpen}
          company={activeCompany}
          initialMode={vesselModalMode}
          onClose={() => setIsAddVesselModalOpen(false)}
          onSuccess={handleVesselAdded}
        />
      )}
    </div>
  );
};

