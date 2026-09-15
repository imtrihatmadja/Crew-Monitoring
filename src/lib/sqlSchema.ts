/**
 * SUPABASE POSTGRESQL SCHEMA (SISTEM MONITORED MANIFEST KAPAL & ANOMALI)
 * 
 * PENJELASAN MIGRASI SKEMA & DATA LAMA (FASE 1 -> REVISI BERBASIS MANIFEST):
 * 1. Tabel Baru `manifests` & `manifest_workers`:
 *    - Mengelompokkan pencatatan keberangkatan/kedatangan pekerja per kapal.
 *    - `manifests`: Menyimpan metadata pelayaran (kapal, tanggal, pelabuhan, jenis, pembuat).
 *    - `manifest_workers`: Tabel relasi N:M antara manifest dan pekerja, menyimpan status turun (`disembarked`).
 * 
 * 2. Penanganan Data Lama (`checkin_events`):
 *    - Tabel `checkin_events` TETAP DIPERTAHANKAN untuk menjaga integritas histori audit individual dari Fase 1.
 *    - Saat Manifest Baru disimpan, sistem otomatis menginsert baris ke `checkin_events` 
 *      (dengan ref `manifest_id`) untuk merekam jejak audit histori per pekerja tanpa merusak log lama.
 * 
 * 3. Status Pekerja (`current_status` di tabel `workers`):
 *    - Diubah menggunakan ENUM `'di_darat'` dan `'di_laut'`.
 *    - Menggunakan Database Trigger (atau logic aplikasi atomic) yang otomatis mengubah status `workers.current_status` 
 *      dan `last_vessel_id` setiap kali manifest keberangkatan/kedatangan baru berhasil dimasukkan.
 * 
 * 4. Deteksi Selisih Manifest (Tidak Mempengaruhi Rating):
 *    - Selisih dihitung dinamis melalui SQL View / Query `manifest_discrepancies_view`.
 *    - Hanya menjadi sinyal/peringatan di Dashboard Admin, tidak otomatis menghukum atau mengubah rating pekerja.
 */

export const SUPABASE_SQL_SCHEMA = `-- 1. KATEGORI STATUS ENUM WORKER
CREATE TYPE worker_status_enum AS ENUM ('di_darat', 'di_laut');
CREATE TYPE manifest_type_enum AS ENUM ('keberangkatan', 'kedatangan');
CREATE TYPE discrepancy_type_enum AS ENUM ('overdue_at_sea', 'unlisted_on_departure');

-- 2. TABEL WORKERS (Pekerja Awak Kapal)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  nik_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 Hash
  nik_last4 VARCHAR(4) NOT NULL,        -- Masking UU PDP
  dob DATE NOT NULL,
  phone VARCHAR(20),
  home_port VARCHAR(100) NOT NULL,
  current_status worker_status_enum NOT NULL DEFAULT 'di_darat',
  last_vessel_id UUID REFERENCES vessels(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL MANIFESTS (Manifest Kapal)
CREATE TABLE IF NOT EXISTS manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_number VARCHAR(50) UNIQUE NOT NULL,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  type manifest_type_enum NOT NULL,
  departure_manifest_id UUID REFERENCES manifests(id), -- Terisi jika tipe kedatangan
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port VARCHAR(100) NOT NULL,
  recorded_by_user_id UUID NOT NULL,
  recorded_by_name VARCHAR(255) NOT NULL,
  recorded_by_role VARCHAR(50) NOT NULL,
  total_workers INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL MANIFEST_WORKERS (Relasi Manifest & Worker)
CREATE TABLE IF NOT EXISTS manifest_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES manifests(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  disembarked BOOLEAN NOT NULL DEFAULT TRUE, -- Untuk kedatangan: true jika turun ke darat, false jika tetap di laut
  notes TEXT,
  UNIQUE(manifest_id, worker_id)
);

-- 5. TABEL CHECKIN_EVENTS (HISTORI INDIVIDUAL FASE 1 — DIPERTAHANKAN)
CREATE TABLE IF NOT EXISTS checkin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
  manifest_id UUID REFERENCES manifests(id) ON DELETE SET NULL, -- Link ke manifest baru
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('keluar', 'masuk')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  port VARCHAR(100) NOT NULL,
  recorded_by_user_id UUID NOT NULL,
  recorded_by_name VARCHAR(255) NOT NULL,
  recorded_by_role VARCHAR(50) NOT NULL,
  notes TEXT
);

-- 6. TRIGGER OTOMATIS: Update Real-time Status Pekerja saat Manifest Baru Dibuat
CREATE OR REPLACE FUNCTION update_worker_status_from_manifest()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
  manifest_record RECORD;
BEGIN
  SELECT * INTO manifest_record FROM manifests WHERE id = NEW.manifest_id;

  IF manifest_record.type = 'keberangkatan' THEN
    -- Seluruh pekerja di manifest keberangkatan statusnya berubah jadi 'di_laut'
    UPDATE workers
    SET current_status = 'di_laut',
        last_vessel_id = manifest_record.vessel_id
    WHERE id = NEW.worker_id;

  ELSIF manifest_record.type = 'kedatangan' THEN
    -- Jika pekerja dicentang turun (disembarked = true), ubah ke 'di_darat'
    IF NEW.disembarked = TRUE THEN
      UPDATE workers
      SET current_status = 'di_darat'
      WHERE id = NEW.worker_id;
    ELSE
      -- Jika tidak dicentang turun, tetap 'di_laut'
      UPDATE workers
      SET current_status = 'di_laut',
          last_vessel_id = manifest_record.vessel_id
      WHERE id = NEW.worker_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_worker_status_manifest
AFTER INSERT ON manifest_workers
FOR EACH ROW
EXECUTE FUNCTION update_worker_status_from_manifest();

-- 7. ROW LEVEL SECURITY (RLS) SUPABASE
ALTER TABLE manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access syahbandar & admin" ON manifests
  FOR ALL USING (auth.jwt() ->> 'role' IN ('syahbandar', 'admin'));

CREATE POLICY "Full access manifest workers" ON manifest_workers
  FOR ALL USING (auth.jwt() ->> 'role' IN ('syahbandar', 'admin'));
`;

export const SQL_SCHEMA_TEXT = SUPABASE_SQL_SCHEMA;

export const SCHEMA_DIAGRAM = `
+---------------------------------------------------------------------------------+
|                         SKEMA DATABASE MANIFEST KAPAL                          |
+---------------------------------------------------------------------------------+

 [ VESSELS ] 1 <------- N [ MANIFESTS ] 1 <------- N [ MANIFEST_WORKERS ] N ----> 1 [ WORKERS ]
 (id, name,               (id, manifest_number,        (id, manifest_id,            (id, name,
  registration_number,     vessel_id, type,             worker_id, disembarked)      nik_hash, nik_last4,
  company_id)              timestamp, port)                                              current_status: 'di_darat'|'di_laut')
                                 |
                                 | (Migration & Backward-Compatibility Link)
                                 v
                         [ CHECKIN_EVENTS ] 
                         (id, worker_id, vessel_id, manifest_id, event_type, timestamp)
`;
