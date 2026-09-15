import React, { useState } from 'react';
import { UserProfile } from '../types';
import { DEMO_USERS, store } from '../lib/supabaseStore';
import { UserCheck, Shield, Anchor, X, Check, Database, Key } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('abk_system_supabase_config_v1', JSON.stringify({ supabaseUrl, supabaseKey }));
      setSavedConfigMsg('Kredensial Supabase berhasil disimpan di local storage browser!');
      setTimeout(() => setSavedConfigMsg(''), 3000);
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
              <h2 className="font-bold text-base">Ganti Role / Akun Demo</h2>
              <p className="text-xs text-slate-400">Pilih identitas role untuk menguji hak akses RBAC</p>
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
              Pilih Akun Demo Anggota Asosiasi / Perusahaan:
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

          {/* Optional Live Supabase Credentials */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              Koneksi Supabase Proyek Anda (Opsional)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aplikasi berjalan dengan database terenkripsi lokal + RLS. Anda juga dapat menghubungkan credentials Supabase pribadi di bawah:
            </p>

            {savedConfigMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold">
                {savedConfigMsg}
              </div>
            )}

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                  SUPABASE URL:
                </label>
                <input
                  type="url"
                  placeholder="https://xyz.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">
                  SUPABASE ANON KEY:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                Simpan Konfigurasi Supabase
              </button>
            </form>
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
