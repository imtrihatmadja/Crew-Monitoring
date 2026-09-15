import { 
  Worker, 
  Vessel, 
  Company, 
  CheckinEvent, 
  UserProfile, 
  Manifest, 
  ManifestType,
  ManifestWorkerItem, 
  ManifestDiscrepancy, 
  DashboardMetrics,
  WorkerMobilityRecord,
  CrewDuplicationAlert,
  ClearanceRecord
} from '../types';
import { hashNik } from './hash';
import {
  getSupabaseClient,
  dbInsertCompany,
  dbInsertVessel,
  dbInsertWorker,
  dbInsertManifest,
  dbInsertMobility,
  dbInsertDuplicateAlert,
  fetchAllFromSupabase
} from './supabaseClient';

// Akun Pengujian Akses (Role-Based Access Control)
export const DEMO_USERS: UserProfile[] = [
  {
    id: 'u-admin-1',
    email: 'admin@asosiasi-kapal.id',
    name: 'Admin Sekretariat Asosiasi',
    role: 'admin',
    port: 'Kantor Pusat Asosiasi'
  },
  {
    id: 'u-syahbandar-1',
    email: 'syahbandar@pelabuhan.go.id',
    name: 'Petugas Syahbandar Pelabuhan',
    role: 'syahbandar',
    port: 'PPS Nizam Zachman Jakarta'
  },
  {
    id: 'u-comp-1',
    email: 'ops@perusahaan-kapal.com',
    name: 'Staf Personalia Perusahaan Anggota',
    role: 'company',
    port: 'PPS Nizam Zachman Jakarta'
  }
];

export const INDONESIAN_PORTS = [
  'PPS Nizam Zachman Jakarta',
  'PPS Bitung',
  'PPS Benoa',
  'PPN Pengambengan',
  'PPN Kejawanan Cirebon',
  'PPN Pelabuhanratu',
  'PPN Tual',
  'PPP Mayangan Probolinggo'
];

// DATA SEED BERSIH (0 DATA DUMMY - 100% SIAP DATA REAL)
const INITIAL_COMPANIES: Company[] = [];
const INITIAL_VESSELS: Vessel[] = [];
const INITIAL_WORKERS_SEED: any[] = [];
const INITIAL_MOBILITY_SEED: WorkerMobilityRecord[] = [];
const INITIAL_DUPLICATE_ALERTS: CrewDuplicationAlert[] = [];
const INITIAL_CLEARANCES_SEED: ClearanceRecord[] = [];

const STORAGE_KEYS = {
  WORKERS: "abk_system_workers_v4_real",
  EVENTS: "abk_system_events_v4_real",
  VESSELS: "abk_system_vessels_v4_real",
  COMPANIES: "abk_system_companies_v4_real",
  MANIFESTS: "abk_system_manifests_v4_real",
  DISCREPANCIES: "abk_system_discrepancies_v4_real",
  MOBILITY: "abk_system_mobility_v4_real",
  DUPLICATES: "abk_system_duplicates_v4_real",
  CLEARANCES: "abk_system_clearance_v4_real",
  USER: "abk_system_active_user_v4_real"
};

export class DataStore {
  private workers: Worker[] = [];
  private events: CheckinEvent[] = [];
  private vessels: Vessel[] = [];
  private companies: Company[] = [];
  private manifests: Manifest[] = [];
  private discrepancies: ManifestDiscrepancy[] = [];
  private mobilityRecords: WorkerMobilityRecord[] = [];
  private duplicateAlerts: CrewDuplicationAlert[] = [];
  private clearanceRecords: ClearanceRecord[] = [];
  private currentUser: UserProfile = DEMO_USERS[0];

  constructor() {
    this.init();
  }

  private isSupabaseSyncing: boolean = false;

  private async init() {
    // 1. Bersihkan seluruh jejak data dummy versi lama dari localStorage browser
    try {
      const oldKeys = [
        "abk_system_workers_v3", "abk_system_events_v3", "abk_system_vessels_v3",
        "abk_system_companies_v3", "abk_system_manifests_v3", "abk_system_discrepancies_v3",
        "abk_system_mobility_v3", "abk_system_duplicates_v3", "abk_system_clearance_v3",
        "abk_system_workers_v2", "abk_system_workers_v1"
      ];
      oldKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }

    // 2. Muat data riil dari localStorage (default kosong jika baru pertama kali)
    const savedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    this.companies = savedCompanies ? JSON.parse(savedCompanies) : [];

    const savedVessels = localStorage.getItem(STORAGE_KEYS.VESSELS);
    this.vessels = savedVessels ? JSON.parse(savedVessels) : [];

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }

    const savedWorkers = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (savedWorkers) {
      const parsedWorkers: Worker[] = JSON.parse(savedWorkers);
      // Buang jika ada record dummy lama (w-1 s/d w-12)
      this.workers = parsedWorkers.filter(w => !w.id.startsWith("w-") || w.id.length > 5);
    } else {
      this.workers = [];
    }

    const savedManifests = localStorage.getItem(STORAGE_KEYS.MANIFESTS);
    this.manifests = savedManifests ? JSON.parse(savedManifests) : [];

    const savedDiscrepancies = localStorage.getItem(STORAGE_KEYS.DISCREPANCIES);
    this.discrepancies = savedDiscrepancies ? JSON.parse(savedDiscrepancies) : [];

    const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    this.events = savedEvents ? JSON.parse(savedEvents) : [];

    const savedMobility = localStorage.getItem(STORAGE_KEYS.MOBILITY);
    this.mobilityRecords = savedMobility ? JSON.parse(savedMobility) : [];

    const savedDuplicates = localStorage.getItem(STORAGE_KEYS.DUPLICATES);
    this.duplicateAlerts = savedDuplicates ? JSON.parse(savedDuplicates) : [];

    const savedClearances = localStorage.getItem(STORAGE_KEYS.CLEARANCES);
    this.clearanceRecords = savedClearances ? JSON.parse(savedClearances) : [];

    // 3. Otomatis sinkronisasi data riil dari Supabase jika konfigurasi tersedia
    this.refreshFromSupabase().catch(err => console.log("Supabase sync notice:", err));
  }

  /**
   * Mengambil dan memperbarui data riil langsung dari Cloud Supabase
   */
  public async refreshFromSupabase(): Promise<{ success: boolean; message: string }> {
    if (this.isSupabaseSyncing) return { success: false, message: "Sinkronisasi sedang berlangsung..." };
    this.isSupabaseSyncing = true;

    try {
      const res = await fetchAllFromSupabase();
      if (res.error) {
        this.isSupabaseSyncing = false;
        return { success: false, message: res.error };
      }

      if (res.companies && res.companies.length > 0) {
        this.companies = res.companies;
        this.saveCompanies();
      }
      if (res.vessels && res.vessels.length > 0) {
        this.vessels = res.vessels;
        this.saveVessels();
      }
      if (res.workers && res.workers.length > 0) {
        this.workers = res.workers;
        this.saveWorkers();
      }
      if (res.manifests && res.manifests.length > 0) {
        this.manifests = res.manifests;
        this.saveManifests();
      }
      if (res.alerts && res.alerts.length > 0) {
        this.duplicateAlerts = res.alerts;
        this.saveDuplicates();
      }

      this.isSupabaseSyncing = false;
      return { 
        success: true, 
        message: `Sinkronisasi Supabase berhasil: ${this.workers.length} ABK, ${this.vessels.length} Kapal, ${this.companies.length} Perusahaan.` 
      };
    } catch (e) {
      this.isSupabaseSyncing = false;
      return { success: false, message: e?.message || "Gagal terhubung ke Supabase" };
    }
  }

  /**
   * Mengosongkan seluruh data lokal (reset ke kondisi kosong murni)
   */
  public async clearAllData(): Promise<void> {
    this.workers = [];
    this.events = [];
    this.vessels = [];
    this.companies = [];
    this.manifests = [];
    this.discrepancies = [];
    this.mobilityRecords = [];
    this.duplicateAlerts = [];
    this.clearanceRecords = [];

    this.saveWorkers();
    this.saveEvents();
    this.saveVessels();
    this.saveCompanies();
    this.saveManifests();
    this.saveDiscrepancies();
    this.saveMobility();
    this.saveDuplicates();
    this.saveClearances();
  }

  public isSupabaseConnected(): boolean {
    return getSupabaseClient() !== null;
  }

  private saveClearances() {
    localStorage.setItem(STORAGE_KEYS.CLEARANCES, JSON.stringify(this.clearanceRecords));
  }

  private saveWorkers() {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(this.workers));
  }

  private saveEvents() {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this.events));
  }

  private saveManifests() {
    localStorage.setItem(STORAGE_KEYS.MANIFESTS, JSON.stringify(this.manifests));
  }

  private saveDiscrepancies() {
    localStorage.setItem(STORAGE_KEYS.DISCREPANCIES, JSON.stringify(this.discrepancies));
  }

  private saveMobility() {
    localStorage.setItem(STORAGE_KEYS.MOBILITY, JSON.stringify(this.mobilityRecords));
  }

  private saveDuplicates() {
    localStorage.setItem(STORAGE_KEYS.DUPLICATES, JSON.stringify(this.duplicateAlerts));
  }

  public saveCompanies() {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(this.companies));
  }

  public saveVessels() {
    localStorage.setItem(STORAGE_KEYS.VESSELS, JSON.stringify(this.vessels));
  }

  private saveUser() {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.currentUser));
  }

  // --- GETTERS ---
  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    this.saveUser();
  }

  public getWorkers(): Worker[] {
    return [...this.workers];
  }

  public getWorkerById(id: string): Worker | undefined {
    return this.workers.find(w => w.id === id);
  }

  public getVessels(): Vessel[] {
    return [...this.vessels];
  }

  public getCompanies(): Company[] {
    return [...this.companies];
  }

  public getEvents(): CheckinEvent[] {
    return [...this.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getManifests(): Manifest[] {
    return [...this.manifests].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getDiscrepancies(): ManifestDiscrepancy[] {
    return [...this.discrepancies].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }

  /**
   * Get the LAST departure manifest for a vessel
   */
  public getLastDepartureManifest(vesselId: string): Manifest | null {
    const departures = this.manifests
      .filter(m => m.vessel_id === vesselId && m.type === 'keberangkatan')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return departures[0] || null;
  }

  // --- ACTIONS ---

  /**
   * Register a new worker with NIK hashing & UU PDP compliance
   */
  public async registerWorker(data: {
    name: string;
    nikRaw: string;
    dob: string;
    phone: string;
    home_port: string;
  }): Promise<{ success: boolean; worker?: Worker; error?: string }> {
    const cleanNik = data.nikRaw.replace(/\D/g, '');
    if (cleanNik.length !== 16) {
      return { success: false, error: 'NIK harus berjumlah 16 digit angka' };
    }

    const hashed = await hashNik(cleanNik);
    const last4 = cleanNik.slice(-4);

    // Check duplicate NIK by hash
    const existing = this.workers.find(w => w.nik_hash === hashed);
    if (existing) {
      return {
        success: false,
        error: `Pekerja dengan NIK (****${last4}) sudah terdaftar dalam sistem atas nama: ${existing.name}`
      };
    }

    const newWorker: Worker = {
      id: `w-${Date.now()}`,
      name: data.name.trim(),
      nik_hash: hashed,
      nik_last4: last4,
      dob: data.dob,
      phone: data.phone.trim(),
      home_port: data.home_port,
      current_status: 'di_darat', // Default ashore
      created_at: new Date().toISOString()
    };

    this.workers.unshift(newWorker);
    this.saveWorkers();

    // Simpan otomatis ke Supabase jika terhubung
    dbInsertWorker(newWorker).catch(err => console.log('Supabase sync worker:', err));

    return { success: true, worker: newWorker };
  }

  /**
   * Register a new vessel name & details
   */
  public registerVessel(data: {
    name: string;
    registration_number: string;
    gross_tonnage?: number;
    company_name?: string;
  }): { success: boolean; vessel?: Vessel; error?: string } {
    if (!data.name.trim()) {
      return { success: false, error: 'Nama kapal perikanan wajib diisi.' };
    }
    if (!data.registration_number.trim()) {
      return { success: false, error: 'Nomor registrasi SIPI/SIUP wajib diisi.' };
    }

    const companyName = data.company_name?.trim() || (this.companies.length > 0 ? this.companies[0].name : 'Perusahaan Anggota ATLI');

    // Find or create company
    let company = this.companies.find(
      c => c.name.toLowerCase() === companyName.toLowerCase()
    );
    if (!company) {
      company = {
        id: `c-${Date.now()}`,
        name: companyName,
        code: companyName.slice(0, 4).toUpperCase(),
        license_number: `SIUP-KKP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        pic_name: 'Staf Operasional',
        pic_role: 'Koordinator Personil',
        pic_phone: '0812-3456-7890',
        pic_email: 'ops@perusahaan.co.id',
        address: 'Kawasan Pelabuhan Perikanan',
        created_at: new Date().toISOString()
      };
      this.companies.push(company);
      this.saveCompanies();
      dbInsertCompany(company).catch(err => console.log('Supabase sync company:', err));
    }

    const newVessel: Vessel = {
      id: `v-${Date.now()}`,
      name: data.name.trim(),
      registration_number: data.registration_number.trim(),
      gross_tonnage: Number(data.gross_tonnage) || 30,
      company_id: company.id,
      company_name: company.name,
      home_port: 'PPS Nizam Zachman Jakarta',
      status: 'sandar'
    };

    this.vessels.unshift(newVessel);
    this.saveVessels();

    // Simpan otomatis ke Supabase jika terhubung
    dbInsertVessel(newVessel).catch(err => console.log('Supabase sync vessel:', err));

    return { success: true, vessel: newVessel };
  }

  /**
   * Bulk Register Vessels (from Excel / CSV import)
   */
  public registerVesselsBulk(vesselList: Array<{
    name: string;
    registration_number?: string;
    gross_tonnage?: number;
    company_name?: string;
    home_port?: string;
  }>): { success: boolean; count: number; vessels: Vessel[]; errors: string[] } {
    const createdVessels: Vessel[] = [];
    const errors: string[] = [];

    vesselList.forEach((item, idx) => {
      if (!item.name || !item.name.trim()) {
        errors.push(`Baris ${idx + 1}: Nama kapal wajib diisi.`);
        return;
      }
      const trimmedName = item.name.trim();
      const reg = item.registration_number?.trim() || `SIPI-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const companyName = item.company_name?.trim() || 'PT Samudera Bahari Indonesia';

      // Find or create company
      let company = this.companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
      if (!company) {
        company = {
          id: `c-${Date.now()}-${idx}`,
          name: companyName,
          code: `CMP-${Math.floor(100 + Math.random() * 900)}`,
          license_number: `SIUP-P/${new Date().getFullYear()}/${100 + this.companies.length}`,
          pic_name: 'Direktur Armada',
          pic_role: 'Direktur Operasional',
          pic_phone: '0812-0000-1111',
          pic_email: `ops@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`,
          address: 'Kawasan Pelabuhan Perikanan Samudera',
          created_at: new Date().toISOString()
        };
        this.companies.push(company);
      }

      // Check if registration number already exists
      const existing = this.vessels.find(v => v.registration_number.toLowerCase() === reg.toLowerCase());
      if (existing) {
        errors.push(`Baris ${idx + 1}: Kapal "${trimmedName}" dengan nomor registrasi ${reg} sudah terdaftar.`);
        return;
      }

      const newVessel: Vessel = {
        id: `v-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: trimmedName,
        registration_number: reg,
        gross_tonnage: Number(item.gross_tonnage) || 30,
        company_id: company.id,
        company_name: company.name,
        home_port: item.home_port?.trim() || 'PPS Nizam Zachman Jakarta',
        status: 'sandar',
        active_crew_count: 0
      };

      this.vessels.unshift(newVessel);
      createdVessels.push(newVessel);
    });

    if (createdVessels.length > 0) {
      this.saveVessels();
      this.saveCompanies();
    }

    return {
      success: createdVessels.length > 0,
      count: createdVessels.length,
      vessels: createdVessels,
      errors
    };
  }

  /**
   * Unified Manifest Creation wrapper used by ManifestLog component
   */
  public createManifest(data: {
    vessel_id: string;
    type: ManifestType;
    departure_manifest_id?: string;
    port: string;
    notes?: string;
    workers: { 
      worker_id: string; 
      disembarked: boolean;
      clearance_status?: 'bebas_tanggungan' | 'ada_tanggungan';
      tanggungan_category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
      tanggungan_amount?: number;
      tanggungan_notes?: string;
    }[];
  }): Manifest {
    if (data.type === 'keberangkatan') {
      const res = this.createDepartureManifest({
        vessel_id: data.vessel_id,
        worker_ids: data.workers.map(w => w.worker_id),
        port: data.port,
        notes: data.notes
      });
      if (!res.success || !res.manifest) {
        throw new Error(res.error || 'Gagal membuat manifest keberangkatan');
      }
      return res.manifest;
    } else {
      const disembarkMap: Record<string, boolean> = {};
      const clearanceMap: Record<string, {
        status: 'bebas_tanggungan' | 'ada_tanggungan';
        category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
        amount?: number;
        notes?: string;
      }> = {};

      data.workers.forEach(w => {
        disembarkMap[w.worker_id] = w.disembarked;
        clearanceMap[w.worker_id] = {
          status: w.clearance_status || 'bebas_tanggungan',
          category: w.tanggungan_category,
          amount: w.tanggungan_amount,
          notes: w.tanggungan_notes
        };
      });

      const res = this.createArrivalManifest({
        vessel_id: data.vessel_id,
        departure_manifest_id: data.departure_manifest_id,
        disembark_map: disembarkMap,
        clearance_map: clearanceMap,
        port: data.port,
        notes: data.notes
      });
      if (!res.success || !res.manifest) {
        throw new Error(res.error || 'Gagal membuat manifest kedatangan');
      }
      return res.manifest;
    }
  }

  /**
   * Legacy individual checkin logger
   */
  public logCheckinEvent(data: {
    worker_id: string;
    vessel_id: string;
    event_type: 'keluar' | 'masuk';
    port: string;
    timestamp: string;
    notes?: string;
  }): { success: boolean; event?: CheckinEvent; error?: string } {
    const worker = this.workers.find(w => w.id === data.worker_id);
    const vessel = this.vessels.find(v => v.id === data.vessel_id);

    if (!worker || !vessel) {
      return { success: false, error: 'Pekerja atau kapal tidak ditemukan.' };
    }

    // Update worker status
    const wIdx = this.workers.findIndex(w => w.id === data.worker_id);
    if (wIdx !== -1) {
      this.workers[wIdx] = {
        ...this.workers[wIdx],
        current_status: data.event_type === 'keluar' ? 'di_laut' : 'di_darat',
        last_vessel_id: vessel.id,
        last_vessel_name: vessel.name
      };
      this.saveWorkers();
    }

    const event: CheckinEvent = {
      id: `e-${Date.now()}`,
      worker_id: worker.id,
      worker_name: worker.name,
      worker_nik_last4: worker.nik_last4,
      vessel_id: vessel.id,
      vessel_name: vessel.name,
      event_type: data.event_type,
      timestamp: data.timestamp,
      port: data.port,
      recorded_by_user_id: this.currentUser.id,
      recorded_by_name: this.currentUser.name,
      recorded_by_role: this.currentUser.role,
      notes: data.notes
    };

    this.events.unshift(event);
    this.saveEvents();

    return { success: true, event };
  }

  /**
   * CREATE MANIFEST KEBERANGKATAN (Departure Manifest)
   * Multi-select workers boarding the ship
   */
  public createDepartureManifest(data: {
    vessel_id: string;
    worker_ids: string[];
    port: string;
    notes?: string;
  }): { success: boolean; manifest?: Manifest; error?: string } {
    if (!data.vessel_id) {
      return { success: false, error: 'Pilih kapal perikanan terlebih dahulu.' };
    }
    if (!data.worker_ids || data.worker_ids.length === 0) {
      return { success: false, error: 'Pilih minimal satu pekerja untuk dimasukkan ke dalam manifest keberangkatan.' };
    }

    const vessel = this.vessels.find(v => v.id === data.vessel_id);
    if (!vessel) {
      return { success: false, error: 'Kapal perikanan tidak ditemukan.' };
    }

    const manifestNumber = `MAN-KEBERANGKATAN-${new Date().getFullYear()}-${String(this.manifests.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const manifestWorkerItems: ManifestWorkerItem[] = [];

    // Process selected workers
    data.worker_ids.forEach(workerId => {
      const idx = this.workers.findIndex(w => w.id === workerId);
      if (idx !== -1) {
        const worker = this.workers[idx];
        
        // Update real-time status to 'di_laut'
        this.workers[idx] = {
          ...worker,
          current_status: 'di_laut',
          last_vessel_id: vessel.id,
          last_vessel_name: vessel.name
        };

        manifestWorkerItems.push({
          worker_id: worker.id,
          worker_name: worker.name,
          worker_nik_last4: worker.nik_last4,
          home_port: worker.home_port,
          disembarked: false
        });

        // Save legacy checkin_event for backward compatibility
        this.events.unshift({
          id: `e-${Date.now()}-${worker.id}`,
          worker_id: worker.id,
          worker_name: worker.name,
          worker_nik_last4: worker.nik_last4,
          vessel_id: vessel.id,
          vessel_name: vessel.name,
          event_type: 'keluar',
          timestamp: timestamp,
          port: data.port,
          recorded_by_user_id: this.currentUser.id,
          recorded_by_name: this.currentUser.name,
          recorded_by_role: this.currentUser.role,
          notes: `Manifest Keberangkatan (${manifestNumber}). ${data.notes || ''}`
        });
      }
    });

    const newManifest: Manifest = {
      id: `m-${Date.now()}`,
      manifest_number: manifestNumber,
      vessel_id: vessel.id,
      vessel_name: vessel.name,
      vessel_registration: vessel.registration_number,
      company_name: vessel.company_name,
      type: 'keberangkatan',
      timestamp: timestamp,
      port: data.port,
      recorded_by_user_id: this.currentUser.id,
      recorded_by_name: this.currentUser.name,
      recorded_by_role: this.currentUser.role,
      total_workers: manifestWorkerItems.length,
      workers: manifestWorkerItems,
      notes: data.notes
    };

    this.manifests.unshift(newManifest);
    const vIdx = this.vessels.findIndex(v => v.id === vessel.id);
    if (vIdx !== -1) {
      this.vessels[vIdx] = { ...this.vessels[vIdx], status: 'di_laut' };
      this.saveVessels();
    }
    this.saveWorkers();
    this.saveManifests();
    this.saveEvents();

    // Simpan otomatis manifest ke Supabase jika terhubung
    dbInsertManifest(newManifest).catch(err => console.log('Supabase sync manifest:', err));

    return { success: true, manifest: newManifest };
  }

  /**
   * CREATE MANIFEST KEDATANGAN (Arrival Manifest)
   * Bulk update: Checkbox workers disembarking ashore
   * AUTOMATIC DISCREPANCY DETECTION INCLUDED!
   */
  public createArrivalManifest(data: {
    vessel_id: string;
    departure_manifest_id?: string;
    disembark_map: Record<string, boolean>; // worker_id -> true (disembarked / turun) or false (stayed on ship)
    clearance_map?: Record<string, {
      status: 'bebas_tanggungan' | 'ada_tanggungan';
      category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
      amount?: number;
      notes?: string;
    }>;
    unlisted_worker_ids?: string[]; // Extra workers disembarking who were not on departure manifest!
    port: string;
    notes?: string;
  }): { success: boolean; manifest?: Manifest; discrepanciesDetected?: number; error?: string } {
    if (!data.vessel_id) {
      return { success: false, error: 'Pilih kapal perikanan terlebih dahulu.' };
    }

    const vessel = this.vessels.find(v => v.id === data.vessel_id);
    if (!vessel) {
      return { success: false, error: 'Kapal perikanan tidak ditemukan.' };
    }

    const departureManifest = data.departure_manifest_id 
      ? this.manifests.find(m => m.id === data.departure_manifest_id)
      : this.getLastDepartureManifest(vessel.id);

    const manifestNumber = `MAN-KEDATANGAN-${new Date().getFullYear()}-${String(this.manifests.length + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const manifestWorkerItems: ManifestWorkerItem[] = [];
    let discrepanciesDetected = 0;

    // Process departure manifest workers checklist
    if (departureManifest) {
      departureManifest.workers.forEach(depWorker => {
        const disembarked = !!data.disembark_map[depWorker.worker_id];
        const wIdx = this.workers.findIndex(w => w.id === depWorker.worker_id);

        if (wIdx !== -1) {
          const worker = this.workers[wIdx];
          
          if (disembarked) {
            const clrInfo = data.clearance_map?.[depWorker.worker_id] || { status: 'bebas_tanggungan' };
            const clearanceStatus: 'bebas_tanggungan' | 'ada_tanggungan' = clrInfo.status || 'bebas_tanggungan';
            const clearanceCategory = clrInfo.category;
            const clearanceAmount = clrInfo.amount;
            const clearanceNotes = clrInfo.notes;

            // Worker disembarked ashore -> update to 'di_darat' and free from vessel binding (bebas transfer)
            this.workers[wIdx] = {
              ...worker,
              current_status: 'di_darat',
              last_vessel_id: undefined,
              last_vessel_name: undefined,
              previous_vessel_name: vessel.name,
              clearance_status: clearanceStatus,
              tanggungan_category: clearanceCategory,
              tanggungan_amount: clearanceAmount,
              tanggungan_notes: clearanceNotes,
              clearance_updated_at: timestamp,
              clearance_by_vessel: vessel.name,
              clearance_by_company: vessel.company_name,
              clearance_by_name: this.currentUser.name
            };

            // Save Clearance Record audit
            this.clearanceRecords.unshift({
              id: `clr-${Date.now()}-${worker.id}`,
              worker_id: worker.id,
              worker_name: worker.name,
              worker_nik_last4: worker.nik_last4,
              vessel_id: vessel.id,
              vessel_name: vessel.name,
              company_name: vessel.company_name,
              port: data.port,
              timestamp: timestamp,
              status: clearanceStatus,
              category: clearanceCategory,
              amount: clearanceAmount,
              notes: clearanceNotes,
              recorded_by_name: this.currentUser.name
            });

            // Save Mobility Record for transfer history
            this.mobilityRecords.unshift({
              id: `mob-${Date.now()}-${worker.id}`,
              worker_id: worker.id,
              worker_name: worker.name,
              worker_nik_last4: worker.nik_last4,
              from_vessel_id: vessel.id,
              from_vessel_name: vessel.name,
              from_company_id: vessel.company_id,
              from_company_name: vessel.company_name,
              transfer_date: timestamp,
              reason: 'selesai_kontrak',
              notes: `Turun di darat (${data.port}) via ${manifestNumber}. Status: ${clearanceStatus === 'bebas_tanggungan' ? 'Bebas Tanggungan (Bebas Transfer)' : 'Ada Tanggungan: ' + (clearanceNotes || '-')}`,
              clearance_status: clearanceStatus === 'bebas_tanggungan' ? 'disetujui' : 'menunggu_klarifikasi',
              recorded_by_name: this.currentUser.name
            });

            // Legacy checkin event
            this.events.unshift({
              id: `e-${Date.now()}-${worker.id}`,
              worker_id: worker.id,
              worker_name: worker.name,
              worker_nik_last4: worker.nik_last4,
              vessel_id: vessel.id,
              vessel_name: vessel.name,
              event_type: 'masuk',
              timestamp: timestamp,
              port: data.port,
              recorded_by_user_id: this.currentUser.id,
              recorded_by_name: this.currentUser.name,
              recorded_by_role: this.currentUser.role,
              notes: `Manifest Kedatangan (${manifestNumber}). Turun ke darat. Status Clearance: ${clearanceStatus === 'bebas_tanggungan' ? 'Bersih (Bebas Transfer)' : 'Ada Tanggungan'}.`
            });
          } else {
            // Worker DID NOT disembark -> remains 'di_laut'
            // Trigger Discrepancy Check if voyage has been long or flagged
            const daysAtSea = Math.floor((new Date(timestamp).getTime() - new Date(departureManifest.timestamp).getTime()) / (1000 * 3600 * 24));
            
            // If worker hasn't disembarked and vessel was away > 30 days, flag warning for admin
            if (daysAtSea >= 30) {
              const discId = `disc-${Date.now()}-${worker.id}`;
              this.discrepancies.unshift({
                id: discId,
                type: 'overdue_at_sea',
                worker_id: worker.id,
                worker_name: worker.name,
                worker_nik_last4: worker.nik_last4,
                vessel_id: vessel.id,
                vessel_name: vessel.name,
                departure_manifest_id: departureManifest.id,
                departure_manifest_number: departureManifest.manifest_number,
                departure_date: departureManifest.timestamp,
                days_at_sea: daysAtSea,
                port: data.port,
                status: 'perlu_tinjauan',
                detected_at: timestamp,
                notes: `Pekerja belum dicentang turun setelah pelayaran ${daysAtSea} hari pada Manifest ${manifestNumber}. Perlu verifikasi admin & syahbandar.`
              });
              discrepanciesDetected++;
            }
          }

          manifestWorkerItems.push({
            worker_id: worker.id,
            worker_name: worker.name,
            worker_nik_last4: worker.nik_last4,
            home_port: worker.home_port,
            disembarked: disembarked,
            clearance_status: disembarked ? (data.clearance_map?.[depWorker.worker_id]?.status || 'bebas_tanggungan') : undefined,
            tanggungan_category: disembarked ? data.clearance_map?.[depWorker.worker_id]?.category : undefined,
            tanggungan_amount: disembarked ? data.clearance_map?.[depWorker.worker_id]?.amount : undefined,
            tanggungan_notes: disembarked ? data.clearance_map?.[depWorker.worker_id]?.notes : undefined
          });
        }
      });
    }

    // Process UNLISTED workers (Pekerja yang turun/ada di kapal tetapi TIDAK ada di manifest awal)
    if (data.unlisted_worker_ids && data.unlisted_worker_ids.length > 0) {
      data.unlisted_worker_ids.forEach(unlistedId => {
        const wIdx = this.workers.findIndex(w => w.id === unlistedId);
        if (wIdx !== -1) {
          const worker = this.workers[wIdx];

          // Update status to 'di_darat' and release to transfer pool
          this.workers[wIdx] = {
            ...worker,
            current_status: 'di_darat',
            last_vessel_id: undefined,
            last_vessel_name: undefined,
            previous_vessel_name: vessel.name,
            clearance_status: 'bebas_tanggungan',
            clearance_updated_at: timestamp,
            clearance_by_vessel: vessel.name,
            clearance_by_name: this.currentUser.name
          };

          manifestWorkerItems.push({
            worker_id: worker.id,
            worker_name: worker.name,
            worker_nik_last4: worker.nik_last4,
            home_port: worker.home_port,
            disembarked: true,
            clearance_status: 'bebas_tanggungan',
            notes: '⚠️ TIDAK TERCATAT DI MANIFEST KEBERANGKATAN AWAL'
          });

          // FLAG CRITICAL ANOMALY FOR ADMIN
          this.discrepancies.unshift({
            id: `disc-${Date.now()}-${worker.id}`,
            type: 'unlisted_on_departure',
            worker_id: worker.id,
            worker_name: worker.name,
            worker_nik_last4: worker.nik_last4,
            vessel_id: vessel.id,
            vessel_name: vessel.name,
            port: data.port,
            status: 'perlu_tinjauan',
            detected_at: timestamp,
            notes: `Pekerja ${worker.name} (****${worker.nik_last4}) ditemukan saat kedatangan kapal ${vessel.name} di ${data.port}, tetapi TIDAK tercatat di manifest keberangkatan resmi manapun. Potensi indikasi pekerja tidak berdokumen/tidak terdaftar.`
          });
          discrepanciesDetected++;

          // Legacy checkin event
          this.events.unshift({
            id: `e-${Date.now()}-${worker.id}`,
            worker_id: worker.id,
            worker_name: worker.name,
            worker_nik_last4: worker.nik_last4,
            vessel_id: vessel.id,
            vessel_name: vessel.name,
            event_type: 'masuk',
            timestamp: timestamp,
            port: data.port,
            recorded_by_user_id: this.currentUser.id,
            recorded_by_name: this.currentUser.name,
            recorded_by_role: this.currentUser.role,
            notes: `Manifest Kedatangan (${manifestNumber}). [ANOMALI: Tidak tercatat saat berangkat]`
          });
        }
      });
    }

    const newManifest: Manifest = {
      id: `m-${Date.now()}`,
      manifest_number: manifestNumber,
      vessel_id: vessel.id,
      vessel_name: vessel.name,
      vessel_registration: vessel.registration_number,
      company_name: vessel.company_name,
      type: 'kedatangan',
      departure_manifest_id: departureManifest?.id,
      timestamp: timestamp,
      port: data.port,
      recorded_by_user_id: this.currentUser.id,
      recorded_by_name: this.currentUser.name,
      recorded_by_role: this.currentUser.role,
      total_workers: manifestWorkerItems.length,
      workers: manifestWorkerItems,
      notes: data.notes
    };

    this.manifests.unshift(newManifest);
    const vIdx = this.vessels.findIndex(v => v.id === vessel.id);
    if (vIdx !== -1) {
      this.vessels[vIdx] = { ...this.vessels[vIdx], status: 'sandar' };
    }
    
    // Update vessel active crew counts
    this.vessels = this.vessels.map(v => ({
      ...v,
      active_crew_count: this.workers.filter(w => w.last_vessel_id === v.id).length
    }));
    this.saveVessels();

    this.saveWorkers();
    this.saveManifests();
    this.saveDiscrepancies();
    this.saveEvents();
    this.saveMobility();
    this.saveClearances();

    // Simpan otomatis manifest kedatangan ke Supabase jika terhubung
    dbInsertManifest(newManifest).catch(err => console.log('Supabase sync manifest arrival:', err));

    return { 
      success: true, 
      manifest: newManifest, 
      discrepanciesDetected 
    };
  }

  /**
   * Get all clearance records across the association
   */
  public getClearanceRecords(): ClearanceRecord[] {
    return [...this.clearanceRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get clearance history for a specific worker
   */
  public getWorkerClearanceRecords(workerId: string): ClearanceRecord[] {
    return this.clearanceRecords
      .filter(c => c.worker_id === workerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Resolve / clear an active liability (tanggungan) for a worker
   */
  public resolveWorkerClearance(
    workerId: string, 
    resolutionNotes: string
  ): { success: boolean; worker?: Worker; error?: string } {
    const wIdx = this.workers.findIndex(w => w.id === workerId);
    if (wIdx === -1) {
      return { success: false, error: 'Pekerja tidak ditemukan.' };
    }

    const worker = this.workers[wIdx];
    const timestamp = new Date().toISOString();

    // Mark worker clearance as clean / bebas_tanggungan
    this.workers[wIdx] = {
      ...worker,
      clearance_status: 'bebas_tanggungan',
      tanggungan_category: undefined,
      tanggungan_amount: undefined,
      tanggungan_notes: `Telah diselesaikan pada ${new Date(timestamp).toLocaleDateString('id-ID')}: ${resolutionNotes}`,
      clearance_updated_at: timestamp,
      clearance_by_name: this.currentUser.name
    };
    this.saveWorkers();

    // Update active clearance record if found
    const clrIdx = this.clearanceRecords.findIndex(c => c.worker_id === workerId && c.status === 'ada_tanggungan');
    if (clrIdx !== -1) {
      this.clearanceRecords[clrIdx] = {
        ...this.clearanceRecords[clrIdx],
        status: 'diselesaikan',
        resolution_notes: resolutionNotes,
        resolved_at: timestamp,
        resolved_by_name: this.currentUser.name
      };
      this.saveClearances();
    }

    return { success: true, worker: this.workers[wIdx] };
  }

  /**
   * Update Admin Discrepancy Status
   */
  public resolveDiscrepancy(id: string, status: 'diverifikasi_aman' | 'dalam_penyelidikan', notes?: string) {
    const idx = this.discrepancies.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.discrepancies[idx] = {
        ...this.discrepancies[idx],
        status,
        notes: notes ? `${this.discrepancies[idx].notes} | Catatan Admin: ${notes}` : this.discrepancies[idx].notes
      };
      this.saveDiscrepancies();
    }
  }

  // Search Workers by name or last 4 digits of NIK
  public searchWorkers(query: string): Worker[] {
    if (!query.trim()) return this.getWorkers();
    const q = query.toLowerCase().trim();
    return this.workers.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.nik_last4.includes(q) ||
      w.home_port.toLowerCase().includes(q)
    );
  }

  // Get events history for specific worker
  public getWorkerEvents(workerId: string): CheckinEvent[] {
    return this.events
      .filter(e => e.worker_id === workerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get Dashboard metrics for Association
  public getMetrics(): DashboardMetrics {
    const highMobilityWorkers = this.workers.filter(w => {
      const records = this.mobilityRecords.filter(m => m.worker_id === w.id);
      return records.length >= 2 || (w.transfer_count && w.transfer_count >= 2);
    });

    const activeDuplicates = this.duplicateAlerts.filter(d => d.status === 'aktif');

    return {
      totalWorkers: this.workers.length,
      workersAtSea: this.workers.filter(w => w.current_status === 'di_laut').length,
      workersAshore: this.workers.filter(w => w.current_status === 'di_darat').length,
      totalVessels: this.vessels.length,
      totalCompanies: this.companies.length,
      totalManifests: this.manifests.length,
      duplicateAlertsCount: activeDuplicates.length,
      highMobilityCount: highMobilityWorkers.length,
      redRatingCount: this.workers.filter(w => w.performance_rating === 'merah').length,
      yellowRatingCount: this.workers.filter(w => w.performance_rating === 'kuning').length,
      greenRatingCount: this.workers.filter(w => (w.performance_rating || 'hijau') === 'hijau').length
    };
  }

  // --- MOBILITY & ANTI-DUPLICATION API ---

  /**
   * Get all worker transfer / mobility logs across association vessels
   */
  public getMobilityRecords(): WorkerMobilityRecord[] {
    return [...this.mobilityRecords].sort(
      (a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime()
    );
  }

  /**
   * Get mobility history for a single worker
   */
  public getWorkerMobilityRecords(workerId: string): WorkerMobilityRecord[] {
    return this.mobilityRecords
      .filter(m => m.worker_id === workerId)
      .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime());
  }

  /**
   * Get all crew duplication conflict alerts
   */
  public getDuplicateAlerts(): CrewDuplicationAlert[] {
    return [...this.duplicateAlerts].sort(
      (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );
  }

  /**
   * Create a new crew duplication conflict alert
   */
  public createDuplicateAlert(data: {
    worker_id: string;
    worker_name: string;
    worker_nik_last4: string;
    worker_phone?: string;
    primary_vessel_id: string;
    primary_vessel_name: string;
    primary_company_name: string;
    conflicting_vessel_id: string;
    conflicting_vessel_name: string;
    conflicting_company_name: string;
    conflict_type: 'double_booking' | 'at_sea_conflict' | 'unreleased_contract';
    resolution_notes?: string;
  }): CrewDuplicationAlert {
    const newAlert: CrewDuplicationAlert = {
      id: `alert-dup-${Date.now()}`,
      worker_id: data.worker_id,
      worker_name: data.worker_name,
      worker_nik_last4: data.worker_nik_last4,
      worker_phone: data.worker_phone || '081234567890',
      primary_vessel_id: data.primary_vessel_id,
      primary_vessel_name: data.primary_vessel_name,
      primary_company_name: data.primary_company_name,
      conflicting_vessel_id: data.conflicting_vessel_id,
      conflicting_vessel_name: data.conflicting_vessel_name,
      conflicting_company_name: data.conflicting_company_name,
      conflict_type: data.conflict_type,
      detected_at: new Date().toISOString(),
      status: 'aktif',
      resolution_notes: data.resolution_notes || 'Pekerja diajukan masuk manifest kapal baru saat masih terikat di kapal lain.'
    };

    this.duplicateAlerts.unshift(newAlert);
    this.saveDuplicates();

    // Simpan otomatis ke Supabase jika terhubung
    dbInsertDuplicateAlert(newAlert).catch(err => console.log('Supabase sync alert:', err));

    return newAlert;
  }

  /**
   * Reset or re-seed sample duplicate alerts for testing
   */
  public resetDuplicateAlertsToDefault() {
    this.duplicateAlerts = [
      ...INITIAL_DUPLICATE_ALERTS.map(a => ({ ...a, status: 'aktif' as const, id: `alert-dup-${Date.now()}` }))
    ];
    this.saveDuplicates();
  }

  /**
   * Resolve an alert after PICs communicate & clarify
   */
  public resolveDuplicateAlert(alertId: string, resolutionNotes: string): { success: boolean; error?: string } {
    const idx = this.duplicateAlerts.findIndex(a => a.id === alertId);
    if (idx === -1) {
      return { success: false, error: 'Peringatan duplikasi tidak ditemukan.' };
    }

    this.duplicateAlerts[idx] = {
      ...this.duplicateAlerts[idx],
      status: 'diselesaikan',
      resolution_notes: resolutionNotes
    };
    this.saveDuplicates();

    return { success: true };
  }

  /**
   * Check if adding a worker to targetVessel creates a duplication or conflict
   * Crucial anti-duplication engine rule!
   */
  public checkCrewConflict(workerId: string, targetVesselId: string): {
    hasConflict: boolean;
    conflictType?: 'at_sea_conflict' | 'double_booking';
    currentVesselName?: string;
    currentCompanyName?: string;
    message?: string;
  } {
    const worker = this.workers.find(w => w.id === workerId);
    const targetVessel = this.vessels.find(v => v.id === targetVesselId);
    if (!worker || !targetVessel) {
      return { hasConflict: false };
    }

    // Rule 1: Worker is already marked 'di_laut' on another vessel
    if (worker.current_status === 'di_laut' && worker.last_vessel_id && worker.last_vessel_id !== targetVesselId) {
      const currentVessel = this.vessels.find(v => v.id === worker.last_vessel_id);
      return {
        hasConflict: true,
        conflictType: 'at_sea_conflict',
        currentVesselName: currentVessel?.name || worker.last_vessel_name || 'Kapal Lain',
        currentCompanyName: currentVessel?.company_name || 'Perusahaan Lain',
        message: `⚠️ PERINGATAN DUPLIKASI: Pekerja ${worker.name} (****${worker.nik_last4}) saat ini berstatus AKTIF DI LAUT pada ${currentVessel?.name || worker.last_vessel_name} (${currentVessel?.company_name}). Pekerja tidak boleh didaftarkan berlayar di kapal lain sebelum ada manifest kedatangan atau surat pelepasan resmi!`
      };
    }

    // Rule 2: Worker is assigned to another vessel of a different member company without sign-off
    if (worker.last_vessel_id && worker.last_vessel_id !== targetVesselId) {
      const currentVessel = this.vessels.find(v => v.id === worker.last_vessel_id);
      if (currentVessel && currentVessel.company_id !== targetVessel.company_id) {
        return {
          hasConflict: true,
          conflictType: 'double_booking',
          currentVesselName: currentVessel.name,
          currentCompanyName: currentVessel.company_name,
          message: `ℹ️ KONFIRMASI MUTASI: Pekerja ${worker.name} (****${worker.nik_last4}) sebelumnya terdaftar di ${currentVessel.name} milik ${currentVessel.company_name}. Pendaftaran ini akan mencatat perpindahan kapal antar-perusahaan dalam asosiasi.`
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Transfer worker between vessels / companies with audit log & mobility record
   */
  public transferWorkerVessel(data: {
    workerId: string;
    toVesselId: string;
    reason: 'selesai_kontrak' | 'mutasi_armada' | 'permintaan_pribadi' | 'rotasi_kru' | 'lainnya';
    notes?: string;
    clearanceStatus: 'disetujui' | 'menunggu_klarifikasi' | 'tanpa_pelepasan';
  }): { success: boolean; worker?: Worker; record?: WorkerMobilityRecord; error?: string } {
    const wIdx = this.workers.findIndex(w => w.id === data.workerId);
    const toVessel = this.vessels.find(v => v.id === data.toVesselId);
    if (wIdx === -1) return { success: false, error: 'Pekerja tidak ditemukan.' };
    if (!toVessel) return { success: false, error: 'Kapal tujuan tidak ditemukan.' };

    const worker = this.workers[wIdx];
    const fromVessel = worker.last_vessel_id ? this.vessels.find(v => v.id === worker.last_vessel_id) : undefined;
    const toCompany = this.companies.find(c => c.id === toVessel.company_id);

    // Create mobility record
    const mobilityRecord: WorkerMobilityRecord = {
      id: `mob-${Date.now()}`,
      worker_id: worker.id,
      worker_name: worker.name,
      worker_nik_last4: worker.nik_last4,
      from_vessel_id: fromVessel?.id,
      from_vessel_name: fromVessel?.name || worker.last_vessel_name,
      from_company_id: fromVessel?.company_id,
      from_company_name: fromVessel?.company_name || worker.pkl_company_name,
      to_vessel_id: toVessel.id,
      to_vessel_name: toVessel.name,
      to_company_id: toVessel.company_id,
      to_company_name: toVessel.company_name,
      transfer_date: new Date().toISOString(),
      reason: data.reason,
      notes: data.notes,
      clearance_status: data.clearanceStatus,
      recorded_by_name: this.currentUser.name
    };

    this.mobilityRecords.unshift(mobilityRecord);
    this.saveMobility();

    // Simpan otomatis ke Supabase jika terhubung
    dbInsertMobility(mobilityRecord).catch(err => console.log('Supabase sync mobility:', err));

    // Update worker current vessel & company
    const currentTransfers = (worker.transfer_count || 0) + 1;
    this.workers[wIdx] = {
      ...worker,
      last_vessel_id: toVessel.id,
      last_vessel_name: toVessel.name,
      company_id: toVessel.company_id,
      company_name: toVessel.company_name,
      transfer_count: currentTransfers
    };
    this.saveWorkers();

    // If there were any active duplicate alerts for this worker, resolve them
    this.duplicateAlerts = this.duplicateAlerts.map(alert => {
      if (alert.worker_id === worker.id && alert.status === 'aktif') {
        return {
          ...alert,
          status: 'diselesaikan',
          resolution_notes: `Diselesaikan melalui perpindahan resmi ke ${toVessel.name} (${data.reason}) oleh ${this.currentUser.name}`
        };
      }
      return alert;
    });
    this.saveDuplicates();

    return { success: true, worker: this.workers[wIdx], record: mobilityRecord };
  }

  /**
   * Get workers associated with a specific vessel
   * STRICT ANTI-DUPLICATION RULE: A worker can only be actively assigned to at most ONE vessel at any time.
   * Historical manifests do not leak a worker into another vessel's active crew list.
   */
  public getWorkersByVessel(vesselId: string): Worker[] {
    const vessel = this.vessels.find(v => v.id === vesselId);
    if (!vessel) return [];

    return this.workers.filter(w => {
      // 1. If explicit last_vessel_id is set, it is the sole authority
      if (w.last_vessel_id) {
        return w.last_vessel_id === vesselId;
      }
      // 2. If last_vessel_id is empty, but last_vessel_name matches and no conflict
      if (w.last_vessel_name && vessel.name) {
        return w.last_vessel_name.toLowerCase().trim() === vessel.name.toLowerCase().trim();
      }
      return false;
    });
  }

  /**
   * Update worker attributes and documents (PKL, Sertifikasi, BPJS, Kinerja)
   */
  public updateWorkerAttributes(workerId: string, attributes: Partial<Worker>): { success: boolean; worker?: Worker; error?: string } {
    const idx = this.workers.findIndex(w => w.id === workerId);
    if (idx === -1) {
      return { success: false, error: 'Pekerja tidak ditemukan.' };
    }

    this.workers[idx] = {
      ...this.workers[idx],
      ...attributes
    };
    this.saveWorkers();

    return { success: true, worker: this.workers[idx] };
  }

  /**
   * Assign or transfer a worker to a vessel
   * Automatically validates to prevent assigning a worker who is currently at sea on another vessel!
   * Logs mobility history if transferred from another vessel.
   */
  public assignWorkerToVessel(workerId: string, vesselId: string): { success: boolean; worker?: Worker; error?: string } {
    const wIdx = this.workers.findIndex(w => w.id === workerId);
    const vessel = this.vessels.find(v => v.id === vesselId);
    if (wIdx === -1) {
      return { success: false, error: 'Pekerja tidak ditemukan.' };
    }
    if (!vessel) {
      return { success: false, error: 'Kapal perikanan tidak ditemukan.' };
    }

    const worker = this.workers[wIdx];

    // CRITICAL ANTI-DUPLICATION RULE:
    // If worker is currently 'di_laut' on another vessel, forbid re-assignment!
    if (worker.current_status === 'di_laut' && worker.last_vessel_id && worker.last_vessel_id !== vesselId) {
      const currentVessel = this.vessels.find(v => v.id === worker.last_vessel_id);
      return {
        success: false,
        error: `Pekerja ${worker.name} saat ini aktif berlayar di laut pada kapal ${currentVessel?.name || worker.last_vessel_name}. Pekerja harus dicatat tiba di manifest kedatangan terlebih dahulu sebelum dapat ditugaskan ke kapal lain!`
      };
    }

    // If transferring from another vessel, log mobility audit
    if (worker.last_vessel_id && worker.last_vessel_id !== vesselId) {
      const fromVessel = this.vessels.find(v => v.id === worker.last_vessel_id);
      this.mobilityRecords.unshift({
        id: `mob-${Date.now()}`,
        worker_id: worker.id,
        worker_name: worker.name,
        worker_nik_last4: worker.nik_last4,
        from_vessel_id: fromVessel?.id,
        from_vessel_name: fromVessel?.name || worker.last_vessel_name,
        from_company_id: fromVessel?.company_id,
        from_company_name: fromVessel?.company_name || worker.pkl_company_name,
        to_vessel_id: vessel.id,
        to_vessel_name: vessel.name,
        to_company_id: vessel.company_id,
        to_company_name: vessel.company_name,
        transfer_date: new Date().toISOString(),
        reason: 'mutasi_armada',
        notes: `Penugasan pindah armada ke kapal ${vessel.name}`,
        clearance_status: 'disetujui',
        recorded_by_name: this.currentUser.name
      });
      this.saveMobility();
    }

    this.workers[wIdx] = {
      ...this.workers[wIdx],
      last_vessel_id: vessel.id,
      last_vessel_name: vessel.name,
      company_id: vessel.company_id,
      company_name: vessel.company_name,
      transfer_count: (worker.transfer_count || 0) + (worker.last_vessel_id && worker.last_vessel_id !== vesselId ? 1 : 0)
    };
    this.saveWorkers();

    // Update vessel active crew counts
    this.vessels = this.vessels.map(v => ({
      ...v,
      active_crew_count: this.workers.filter(w => w.last_vessel_id === v.id).length
    }));
    this.saveVessels();

    return { success: true, worker: this.workers[wIdx] };
  }

  /**
   * Unassign worker from a vessel, returning them to the unassigned ashore pool
   * Only allowed when worker is 'di_darat' (not currently at sea)
   */
  public unassignWorkerFromVessel(
    workerId: string,
    reason?: 'selesai_kontrak' | 'mutasi_armada' | 'permintaan_pribadi' | 'rotasi_kru' | 'lainnya',
    notes?: string
  ): { success: boolean; worker?: Worker; error?: string } {
    const wIdx = this.workers.findIndex(w => w.id === workerId);
    if (wIdx === -1) {
      return { success: false, error: 'Pekerja tidak ditemukan.' };
    }

    const worker = this.workers[wIdx];
    if (worker.current_status === 'di_laut') {
      return {
        success: false,
        error: `Pekerja ${worker.name} saat ini sedang aktif berlayar di laut. Catat kepulangan pada manifest kedatangan terlebih dahulu sebelum melepas penugasan.`
      };
    }

    const fromVessel = worker.last_vessel_id 
      ? this.vessels.find(v => v.id === worker.last_vessel_id) 
      : (worker.last_vessel_name ? this.vessels.find(v => v.name.toLowerCase() === worker.last_vessel_name?.toLowerCase()) : undefined);

    const vesselName = fromVessel?.name || worker.last_vessel_name;
    const companyName = fromVessel?.company_name || worker.company_name || worker.pkl_company_name;

    this.mobilityRecords.unshift({
      id: `mob-${Date.now()}`,
      worker_id: worker.id,
      worker_name: worker.name,
      worker_nik_last4: worker.nik_last4,
      from_vessel_id: fromVessel?.id || worker.last_vessel_id,
      from_vessel_name: vesselName,
      from_company_id: fromVessel?.company_id || worker.company_id,
      from_company_name: companyName,
      to_vessel_id: undefined,
      to_vessel_name: undefined,
      to_company_id: undefined,
      to_company_name: undefined,
      transfer_date: new Date().toISOString(),
      reason: reason || 'selesai_kontrak',
      notes: notes || `Resmi dilepas dari hubungan kerja kapal ${vesselName || '-'} dan perusahaan ${companyName || '-'}. Status pekerja kembali bebas tugas di darat.`,
      clearance_status: 'disetujui',
      recorded_by_name: this.currentUser.name
    });
    this.saveMobility();

    this.workers[wIdx] = {
      ...worker,
      last_vessel_id: undefined,
      last_vessel_name: undefined,
      company_id: undefined,
      company_name: undefined,
      pkl_company_name: undefined,
      pkl_status: 'belum_ada',
      current_status: 'di_darat',
      previous_vessel_name: vesselName,
      previous_company_name: companyName,
      clearance_status: 'bebas_tanggungan',
      tanggungan_notes: notes ? `Pelepasan tugas: ${notes}` : undefined
    };
    this.saveWorkers();

    // Update vessel active crew counts
    this.vessels = this.vessels.map(v => ({
      ...v,
      active_crew_count: this.workers.filter(w => w.last_vessel_id === v.id).length
    }));
    this.saveVessels();

    return { success: true, worker: this.workers[wIdx] };
  }

  /**
   * Register a new member company to the association
   */
  public addCompany(data: {
    name: string;
    code: string;
    license_number?: string;
    pic_name?: string;
    pic_role?: string;
    pic_phone?: string;
    pic_email?: string;
    address?: string;
    initialVessel?: {
      name: string;
      registration_number?: string;
      gross_tonnage?: number;
      home_port?: string;
      captain_name?: string;
    };
  }): { success: boolean; company?: Company; vessel?: Vessel; error?: string } {
    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      return { success: false, error: 'Nama perusahaan minimal 3 karakter.' };
    }

    const cleanCode = (data.code || trimmedName.substring(0, 3)).trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kode anggota perusahaan wajib diisi.' };
    }

    // Check duplicate code or name
    if (this.companies.some(c => c.code.toUpperCase() === cleanCode)) {
      return { success: false, error: `Kode anggota "${cleanCode}" sudah digunakan oleh perusahaan anggota lain.` };
    }

    if (this.companies.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `Perusahaan dengan nama "${trimmedName}" sudah terdaftar dalam asosiasi.` };
    }

    const newCompany: Company = {
      id: `c-${Date.now()}`,
      name: trimmedName,
      code: cleanCode,
      license_number: data.license_number?.trim() || `SIUP-KKP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pic_name: data.pic_name?.trim() || 'Staf Operasional',
      pic_role: data.pic_role?.trim() || 'Koordinator Personel & Kru',
      pic_phone: data.pic_phone?.trim() || '0812-3456-7890',
      pic_email: data.pic_email?.trim() || `ops@${cleanCode.toLowerCase()}.id`,
      address: data.address?.trim() || 'Kawasan Pelabuhan Perikanan',
      created_at: new Date().toISOString()
    };

    this.companies.push(newCompany);
    this.saveCompanies();

    let createdVessel: Vessel | undefined;

    // Optional initial vessel registration
    if (data.initialVessel && data.initialVessel.name && data.initialVessel.name.trim()) {
      createdVessel = {
        id: `v-${Date.now()}`,
        name: data.initialVessel.name.trim(),
        registration_number: data.initialVessel.registration_number?.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
        gross_tonnage: Number(data.initialVessel.gross_tonnage) || 30,
        company_id: newCompany.id,
        company_name: newCompany.name,
        home_port: data.initialVessel.home_port?.trim() || INDONESIAN_PORTS[0],
        captain_name: data.initialVessel.captain_name?.trim() || 'Capt. Belum Ditentukan',
        status: 'sandar',
        active_crew_count: 0
      };
      this.vessels.push(createdVessel);
      this.saveVessels();
    }

    return { 
      success: true, 
      company: newCompany, 
      vessel: createdVessel 
    };
  }

  /**
   * Register a new vessel for a company
   */
  public addVessel(data: {
    name: string;
    registration_number?: string;
    gross_tonnage?: number;
    company_id: string;
    home_port?: string;
    captain_name?: string;
  }): { success: boolean; vessel?: Vessel; error?: string } {
    const comp = this.companies.find(c => c.id === data.company_id);
    if (!comp) {
      return { success: false, error: 'Perusahaan pemilik kapal tidak ditemukan.' };
    }

    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Nama kapal minimal 2 karakter.' };
    }

    const newVessel: Vessel = {
      id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: trimmedName,
      registration_number: data.registration_number?.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
      gross_tonnage: Number(data.gross_tonnage) || 30,
      company_id: comp.id,
      company_name: comp.name,
      home_port: data.home_port?.trim() || INDONESIAN_PORTS[0],
      captain_name: data.captain_name?.trim() || 'Capt. Belum Ditentukan',
      status: 'sandar',
      active_crew_count: 0
    };

    this.vessels.push(newVessel);
    this.saveVessels();
    return { success: true, vessel: newVessel };
  }

  /**
   * Bulk register multiple vessels for a company (from Excel / CSV)
   */
  public addVesselsBulk(
    companyId: string, 
    vesselsData: Array<{
      name: string;
      registration_number?: string;
      gross_tonnage?: number;
      home_port?: string;
      captain_name?: string;
    }>
  ): { success: boolean; addedVessels: Vessel[]; errors: string[] } {
    const comp = this.companies.find(c => c.id === companyId);
    if (!comp) {
      return { success: false, addedVessels: [], errors: ['Perusahaan tidak ditemukan.'] };
    }

    const addedVessels: Vessel[] = [];
    const errors: string[] = [];
    let counter = 0;

    for (const item of vesselsData) {
      counter++;
      const trimmedName = item.name?.trim();
      if (!trimmedName || trimmedName.length < 2) {
        errors.push(`Baris ${counter}: Nama kapal tidak valid / kosong.`);
        continue;
      }

      // Check if duplicate vessel name in the same company
      const existingInCompany = this.vessels.some(
        v => v.company_id === companyId && v.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existingInCompany) {
        errors.push(`Baris ${counter}: Kapal "${trimmedName}" sudah terdaftar pada armada perusahaan ini.`);
        continue;
      }

      const newVessel: Vessel = {
        id: `v-${Date.now()}-${counter}-${Math.floor(Math.random() * 1000)}`,
        name: trimmedName,
        registration_number: item.registration_number?.trim() || `SIPI.${Math.floor(100 + Math.random() * 900)}/KKP/${new Date().getFullYear()}`,
        gross_tonnage: Number(item.gross_tonnage) || 30,
        company_id: comp.id,
        company_name: comp.name,
        home_port: item.home_port?.trim() || INDONESIAN_PORTS[0],
        captain_name: item.captain_name?.trim() || 'Capt. Belum Ditentukan',
        status: 'sandar',
        active_crew_count: 0
      };

      this.vessels.push(newVessel);
      addedVessels.push(newVessel);
    }

    if (addedVessels.length > 0) {
      this.saveVessels();
    }

    return {
      success: addedVessels.length > 0,
      addedVessels,
      errors
    };
  }
}

export const store = new DataStore();
