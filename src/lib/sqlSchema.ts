/**
 * SUPABASE POSTGRESQL SCHEMA (SISTEM MONITORING KRU AWAK KAPAL ATLI)
 * 
 * URUTAN PEMBUATAN TABEL (MENCEGAH ERROR "relation does not exist"):
 * 1. ENUM Types (status, tipe manifest, rating kinerja)
 * 2. companies (Perusahaan Pemilik Kapal Anggota ATLI)
 * 3. vessels (Armada Kapal Perikanan, Foreign Key -> companies)
 * 4. workers (Pekerja Awak Kapal, Foreign Key -> vessels, companies)
 * 5. manifests (Manifest Keberangkatan & Kedatangan, Foreign Key -> vessels)
 * 6. manifest_workers (Relasi Manifest & Pekerja, Foreign Key -> manifests, workers)
 * 7. checkin_events (Log Histori Keluar-Masuk Pelabuhan)
 * 8. worker_mobility_records (Riwayat Mutasi & Perpindahan Kapal)
 * 9. crew_duplication_alerts (Deteksi Benturan & Kasus Duplikasi Manifest)
 * 10. clearance_records (Histori Bebas Tanggungan & Serah Terima)
 * 11. worker_complaints (Kanal Pengaduan Pekerja Awak Kapal)
 */

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- 1. EKSTENSI & ENUM TYPES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE worker_status_enum AS ENUM ('di_darat', 'di_laut');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE manifest_type_enum AS ENUM ('keberangkatan', 'kedatangan');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE performance_rating_enum AS ENUM ('hijau', 'kuning', 'merah');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE conflict_type_enum AS ENUM ('double_booking', 'at_sea_conflict', 'unreleased_contract');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. TABEL COMPANIES (Perusahaan Anggota Asosiasi ATLI)
-- Dibuat paling awal karena direferensikan oleh vessels dan workers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  license_number VARCHAR(100),
  pic_name VARCHAR(255) NOT NULL,
  pic_role VARCHAR(100) DEFAULT 'Staff Personalia / Operasional',
  pic_phone VARCHAR(50) NOT NULL,
  pic_email VARCHAR(100) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABEL VESSELS (Kapal Penangkap / Pengangkut Ikan)
-- Dibuat setelah companies karena memiliki Foreign Key ke companies(id)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS vessels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) NOT NULL UNIQUE, -- SIPI / Nomor Registrasi Kapal
  gross_tonnage NUMERIC NOT NULL DEFAULT 0,         -- GT Kapal
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  home_port VARCHAR(100) NOT NULL,
  captain_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'sandar' CHECK (status IN ('di_laut', 'sandar')),
  active_crew_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABEL WORKERS (Pekerja Awak Kapal Perikanan)
-- Referensi ke vessels(id) dan companies(id) sekarang aman & valid
-- ==============================================================================
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nik_hash VARCHAR(64) NOT NULL UNIQUE,         -- SHA-256 Hash NIK (UU PDP)
  nik_last4 VARCHAR(4) NOT NULL,                -- 4 Digit Terakhir untuk Tampilan UI
  dob DATE NOT NULL,
  phone VARCHAR(50),
  home_port VARCHAR(100) NOT NULL,
  current_status worker_status_enum NOT NULL DEFAULT 'di_darat',
  last_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  last_vessel_name VARCHAR(255),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name VARCHAR(255),
  position VARCHAR(100) DEFAULT 'Kelasi',
  performance_rating performance_rating_enum NOT NULL DEFAULT 'hijau',
  performance_notes TEXT,
  transfer_count INT NOT NULL DEFAULT 0,
  
  -- PKL & Sertifikasi
  pkl_number VARCHAR(100),
  pkl_start_date DATE,
  pkl_expiry_date DATE,
  pkl_company_name VARCHAR(255),
  pkl_status VARCHAR(50) DEFAULT 'belum_ada' CHECK (pkl_status IN ('aktif', 'kadaluarsa', 'belum_ada')),
  previous_company_name VARCHAR(255),
  bst_number VARCHAR(100),
  seaman_book_number VARCHAR(100),
  mcu_status VARCHAR(50) DEFAULT 'layak',
  bpjs_tk_number VARCHAR(100),
  bpjs_tk_active BOOLEAN DEFAULT TRUE,
  
  -- Tanggungan & Clearance
  clearance_status VARCHAR(50) DEFAULT 'bebas_tanggungan' CHECK (clearance_status IN ('bebas_tanggungan', 'ada_tanggungan')),
  tanggungan_category VARCHAR(100),
  tanggungan_amount NUMERIC DEFAULT 0,
  tanggungan_notes TEXT,
  clearance_updated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABEL MANIFESTS (Manifest Keberangkatan & Kedatangan Kapal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_number VARCHAR(50) UNIQUE NOT NULL,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  type manifest_type_enum NOT NULL,
  departure_manifest_id UUID REFERENCES manifests(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port VARCHAR(100) NOT NULL,
  recorded_by_user_id UUID,
  recorded_by_name VARCHAR(255) NOT NULL,
  recorded_by_role VARCHAR(50) NOT NULL,
  total_workers INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. TABEL MANIFEST_WORKERS (Daftar Kru di Tiap Manifest)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS manifest_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  disembarked BOOLEAN NOT NULL DEFAULT TRUE, -- True jika turun ke darat pada saat kedatangan
  notes TEXT,
  UNIQUE(manifest_id, worker_id)
);

-- ==============================================================================
-- 7. TABEL CHECKIN_EVENTS (Audit Log Keluar / Masuk Pelabuhan)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS checkin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  manifest_id UUID REFERENCES manifests(id) ON DELETE SET NULL,
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('keluar', 'masuk')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port VARCHAR(100) NOT NULL,
  recorded_by_user_id UUID,
  recorded_by_name VARCHAR(255) NOT NULL,
  recorded_by_role VARCHAR(50) NOT NULL,
  notes TEXT
);

-- ==============================================================================
-- 8. TABEL WORKER_MOBILITY_RECORDS (Histori Mutasi / Perpindahan Antar-Kapal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS worker_mobility_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  worker_name VARCHAR(255) NOT NULL,
  worker_nik_last4 VARCHAR(4) NOT NULL,
  from_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  from_vessel_name VARCHAR(255),
  from_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  from_company_name VARCHAR(255),
  to_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  to_vessel_name VARCHAR(255),
  to_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  to_company_name VARCHAR(255),
  transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason VARCHAR(50) NOT NULL,
  clearance_status VARCHAR(50) NOT NULL DEFAULT 'disetujui',
  notes TEXT,
  recorded_by_name VARCHAR(255) NOT NULL
);

-- ==============================================================================
-- 9. TABEL CREW_DUPLICATION_ALERTS (Peringatan & Kasus Duplikasi Kru)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS crew_duplication_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  worker_name VARCHAR(255) NOT NULL,
  worker_nik_last4 VARCHAR(4) NOT NULL,
  worker_phone VARCHAR(50),
  primary_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  primary_vessel_name VARCHAR(255) NOT NULL,
  primary_company_name VARCHAR(255) NOT NULL,
  conflicting_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
  conflicting_vessel_name VARCHAR(255) NOT NULL,
  conflicting_company_name VARCHAR(255) NOT NULL,
  conflict_type conflict_type_enum NOT NULL DEFAULT 'double_booking',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(30) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'diselesaikan')),
  resolution_notes TEXT
);

-- ==============================================================================
-- 10. TABEL WORKER_COMPLAINTS (Kanal Pengaduan Hak Ketenagakerjaan ABK)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS worker_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  worker_name VARCHAR(255) NOT NULL,
  worker_phone VARCHAR(50) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  vessel_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'diajukan' CHECK (status IN ('draft', 'diajukan', 'diverifikasi', 'ditolak', 'selesai')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolution_notes TEXT
);

-- ==============================================================================
-- 11. INDEX UNTUK PERFORMA QUERY CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_workers_nik_hash ON workers(nik_hash);
CREATE INDEX IF NOT EXISTS idx_workers_company ON workers(company_id);
CREATE INDEX IF NOT EXISTS idx_workers_last_vessel ON workers(last_vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessels_company ON vessels(company_id);
CREATE INDEX IF NOT EXISTS idx_manifests_vessel ON manifests(vessel_id);
CREATE INDEX IF NOT EXISTS idx_manifest_workers_m_w ON manifest_workers(manifest_id, worker_id);
CREATE INDEX IF NOT EXISTS idx_duplication_status ON crew_duplication_alerts(status);

-- ==============================================================================
-- 12. DATABASE TRIGGER: Update Otomatis Status Kru Saat Manifest Dimasukkan
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_worker_status_from_manifest()
RETURNS TRIGGER AS $$
DECLARE
  manifest_record RECORD;
BEGIN
  SELECT * INTO manifest_record FROM manifests WHERE id = NEW.manifest_id;

  IF manifest_record.type = 'keberangkatan' THEN
    -- Seluruh pekerja di manifest keberangkatan statusnya berubah menjadi 'di_laut'
    UPDATE workers
    SET current_status = 'di_laut',
        last_vessel_id = manifest_record.vessel_id
    WHERE id = NEW.worker_id;

    -- Update status kapal menjadi di_laut
    UPDATE vessels
    SET status = 'di_laut'
    WHERE id = manifest_record.vessel_id;

  ELSIF manifest_record.type = 'kedatangan' THEN
    IF NEW.disembarked = TRUE THEN
      -- Jika dicentang turun ke darat
      UPDATE workers
      SET current_status = 'di_darat'
      WHERE id = NEW.worker_id;
    ELSE
      -- Jika tetap tinggal di kapal
      UPDATE workers
      SET current_status = 'di_laut',
          last_vessel_id = manifest_record.vessel_id
      WHERE id = NEW.worker_id;
    END IF;

    -- Update status kapal menjadi sandar
    UPDATE vessels
    SET status = 'sandar'
    WHERE id = manifest_record.vessel_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_worker_status_manifest ON manifest_workers;
CREATE TRIGGER trg_update_worker_status_manifest
AFTER INSERT ON manifest_workers
FOR EACH ROW
EXECUTE FUNCTION update_worker_status_from_manifest();

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) SUPABASE
-- ==============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_mobility_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_duplication_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_complaints ENABLE ROW LEVEL SECURITY;

-- Kebijakan Baca (SELECT) Umum untuk Pengguna Terotentikasi
DO $$ BEGIN
  CREATE POLICY "Allow read for authenticated users on companies" ON companies FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on vessels" ON vessels FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on workers" ON workers FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on manifests" ON manifests FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on manifest_workers" ON manifest_workers FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on worker_mobility_records" ON worker_mobility_records FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Allow read for authenticated users on crew_duplication_alerts" ON crew_duplication_alerts FOR SELECT TO authenticated USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Kebijakan Akses Penuh untuk Admin Asosiasi & Syahbandar
DO $$ BEGIN
  CREATE POLICY "Full access for admins on companies" ON companies FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
  CREATE POLICY "Full access for admins on vessels" ON vessels FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
  CREATE POLICY "Full access for admins on workers" ON workers FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
  CREATE POLICY "Full access for admins on manifests" ON manifests FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
  CREATE POLICY "Full access for admins on manifest_workers" ON manifest_workers FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
  CREATE POLICY "Full access for admins on duplicates" ON crew_duplication_alerts FOR ALL TO authenticated USING (auth.jwt() ->> 'role' IN ('admin', 'syahbandar'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
`;

export const SQL_SCHEMA_TEXT = SUPABASE_SQL_SCHEMA;

export const SCHEMA_DIAGRAM = `
+----------------------------------------------------------------------------------------------------+
|                         SKEMA DATABASE POSTGRESQL CREW SISTEM ATLI                                |
+----------------------------------------------------------------------------------------------------+

  [ COMPANIES ] 1 <----------- N [ VESSELS ] 1 <----------- N [ MANIFESTS ] 1 <--- N [ MANIFEST_WORKERS ]
  (id, name, code,               (id, name,                   (id, manifest_no,        (id, manifest_id,
   pic_name, pic_phone)           company_id, GT,              vessel_id, type,         worker_id,
                                  status: di_laut|sandar)      timestamp, port)         disembarked)
         ^                              ^                                                    |
         |                              |                                                    |
         |                              |                                                    v
         +------------------------------+-------------------------------------------- [ WORKERS ]
                                                                                      (id, name,
                                                                                       nik_hash, nik_last4,
                                                                                       company_id,
                                                                                       last_vessel_id,
                                                                                       current_status:
                                                                                       'di_darat'|'di_laut')
                                                                                             |
                                        +----------------------------------------------------+
                                        |
       +--------------------------------+--------------------------------+
       v                                v                                v
 [ CHECKIN_EVENTS ]           [ WORKER_MOBILITY_RECORDS ]     [ CREW_DUPLICATION_ALERTS ]
 (id, worker_id, vessel_id,   (id, worker_id, from_vessel,    (id, worker_id, primary_vessel,
  event_type: keluar|masuk,    to_vessel, transfer_date,       conflicting_vessel, conflict_type,
  timestamp, port)             reason, clearance_status)       status: 'aktif'|'diselesaikan')
`;
