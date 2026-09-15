import React, { useState } from 'react';
import { SQL_SCHEMA_TEXT, SCHEMA_DIAGRAM } from '../lib/sqlSchema';
import { FileCode, Copy, Check, X, Database, Shield, Cpu, Layers } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagram' | 'sql' | 'rls'>('diagram');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                Skema Database Supabase PostgreSQL
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                  FASE 1 MVP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Struktur tabel, RLS policy, fungsi hashing NIK, dan trigger otomatis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 pt-3 flex items-center justify-between text-xs font-mono">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-4 py-2 font-bold rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === 'diagram'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" /> Diagram Relasi (ERD)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2 font-bold rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === 'sql'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4" /> Script SQL Supabase
            </button>
            <button
              onClick={() => setActiveTab('rls')}
              className={`px-4 py-2 font-bold rounded-t-lg transition flex items-center gap-1.5 ${
                activeTab === 'rls'
                  ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" /> Penjelasan RLS & Trigger
            </button>
          </div>

          {activeTab === 'sql' && (
            <button
              onClick={handleCopy}
              className="mb-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin DDL SQL
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'diagram' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-cyan-300">
                <pre className="text-[11px] leading-relaxed">{SCHEMA_DIAGRAM}</pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-300">
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> 1. Proteksi NIK (UU PDP)
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Tabel <code className="text-cyan-300">workers</code> menyimpan <code className="text-cyan-300">nik_hash</code> (SHA-256) untuk validasi keunikan NIK dan <code className="text-cyan-300">nik_last4</code> untuk tampilan UI. Teks plain NIK tidak pernah disimpan.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-1">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> 2. Automatic Status Trigger
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Setiap event <code className="text-amber-300">keluar</code> otomatis mengupdate <code className="text-cyan-300">current_status = 'laut'</code>. Event <code className="text-emerald-300">masuk</code> mengupdate <code className="text-cyan-300">current_status = 'darat'</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-slate-200">
              <pre className="text-[11px] leading-relaxed">{SQL_SCHEMA_TEXT}</pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-4 font-sans text-xs text-slate-300">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2">
                <h3 className="font-bold text-cyan-300 text-sm">Penjelasan Row Level Security (RLS)</h3>
                <p>
                  RLS memastikan pengguna hanya bisa membaca atau merubah baris data sesuai dengan peranan (role) mereka di tabel <code className="text-cyan-300 font-mono">users_roles</code>.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400">1. Role: Syahbandar</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                    <li>Dapat melakukan <code className="text-cyan-300 font-mono">SELECT</code> seluruh data pekerja dan kapal di pelabuhan.</li>
                    <li>Dapat melakukan <code className="text-cyan-300 font-mono">INSERT</code> pendaftaran pekerja baru dan pembuatan event keluar-masuk.</li>
                    <li>Dibatasi dari menghapus (<code className="text-rose-400 font-mono">DELETE</code>) atau merubah riwayat event lama.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400">2. Role: Admin KKP / Pengawas</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                    <li>Memiliki hak akses penuh (<code className="text-cyan-300 font-mono">ALL PRIVILEGES</code>) untuk audit trail, pengelolaan master data perusahaan, kapal, dan pengguna.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
