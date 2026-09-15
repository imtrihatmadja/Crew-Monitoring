import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, NavTab } from '../types';
import { store } from '../lib/supabaseStore';
import { 
  Users, 
  UserCheck, 
  FileCode, 
  Ship, 
  AlertOctagon, 
  LayoutDashboard, 
  History, 
  ChevronDown, 
  ArrowRightLeft, 
  Building2,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenUserModal: () => void;
  onOpenSqlModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenUserModal,
  onOpenSqlModal
}) => {
  const [isWorkerDropdownOpen, setIsWorkerDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const duplicateAlerts = store.getDuplicateAlerts().filter(a => a.status === 'aktif');
  const highMobilityCount = store.getMetrics().highMobilityCount;

  // Tutup dropdown pekerja jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWorkerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cegah scrolling halaman saat drawer menu mobile terbuka
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isWorkerParentActive = activeTab === 'workers' || activeTab === 'register';

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsWorkerDropdownOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white shadow-sm border-b border-slate-800 sticky top-0 z-40">
      {/* Top Banner Bar for Association & UU PDP Notice */}
      <div className="bg-slate-950 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="font-bold text-white tracking-wide">CREW SISTEM - ATLI</span>
          <span className="text-slate-400 hidden sm:inline">
            | Asosiasi Tuna Longline Indonesia (UU PDP No. 27/2022)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-700 font-medium transition cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Supabase DDL &amp; RLS</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand: Klik logo atau tulisan langsung masuk ke Dashboard */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left group p-1 -ml-1 rounded-xl transition hover:bg-slate-800/60 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
            title="Klik untuk kembali ke Dashboard Operasional"
          >
            <div className="w-10 h-10 bg-blue-600 group-hover:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105 shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                <span>CREW SISTEM - ATLI</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  ATLI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 transition line-clamp-1">
                Asosiasi Tuna Longline Indonesia
              </p>
            </div>
          </button>

          {/* Navigation Links - Desktop Only (Dashboard tombol dihapus sesuai permintaan) */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Anti-Duplikasi */}
            <button
              onClick={() => handleNavClick('anti-duplication')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                activeTab === 'anti-duplication'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/60 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <AlertOctagon className={`w-4 h-4 ${duplicateAlerts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Anti-Duplikasi</span>
              {duplicateAlerts.length > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {duplicateAlerts.length}
                </span>
              )}
            </button>

            {/* Mobilitas Kru */}
            <button
              onClick={() => handleNavClick('mobility')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                activeTab === 'mobility'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/60 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <span>Mobilitas Kru</span>
              {highMobilityCount > 0 && (
                <span className="bg-amber-500/30 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {highMobilityCount}
                </span>
              )}
            </button>

            {/* Log Manifest */}
            <button
              onClick={() => handleNavClick('manifest-log')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                activeTab === 'manifest-log'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/60 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <Ship className="w-4 h-4 text-blue-400" />
              <span>Log Manifest</span>
            </button>

            {/* Menu Dropdown: Pekerja */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setActiveTab('workers');
                  setIsWorkerDropdownOpen(!isWorkerDropdownOpen);
                }}
                onMouseEnter={() => setIsWorkerDropdownOpen(true)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                  isWorkerParentActive
                    ? 'bg-blue-950/60 text-blue-300 border-blue-500/60 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                }`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Pekerja</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isWorkerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Child Submenu Dropdown */}
              {isWorkerDropdownOpen && (
                <div
                  onMouseLeave={() => setIsWorkerDropdownOpen(false)}
                  className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                    Menu Pekerja Awak Kapal
                  </div>
                  <button
                    onClick={() => {
                      handleNavClick('workers');
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 font-medium transition ${
                      activeTab === 'workers' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Daftar Pekerja (ABK)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleNavClick('register');
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2.5 font-medium transition ${
                      activeTab === 'register' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Registrasi NIK (Baru / Import Excel)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direktori Asosiasi */}
            <button
              onClick={() => handleNavClick('directory')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-blue-400 border-slate-700 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Direktori Asosiasi</span>
            </button>

            {/* Audit Log */}
            <button
              onClick={() => handleNavClick('history')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 border ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-blue-400 border-slate-700 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <History className="w-4 h-4 text-slate-400" />
              <span>Audit Log</span>
            </button>
          </nav>

          {/* Right Section: User Profile & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Supabase Auto-Connected Status Badge */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-semibold cursor-pointer transition"
              title="Database Cloud Supabase Terhubung Otomatis - Klik untuk status & sinkronisasi"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Supabase</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">ONLINE</span>
            </button>

            {/* User Profile & Company Switcher */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700/90 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Ganti Perusahaan / Akun Anggota"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left text-xs hidden sm:block">
                <div className="font-semibold text-slate-100 max-w-[140px] truncate">
                  {currentUser.name}
                </div>
                <div className="text-blue-400 text-[10px] truncate max-w-[140px]">
                  {currentUser.company_name || currentUser.role.toUpperCase()}
                </div>
              </div>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slider / Off-Canvas Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop gelap */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel Slider */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10">
            {/* Header Slider */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => handleNavClick('dashboard')}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                  <Ship className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>CREW SISTEM - ATLI</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Asosiasi Tuna Longline Indonesia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profil User di Slider */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Akun Anggota Asosiasi
              </div>
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-800/90 rounded-xl border border-slate-700/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-100 text-xs truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-blue-400 text-[10px] truncate">
                      {currentUser.company_name || 'Sekretariat Asosiasi'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenUserModal();
                  }}
                  className="px-2.5 py-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md font-medium shrink-0 transition"
                >
                  Ganti
                </button>
              </div>
            </div>

            {/* Navigasi List Slider */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Navigasi Menu
              </div>

              {/* Shortcut Dashboard */}
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Dashboard Operasional</span>
              </button>

              {/* Anti-Duplikasi */}
              <button
                onClick={() => handleNavClick('anti-duplication')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition font-medium ${
                  activeTab === 'anti-duplication'
                    ? 'bg-rose-950/70 text-rose-200 border border-rose-600/50 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertOctagon className={`w-4 h-4 shrink-0 ${duplicateAlerts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>Anti-Duplikasi Manifest</span>
                </div>
                {duplicateAlerts.length > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {duplicateAlerts.length} Kasus
                  </span>
                )}
              </button>

              {/* Mobilitas Kru */}
              <button
                onClick={() => handleNavClick('mobility')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition font-medium ${
                  activeTab === 'mobility'
                    ? 'bg-amber-950/70 text-amber-200 border border-amber-600/50 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pelacakan Mobilitas Kru</span>
                </div>
                {highMobilityCount > 0 && (
                  <span className="bg-amber-500/30 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {highMobilityCount}
                  </span>
                )}
              </button>

              {/* Log Manifest */}
              <button
                onClick={() => handleNavClick('manifest-log')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'manifest-log'
                    ? 'bg-blue-950/70 text-blue-200 border border-blue-600/50 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Ship className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Log Manifest Kapal</span>
              </button>

              <div className="pt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Kru &amp; Anggota Asosiasi
                </div>
              </div>

              {/* Daftar Pekerja */}
              <button
                onClick={() => handleNavClick('workers')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'workers'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Daftar Pekerja (ABK)</span>
              </button>

              {/* Registrasi NIK */}
              <button
                onClick={() => handleNavClick('register')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Registrasi NIK &amp; Bulk Import Excel</span>
              </button>

              {/* Direktori Asosiasi */}
              <button
                onClick={() => handleNavClick('directory')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'directory'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Direktori Asosiasi &amp; Kapal</span>
              </button>

              {/* Audit Log */}
              <button
                onClick={() => handleNavClick('history')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition font-medium ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Audit Log Transaksi</span>
              </button>
            </div>

            {/* Slider Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSqlModal();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Supabase DDL &amp; RLS</span>
              </button>
              <div className="text-[10px] text-center text-slate-500">
                Kepatuhan UU PDP No. 27/2022 (Masking NIK 4 Digit)
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
