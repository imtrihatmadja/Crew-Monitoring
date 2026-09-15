import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Worker, Vessel, Company, Manifest, WorkerMobilityRecord, CrewDuplicationAlert, CheckinEvent } from '../types';

const STORAGE_KEY_CONFIG = 'abk_system_supabase_config_v1';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  // Check localStorage first
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.supabaseUrl && parsed.supabaseKey) {
        return {
          supabaseUrl: parsed.supabaseUrl.trim(),
          supabaseKey: parsed.supabaseKey.trim()
        };
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from localStorage:', e);
  }

  // Fallback to Vite environment variables if available
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey && envUrl !== 'MY_SUPABASE_URL' && envUrl !== '') {
    return {
      supabaseUrl: envUrl.trim(),
      supabaseKey: envKey.trim()
    };
  }

  return null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (config && config.supabaseUrl && config.supabaseKey) {
    try {
      supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return null;
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

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  supabaseInstance = null;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tablesCount?: number }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
  }

  try {
    // Try to query companies table
    const { data, error } = await client.from('companies').select('id').limit(1);
    if (error) {
      return { success: false, message: `Error koneksi Supabase: ${error.message}` };
    }
    return { success: true, message: 'Koneksi ke Supabase berhasil! Tabel siap digunakan.' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Gagal terhubung ke Supabase.' };
  }
}

/**
 * Sync Methods - Push data directly to Supabase
 */

export async function dbInsertCompany(company: Company): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const { error } = await client.from('companies').upsert({
      id: company.id.startsWith('c-') ? undefined : company.id,
      name: company.name,
      code: company.code || company.name.slice(0, 4).toUpperCase(),
      license_number: company.license_number,
      pic_name: company.pic_name,
      pic_role: company.pic_role,
      pic_phone: company.pic_phone,
      pic_email: company.pic_email,
      address: company.address
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertCompany error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertVessel(vessel: Vessel): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const { error } = await client.from('vessels').upsert({
      name: vessel.name,
      registration_number: vessel.registration_number,
      gross_tonnage: vessel.gross_tonnage,
      company_id: vessel.company_id.startsWith('c-') ? null : vessel.company_id,
      company_name: vessel.company_name,
      home_port: vessel.home_port,
      captain_name: vessel.captain_name || null,
      status: vessel.status || 'sandar',
      active_crew_count: vessel.active_crew_count || 0
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertVessel error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertWorker(worker: Worker): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const { error } = await client.from('workers').upsert({
      name: worker.name,
      nik_hash: worker.nik_hash,
      nik_last4: worker.nik_last4,
      dob: worker.dob,
      phone: worker.phone,
      home_port: worker.home_port,
      current_status: worker.current_status,
      last_vessel_name: worker.last_vessel_name || null,
      company_name: worker.company_name || null,
      position: worker.position || 'Kelasi',
      performance_rating: worker.performance_rating || 'hijau',
      performance_notes: worker.performance_notes || null,
      transfer_count: worker.transfer_count || 0,
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
      tanggungan_amount: worker.tanggungan_amount || 0,
      tanggungan_notes: worker.tanggungan_notes || null
    }, { onConflict: 'nik_hash' });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertWorker error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertManifest(manifest: Manifest): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    // 1. Insert into manifests table
    const { data: manifestData, error: mError } = await client.from('manifests').insert({
      manifest_number: manifest.manifest_number,
      vessel_id: manifest.vessel_id.startsWith('v-') ? null : manifest.vessel_id,
      type: manifest.type,
      timestamp: manifest.timestamp,
      port: manifest.port,
      recorded_by_name: manifest.recorded_by_name,
      recorded_by_role: manifest.recorded_by_role,
      total_workers: manifest.total_workers,
      notes: manifest.notes
    }).select('id').single();

    if (mError && !manifestData) throw mError;

    // 2. Insert manifest workers if any
    if (manifestData && manifest.workers && manifest.workers.length > 0) {
      const workerRows = manifest.workers.map(w => ({
        manifest_id: manifestData.id,
        worker_id: w.worker_id.startsWith('w-') ? null : w.worker_id,
        disembarked: w.disembarked ?? true,
        notes: w.home_port || null
      })).filter(r => r.worker_id !== null);

      if (workerRows.length > 0) {
        await client.from('manifest_workers').insert(workerRows);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('dbInsertManifest error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertMobility(record: WorkerMobilityRecord): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const { error } = await client.from('worker_mobility_records').insert({
      worker_name: record.worker_name,
      worker_nik_last4: record.worker_nik_last4,
      from_vessel_name: record.from_vessel_name,
      from_company_name: record.from_company_name,
      to_vessel_name: record.to_vessel_name,
      to_company_name: record.to_company_name,
      transfer_date: record.transfer_date,
      reason: record.reason,
      clearance_status: record.clearance_status,
      notes: record.notes,
      recorded_by_name: record.recorded_by_name
    });
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
    const { error } = await client.from('crew_duplication_alerts').insert({
      worker_name: alert.worker_name,
      worker_nik_last4: alert.worker_nik_last4,
      worker_phone: alert.worker_phone,
      primary_vessel_name: alert.primary_vessel_name,
      primary_company_name: alert.primary_company_name,
      conflicting_vessel_name: alert.conflicting_vessel_name,
      conflicting_company_name: alert.conflicting_company_name,
      conflict_type: alert.conflict_type,
      detected_at: alert.detected_at,
      status: alert.status,
      resolution_notes: alert.resolution_notes
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('dbInsertDuplicateAlert error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all rows from Supabase
 */
export async function fetchAllFromSupabase(): Promise<{
  companies?: Company[];
  vessels?: Vessel[];
  workers?: Worker[];
  manifests?: Manifest[];
  alerts?: CrewDuplicationAlert[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase client not configured' };

  try {
    const [compRes, vessRes, workRes, manRes, alertRes] = await Promise.all([
      client.from('companies').select('*').order('name'),
      client.from('vessels').select('*').order('name'),
      client.from('workers').select('*').order('created_at', { ascending: false }),
      client.from('manifests').select('*').order('timestamp', { ascending: false }),
      client.from('crew_duplication_alerts').select('*').order('detected_at', { ascending: false })
    ]);

    return {
      companies: compRes.data || [],
      vessels: (vessRes.data || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        registration_number: v.registration_number,
        gross_tonnage: v.gross_tonnage,
        company_id: v.company_id || '',
        company_name: v.company_name,
        home_port: v.home_port,
        captain_name: v.captain_name,
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
        last_vessel_id: w.last_vessel_id,
        last_vessel_name: w.last_vessel_name,
        company_id: w.company_id,
        company_name: w.company_name,
        position: w.position,
        performance_rating: w.performance_rating,
        performance_notes: w.performance_notes,
        transfer_count: w.transfer_count,
        pkl_number: w.pkl_number,
        pkl_start_date: w.pkl_start_date,
        pkl_expiry_date: w.pkl_expiry_date,
        pkl_company_name: w.pkl_company_name,
        pkl_status: w.pkl_status,
        previous_company_name: w.previous_company_name,
        bst_number: w.bst_number,
        seaman_book_number: w.seaman_book_number,
        mcu_status: w.mcu_status,
        bpjs_tk_number: w.bpjs_tk_number,
        bpjs_tk_active: w.bpjs_tk_active,
        clearance_status: w.clearance_status,
        tanggungan_category: w.tanggungan_category,
        tanggungan_amount: w.tanggungan_amount,
        tanggungan_notes: w.tanggungan_notes,
        created_at: w.created_at
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
        recorded_by_name: m.recorded_by_name,
        recorded_by_role: m.recorded_by_role,
        total_workers: m.total_workers,
        workers: [],
        notes: m.notes
      })),
      alerts: (alertRes.data || []).map((a: any) => ({
        id: a.id,
        worker_id: a.worker_id || '',
        worker_name: a.worker_name,
        worker_nik_last4: a.worker_nik_last4,
        worker_phone: a.worker_phone,
        primary_vessel_id: a.primary_vessel_id || '',
        primary_vessel_name: a.primary_vessel_name,
        primary_company_name: a.primary_company_name,
        conflicting_vessel_id: a.conflicting_vessel_id || '',
        conflicting_vessel_name: a.conflicting_vessel_name,
        conflicting_company_name: a.conflicting_company_name,
        conflict_type: a.conflict_type,
        detected_at: a.detected_at,
        status: a.status,
        resolution_notes: a.resolution_notes
      }))
    };
  } catch (err: any) {
    return { error: err.message || 'Gagal memuat data dari Supabase' };
  }
}
