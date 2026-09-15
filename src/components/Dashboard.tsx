import React, { useState } from 'react';
import { UserProfile, NavTab, Worker, Company } from '../types';
import { store } from '../lib/supabaseStore';
import { 
  Ship, 
  Anchor, 
  Users, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  Lock, 
  Clock, 
  PlusCircle, 
  AlertOctagon, 
  ArrowRightLeft, 
  Building2, 
  Search, 
  Phone, 
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Filter,
  RotateCcw,
  FileText,
  Info,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  setActiveTab: (tab: NavTab) => void;
  onOpenSqlModal: () => void;
  onOpenWorkerDetail?: (workerId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  setActiveTab,
  onOpenSqlModal,
  onOpenWorkerDetail
}) => {
  const metrics = store.getMetrics();
  const workers = store.getWorkers();
  const vessels = store.getVessels();
  const companies = store.getCompanies();
  const duplicateAlerts = store.getDuplicateAlerts().filter(a => a.status === 'aktif');
  const mobilityRecords = store.getMobilityRecords().slice(0, 4);

  // Quick NIK Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Worker[] | null>(null);

  // Quick Contact state
  const [selectedContactCompany, setSelectedContactCompany] = useState<Company | null>(null);

  // Worker Rating & Status Section state
  const [ratingFilter, setRatingFilter] = useState<'all' | 'attention' | 'merah' | 'kuning' | 'hijau'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'di_laut' | 'di_darat'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [ratingSearchTerm, setRatingSearchTerm] = useState<string>('');

  const redWorkers = workers.filter(w => w.performance_rating === 'merah');
  const yellowWorkers = workers.filter(w => w.performance_rating === 'kuning');
  const greenWorkers = workers.filter(w => (w.performance_rating || 'hijau') === 'hijau');
  const attentionWorkers = workers.filter(w => w.performance_rating === 'merah' || w.performance_rating === 'kuning');

  const filteredRatingWorkers = workers.filter(w => {
    const effectiveRating = w.performance_rating || 'hijau';
    if (ratingFilter === 'attention') {
      if (effectiveRating !== 'merah' && effectiveRating !== 'kuning') return false;
    } else if (ratingFilter !== 'all') {
      if (effectiveRating !== ratingFilter) return false;
    }

    if (statusFilter !== 'all' && w.current_status !== statusFilter) return false;

    if (companyFilter !== 'all') {
      const wComp = w.pkl_company_name || w.company_name || '';
      if (!wComp.toLowerCase().includes(companyFilter.toLowerCase())) return false;
    }

    if (ratingSearchTerm.trim()) {
      const q = ratingSearchTerm.trim().toLowerCase();
      const matchName = w.name.toLowerCase().includes(q);
      const matchNik = w.nik_last4.includes(q);
      const matchVessel = w.last_vessel_name?.toLowerCase().includes(q);
      const matchNotes = w.performance_notes?.toLowerCase().includes(q);
      const matchPos = w.position?.toLowerCase().includes(q);
      if (!matchName && !matchNik && !matchVessel && !matchNotes && !matchPos) return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort priority: Merah first, then Kuning, then Hijau
    const weight: Record<string, number> = { merah: 1, kuning: 2, hijau: 3 };
    const weightA = weight[a.performance_rating || 'hijau'] || 3;
    const weightB = weight[b.performance_rating || 'hijau'] || 3;
    if (weightA !== weightB) return weightA - weightB;
    return a.name.localeCompare(b.name);
  });

  const isFilterActive = ratingFilter !== 'all' || statusFilter !== 'all' || companyFilter !== 'all' || ratingSearchTerm.trim() !== '';

  const handleResetRatingFilters = () => {
    setRatingFilter('all');
    setStatusFilter('all');
    setCompanyFilter('all');
    setRatingSearchTerm('');
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResult(null);
      return;
    }

    const matched = workers.filter(w => 
      w.name.toLowerCase().includes(query) ||
      w.nik_last4.includes(query) ||
      (w.last_vessel_name && w.last_vessel_name.toLowerCase().includes(query))
    );
    setSearchResult(matched);
  };

  const handleOpenContact = (companyName: string) => {
    const comp = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
    if (comp) {
      setSelectedContactCompany(comp);
    }
  };

  return (
    <div className="space-y-6">
      {/* Association Header Notice Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CREW SISTEM - ATLI &bull; Asosiasi Tuna Longline Indonesia</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Dashboard Operasional Armada &amp; Kru Terpadu
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Pengguna Aktif: <strong className="text-slate-200">{currentUser.name}</strong> &bull; {currentUser.company_name || 'Sekretariat Asosiasi'} ({currentUser.port})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('manifest-log')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Manifest Kapal</span>
            </button>

            <button
              onClick={() => setActiveTab('anti-duplication')}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm ${
                duplicateAlerts.length > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Pencegahan Duplikasi ({duplicateAlerts.length})</span>
            </button>

            <button
              onClick={onOpenSqlModal}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Supabase Schema & Security Rules"
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Skema DB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner if Duplications Exist */}
      {duplicateAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Perhatian: Terdeteksi {duplicateAlerts.length} Konflik Duplikasi Manifest Kru Antar-Kapal!
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Terdapat awak kapal yang tercatat aktif di laut pada kapal anggota lain namun diajukan pada manifest baru.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('anti-duplication')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition self-start sm:self-center flex items-center gap-1"
            >
              <span>Periksa &amp; Selesaikan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Armada Kapal */}
        <div 
          onClick={() => setActiveTab('directory')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Armada Kapal Grup
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
              <Ship className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.totalVessels} Kapal</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-blue-600 font-semibold">{vessels.filter(v => v.status === 'di_laut').length} Di Laut</span>
            <span>&bull;</span>
            <span className="text-emerald-600 font-semibold">{vessels.filter(v => v.status === 'sandar').length} Sandar</span>
          </div>
        </div>

        {/* Card 2: Total ABK Terdaftar */}
        <div 
          onClick={() => setActiveTab('workers')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Awak Kapal (NIK 4 Digit)
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.totalWorkers} ABK</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-blue-600 font-semibold">{metrics.workersAtSea} Di Laut</span>
            <span>&bull;</span>
            <span className="text-emerald-600 font-semibold">{metrics.workersAshore} Siap Di Darat</span>
          </div>
        </div>

        {/* Card 3: Peringatan Duplikasi */}
        <div 
          onClick={() => setActiveTab('anti-duplication')}
          className={`rounded-xl border p-5 shadow-sm transition cursor-pointer group ${
            metrics.duplicateAlertsCount > 0
              ? 'bg-rose-50/50 border-rose-300 hover:border-rose-500'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Konflik Manifest Duplikasi
            </span>
            <div className={`p-2 rounded-lg transition ${
              metrics.duplicateAlertsCount > 0
                ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {metrics.duplicateAlertsCount} Kasus
          </div>
          <p className="text-xs mt-1 font-medium text-rose-600">
            {metrics.duplicateAlertsCount > 0 ? '⚠️ Butuh pelepasan resmi' : '✓ Tidak ada duplikasi kru'}
          </p>
        </div>

        {/* Card 4: Mobilitas Tinggi */}
        <div 
          onClick={() => setActiveTab('mobility')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sering Berpindah Kapal
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {metrics.highMobilityCount} ABK
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            Pindah kapal &ge; 2 kali (Cek histori)
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEKSI UTAMA: DAFTAR STATUS & RATING KINERJA AWAK KAPAL (ABK) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        {/* Header Seksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                Monitoring Asosiasi
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                UU PDP No. 27/2022 (NIK 4 Digit)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Daftar Status &amp; Rating Kinerja Awak Kapal (ABK)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Memudahkan seluruh perusahaan anggota memantau kelaikan, rekam jejak, dan status keberadaan pekerja.
              Prioritaskan peninjauan terhadap kru dengan <strong className="text-rose-700">Rating Merah</strong> (pelanggaran/indisipliner) dan <strong className="text-amber-700">Rating Kuning</strong> (evaluasi dokumen/kesehatan) sebelum penerbitan izin berlayar.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('workers')}
            className="self-start md:self-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Users className="w-4 h-4 text-slate-300" />
            <span>Buka Manajemen Master ABK</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Kartu KPI Rating Cepat (Interaktif: Klik untuk memfilter) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card: Rating Merah */}
          <button
            type="button"
            onClick={() => setRatingFilter(ratingFilter === 'merah' ? 'all' : 'merah')}
            className={`p-4 rounded-xl border text-left transition relative group cursor-pointer ${
              ratingFilter === 'merah'
                ? 'bg-rose-100/70 border-rose-500 shadow-sm ring-2 ring-rose-400'
                : 'bg-rose-50/50 border-rose-200 hover:border-rose-400 hover:bg-rose-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Rating Merah
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900">
                Peringatan
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-900">
              {redWorkers.length} <span className="text-sm font-semibold text-rose-700">ABK</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1 font-medium line-clamp-2">
              Pelanggaran indisipliner / mangkir / riwayat berisiko
            </p>
            {ratingFilter === 'merah' && (
              <div className="mt-2 text-[10px] font-bold text-rose-800 flex items-center gap-1">
                <span>&bull; Filter Aktif (Klik untuk lepas)</span>
              </div>
            )}
          </button>

          {/* Card: Rating Kuning */}
          <button
            type="button"
            onClick={() => setRatingFilter(ratingFilter === 'kuning' ? 'all' : 'kuning')}
            className={`p-4 rounded-xl border text-left transition relative group cursor-pointer ${
              ratingFilter === 'kuning'
                ? 'bg-amber-100/70 border-amber-500 shadow-sm ring-2 ring-amber-400'
                : 'bg-amber-50/50 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Rating Kuning
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                Tinjauan
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-900">
              {yellowWorkers.length} <span className="text-sm font-semibold text-amber-700">ABK</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-medium line-clamp-2">
              Masa PKL/MCU hampir habis atau evaluasi ringan
            </p>
            {ratingFilter === 'kuning' && (
              <div className="mt-2 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                <span>&bull; Filter Aktif (Klik untuk lepas)</span>
              </div>
            )}
          </button>

          {/* Card: Rating Hijau */}
          <button
            type="button"
            onClick={() => setRatingFilter(ratingFilter === 'hijau' ? 'all' : 'hijau')}
            className={`p-4 rounded-xl border text-left transition relative group cursor-pointer ${
              ratingFilter === 'hijau'
                ? 'bg-emerald-100/70 border-emerald-500 shadow-sm ring-2 ring-emerald-400'
                : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Rating Hijau
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                Baik
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-900">
              {greenWorkers.length} <span className="text-sm font-semibold text-emerald-700">ABK</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium line-clamp-2">
              Kelaikan laut terpenuhi &amp; dokumen lengkap
            </p>
            {ratingFilter === 'hijau' && (
              <div className="mt-2 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                <span>&bull; Filter Aktif (Klik untuk lepas)</span>
              </div>
            )}
          </button>

          {/* Card: Perhatian Khusus (Merah + Kuning) */}
          <button
            type="button"
            onClick={() => setRatingFilter(ratingFilter === 'attention' ? 'all' : 'attention')}
            className={`p-4 rounded-xl border text-left transition relative group cursor-pointer ${
              ratingFilter === 'attention'
                ? 'bg-slate-800 text-white border-slate-900 shadow-sm ring-2 ring-slate-700'
                : 'bg-slate-50 border-slate-300 hover:border-slate-500 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${ratingFilter === 'attention' ? 'text-amber-300' : 'text-slate-800'}`}>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Perhatian Khusus
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${ratingFilter === 'attention' ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-800'}`}>
                Merah + Kuning
              </span>
            </div>
            <div className={`mt-2 text-2xl font-black ${ratingFilter === 'attention' ? 'text-white' : 'text-slate-900'}`}>
              {attentionWorkers.length} <span className={`text-sm font-semibold ${ratingFilter === 'attention' ? 'text-slate-300' : 'text-slate-600'}`}>ABK</span>
            </div>
            <p className={`text-[11px] mt-1 font-medium line-clamp-2 ${ratingFilter === 'attention' ? 'text-slate-300' : 'text-slate-600'}`}>
              Fokus pengawasan pra-keberangkatan kapal
            </p>
            {ratingFilter === 'attention' && (
              <div className="mt-2 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                <span>&bull; Filter Aktif (Klik untuk lepas)</span>
              </div>
            )}
          </button>
        </div>

        {/* Toolbar Filter & Pencarian */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          {/* Quick Rating Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-bold px-2 whitespace-nowrap flex items-center gap-1 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Filter Rating:
            </span>

            <button
              onClick={() => setRatingFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition ${
                ratingFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Semua ABK ({workers.length})
            </button>

            <button
              onClick={() => setRatingFilter('attention')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                ratingFilter === 'attention'
                  ? 'bg-rose-700 text-white shadow-xs ring-1 ring-rose-800'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Perhatian: Merah &amp; Kuning ({attentionWorkers.length})
            </button>

            <button
              onClick={() => setRatingFilter('merah')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                ratingFilter === 'merah'
                  ? 'bg-rose-700 text-white shadow-xs ring-1 ring-rose-800'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Rating Merah ({redWorkers.length})
            </button>

            <button
              onClick={() => setRatingFilter('kuning')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                ratingFilter === 'kuning'
                  ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-700'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Rating Kuning ({yellowWorkers.length})
            </button>

            <button
              onClick={() => setRatingFilter('hijau')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                ratingFilter === 'hijau'
                  ? 'bg-emerald-700 text-white shadow-xs ring-1 ring-emerald-800'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Rating Hijau ({greenWorkers.length})
            </button>
          </div>

          {/* Secondary Controls: Search, Status, Company, Reset */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ratingSearchTerm}
                onChange={(e) => setRatingSearchTerm(e.target.value)}
                placeholder="Cari nama ABK, NIK 4 digit, kapal, atau catatan..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {ratingSearchTerm && (
                <button
                  type="button"
                  onClick={() => setRatingSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Status Keberadaan */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Semua Status Lokasi</option>
                <option value="di_laut">🚢 Sedang Di Laut ({workers.filter(w => w.current_status === 'di_laut').length})</option>
                <option value="di_darat">⚓ Di Darat / Siap Layar ({workers.filter(w => w.current_status === 'di_darat').length})</option>
              </select>
            </div>

            {/* Filter Perusahaan */}
            <div className="sm:col-span-3">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Semua Perusahaan Anggota</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div className="sm:col-span-1 flex items-center justify-end">
              {isFilterActive ? (
                <button
                  type="button"
                  onClick={handleResetRatingFilters}
                  title="Reset Semua Filter"
                  className="w-full py-2 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Reset</span>
                </button>
              ) : (
                <div className="text-center text-[11px] text-slate-400 font-medium py-2">
                  {filteredRatingWorkers.length} ABK
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Data Pekerja (Desktop) & Kartu Responsif (Mobile) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold">
              Menampilkan {filteredRatingWorkers.length} dari {workers.length} pekerja awak kapal
              {ratingFilter === 'merah' && ' (Khusus Rating Merah)'}
              {ratingFilter === 'kuning' && ' (Khusus Rating Kuning)'}
              {ratingFilter === 'attention' && ' (Perhatian Khusus: Merah & Kuning)'}
              {ratingFilter === 'hijau' && ' (Khusus Rating Hijau)'}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
              <span>Urutan prioritas:</span>
              <span className="text-rose-600 font-bold">Merah</span> &rarr; <span className="text-amber-600 font-bold">Kuning</span> &rarr; <span className="text-emerald-600 font-bold">Hijau</span>
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-4">Awak Kapal (UU PDP)</th>
                  <th className="py-3 px-4">Rating Kinerja &amp; Catatan</th>
                  <th className="py-3 px-4">Status Keberadaan</th>
                  <th className="py-3 px-4">Kapal &amp; Perusahaan</th>
                  <th className="py-3 px-4">Dokumen PKL</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredRatingWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700">Tidak ada pekerja yang sesuai kriteria filter.</span>
                        <p className="text-xs text-slate-400">Silakan ubah filter rating, lokasi keberadaan, atau kata kunci pencarian.</p>
                        <button
                          type="button"
                          onClick={handleResetRatingFilters}
                          className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRatingWorkers.map((w) => {
                    const rating = w.performance_rating || 'hijau';
                    return (
                      <tr
                        key={w.id}
                        className={`transition ${
                          rating === 'merah'
                            ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                            : rating === 'kuning'
                            ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500'
                            : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Col 1: Nama, Posisi & Masked NIK */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{w.name}</span>
                            {rating === 'merah' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                                Evaluasi
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                            {w.position || 'Kelasi / ABK'}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px]">
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              •••• •••• •••• {w.nik_last4}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {w.home_port}
                            </span>
                          </div>
                        </td>

                        {/* Col 2: Rating Kinerja & Catatan Pelanggaran */}
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          {rating === 'merah' ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                RATING MERAH
                              </span>
                              <div className="mt-1.5 p-2 bg-rose-100/60 border border-rose-200 rounded text-[11px] text-rose-900 font-medium leading-relaxed">
                                {w.performance_notes || 'Terdapat catatan pelanggaran disiplin kerja / mangkir yang memerlukan klarifikasi resmi.'}
                              </div>
                            </div>
                          ) : rating === 'kuning' ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                RATING KUNING
                              </span>
                              <div className="mt-1.5 p-2 bg-amber-100/60 border border-amber-200 rounded text-[11px] text-amber-900 font-medium leading-relaxed">
                                {w.performance_notes || 'Dokumen PKL/MCU mendekati masa kedaluwarsa atau membutuhkan penyesuaian administratif.'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                RATING HIJAU
                              </span>
                              <div className="mt-1 text-[11px] text-slate-600 leading-normal line-clamp-2">
                                {w.performance_notes || 'Kelaikan kerja terpenuhi, dokumen lengkap & rekam jejak bersih.'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Col 3: Status Keberadaan */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          {w.current_status === 'di_laut' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Ship className="w-3.5 h-3.5 text-blue-600" />
                                Sedang Di Laut
                              </span>
                              <div className="text-[11px] font-semibold text-slate-700 mt-1">
                                {w.last_vessel_name || 'Kapal Terdaftar'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Anchor className="w-3.5 h-3.5 text-emerald-600" />
                                Di Darat (Siap Layar)
                              </span>
                              <div className="text-[11px] text-slate-500 mt-1">
                                Pangkalan / Stand by
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Col 4: Kapal & Perusahaan */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <Ship className="w-3 h-3 text-slate-400" />
                            <span>{w.last_vessel_name || 'Belum Terdaftar Kapal'}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{w.pkl_company_name || w.company_name || 'Perusahaan Anggota'}</span>
                          </div>
                        </td>

                        {/* Col 5: Dokumen PKL */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-mono text-[11px] text-slate-800">
                            {w.pkl_number || 'Belum Ada PKL'}
                          </div>
                          <div className="mt-1">
                            {w.pkl_status === 'aktif' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                PKL Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                Kadaluarsa
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Col 6: Aksi */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenWorkerDetail && (
                              <button
                                type="button"
                                onClick={() => onOpenWorkerDetail(w.id)}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 transition shadow-xs"
                                title="Buka Detail &amp; Verifikasi Dokumen"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>
                            )}

                            {(w.pkl_company_name || w.company_name) && (
                              <button
                                type="button"
                                onClick={() => handleOpenContact(w.pkl_company_name || w.company_name || '')}
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-slate-200"
                                title="Hubungi PIC Perusahaan Penjamin"
                              >
                                <Phone className="w-3 h-3" />
                                <span className="hidden lg:inline">Kontak PIC</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (for screens smaller than md) */}
          <div className="md:hidden space-y-3">
            {filteredRatingWorkers.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="font-semibold text-slate-700">Tidak ada pekerja yang sesuai filter.</div>
                <button
                  type="button"
                  onClick={handleResetRatingFilters}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredRatingWorkers.map((w) => {
                const rating = w.performance_rating || 'hijau';
                return (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl border space-y-3 bg-white shadow-xs ${
                      rating === 'merah'
                        ? 'border-l-4 border-l-rose-500 border-rose-200'
                        : rating === 'kuning'
                        ? 'border-l-4 border-l-amber-500 border-amber-200'
                        : 'border-l-4 border-l-emerald-500 border-slate-200'
                    }`}
                  >
                    {/* Baris 1: Nama & Rating Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {w.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {w.position || 'Kelasi / ABK'} &bull; <span className="text-slate-500">{w.home_port}</span>
                        </div>
                      </div>

                      {rating === 'merah' ? (
                        <span className="px-2 py-1 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          MERAH
                        </span>
                      ) : rating === 'kuning' ? (
                        <span className="px-2 py-1 rounded text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          KUNING
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          HIJAU
                        </span>
                      )}
                    </div>

                    {/* Baris 2: Catatan Rating jika Merah atau Kuning */}
                    {(rating === 'merah' || rating === 'kuning' || w.performance_notes) && (
                      <div className={`p-2.5 rounded-lg text-xs font-medium leading-relaxed ${
                        rating === 'merah'
                          ? 'bg-rose-50 text-rose-900 border border-rose-200'
                          : rating === 'kuning'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">
                          {rating === 'merah' ? 'Catatan Pelanggaran:' : rating === 'kuning' ? 'Catatan Evaluasi Dokumen:' : 'Catatan Rekam Jejak:'}
                        </div>
                        {w.performance_notes || (rating === 'merah' ? 'Pelanggaran indisipliner memerlukan verifikasi.' : 'Perlu evaluasi dokumen.')}
                      </div>
                    )}

                    {/* Baris 3: Info Lokasi, NIK, Kapal */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Status Keberadaan</span>
                        {w.current_status === 'di_laut' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 mt-0.5">
                            <Ship className="w-3 h-3" />
                            Di Laut ({w.last_vessel_name})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 mt-0.5">
                            <Anchor className="w-3 h-3" />
                            Di Darat (Siap Layar)
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">NIK (UU PDP)</span>
                        <span className="font-mono font-bold text-slate-700 mt-0.5 block">
                          •••• {w.nik_last4}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Kapal &amp; Perusahaan</span>
                        <span className="font-medium text-slate-800 mt-0.5 block">
                          {w.last_vessel_name || '-'} &bull; <span className="text-slate-600">{w.pkl_company_name || w.company_name || 'Asosiasi'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Baris 4: Aksi Tombol Mobile */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {onOpenWorkerDetail && (
                        <button
                          type="button"
                          onClick={() => onOpenWorkerDetail(w.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Detail &amp; Klarifikasi</span>
                        </button>
                      )}

                      {(w.pkl_company_name || w.company_name) && (
                        <button
                          type="button"
                          onClick={() => handleOpenContact(w.pkl_company_name || w.company_name || '')}
                          className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>PIC</span>
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

      {/* Quick Search Tool: Cek Ketersediaan Kru Berbasis NIK 4 Digit */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Pemeriksaan Cepat Ketersediaan Awak Kapal (Pre-boarding Clearance Check)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ketik nama atau 4 digit terakhir NIK pekerja untuk memeriksa apakah pekerja saat ini masih aktif di kapal anggota lain atau siap diberangkatkan.
          </p>
        </div>

        <form onSubmit={handleQuickSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan nama ABK atau 4 digit NIK (contoh: 0002 atau Sukarman)..."
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
          >
            Cek Status Kru
          </button>
          {searchResult !== null && (
            <button
              type="button"
              onClick={() => {
                setSearchResult(null);
                setSearchQuery('');
              }}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg font-medium"
            >
              Reset
            </button>
          )}
        </form>

        {searchResult !== null && (
          <div className="pt-2 border-t border-slate-100">
            {searchResult.length === 0 ? (
              <div className="p-4 bg-slate-50 text-slate-600 rounded-lg text-xs text-center">
                Tidak ditemukan pekerja dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Hasil Pemeriksaan ({searchResult.length} ABK ditemukan):
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {searchResult.map(w => {
                    const isAtSea = w.current_status === 'di_laut';
                    return (
                      <div key={w.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{w.name}</span>
                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              •••• •••• •••• {w.nik_last4}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAtSea ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isAtSea ? 'SEDANG DI LAUT' : 'SIAP BERLAYAR (DI DARAT)'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Kapal Saat Ini: <strong>{w.last_vessel_name || 'Belum Terdaftar'}</strong> &bull; Perusahaan: <strong>{w.pkl_company_name || w.company_name || 'Tidak ada data'}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {isAtSea && (
                            <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ⚠️ Jangan Diduplikasi
                            </span>
                          )}
                          {w.company_name && (
                            <button
                              onClick={() => handleOpenContact(w.company_name!)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium text-[11px] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              Kontak PIC
                            </button>
                          )}
                          {onOpenWorkerDetail && (
                            <button
                              onClick={() => onOpenWorkerDetail(w.id)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px]"
                            >
                              Detail Profil
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two Column Section: Recent Transfers & Member Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Cross-Company Transfers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span>Mutasi Kru Terkini Antar-Kapal</span>
            </h2>
            <button
              onClick={() => setActiveTab('mobility')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {mobilityRecords.map(rec => (
              <div key={rec.id} className="py-3 space-y-1.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rec.worker_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    NIK: •••• •••• •••• {rec.worker_nik_last4}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-medium truncate max-w-[140px]">
                    {rec.from_vessel_name || 'Kru Baru'}
                  </span>
                  <span>&rarr;</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium truncate max-w-[140px]">
                    {rec.to_vessel_name}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Alasan: {rec.reason.replace(/_/g, ' ')}</span>
                  <span>{new Date(rec.transfer_date).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Member Companies Fleet Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Perusahaan Anggota Asosiasi</span>
            </h2>
            <button
              onClick={() => setActiveTab('directory')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Direktori Lengkap</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {companies.map(comp => {
              const compVessels = vessels.filter(v => v.company_id === comp.id);
              const compWorkers = workers.filter(w => w.pkl_company_name === comp.name || w.company_name === comp.name);
              return (
                <div key={comp.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{comp.name}</span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono font-bold">
                        {comp.code}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      PIC: <strong>{comp.pic_name}</strong> &bull; {compVessels.length} Kapal &bull; {compWorkers.length} ABK
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenContact(comp.name)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold text-xs flex items-center gap-1 transition"
                    title="Hubungi PIC"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Hubungi</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Contact PIC */}
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
                <label className="text-slate-500 font-medium">Perusahaan:</label>
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
