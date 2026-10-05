import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Worker, Vessel, Company, Manifest, WorkerMobilityRecord, CrewDuplicationAlert, CheckinEvent } from '../types';

const STORAGE_KEY_CONFIG = 'abk_system_supabase_config_v1';

// Kredensial Resmi Supabase Cloud Project ATLI
// Terpasang permanen secara otomatis agar sistem selalu terhubung di manapun dibuka
export const BUILTIN_SUPABASE_URL = 'https://dzfozeuccisjfwmpbews.supabase.co';
export const BUILTIN_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm96ZXVjY2lzamZ3bXBiZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NDQwMDIsImV4cCI6MjEwNTAyMDAwMn0.RIaYnfn2kiHFA_A7uFnjxhDNM6J6sKudahKdFHW9uAo';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
  isBuiltin: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  // 1. Cek penyimpanan lokal (opsional bila ada override)
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.supabaseUrl && parsed.supabaseKey) {
        return {
          supabaseUrl: parsed.supabaseUrl.trim(),
          supabaseKey: parsed.supabaseKey.trim(),
          isBuiltin: false
        };
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  // 2. Cek variabel lingkungan Vite bila ada
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && envUrl !== 'MY_SUPABASE_URL' && envUrl !== '') {
    return {
      supabaseUrl: envUrl.trim(),
      supabaseKey: envKey.trim(),
      isBuiltin: false
    };
  }

  // 3. Otomatis gunakan Kredensial Default Resmi Supabase (Selalu Terhubung)
  return {
    supabaseUrl: BUILTIN_SUPABASE_URL,
    supabaseKey: BUILTIN_SUPABASE_ANON_KEY,
    isBuiltin: true
  };
}

let supabaseInstance: SupabaseClient | null = null;

// Selalu mengembalikan instance Supabase Client yang aktif dan siap digunakan
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  try {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    // Fallback instance
    supabaseInstance = createClient(BUILTIN_SUPABASE_URL, BUILTIN_SUPABASE_ANON_KEY);
    return supabaseInstance;
  }
}

export function saveSupabaseConfig(url: string, key: string): { success: boolean; error?: string } {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    if (!cleanUrl.startsWith('http')) {
      return { success: false, error: 'URL Supabase harus diawali dengan https://' };
    }
    if (!cleanKey) {
      return { success: false, error: 'Supabase Anon Key tidak boleh kosong' };
    }

    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({
      supabaseUrl: cleanUrl,
      supabaseKey: cleanKey
    }));

    // Reset instance so it picks up the new config
    supabaseInstance = createClient(cleanUrl, cleanKey);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal menyimpan konfigurasi' };
  }
}

export function resetToBuiltinConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  supabaseInstance = createClient(BUILTIN_SUPABASE_URL, BUILTIN_SUPABASE_ANON_KEY);
}

export function clearSupabaseConfig(): void {
  resetToBuiltinConfig();
}

export async function testSupabaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  latencyMs?: number;
  isRlsBlocked?: boolean;
}> {
  const client = getSupabaseClient();
  const startTime = performance.now();

  try {
    const { data, error } = await client.from('companies').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      if (error.code === '42501' || error.message.toLowerCase().includes('row-level security') || error.message.toLowerCase().includes('policy')) {
        return {
          success: true,
          isRlsBlocked: true,
          latencyMs,
          message: 'Server Supabase terhubung online. Memerlukan izin RLS (buka SQL izin RLS).'
        };
      }
      return { 
        success: false, 
        message: `Error Supabase: ${error.message}`, 
        latencyMs 
      };
    }
    return { 
      success: true, 
      isRlsBlocked: false, 
      latencyMs, 
      message: `Terhubung & Siap (${latencyMs}ms)` 
    };
  } catch (e: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { 
      success: false, 
      message: e?.message || 'Gagal terhubung ke Cloud Supabase.', 
      latencyMs 
    };
  }
}

/**
 * Sync Methods - Push data directly to Supabase with UUID sanitation & foreign key resolution
 */

export async function dbInsertCompany(company: Company): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const companyId = isValidUuid(company.id) ? company.id : generateUUID();
    const payload: any = {
      id: companyId,
      name: company.name,
      code: company.code || company.name.slice(0, 4).toUpperCase(),
      license_number: company.license_number,
      pic_name: company.pic_name,
      pic_role: company.pic_role,
      pic_phone: company.pic_phone,
      pic_email: company.pic_email,
      address: company.address
    };

    const { data, error } = await client.from('companies').upsert(payload, { onConflict: 'code' }).select().single();
    if (error) throw error;
    return { success: true, data: data || { ...payload, id: companyId } };
  } catch (err: any) {
    console.error('dbInsertCompany error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertVessel(vessel: Vessel): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    let companyUuid = isValidUuid(vessel.company_id) ? vessel.company_id : null;

    // Jika company_id belum berupa UUID, cari atau buatkan company di Supabase
    if (!companyUuid) {
      if (vessel.company_name) {
        const { data: compSearch } = await client
          .from('companies')
          .select('id')
          .eq('name', vessel.company_name)
          .limit(1);
        if (compSearch && compSearch.length > 0) {
          companyUuid = compSearch[0].id;
        }
      }

      // Jika belum ditemukan, buatkan perusahaannya terlebih dahulu
      if (!companyUuid) {
        const fallbackName = vessel.company_name || 'PT Armada Perikanan Indonesia';
        const fallbackCode = fallbackName.slice(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
        const { data: newComp } = await client
          .from('companies')
          .upsert({
            id: generateUUID(),
            name: fallbackName,
            code: fallbackCode,
            pic_name: 'Staf Operasional',
            pic_phone: '0812-3456-7890',
            pic_email: `ops@${fallbackCode.toLowerCase()}.id`
          }, { onConflict: 'code' })
          .select('id')
          .single();
        if (newComp) {
          companyUuid = newComp.id;
        }
      }
    }

    if (!companyUuid) {
      // Jika masih tidak ada, ambil perusahaan pertama yang ada
      const { data: anyComp } = await client.from('companies').select('id').limit(1);
      if (anyComp && anyComp.length > 0) {
        companyUuid = anyComp[0].id;
      }
    }

    const vesselId = isValidUuid(vessel.id) ? vessel.id : generateUUID();
    const payload: any = {
      id: vesselId,
      name: vessel.name,
      registration_number: vessel.registration_number,
      gross_tonnage: Number(vessel.gross_tonnage) || 30,
      company_id: companyUuid,
      company_name: vessel.company_name,
      home_port: vessel.home_port || 'PPS Nizam Zachman Jakarta',
      captain_name: vessel.captain_name || null,
      status: vessel.status || 'sandar',
      active_crew_count: Number(vessel.active_crew_count) || 0
    };

    const { data, error } = await client.from('vessels').upsert(payload, { onConflict: 'registration_number' }).select().single();
    if (error) throw error;
    return { success: true, data: data || { ...payload, id: vesselId } };
  } catch (err: any) {
    console.error('dbInsertVessel error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertWorker(worker: Worker): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const workerId = isValidUuid(worker.id) ? worker.id : generateUUID();
    const payload: any = {
      id: workerId,
      name: worker.name,
      nik_hash: worker.nik_hash,
      nik_last4: worker.nik_last4,
      dob: worker.dob || '1990-01-01',
      phone: worker.phone || '-',
      home_port: worker.home_port || 'PPS Nizam Zachman Jakarta',
      current_status: worker.current_status || 'di_darat',
      last_vessel_name: worker.last_vessel_name || null,
      company_name: worker.company_name || null,
      position: worker.position || 'Kelasi',
      performance_rating: worker.performance_rating || 'hijau',
      performance_notes: worker.performance_notes || null,
      transfer_count: Number(worker.transfer_count) || 0,
      pkl_number: worker.pkl_number || null,
      pkl_start_date: worker.pkl_start_date || null,
      pkl_expiry_date: worker.pkl_expiry_date || null,
      pkl_company_name: worker.pkl_company_name || null,
      pkl_status: worker.pkl_status || 'belum_ada',
      previous_company_name: worker.previous_company_name || null,
      bst_number: worker.bst_number || null,
      seaman_book_number: worker.seaman_book_number || null,
      mcu_status: worker.mcu_status || 'layak',
      bpjs_tk_number: worker.bpjs_tk_number || null,
      bpjs_tk_active: worker.bpjs_tk_active ?? true,
      clearance_status: worker.clearance_status || 'bebas_tanggungan',
      tanggungan_category: worker.tanggungan_category || null,
      tanggungan_amount: Number(worker.tanggungan_amount) || 0,
      tanggungan_notes: worker.tanggungan_notes || null
    };

    if (isValidUuid(worker.last_vessel_id)) {
      payload.last_vessel_id = worker.last_vessel_id;
    }
    if (isValidUuid(worker.company_id)) {
      payload.company_id = worker.company_id;
    }

    const { data, error } = await client.from('workers').upsert(payload, { onConflict: 'nik_hash' }).select().single();
    if (error) throw error;
    return { success: true, data: data || { ...payload, id: workerId } };
  } catch (err: any) {
    console.error('dbInsertWorker error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertManifest(manifest: Manifest): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    let vesselUuid = isValidUuid(manifest.vessel_id) ? manifest.vessel_id : null;

    if (!vesselUuid) {
      if (manifest.vessel_name) {
        const { data: vSearch } = await client.from('vessels').select('id').eq('name', manifest.vessel_name).limit(1);
        if (vSearch && vSearch.length > 0) {
          vesselUuid = vSearch[0].id;
        }
      }
      if (!vesselUuid) {
        const { data: anyVessel } = await client.from('vessels').select('id').limit(1);
        if (anyVessel && anyVessel.length > 0) {
          vesselUuid = anyVessel[0].id;
        }
      }
    }

    if (!vesselUuid) {
      return { success: false, error: 'Kapal belum terdaftar di database untuk membuat manifest.' };
    }

    const manifestId = isValidUuid(manifest.id) ? manifest.id : generateUUID();
    const { data: manifestData, error: mError } = await client.from('manifests').upsert({
      id: manifestId,
      manifest_number: manifest.manifest_number,
      vessel_id: vesselUuid,
      type: manifest.type,
      timestamp: manifest.timestamp,
      port: manifest.port,
      recorded_by_name: manifest.recorded_by_name,
      recorded_by_role: manifest.recorded_by_role,
      total_workers: manifest.total_workers,
      notes: manifest.notes
    }, { onConflict: 'manifest_number' }).select('id').single();

    if (mError) throw mError;

    // Insert manifest workers if any
    const finalManifestId = manifestData?.id || manifestId;
    if (manifest.workers && manifest.workers.length > 0) {
      const workerRows = manifest.workers
        .filter(w => isValidUuid(w.worker_id))
        .map(w => ({
          manifest_id: finalManifestId,
          worker_id: w.worker_id,
          disembarked: w.disembarked ?? true,
          notes: w.home_port || null
        }));

      if (workerRows.length > 0) {
        await client.from('manifest_workers').upsert(workerRows, { onConflict: 'manifest_id,worker_id' });
      }
    }

    return { success: true, data: { id: finalManifestId } };
  } catch (err: any) {
    console.error('dbInsertManifest error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertMobility(record: WorkerMobilityRecord): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const payload: any = {
      id: isValidUuid(record.id) ? record.id : generateUUID(),
      worker_name: record.worker_name,
      worker_nik_last4: record.worker_nik_last4,
      from_vessel_name: record.from_vessel_name || null,
      from_company_name: record.from_company_name || null,
      to_vessel_name: record.to_vessel_name || null,
      to_company_name: record.to_company_name || null,
      transfer_date: record.transfer_date || new Date().toISOString(),
      reason: record.reason || 'mutasi_armada',
      clearance_status: record.clearance_status || 'disetujui',
      notes: record.notes || null,
      recorded_by_name: record.recorded_by_name || 'Admin'
    };

    if (isValidUuid(record.worker_id)) payload.worker_id = record.worker_id;
    if (isValidUuid(record.from_vessel_id)) payload.from_vessel_id = record.from_vessel_id;
    if (isValidUuid(record.from_company_id)) payload.from_company_id = record.from_company_id;
    if (isValidUuid(record.to_vessel_id)) payload.to_vessel_id = record.to_vessel_id;
    if (isValidUuid(record.to_company_id)) payload.to_company_id = record.to_company_id;

    const { error } = await client.from('worker_mobility_records').insert(payload);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertMobility error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertDuplicateAlert(alert: CrewDuplicationAlert): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const payload: any = {
      id: isValidUuid(alert.id) ? alert.id : generateUUID(),
      worker_name: alert.worker_name,
      worker_nik_last4: alert.worker_nik_last4,
      worker_phone: alert.worker_phone || null,
      primary_vessel_name: alert.primary_vessel_name,
      primary_company_name: alert.primary_company_name,
      conflicting_vessel_name: alert.conflicting_vessel_name,
      conflicting_company_name: alert.conflicting_company_name,
      conflict_type: alert.conflict_type || 'double_booking',
      detected_at: alert.detected_at || new Date().toISOString(),
      status: alert.status || 'aktif',
      resolution_notes: alert.resolution_notes || null
    };

    if (isValidUuid(alert.worker_id)) payload.worker_id = alert.worker_id;
    if (isValidUuid(alert.primary_vessel_id)) payload.primary_vessel_id = alert.primary_vessel_id;
    if (isValidUuid(alert.conflicting_vessel_id)) payload.conflicting_vessel_id = alert.conflicting_vessel_id;

    const { error } = await client.from('crew_duplication_alerts').insert(payload);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertDuplicateAlert error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all rows from Supabase with resilient per-table error handling
 */
export async function fetchAllFromSupabase(): Promise<{
  companies?: Company[];
  vessels?: Vessel[];
  workers?: Worker[];
  manifests?: Manifest[];
  alerts?: CrewDuplicationAlert[];
  isRlsBlocked?: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase client not configured' };

  try {
    // Jalankan setiap query secara independen agar jika satu tabel bermasalah (misal RLS / belum ada relasi), tabel lain tetap sukses dimuat
    const [compRes, vessRes, workRes, manRes, alertRes] = await Promise.all([
      client.from('companies').select('*').order('name').then(r => r, e => ({ data: [], error: e })),
      client.from('vessels').select('*').order('name').then(r => r, e => ({ data: [], error: e })),
      client.from('workers').select('*').order('created_at', { ascending: false }).then(r => r, e => ({ data: [], error: e })),
      client.from('manifests').select('*').order('timestamp', { ascending: false }).then(r => r, e => ({ data: [], error: e })),
      client.from('crew_duplication_alerts').select('*').order('detected_at', { ascending: false }).then(r => r, e => ({ data: [], error: e }))
    ]);

    let isRlsBlocked = false;
    const errors: string[] = [];

    [compRes, vessRes, workRes, manRes, alertRes].forEach(res => {
      if (res.error) {
        if (res.error.code === '42501' || res.error.message?.toLowerCase().includes('row-level security') || res.error.message?.toLowerCase().includes('policy')) {
          isRlsBlocked = true;
        } else {
          errors.push(res.error.message);
        }
      }
    });

    return {
      isRlsBlocked,
      error: errors.length > 0 ? errors.join(', ') : undefined,
      companies: (compRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        license_number: c.license_number || '',
        pic_name: c.pic_name || '',
        pic_role: c.pic_role || '',
        pic_phone: c.pic_phone || '',
        pic_email: c.pic_email || '',
        address: c.address || '',
        created_at: c.created_at || new Date().toISOString()
      })),
      vessels: (vessRes.data || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        registration_number: v.registration_number,
        gross_tonnage: v.gross_tonnage,
        company_id: v.company_id || '',
        company_name: v.company_name || '',
        home_port: v.home_port || '',
        captain_name: v.captain_name || '',
        status: v.status || 'sandar',
        active_crew_count: v.active_crew_count || 0
      })),
      workers: (workRes.data || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        nik_hash: w.nik_hash,
        nik_last4: w.nik_last4,
        dob: w.dob,
        phone: w.phone,
        home_port: w.home_port,
        current_status: w.current_status,
        last_vessel_id: w.last_vessel_id || undefined,
        last_vessel_name: w.last_vessel_name || undefined,
        company_id: w.company_id || undefined,
        company_name: w.company_name || undefined,
        position: w.position || 'Kelasi',
        performance_rating: w.performance_rating || 'hijau',
        performance_notes: w.performance_notes || undefined,
        transfer_count: w.transfer_count || 0,
        pkl_number: w.pkl_number || undefined,
        pkl_start_date: w.pkl_start_date || undefined,
        pkl_expiry_date: w.pkl_expiry_date || undefined,
        pkl_company_name: w.pkl_company_name || undefined,
        pkl_status: w.pkl_status || 'belum_ada',
        previous_company_name: w.previous_company_name || undefined,
        bst_number: w.bst_number || undefined,
        seaman_book_number: w.seaman_book_number || undefined,
        mcu_status: w.mcu_status || 'layak',
        bpjs_tk_number: w.bpjs_tk_number || undefined,
        bpjs_tk_active: w.bpjs_tk_active ?? true,
        clearance_status: w.clearance_status || 'bebas_tanggungan',
        tanggungan_category: w.tanggungan_category || undefined,
        tanggungan_amount: w.tanggungan_amount || 0,
        tanggungan_notes: w.tanggungan_notes || undefined,
        created_at: w.created_at || new Date().toISOString()
      })),
      manifests: (manRes.data || []).map((m: any) => ({
        id: m.id,
        manifest_number: m.manifest_number,
        vessel_id: m.vessel_id || '',
        vessel_name: '',
        vessel_registration: '',
        company_name: '',
        type: m.type,
        timestamp: m.timestamp,
        port: m.port,
        recorded_by_user_id: m.recorded_by_user_id,
        recorded_by_name: m.recorded_by_name || 'Petugas',
        recorded_by_role: m.recorded_by_role || 'syahbandar',
        total_workers: m.total_workers || 0,
        workers: [],
        notes: m.notes || ''
      })),
      alerts: (alertRes.data || []).map((a: any) => ({
        id: a.id,
        worker_id: a.worker_id || '',
        worker_name: a.worker_name,
        worker_nik_last4: a.worker_nik_last4,
        worker_phone: a.worker_phone || '',
        primary_vessel_id: a.primary_vessel_id || '',
        primary_vessel_name: a.primary_vessel_name,
        primary_company_name: a.primary_company_name,
        conflicting_vessel_id: a.conflicting_vessel_id || '',
        conflicting_vessel_name: a.conflicting_vessel_name,
        conflicting_company_name: a.conflicting_company_name,
        conflict_type: a.conflict_type || 'double_booking',
        detected_at: a.detected_at,
        status: a.status || 'aktif',
        resolution_notes: a.resolution_notes || ''
      }))
    };
  } catch (err: any) {
    return { error: err.message || 'Gagal memuat data dari Supabase' };
  }
}

/**
 * Realtime Sync Channel - Mendengarkan perubahan data Postgres secara langsung
 * Memastikan setiap gadget lain menerima pembaruan secara instan tanpa reload halaman
 */
let activeRealtimeChannel: RealtimeChannel | null = null;

export function setupSupabaseRealtime(onDataChanged: (table: string, payload: any) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  if (activeRealtimeChannel) {
    try {
      client.removeChannel(activeRealtimeChannel);
    } catch (e) {
      // ignore
    }
  }

  try {
    const channel = client
      .channel('atli_crew_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workers' },
        (payload) => {
          console.info('[Realtime] Perubahan data pekerja ABK terdeteksi:', payload.eventType);
          onDataChanged('workers', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vessels' },
        (payload) => {
          console.info('[Realtime] Perubahan armada kapal terdeteksi:', payload.eventType);
          onDataChanged('vessels', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        (payload) => {
          console.info('[Realtime] Perubahan perusahaan terdeteksi:', payload.eventType);
          onDataChanged('companies', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'manifests' },
        (payload) => {
          console.info('[Realtime] Perubahan manifest terdeteksi:', payload.eventType);
          onDataChanged('manifests', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crew_duplication_alerts' },
        (payload) => {
          console.info('[Realtime] Perubahan peringatan duplikasi terdeteksi:', payload.eventType);
          onDataChanged('crew_duplication_alerts', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_mobility_records' },
        (payload) => {
          console.info('[Realtime] Perubahan mobilitas pekerja terdeteksi:', payload.eventType);
          onDataChanged('worker_mobility_records', payload);
        }
      )
      .subscribe((status) => {
        console.info('[Realtime] Status koneksi channel Supabase:', status);
      });

    activeRealtimeChannel = channel;

    return () => {
      try {
        if (activeRealtimeChannel) {
          client.removeChannel(activeRealtimeChannel);
          activeRealtimeChannel = null;
        }
      } catch (e) {
        // ignore
      }
    };
  } catch (err) {
    console.error('Failed to setup Supabase realtime:', err);
    return () => {};
  }
}
