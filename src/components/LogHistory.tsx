import React, { useState } from 'react';
import { UserProfile, CheckinEvent } from '../types';
import { store, INDONESIAN_PORTS } from '../lib/supabaseStore';
import { Clock, Search, Filter, ArrowUpRight, ArrowDownLeft, Lock, FileSpreadsheet, Anchor } from 'lucide-react';

interface LogHistoryProps {
  currentUser: UserProfile;
}

export const LogHistory: React.FC<LogHistoryProps> = ({ currentUser }) => {
  const allEvents = store.getEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPort, setSelectedPort] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'keluar' | 'masuk'>('all');

  const filteredEvents = allEvents.filter((evt) => {
    // Port filter
    if (selectedPort !== 'all' && evt.port !== selectedPort) return false;

    // Event type filter
    if (eventTypeFilter !== 'all' && evt.event_type !== eventTypeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchWorker = evt.worker_name.toLowerCase().includes(q);
      const matchNik = evt.worker_nik_last4.includes(q);
      const matchVessel = evt.vessel_name.toLowerCase().includes(q);
      const matchPort = evt.port.toLowerCase().includes(q);
      if (!matchWorker && !matchNik && !matchVessel && !matchPort) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Filters (Tabler Card Style) */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm space-y-4 border-t-4 border-t-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Master Audit Log Pergerakan ABK
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan historis individual pergerakan pekerja awak kapal di pelabuhan perikanan Indonesia
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 self-start md:self-auto">
            Total Record: <span className="font-bold text-slate-900">{filteredEvents.length}</span> Event
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pekerja / NIK / kapal..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Port Filter */}
          <div>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white font-medium text-slate-800"
            >
              <option value="all">Semua Pelabuhan</option>
              {INDONESIAN_PORTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Filter (Tabler Pill Style) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
            <button
              onClick={() => setEventTypeFilter('all')}
              className={`flex-1 py-1 rounded font-semibold transition text-center ${
                eventTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setEventTypeFilter('keluar')}
              className={`flex-1 py-1 rounded font-semibold transition text-center ${
                eventTypeFilter === 'keluar' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Keluar
            </button>
            <button
              onClick={() => setEventTypeFilter('masuk')}
              className={`flex-1 py-1 rounded font-semibold transition text-center ${
                eventTypeFilter === 'masuk' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              Masuk
            </button>
          </div>
        </div>
      </div>

      {/* Events Table (Tabler Clean Table Style) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-600 text-[10px]">
                <th className="py-3 px-4">Waktu Event</th>
                <th className="py-3 px-4">Nama ABK</th>
                <th className="py-3 px-4">NIK (Masked)</th>
                <th className="py-3 px-4">Nama Kapal</th>
                <th className="py-3 px-4">Pelabuhan</th>
                <th className="py-3 px-4">Jenis Event</th>
                <th className="py-3 px-4">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada riwayat event yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {evt.worker_name}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        <Lock className="w-3 h-3 text-blue-600" /> ****{evt.worker_nik_last4}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {evt.vessel_name}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {evt.port}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase border ${
                          evt.event_type === 'keluar'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {evt.event_type === 'keluar' ? (
                          <>
                            <ArrowUpRight className="w-3 h-3 text-amber-700" /> KELUAR
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-3 h-3 text-emerald-700" /> MASUK
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {evt.recorded_by_name} ({evt.recorded_by_role})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
