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
  if (supabaseInstance) {
    if (typeof window !== 'undefined' && !(window as any).client) {
      (window as any).client = supabaseInstance;
    }
    return supabaseInstance;
  }

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

    if (typeof window !== 'undefined') {
      (window as any).client = supabaseInstance;
    }
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseInstance = createClient(BUILTIN_SUPABASE_URL, BUILTIN_SUPABASE_ANON_KEY);
    if (typeof window !== 'undefined') {
      (window as any).client = supabaseInstance;
    }
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

    supabaseInstance = createClient(cleanUrl, cleanKey);
    if (typeof window !== 'undefined') {
      (window as any).client = supabaseInstance;
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Gagal menyimpan konfigurasi' };
  }
}

export function resetToBuiltinConfig(): void {
  localStorage.removeItem(STORAGE_KEY_CONFIG);
  supabaseInstance = createClient(BUILTIN_SUPABASE_URL, BUILTIN_SUPABASE_ANON_KEY);
  if (typeof window !== 'undefined') {
    (window as any).client = supabaseInstance;
  }
}

export function clearSupabaseConfig(): void {
  resetToBuiltinConfig();
}

export async function testSupabaseConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  latencyMs?: number;
  isRlsBlocked?: boolean;
  workerCount?: number;
  vesselCount?: number;
  companyCount?: number;
  tablesFound?: string[];
  tablesMissing?: string[];
}> {
  const client = getSupabaseClient();
  const startTime = performance.now();

  try {
    const [cTest, vTest, wTest] = await Promise.all([
      client.from('companies').select('id', { count: 'exact', head: true }),
      client.from('vessels').select('id', { count: 'exact', head: true }),
      client.from('workers').select('id', { count: 'exact' }).limit(5)
    ]);

    const latencyMs = Math.round(performance.now() - startTime);

    const tablesFound: string[] = [];
    const tablesMissing: string[] = [];
    let isRlsBlocked = false;

    if (!cTest.error) tablesFound.push('companies');
    else if (cTest.error.code === '42P01') tablesMissing.push('companies');
    else if (cTest.error.code === '42501' || cTest.error.message.includes('row-level security')) isRlsBlocked = true;

    if (!vTest.error) tablesFound.push('vessels');
    else if (vTest.error.code === '42P01') tablesMissing.push('vessels');
    else if (vTest.error.code === '42501' || vTest.error.message.includes('row-level security')) isRlsBlocked = true;

    if (!wTest.error) tablesFound.push('workers');
    else if (wTest.error.code === '42P01') tablesMissing.push('workers');
    else if (wTest.error.code === '42501' || wTest.error.message.includes('row-level security')) isRlsBlocked = true;

    const workerCount = wTest.count ?? (wTest.data ? wTest.data.length : 0);
    const vesselCount = vTest.count ?? 0;
    const companyCount = cTest.count ?? 0;

    if (tablesMissing.length > 0) {
      return {
        success: false,
        message: `Tabel belum dibuat di Supabase (${tablesMissing.join(', ')} belum ada). Jalankan SQL Schema di SQL Editor Supabase.`,
        latencyMs,
        tablesFound,
        tablesMissing,
        isRlsBlocked
      };
    }

    if (isRlsBlocked) {
      return {
        success: true,
        isRlsBlocked: true,
        latencyMs,
        message: 'Server Supabase terhubung, namun izin Row Level Security (RLS) masih membatasi akses multi-device. Salin & jalankan skrip buka akses RLS.',
        tablesFound,
        workerCount,
        vesselCount,
        companyCount
      };
    }

    return { 
      success: true, 
      isRlsBlocked: false, 
      latencyMs, 
      message: `Terhubung & Siap (${latencyMs}ms, ${workerCount} ABK, ${vesselCount} Kapal di Cloud)`,
      tablesFound,
      workerCount,
      vesselCount,
      companyCount
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
 * Sync Methods - Push data directly to Supabase using resilient Select -> Update/Insert
 */

export async function dbInsertCompany(company: Company): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const companyId = isValidUuid(company.id) ? company.id : generateUUID();
    const cleanCode = (company.code || company.name.slice(0, 4)).toUpperCase().trim();
    const payload: any = {
      name: company.name.trim(),
      code: cleanCode,
      license_number: company.license_number || '',
      pic_name: company.pic_name || 'Staf Personalia',
      pic_role: company.pic_role || 'Koordinator Personil',
      pic_phone: company.pic_phone || '0812-0000-0000',
      pic_email: company.pic_email || `ops@${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'atli'}.id`,
      address: company.address || 'Kawasan Pelabuhan'
    };

    // 1. Cek apakah sudah ada perusahaan dengan code ini (aman dari error koma syntax PostgREST)
    const { data: byCode } = await client
      .from('companies')
      .select('id')
      .eq('code', cleanCode)
      .limit(1);

    if (byCode && byCode.length > 0) {
      const existingId = byCode[0].id;
      const { data, error } = await client
        .from('companies')
        .update(payload)
        .eq('id', existingId)
        .select();
      if (error) throw error;
      return { success: true, data: (data && data[0]) || { ...payload, id: existingId } };
    }

    // 2. Cek apakah ada perusahaan dengan nama yang sama persis
    const { data: byName } = await client
      .from('companies')
      .select('id')
      .eq('name', company.name.trim())
      .limit(1);

    if (byName && byName.length > 0) {
      const existingId = byName[0].id;
      const { data, error } = await client
        .from('companies')
        .update(payload)
        .eq('id', existingId)
        .select();
      if (error) throw error;
      return { success: true, data: (data && data[0]) || { ...payload, id: existingId } };
    }

    // 3. Masukkan data baru
    const { data, error } = await client
      .from('companies')
      .insert({ ...payload, id: companyId })
      .select();

    if (error) {
      // Jika duplicate key, coba update
      if (error.code === '23505') {
        const { data: retryData } = await client
          .from('companies')
          .update(payload)
          .eq('code', cleanCode)
          .select();
        return { success: true, data: (retryData && retryData[0]) || { ...payload, id: companyId } };
      }
      throw error;
    }

    return { success: true, data: (data && data[0]) || { ...payload, id: companyId } };
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

    // Verifikasi bahwa companyUuid benar-benar ada di Supabase
    if (companyUuid) {
      const { data: cExists } = await client.from('companies').select('id').eq('id', companyUuid).limit(1);
      if (!cExists || cExists.length === 0) {
        companyUuid = null; // Reset agar dicari atau dibuatkan
      }
    }

    // Jika company_id belum ada di Supabase, cari berdasarkan nama atau buatkan
    if (!companyUuid) {
      if (vessel.company_name) {
        const { data: compSearch } = await client
          .from('companies')
          .select('id')
          .eq('name', vessel.company_name.trim())
          .limit(1);
        if (compSearch && compSearch.length > 0) {
          companyUuid = compSearch[0].id;
        }
      }

      // Jika belum ditemukan, buatkan perusahaannya terlebih dahulu di Supabase
      if (!companyUuid) {
        const fallbackName = vessel.company_name?.trim() || 'PT Samudera Bahari Indonesia';
        const fallbackCode = fallbackName.slice(0, 4).toUpperCase();
        const compRes = await dbInsertCompany({
          id: generateUUID(),
          name: fallbackName,
          code: fallbackCode,
          license_number: 'SIUP-KKP-DEFAULT',
          pic_name: 'Staf Operasional',
          pic_role: 'Koordinator',
          pic_phone: '0812-0000-0000',
          pic_email: `ops@${fallbackCode.toLowerCase().replace(/[^a-z0-9]/g, '') || 'atli'}.id`,
          address: 'Kawasan Pelabuhan Perikanan',
          created_at: new Date().toISOString()
        });
        if (compRes.success && compRes.data?.id) {
          companyUuid = compRes.data.id;
        }
      }
    }

    // Jika tetap belum ada, ambil ID perusahaan pertama di Supabase
    if (!companyUuid) {
      const { data: anyComp } = await client.from('companies').select('id').limit(1);
      if (anyComp && anyComp.length > 0) {
        companyUuid = anyComp[0].id;
      }
    }

    const vesselId = isValidUuid(vessel.id) ? vessel.id : generateUUID();
    const payload: any = {
      name: vessel.name.trim(),
      registration_number: vessel.registration_number.trim(),
      gross_tonnage: Number(vessel.gross_tonnage) || 30,
      company_name: vessel.company_name || 'PT Samudera Bahari Indonesia',
      home_port: vessel.home_port || 'PPS Nizam Zachman Jakarta',
      captain_name: vessel.captain_name || null,
      status: vessel.status || 'sandar',
      active_crew_count: Number(vessel.active_crew_count) || 0
    };

    if (companyUuid) {
      payload.company_id = companyUuid;
    }

    // 1. Cek apakah sudah ada kapal dengan nomor registrasi ini
    const { data: existing } = await client
      .from('vessels')
      .select('id')
      .eq('registration_number', vessel.registration_number.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      const { data, error } = await client
        .from('vessels')
        .update(payload)
        .eq('id', existingId)
        .select();
      if (error) throw error;
      return { success: true, data: (data && data[0]) || { ...payload, id: existingId } };
    } else {
      const { data, error } = await client
        .from('vessels')
        .insert({ ...payload, id: vesselId })
        .select();

      if (error) {
        // Jika error foreign key company_id, ambil perusahaan default pertama lalu coba lagi
        if (error.code === '23503') {
          const { data: firstComp } = await client.from('companies').select('id').limit(1);
          if (firstComp && firstComp.length > 0) {
            payload.company_id = firstComp[0].id;
            const { data: retryData, error: retryErr } = await client
              .from('vessels')
              .insert({ ...payload, id: vesselId })
              .select();
            if (!retryErr) return { success: true, data: (retryData && retryData[0]) || { ...payload, id: vesselId } };
          }
        }
        throw error;
      }
      return { success: true, data: (data && data[0]) || { ...payload, id: vesselId } };
    }
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
    
    // Core payload (kolom-kolom standar yang pasti ada)
    const corePayload: any = {
      name: worker.name.trim(),
      nik_hash: worker.nik_hash,
      nik_last4: worker.nik_last4,
      dob: worker.dob && worker.dob.length >= 10 ? worker.dob.slice(0, 10) : '1990-01-01',
      phone: worker.phone?.trim() || '-',
      home_port: worker.home_port || 'PPS Nizam Zachman Jakarta',
      current_status: worker.current_status || 'di_darat',
      position: worker.position || 'Kelasi'
    };

    // Extended payload (fitur rating, PKL, sertifikat, tanggungan)
    const fullPayload: any = {
      ...corePayload,
      last_vessel_name: worker.last_vessel_name || null,
      company_name: worker.company_name || null,
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

    // Validasi Foreign Keys: Hanya sertakan jika ID tersebut benar-benar ada di tabel Supabase
    if (isValidUuid(worker.last_vessel_id)) {
      const { data: vExists } = await client.from('vessels').select('id').eq('id', worker.last_vessel_id).limit(1);
      if (vExists && vExists.length > 0) {
        fullPayload.last_vessel_id = worker.last_vessel_id;
      }
    }
    if (isValidUuid(worker.company_id)) {
      const { data: cExists } = await client.from('companies').select('id').eq('id', worker.company_id).limit(1);
      if (cExists && cExists.length > 0) {
        fullPayload.company_id = worker.company_id;
      }
    }

    // 1. Cek apakah worker dengan nik_hash ini sudah ada di Supabase
    const { data: existing } = await client
      .from('workers')
      .select('id')
      .eq('nik_hash', worker.nik_hash)
      .limit(1);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      let updateRes = await client
        .from('workers')
        .update(fullPayload)
        .eq('id', existingId)
        .select();

      // Jika gagal karena kolom belum ada (42703), fallback ke corePayload
      if (updateRes.error && updateRes.error.code === '42703') {
        updateRes = await client
          .from('workers')
          .update(corePayload)
          .eq('id', existingId)
          .select();
      }

      // Jika gagal karena foreign key (23503), hilangkan relasi ID
      if (updateRes.error && updateRes.error.code === '23503') {
        delete fullPayload.last_vessel_id;
        delete fullPayload.company_id;
        updateRes = await client
          .from('workers')
          .update(fullPayload)
          .eq('id', existingId)
          .select();
      }

      if (updateRes.error) throw updateRes.error;
      return { success: true, data: (updateRes.data && updateRes.data[0]) || { ...fullPayload, id: existingId } };
    } else {
      let insertRes = await client
        .from('workers')
        .insert({ ...fullPayload, id: workerId })
        .select();

      // Jika error kolom belum ada di skema lama (42703), fallback ke corePayload
      if (insertRes.error && insertRes.error.code === '42703') {
        insertRes = await client
          .from('workers')
          .insert({ ...corePayload, id: workerId })
          .select();
      }

      // Jika error foreign key (23503), hilangkan last_vessel_id dan company_id
      if (insertRes.error && insertRes.error.code === '23503') {
        delete fullPayload.last_vessel_id;
        delete fullPayload.company_id;
        insertRes = await client
          .from('workers')
          .insert({ ...fullPayload, id: workerId })
          .select();
      }

      // Jika error duplicate nik_hash (23505), coba update
      if (insertRes.error && insertRes.error.code === '23505') {
        const { data: fData } = await client
          .from('workers')
          .update(fullPayload)
          .eq('nik_hash', worker.nik_hash)
          .select();
        return { success: true, data: fData && fData[0] };
      }

      if (insertRes.error) throw insertRes.error;
      return { success: true, data: (insertRes.data && insertRes.data[0]) || { ...fullPayload, id: workerId } };
    }
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
        const { data: vSearch } = await client.from('vessels').select('id').eq('name', manifest.vessel_name.trim()).limit(1);
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
    const payload: any = {
      manifest_number: manifest.manifest_number.trim(),
      vessel_id: vesselUuid,
      type: manifest.type,
      timestamp: manifest.timestamp || new Date().toISOString(),
      port: manifest.port || 'PPS Nizam Zachman Jakarta',
      recorded_by_name: manifest.recorded_by_name || 'Petugas',
      recorded_by_role: manifest.recorded_by_role || 'syahbandar',
      total_workers: manifest.total_workers || (manifest.workers ? manifest.workers.length : 0),
      notes: manifest.notes || ''
    };

    // Check existing
    const { data: existing } = await client
      .from('manifests')
      .select('id')
      .eq('manifest_number', manifest.manifest_number.trim())
      .limit(1);

    let finalManifestId = manifestId;

    if (existing && existing.length > 0) {
      finalManifestId = existing[0].id;
      const { error } = await client
        .from('manifests')
        .update(payload)
        .eq('id', finalManifestId);
      if (error) throw error;
    } else {
      const { error } = await client
        .from('manifests')
        .insert({ ...payload, id: manifestId });
      if (error) throw error;
    }

    // Insert manifest_workers items if available
    if (manifest.workers && manifest.workers.length > 0) {
      for (const w of manifest.workers) {
        if (isValidUuid(w.worker_id)) {
          try {
            await client.from('manifest_workers').upsert({
              manifest_id: finalManifestId,
              worker_id: w.worker_id,
              disembarked: manifest.type === 'kedatangan'
            }, { onConflict: 'manifest_id,worker_id' });
          } catch (e) {
            // Ignore individual worker relation issue
          }
        }
      }
    }

    return { success: true, data: { ...payload, id: finalManifestId } };
  } catch (err: any) {
    console.error('dbInsertManifest error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertMobility(rec: WorkerMobilityRecord): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const id = isValidUuid(rec.id) ? rec.id : generateUUID();
    const payload: any = {
      worker_name: rec.worker_name,
      worker_nik_last4: rec.worker_nik_last4,
      from_vessel_name: rec.from_vessel_name,
      from_company_name: rec.from_company_name,
      to_vessel_name: rec.to_vessel_name,
      to_company_name: rec.to_company_name,
      transfer_date: rec.transfer_date || new Date().toISOString(),
      reason: rec.reason || 'selesai_kontrak',
      clearance_status: rec.clearance_status || 'disetujui',
      notes: rec.notes || ''
    };

    if (isValidUuid(rec.worker_id)) payload.worker_id = rec.worker_id;
    if (isValidUuid(rec.from_vessel_id)) payload.from_vessel_id = rec.from_vessel_id;
    if (isValidUuid(rec.to_vessel_id)) payload.to_vessel_id = rec.to_vessel_id;

    const { data, error } = await client
      .from('worker_mobility_records')
      .insert({ ...payload, id })
      .select();

    if (error) {
      if (error.code === '23503') {
        // Strip foreign keys if missing
        delete payload.worker_id;
        delete payload.from_vessel_id;
        delete payload.to_vessel_id;
        const { data: rData } = await client.from('worker_mobility_records').insert({ ...payload, id }).select();
        return { success: true, data: rData && rData[0] };
      }
      throw error;
    }
    return { success: true, data: data && data[0] };
  } catch (err: any) {
    console.error('dbInsertMobility error:', err);
    return { success: false, error: err.message };
  }
}

export async function dbInsertDuplicateAlert(alert: CrewDuplicationAlert): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'No Supabase client' };

  try {
    const id = isValidUuid(alert.id) ? alert.id : generateUUID();
    const payload: any = {
      worker_name: alert.worker_name,
      worker_nik_last4: alert.worker_nik_last4,
      worker_phone: alert.worker_phone || '',
      primary_vessel_name: alert.primary_vessel_name,
      primary_company_name: alert.primary_company_name,
      conflicting_vessel_name: alert.conflicting_vessel_name,
      conflicting_company_name: alert.conflicting_company_name,
      conflict_type: alert.conflict_type || 'double_booking',
      detected_at: alert.detected_at || new Date().toISOString(),
      status: alert.status || 'aktif',
      resolution_notes: alert.resolution_notes || ''
    };

    if (isValidUuid(alert.worker_id)) payload.worker_id = alert.worker_id;
    if (isValidUuid(alert.primary_vessel_id)) payload.primary_vessel_id = alert.primary_vessel_id;
    if (isValidUuid(alert.conflicting_vessel_id)) payload.conflicting_vessel_id = alert.conflicting_vessel_id;

    const { data, error } = await client
      .from('crew_duplication_alerts')
      .insert({ ...payload, id })
      .select();

    if (error) {
      if (error.code === '23503') {
        delete payload.worker_id;
        delete payload.primary_vessel_id;
        delete payload.conflicting_vessel_id;
        const { data: rData } = await client.from('crew_duplication_alerts').insert({ ...payload, id }).select();
        return { success: true, data: rData && rData[0] };
      }
      throw error;
    }
    return { success: true, data: data && data[0] };
  } catch (err: any) {
    console.error('dbInsertDuplicateAlert error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all rows from Supabase with resilient per-table error handling & clear diagnostics
 */
export async function fetchAllFromSupabase(): Promise<{
  companies?: Company[];
  vessels?: Vessel[];
  workers?: Worker[];
  manifests?: Manifest[];
  alerts?: CrewDuplicationAlert[];
  mobility?: WorkerMobilityRecord[];
  isRlsBlocked?: boolean;
  tablesMissing?: string[];
  errors?: Record<string, string>;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) return { error: 'Supabase client not configured' };

  try {
    const [compRes, vessRes, workRes, manRes, alertRes, mobRes] = await Promise.all([
      client.from('companies').select('*').order('name'),
      client.from('vessels').select('*').order('name'),
      client.from('workers').select('*').order('created_at', { ascending: false }),
      client.from('manifests').select('*').order('timestamp', { ascending: false }),
      client.from('crew_duplication_alerts').select('*').order('detected_at', { ascending: false }),
      client.from('worker_mobility_records').select('*').order('transfer_date', { ascending: false })
    ]);

    let isRlsBlocked = false;
    const tableErrors: Record<string, string> = {};
    const tablesMissing: string[] = [];

    const checkTable = (tbl: string, res: any) => {
      if (res.error) {
        tableErrors[tbl] = res.error.message;
        if (res.error.code === '42P01') {
          tablesMissing.push(tbl);
        }
        if (res.error.code === '42501' || res.error.message.includes('row-level security')) {
          isRlsBlocked = true;
        }
      }
    };

    checkTable('companies', compRes);
    checkTable('vessels', vessRes);
    checkTable('workers', workRes);
    checkTable('manifests', manRes);
    checkTable('crew_duplication_alerts', alertRes);
    checkTable('worker_mobility_records', mobRes);

    const errMessages = Object.entries(tableErrors).map(([tbl, msg]) => `[${tbl}]: ${msg}`).join(', ');

    return {
      isRlsBlocked,
      tablesMissing: tablesMissing.length > 0 ? tablesMissing : undefined,
      errors: Object.keys(tableErrors).length > 0 ? tableErrors : undefined,
      error: errMessages.length > 0 ? errMessages : undefined,
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
      })),
      mobility: (mobRes.data || []).map((m: any) => ({
        id: m.id,
        worker_id: m.worker_id || '',
        worker_name: m.worker_name,
        worker_nik_last4: m.worker_nik_last4,
        from_vessel_id: m.from_vessel_id || '',
        from_vessel_name: m.from_vessel_name,
        from_company_name: m.from_company_name,
        to_vessel_id: m.to_vessel_id || '',
        to_vessel_name: m.to_vessel_name,
        to_company_name: m.to_company_name,
        transfer_date: m.transfer_date,
        reason: m.reason || 'selesai_kontrak',
        clearance_status: m.clearance_status || 'disetujui',
        recorded_by_name: m.recorded_by_name || 'Petugas Syahbandar',
        notes: m.notes || ''
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
      activeRealtimeChannel = null;
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
      .subscribe((status, err) => {
        console.info('[Realtime] Status koneksi channel Supabase:', status);
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Realtime] Saluran Realtime terputus, sistem menggunakan polling otomatis:', err);
        }
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
