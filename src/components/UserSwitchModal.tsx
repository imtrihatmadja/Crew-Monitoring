import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { DEMO_USERS, store } from '../lib/supabaseStore';
import { UserCheck, Shield, Anchor, X, Check, Database, Key, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [savedConfigMsg, setSavedConfigMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('abk_system_supabase_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSupabaseUrl(parsed.supabaseUrl || '');
        setSupabaseKey(parsed.supabaseKey || '');
      } else {
        // Fallback check Vite env
        const metaEnv = (import.meta as any).env;
        if (metaEnv?.VITE_SUPABASE_URL) setSupabaseUrl(metaEnv.VITE_SUPABASE_URL);
        if (metaEnv?.VITE_SUPABASE_ANON_KEY) setSupabaseKey(metaEnv.VITE_SUPABASE_ANON_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = store.isSupabaseConnected();

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('abk_system_supabase_config_v1', JSON.stringify({ supabaseUrl, supabaseKey }));
      setSavedConfigMsg('Kredensial Supabase berhasil disimpan! Sistem akan menggunakan database cloud ini.');
      setTimeout(() => setSavedConfigMsg(''), 4000);
      handleManualSync();
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await store.refreshFromSupabase();
      setSyncResult(res);
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'Gagal sinkronisasi' });
    } finally {
      setIsSyncing(false);
    }
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

          {/* Live Supabase Connection & Data Management */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                Integrasi Cloud Supabase (Data Real)
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {isConnected ? 'TERHUBUNG' : 'MODE LOKAL (OFFLINE)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan Project URL dan Anon Key Supabase Anda agar semua input data ABK, kapal, dan manifest langsung tersimpan secara permanen di database PostgreSQL Supabase.
            </p>

            {savedConfigMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{savedConfigMsg}</span>
              </div>
            )}

            {syncResult && (
              <div className={`p-2.5 rounded text-xs font-semibold flex items-center gap-2 border ${
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

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                  SUPABASE PROJECT URL:
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                  SUPABASE ANON PUBLIC KEY:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  Simpan &amp; Hubungkan
                </button>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Menghubungkan...' : 'Tarik Data Supabase'}
                </button>
              </div>
            </form>

            {/* Data Management Action */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={isCleaning}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
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
