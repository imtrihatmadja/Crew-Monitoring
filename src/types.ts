export type WorkerStatus = 'di_darat' | 'di_laut';

export type UserRole = 'syahbandar' | 'admin' | 'company' | 'worker';

export type ManifestType = 'keberangkatan' | 'kedatangan';

export type NavTab = 
  | 'dashboard' 
  | 'anti-duplication' 
  | 'mobility' 
  | 'manifest-log' 
  | 'workers' 
  | 'register' 
  | 'directory' 
  | 'history';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  port: string;
  company_id?: string;
  company_name?: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  license_number: string;
  pic_name: string;
  pic_role: string;
  pic_phone: string;
  pic_email: string;
  address: string;
  created_at: string;
}

export interface Vessel {
  id: string;
  name: string;
  registration_number: string; // SIPI / Gross Tonnage reg
  gross_tonnage: number;
  company_id: string;
  company_name: string;
  home_port: string;
  captain_name?: string;
  status: 'di_laut' | 'sandar';
  active_crew_count?: number;
}

export interface WorkerMobilityRecord {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  from_vessel_id?: string;
  from_vessel_name?: string;
  from_company_id?: string;
  from_company_name?: string;
  to_vessel_id?: string;
  to_vessel_name?: string;
  to_company_id?: string;
  to_company_name?: string;
  transfer_date: string;
  reason: 'selesai_kontrak' | 'mutasi_armada' | 'permintaan_pribadi' | 'rotasi_kru' | 'lainnya';
  notes?: string;
  clearance_status: 'disetujui' | 'menunggu_klarifikasi' | 'tanpa_pelepasan';
  recorded_by_name: string;
}

export interface CrewDuplicationAlert {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  worker_phone: string;
  primary_vessel_id: string;
  primary_vessel_name: string;
  primary_company_name: string;
  conflicting_vessel_id: string;
  conflicting_vessel_name: string;
  conflicting_company_name: string;
  conflict_type: 'double_booking' | 'at_sea_conflict' | 'unreleased_contract';
  detected_at: string;
  status: 'aktif' | 'diselesaikan';
  resolution_notes?: string;
}

export interface Worker {
  id: string;
  name: string;
  nik_hash: string;       // SHA-256 hash for secure DB lookup
  nik_last4: string;      // Only 4 digits saved plain text for UI display (UU PDP Compliant)
  dob: string;            // YYYY-MM-DD
  phone: string;
  home_port: string;
  current_status: WorkerStatus; // 'di_darat' (ashore) or 'di_laut' (at sea)
  last_vessel_id?: string;
  last_vessel_name?: string;
  company_id?: string;
  company_name?: string;
  created_at: string;

  // Atribut & Jabatan
  position?: string; // e.g., Nahkoda, KKM, Juru Mudi, Kelasi
  performance_rating?: 'hijau' | 'kuning' | 'merah'; // Rating Kinerja (Hijau: Baik, Kuning: Tinjauan, Merah: Pelanggaran)
  performance_notes?: string;
  transfer_count?: number; // Jumlah perpindahan kapal dalam 6-12 bulan terakhir

  // PKL (Perjanjian Kerja Laut)
  pkl_number?: string;
  pkl_start_date?: string;
  pkl_expiry_date?: string;
  pkl_company_name?: string;
  pkl_status?: 'aktif' | 'kadaluarsa' | 'belum_ada';

  // Sertifikasi & Buku Pelaut
  bst_number?: string; // Basic Safety Training
  bst_expiry?: string;
  seaman_book_number?: string; // Buku Pelaut
  seaman_book_expiry?: string;
  passport_number?: string;
  passport_expiry?: string;
  competency_cert?: string; // ANKAPIN / SKK / Sertifikat Keahlian
  mcu_status?: 'layak' | 'perlu_evaluasi' | 'tidak_layak' | 'belum_mcu'; // Medical Check Up Kesehatan Laut

  // BPJS & Jaminan Sosial
  bpjs_tk_number?: string; // BPJS Ketenagakerjaan
  bpjs_tk_active?: boolean;
  bpjs_kes_number?: string; // BPJS Kesehatan
  bpjs_kes_active?: boolean;

  // Status Clearance & Tanggungan Kepulangan (Laut ke Darat)
  clearance_status?: 'bebas_tanggungan' | 'ada_tanggungan';
  tanggungan_category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
  tanggungan_amount?: number; // Nominal tanggungan jika ada (Rp)
  tanggungan_notes?: string;  // Catatan detail tanggungan atau kewajiban
  clearance_updated_at?: string;
  clearance_by_vessel?: string;
  clearance_by_company?: string;
  clearance_by_name?: string;
  previous_vessel_name?: string;
  previous_company_name?: string;
}

export interface ClearanceRecord {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  vessel_id: string;
  vessel_name: string;
  company_name: string;
  port: string;
  timestamp: string;
  status: 'bebas_tanggungan' | 'ada_tanggungan' | 'diselesaikan';
  category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
  amount?: number;
  notes?: string;
  recorded_by_name: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by_name?: string;
}

export interface ManifestWorkerItem {
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  home_port: string;
  disembarked: boolean; // Relevant for kedatangan: true if disembarked to land, false if stayed on ship
  clearance_status?: 'bebas_tanggungan' | 'ada_tanggungan';
  tanggungan_category?: 'kasbon_pinjaman' | 'alat_kapal' | 'sengketa_kontrak' | 'gaji_bagi_hasil' | 'dokumen_kapal' | 'lainnya';
  tanggungan_amount?: number;
  tanggungan_notes?: string;
  notes?: string;
}

export interface Manifest {
  id: string;
  manifest_number: string; // e.g. MAN-DEPART-2026-001
  vessel_id: string;
  vessel_name: string;
  vessel_registration: string;
  company_name: string;
  type: ManifestType; // 'keberangkatan' | 'kedatangan'
  departure_manifest_id?: string; // Linked departure manifest ID for kedatangan
  timestamp: string;  // ISO String
  port: string;
  recorded_by_user_id: string;
  recorded_by_name: string;
  recorded_by_role: UserRole;
  total_workers: number;
  workers: ManifestWorkerItem[];
  notes?: string;
}

// Backward-compatible Legacy Event interface
export interface CheckinEvent {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  vessel_id: string;
  vessel_name: string;
  event_type: 'keluar' | 'masuk';
  timestamp: string;
  port: string;
  recorded_by_user_id: string;
  recorded_by_name: string;
  recorded_by_role: UserRole;
  manifest_id?: string;
  notes?: string;
}

// Discrepancy / Anomaly item for Admin Review
export interface ManifestDiscrepancy {
  id: string;
  type: 'overdue_at_sea' | 'unlisted_on_departure';
  worker_id: string;
  worker_name: string;
  worker_nik_last4: string;
  vessel_id: string;
  vessel_name: string;
  departure_manifest_id?: string;
  departure_manifest_number?: string;
  departure_date?: string;
  days_at_sea?: number;
  port: string;
  status: 'perlu_tinjauan' | 'diverifikasi_aman' | 'dalam_penyelidikan';
  detected_at: string;
  notes: string;
}

export interface DashboardMetrics {
  totalWorkers: number;
  workersAtSea: number;
  workersAshore: number;
  totalVessels: number;
  totalCompanies: number;
  totalManifests: number;
  duplicateAlertsCount: number;
  highMobilityCount: number;
  redRatingCount?: number;
  yellowRatingCount?: number;
  greenRatingCount?: number;
}

