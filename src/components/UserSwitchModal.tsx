import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEMO_USERS, store } from '../lib/supabaseStore';
import { BUILTIN_SUPABASE_URL, testSupabaseConnection } from '../lib/supabaseClient';
import { SQL_RLS_FIX } from '../lib/sqlSchema';
import { 
  UserCheck, 
  Shield, 
  Anchor, 
  X, 
  Check, 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Globe, 
  Zap 
} from 'lucide-react';

interface UserSwitchModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onClose: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  isOpen,
  currentUser,
  onSelectUser,
  onClose
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [copiedRls, setCopiedRls] = useState(false);
  const [connStatus, setConnStatus] = useState<{ latency?: number; isRlsBlocked?: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      testSupabaseConnection().then(res => {
        setConnStatus({
          latency: res.latencyMs,
          isRlsBlocked: res.isRlsBlocked
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await store.refreshFromSupabase();
      setSyncResult(res);
      const testRes = await testSupabaseConnection();
      setConnStatus({
        latency: testRes.latencyMs,
        isRlsBlocked: testRes.isRlsBlocked
      });
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'Gagal sinkronisasi data cloud.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyRlsFix = () => {
    navigator.clipboard.writeText(SQL_RLS_FIX);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
  };

  const handleClearAllData = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh data lokal (ABK, Kapal, Manifest, Peringatan)? Sistem akan benar-benar bersih 0 data untuk uji coba data riil.')) {
      setIsCleaning(true);
      await store.clearAllData();
      setIsCleaning(false);
      alert('Seluruh data dummy/lokal telah berhasil dikosongkan!');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900 text-blue-300 rounded-md border border-blue-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Ganti Role & Pengaturan Database</h2>
              <p className="text-xs text-slate-400">Pilih identitas role dan koneksi Supabase data riil</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Demo Accounts List */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pilih Role Akun Pengujian Akses:
            </h3>

            <div className="space-y-2">
              {DEMO_USERS.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          user.role === 'syahbandar'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {user.role === 'syahbandar' ? (
                          <Anchor className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          {user.name}
                          {isSelected && (
                            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                          {user.company_name || 'Sekretariat Asosiasi'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Role: <span className="uppercase font-semibold text-slate-700">{user.role}</span> &bull; Pelabuhan: {user.port}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cloud Supabase Auto-Configured Card */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Database Cloud Supabase (Tersambung Otomatis)
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ONLINE &bull; {connStatus.latency ? `${connStatus.latency}ms` : 'TERKONEKSI'}
              </span>
            </div>

            {/* Status Information Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Server Host:
                </span>
                <span className="font-mono text-slate-800 font-semibold truncate max-w-[210px]">
                  {BUILTIN_SUPABASE_URL.replace('https://', '')}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Mode Akses:
                </span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Otomatis Tanpa Input Manual
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/80">
                Sistem telah tersetting otomatis dan selalu terhubung ke database cloud Supabase. Semua pencatatan ABK, armada kapal, dan manifest langsung disinkronkan ke PostgreSQL.
              </p>
            </div>

            {/* Sync feedback notice */}
            {syncResult && (
              <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                syncResult.success 
                  ? 'bg-blue-50 text-blue-800 border-blue-300' 
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {syncResult.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-blue-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                )}
                <span>{syncResult.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Menyinkronkan...' : 'Tarik & Sinkronkan Data'}
              </button>

              <button
                type="button"
                onClick={handleCopyRlsFix}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 shadow-sm cursor-pointer"
                title="Salin skrip SQL untuk membuka hak akses RLS tabel jika diperlukan di Supabase SQL Editor"
              >
                {copiedRls ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SQL RLS Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Salin SQL Izin RLS</span>
                  </>
                )}
              </button>
            </div>

            {/* Data Management Action */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={isCleaning}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Kosongkan Semua Data Dummy (Reset 0 Data)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
