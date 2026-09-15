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

// Default Demo Accounts for Association Member Companies & Admin
export const DEMO_USERS: UserProfile[] = [
  {
    id: 'u-comp-1',
    email: 'ops@samuderabahari.co.id',
    name: 'Hendra Gunawan (PT Samudera Bahari)',
    role: 'company',
    port: 'PPS Nizam Zachman Jakarta',
    company_id: 'c-1',
    company_name: 'PT Samudera Bahari Indonesia'
  },
  {
    id: 'u-comp-2',
    email: 'crew@minajayalautan.com',
    name: 'Dewi Kusuma (PT Mina Jaya Lautan)',
    role: 'company',
    port: 'PPS Bitung',
    company_id: 'c-2',
    company_name: 'PT Mina Jaya Lautan'
  },
  {
    id: 'u-captain-1',
    email: 'capt.bambang@sinarnusantara.com',
    name: 'Capt. Bambang (Nahkoda KM Bahari Utama VII)',
    role: 'company',
    port: 'PPS Benoa',
    company_id: 'c-3',
    company_name: 'CV Sinar Nusantara Maritime'
  },
  {
    id: 'u-admin-1',
    email: 'sekretariat@asokapal.id',
    name: 'Ir. Ahmad Wijaya (Admin Sekretariat Asosiasi)',
    role: 'admin',
    port: 'Kantor Pusat Asosiasi'
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

// Initial Seed Data: Member Companies in the Association
const INITIAL_COMPANIES: Company[] = [
  { 
    id: 'c-1', 
    name: 'PT Samudera Bahari Indonesia', 
    code: 'SBI',
    license_number: 'SIUP-KKP-2023-0891', 
    pic_name: 'Hendra Gunawan',
    pic_role: 'Manajer Personalia & Armada',
    pic_phone: '0812-3344-5566',
    pic_email: 'ops@samuderabahari.co.id',
    address: 'Dermaga Barat No. 12, Pelabuhan Muara Baru, Jakarta Utara',
    created_at: '2023-01-15T08:00:00Z' 
  },
  { 
    id: 'c-2', 
    name: 'PT Mina Jaya Lautan', 
    code: 'MJL',
    license_number: 'SIUP-KKP-2022-0412', 
    pic_name: 'Dewi Kusuma',
    pic_role: 'Kepala Bagian Crewing & Operasional',
    pic_phone: '0813-8899-0011',
    pic_email: 'crewing@minajayalautan.com',
    address: 'Kompleks PPS Bitung Blok C-4, Sulawesi Utara',
    created_at: '2022-05-10T08:00:00Z' 
  },
  { 
    id: 'c-3', 
    name: 'CV Sinar Nusantara Maritime', 
    code: 'SNM',
    license_number: 'SIUP-KKP-2024-0105', 
    pic_name: 'Bambang Sutrisno',
    pic_role: 'Koordinator Kapal & Syahbandar Internal',
    pic_phone: '0811-2233-4455',
    pic_email: 'ops@sinarnusantara.com',
    address: 'Jl. Ikan Tuna II No. 8, Pelabuhan Benoa, Bali',
    created_at: '2024-02-01T08:00:00Z' 
  },
  { 
    id: 'c-4', 
    name: 'PT Bahtera Nelayan Sentosa', 
    code: 'BNS',
    license_number: 'SIUP-KKP-2024-0332', 
    pic_name: 'Capt. Rusli Effendi',
    pic_role: 'Direktur Operasional Armada',
    pic_phone: '0852-6677-8899',
    pic_email: 'rusli@bahteranelayan.co.id',
    address: 'Jl. Samudera Raya Kav. 5, Pelabuhan Kejawanan, Cirebon',
    created_at: '2024-04-12T08:00:00Z' 
  }
];

const INITIAL_VESSELS: Vessel[] = [
  { id: 'v-1', name: 'KM Sinar Laut 01', registration_number: 'SIPI.321/KKP/2023', gross_tonnage: 45, company_id: 'c-1', company_name: 'PT Samudera Bahari Indonesia', home_port: 'PPS Nizam Zachman Jakarta', captain_name: 'Capt. Herman', status: 'di_laut', active_crew_count: 2 },
  { id: 'v-2', name: 'KM Mina Jaya 88', registration_number: 'SIPI.882/KKP/2022', gross_tonnage: 120, company_id: 'c-2', company_name: 'PT Mina Jaya Lautan', home_port: 'PPS Bitung', captain_name: 'Capt. Antonius', status: 'di_laut', active_crew_count: 1 },
  { id: 'v-3', name: 'KM Bahari Utama VII', registration_number: 'SIPI.109/KKP/2024', gross_tonnage: 60, company_id: 'c-3', company_name: 'CV Sinar Nusantara Maritime', home_port: 'PPS Benoa', captain_name: 'Capt. Bambang', status: 'sandar', active_crew_count: 2 },
  { id: 'v-4', name: 'KM Samudera Perkasa', registration_number: 'SIPI.704/KKP/2023', gross_tonnage: 85, company_id: 'c-1', company_name: 'PT Samudera Bahari Indonesia', home_port: 'PPS Nizam Zachman Jakarta', captain_name: 'Capt. Suryadi', status: 'sandar', active_crew_count: 2 },
  { id: 'v-5', name: 'KM Mina Perkasa 09', registration_number: 'SIPI.441/KKP/2024', gross_tonnage: 98, company_id: 'c-2', company_name: 'PT Mina Jaya Lautan', home_port: 'PPS Bitung', captain_name: 'Capt. Yohanes', status: 'sandar', active_crew_count: 0 },
  { id: 'v-6', name: 'KM Bahtera Inti 03', registration_number: 'SIPI.552/KKP/2024', gross_tonnage: 72, company_id: 'c-4', company_name: 'PT Bahtera Nelayan Sentosa', home_port: 'PPN Kejawanan Cirebon', captain_name: 'Capt. Sugeng', status: 'sandar', active_crew_count: 0 }
];

const INITIAL_WORKERS_SEED = [
  {
    id: 'w-1',
    name: 'Sukarman Setiawan',
    nikRaw: '3271011508850001',
    dob: '1985-08-15',
    phone: '081234567890',
    home_port: 'PPS Nizam Zachman Jakarta',
    status: 'di_darat' as const,
    vessel_id: 'v-3',
    vessel_name: 'KM Bahari Utama VII',
    position: 'Nahkoda',
    performance_rating: 'hijau' as const,
    performance_notes: 'Rekam jejak sangat baik. Memiliki sertifikat keahlian lengkap.',
    pkl_number: 'PKL/2025/001',
    pkl_start_date: '2025-01-10',
    pkl_expiry_date: '2026-01-10',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-6201-9872',
    bst_expiry: '2028-08-15',
    seaman_book_number: 'B-883921',
    seaman_book_expiry: '2027-12-31',
    passport_number: 'C-9812039',
    passport_expiry: '2029-05-20',
    competency_cert: 'ANKAPIN I (Ahli Nautika Kapal Penangkap Ikan)',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3271009822100',
    bpjs_tk_active: true,
    bpjs_kes_number: '0001928374821',
    bpjs_kes_active: true
  },
  {
    id: 'w-2',
    name: 'Bambang Supriyanto',
    nikRaw: '3318021204910003',
    dob: '1991-04-12',
    phone: '081398765432',
    home_port: 'PPS Bitung',
    status: 'di_laut' as const,
    vessel_id: 'v-2',
    vessel_name: 'KM Mina Jaya 88',
    position: 'Kepala Kamar Mesin (KKM)',
    performance_rating: 'hijau' as const,
    performance_notes: 'Spesialis teknisi mesin diesel kapal >100 GT.',
    pkl_number: 'PKL/2025/012',
    pkl_start_date: '2025-02-01',
    pkl_expiry_date: '2026-02-01',
    pkl_company_name: 'PT Mina Jaya Bahari',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-8812-4410',
    bst_expiry: '2027-04-12',
    seaman_book_number: 'B-771239',
    seaman_book_expiry: '2026-11-15',
    passport_number: 'C-1029381',
    passport_expiry: '2028-09-10',
    competency_cert: 'ATKAPIN I (Ahli Teknika Kapal Penangkap Ikan)',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3318902192110',
    bpjs_tk_active: true,
    bpjs_kes_number: '0002819382019',
    bpjs_kes_active: true
  },
  {
    id: 'w-3',
    name: 'Herman Prasetyo',
    nikRaw: '3578032009880004',
    dob: '1988-09-20',
    phone: '085711223344',
    home_port: 'PPS Nizam Zachman Jakarta',
    status: 'di_darat' as const,
    vessel_id: 'v-3',
    vessel_name: 'KM Bahari Utama VII',
    position: 'Kelasi / ABK Utama',
    performance_rating: 'kuning' as const,
    performance_notes: 'Perlu peninjauan perpanjangan dokumen PKL yang akan kadaluarsa.',
    pkl_number: 'PKL/2024/099',
    pkl_start_date: '2024-01-15',
    pkl_expiry_date: '2025-01-15',
    pkl_company_name: 'CV Sinar Nusantara Maritime',
    pkl_status: 'kadaluarsa' as const,
    bst_number: 'BST-1102-9921',
    bst_expiry: '2025-10-20',
    seaman_book_number: 'B-551029',
    seaman_book_expiry: '2025-08-01',
    competency_cert: 'SKK 60 Mil Laut',
    mcu_status: 'perlu_evaluasi' as const,
    bpjs_tk_number: '3578901238910',
    bpjs_tk_active: true,
    bpjs_kes_number: '0003912091120',
    bpjs_kes_active: false
  },
  {
    id: 'w-4',
    name: 'Dedi Kurniawan',
    nikRaw: '3175040101950002',
    dob: '1995-01-01',
    phone: '082155667788',
    home_port: 'PPS Benoa',
    status: 'di_laut' as const,
    vessel_id: 'v-1',
    vessel_name: 'KM Sinar Laut 01',
    position: 'Juru Mudi',
    performance_rating: 'hijau' as const,
    performance_notes: 'Kedisiplinan pelayaran sangat tinggi.',
    pkl_number: 'PKL/2025/044',
    pkl_start_date: '2025-03-01',
    pkl_expiry_date: '2026-03-01',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-3391-0021',
    bst_expiry: '2028-01-01',
    seaman_book_number: 'B-901128',
    seaman_book_expiry: '2027-05-15',
    competency_cert: 'ANKAPIN II',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3175109283019',
    bpjs_tk_active: true,
    bpjs_kes_number: '0004812901920',
    bpjs_kes_active: true
  },
  {
    id: 'w-5',
    name: 'Asep Saepullah',
    nikRaw: '3204051011900005',
    dob: '1990-11-10',
    phone: '087899001122',
    home_port: 'PPN Kejawanan Cirebon',
    status: 'di_darat' as const,
    vessel_id: 'v-4',
    vessel_name: 'KM Samudera Perkasa',
    position: 'Masinis II',
    performance_rating: 'hijau' as const,
    performance_notes: 'Sertifikasi teknis lengkap & aktif.',
    pkl_number: 'PKL/2025/055',
    pkl_start_date: '2025-01-20',
    pkl_expiry_date: '2026-01-20',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-9901-2210',
    bst_expiry: '2027-11-10',
    seaman_book_number: 'B-662109',
    seaman_book_expiry: '2027-08-20',
    competency_cert: 'ATKAPIN II',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3204901283012',
    bpjs_tk_active: true,
    bpjs_kes_number: '0005819028110',
    bpjs_kes_active: true
  },
  {
    id: 'w-6',
    name: 'Rahmat Hidayat',
    nikRaw: '3204051011900006',
    dob: '1992-03-25',
    phone: '081299887766',
    home_port: 'PPS Nizam Zachman Jakarta',
    status: 'di_laut' as const,
    vessel_id: 'v-1',
    vessel_name: 'KM Sinar Laut 01',
    position: 'Koki Kapal',
    performance_rating: 'merah' as const,
    performance_notes: 'Pernah tercatat tidak hadir pada keberangkatan manifest tanpa konfirmasi.',
    pkl_number: 'PKL/2024/011',
    pkl_start_date: '2024-02-10',
    pkl_expiry_date: '2025-02-10',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'kadaluarsa' as const,
    bst_number: 'BST-2201-8812',
    bst_expiry: '2025-03-25',
    seaman_book_number: 'B-112908',
    seaman_book_expiry: '2025-06-01',
    mcu_status: 'perlu_evaluasi' as const,
    bpjs_tk_number: '3204901289019',
    bpjs_tk_active: false,
    bpjs_kes_number: '0006819208310',
    bpjs_kes_active: true
  },
  {
    id: 'w-7',
    name: 'Joko Widodo',
    nikRaw: '3204051011900007',
    dob: '1989-07-14',
    phone: '081377665544',
    home_port: 'PPS Bitung',
    status: 'di_darat' as const,
    vessel_id: 'v-4',
    vessel_name: 'KM Samudera Perkasa',
    position: 'ABK Keliling',
    performance_rating: 'hijau' as const,
    performance_notes: 'Tidak pernah memiliki catatan pelanggaran.',
    pkl_number: 'PKL/2025/102',
    pkl_start_date: '2025-04-01',
    pkl_expiry_date: '2026-04-01',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-5512-8821',
    bst_expiry: '2028-07-14',
    seaman_book_number: 'B-449102',
    seaman_book_expiry: '2027-10-10',
    competency_cert: 'SKK 30 Mil Laut',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3204910283019',
    bpjs_tk_active: true,
    bpjs_kes_number: '0007819208120',
    bpjs_kes_active: true
  },
  {
    id: 'w-8',
    name: 'Anton Wijaya',
    nikRaw: '3204051011900008',
    dob: '1993-05-18',
    phone: '081288776655',
    home_port: 'PPS Nizam Zachman Jakarta',
    status: 'di_darat' as const,
    vessel_id: 'v-2',
    vessel_name: 'KM Mina Jaya 88',
    position: 'Kelasi / Juru Motor',
    performance_rating: 'merah' as const,
    performance_notes: 'Catatan pelanggaran indisipliner: meninggalkan kapal saat bersandar di pelabuhan tanpa izin nahkoda dan belum ada surat pelepasan resmi.',
    pkl_number: 'PKL/2024/078',
    pkl_start_date: '2024-03-01',
    pkl_expiry_date: '2025-03-01',
    pkl_company_name: 'PT Mina Jaya Lautan',
    pkl_status: 'kadaluarsa' as const,
    bst_number: 'BST-7721-0091',
    bst_expiry: '2026-08-10',
    seaman_book_number: 'B-338219',
    seaman_book_expiry: '2026-05-12',
    competency_cert: 'SKK 60 Mil Laut',
    mcu_status: 'perlu_evaluasi' as const,
    bpjs_tk_number: '3204918291021',
    bpjs_tk_active: false,
    bpjs_kes_number: '0008819208220',
    bpjs_kes_active: true
  },
  {
    id: 'w-9',
    name: 'Suratman Hadi',
    nikRaw: '3318021204910009',
    dob: '1987-12-04',
    phone: '081322334455',
    home_port: 'PPS Bitung',
    status: 'di_darat' as const,
    vessel_id: 'v-3',
    vessel_name: 'KM Bahari Utama VII',
    position: 'Juru Rawat Jaring',
    performance_rating: 'kuning' as const,
    performance_notes: 'Hasil MCU menyatakan perlu evaluasi lanjutan (hipertensi ringan) dan masa berlaku kontrak PKL berakhir dalam 14 hari.',
    pkl_number: 'PKL/2024/115',
    pkl_start_date: '2024-04-15',
    pkl_expiry_date: '2025-04-15',
    pkl_company_name: 'CV Sinar Nusantara Maritime',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-4412-9901',
    bst_expiry: '2025-11-20',
    seaman_book_number: 'B-229103',
    seaman_book_expiry: '2025-09-18',
    competency_cert: 'BST Perikanan',
    mcu_status: 'perlu_evaluasi' as const,
    bpjs_tk_number: '3318928192019',
    bpjs_tk_active: true,
    bpjs_kes_number: '0009819208330',
    bpjs_kes_active: true,
    clearance_status: 'ada_tanggungan' as const,
    tanggungan_category: 'kasbon_pinjaman' as const,
    tanggungan_amount: 1500000,
    tanggungan_notes: 'Sisa kasbon perbekalan dan pinjaman darurat pelayaran lalu belum diselesaikan dengan kasir kapal.',
    clearance_by_vessel: 'KM Bahari Utama VII'
  },
  {
    id: 'w-10',
    name: 'Agus Setiawan',
    nikRaw: '3271011508930010',
    dob: '1993-08-15',
    phone: '081234556677',
    home_port: 'PPS Nizam Zachman Jakarta',
    status: 'di_darat' as const,
    vessel_id: undefined,
    vessel_name: undefined,
    position: 'ABK Bebas Tugas / Pool Darat',
    performance_rating: 'hijau' as const,
    performance_notes: 'Dokumen lengkap dan valid. Siap ditugaskan untuk pelayaran armada baru.',
    pkl_number: 'PKL/2025/119',
    pkl_start_date: '2025-01-01',
    pkl_expiry_date: '2026-01-01',
    pkl_company_name: 'PT Samudera Bahari Indonesia',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-6601-9011',
    bst_expiry: '2028-04-10',
    seaman_book_number: 'B-998811',
    seaman_book_expiry: '2027-10-15',
    competency_cert: 'SKK 60 Mil Laut',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3271901192010',
    bpjs_tk_active: true,
    bpjs_kes_number: '0001819208440',
    bpjs_kes_active: true,
    clearance_status: 'bebas_tanggungan' as const,
    tanggungan_notes: 'Peralatan kapal lengkap, bagi hasil diselesaikan penuh. Bebas transfer ke kapal manapun.'
  },
  {
    id: 'w-11',
    name: 'Wahyu Hidayat',
    nikRaw: '3318021204950011',
    dob: '1995-02-12',
    phone: '081398877665',
    home_port: 'PPS Bitung',
    status: 'di_darat' as const,
    vessel_id: undefined,
    vessel_name: undefined,
    position: 'Juru Motor / Masinis Cadangan',
    performance_rating: 'hijau' as const,
    performance_notes: 'Sertifikasi teknis mesin perikanan aktif, siap diberangkatkan.',
    pkl_number: 'PKL/2025/122',
    pkl_start_date: '2025-02-15',
    pkl_expiry_date: '2026-02-15',
    pkl_company_name: 'PT Mina Jaya Lautan',
    pkl_status: 'aktif' as const,
    bst_number: 'BST-7702-3312',
    bst_expiry: '2028-09-20',
    seaman_book_number: 'B-882233',
    seaman_book_expiry: '2027-06-30',
    competency_cert: 'ATKAPIN II',
    mcu_status: 'layak' as const,
    bpjs_tk_number: '3318902193011',
    bpjs_tk_active: true,
    bpjs_kes_number: '0002819385550',
    bpjs_kes_active: true,
    clearance_status: 'bebas_tanggungan' as const,
    tanggungan_notes: 'Bebas tanggungan. Siap penugasan baru.'
  }
];

const INITIAL_MOBILITY_SEED: WorkerMobilityRecord[] = [
  {
    id: 'mob-1',
    worker_id: 'w-1',
    worker_name: 'Sukarman Setiawan',
    worker_nik_last4: '0001',
    from_vessel_id: 'v-2',
    from_vessel_name: 'KM Mina Jaya 88',
    from_company_id: 'c-2',
    from_company_name: 'PT Mina Jaya Lautan',
    to_vessel_id: 'v-3',
    to_vessel_name: 'KM Bahari Utama VII',
    to_company_id: 'c-3',
    to_company_name: 'CV Sinar Nusantara Maritime',
    transfer_date: '2025-01-10T10:00:00Z',
    reason: 'selesai_kontrak',
    notes: 'Selesai masa kontrak 12 bulan di PT Mina Jaya Lautan dengan surat rekomendasi baik. Bergabung ke CV Sinar Nusantara.',
    clearance_status: 'disetujui',
    recorded_by_name: 'Hendra Gunawan'
  },
  {
    id: 'mob-2',
    worker_id: 'w-4',
    worker_name: 'Dedi Kurniawan',
    worker_nik_last4: '0002',
    from_vessel_id: 'v-6',
    from_vessel_name: 'KM Bahtera Inti 03',
    from_company_id: 'c-4',
    from_company_name: 'PT Bahtera Nelayan Sentosa',
    to_vessel_id: 'v-1',
    to_vessel_name: 'KM Sinar Laut 01',
    to_company_id: 'c-1',
    to_company_name: 'PT Samudera Bahari Indonesia',
    transfer_date: '2025-03-01T08:30:00Z',
    reason: 'mutasi_armada',
    notes: 'Peminjaman kru antar anggota grup asosiasi untuk trip penangkapan cumi WPPNRI 711.',
    clearance_status: 'disetujui',
    recorded_by_name: 'Capt. Rusli Effendi'
  },
  {
    id: 'mob-3',
    worker_id: 'w-6',
    worker_name: 'Rahmat Hidayat',
    worker_nik_last4: '0006',
    from_vessel_id: 'v-3',
    from_vessel_name: 'KM Bahari Utama VII',
    from_company_id: 'c-3',
    from_company_name: 'CV Sinar Nusantara Maritime',
    to_vessel_id: 'v-1',
    to_vessel_name: 'KM Sinar Laut 01',
    to_company_id: 'c-1',
    to_company_name: 'PT Samudera Bahari Indonesia',
    transfer_date: '2025-02-15T09:00:00Z',
    reason: 'permintaan_pribadi',
    notes: 'Pindah kapal atas inisiatif sendiri, sering berpindah kapal dalam 6 bulan terakhir.',
    clearance_status: 'menunggu_klarifikasi',
    recorded_by_name: 'Dewi Kusuma'
  }
];

const INITIAL_DUPLICATE_ALERTS: CrewDuplicationAlert[] = [
  {
    id: 'alert-dup-1',
    worker_id: 'w-4',
    worker_name: 'Dedi Kurniawan',
    worker_nik_last4: '0002',
    worker_phone: '082155667788',
    primary_vessel_id: 'v-1',
    primary_vessel_name: 'KM Sinar Laut 01',
    primary_company_name: 'PT Samudera Bahari Indonesia',
    conflicting_vessel_id: 'v-2',
    conflicting_vessel_name: 'KM Mina Jaya 88',
    conflicting_company_name: 'PT Mina Jaya Lautan',
    conflict_type: 'at_sea_conflict',
    detected_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'aktif',
    resolution_notes: 'Pekerja terdata sedang berlayar di KM Sinar Laut 01 (status: di_laut). Namun diajukan pada draft crew KM Mina Jaya 88.'
  }
];

const INITIAL_CLEARANCES_SEED: ClearanceRecord[] = [
  {
    id: 'clr-seed-1',
    worker_id: 'w-9',
    worker_name: 'Suratman Hadi',
    worker_nik_last4: '0009',
    vessel_id: 'v-3',
    vessel_name: 'KM Bahari Utama VII',
    company_name: 'CV Sinar Nusantara Maritime',
    port: 'PPS Bitung',
    timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: 'ada_tanggungan',
    category: 'kasbon_pinjaman',
    amount: 1500000,
    notes: 'Sisa kasbon perbekalan dan pinjaman darurat pelayaran lalu belum diselesaikan dengan kasir kapal.',
    recorded_by_name: 'Capt. Herman Sudrajat'
  },
  {
    id: 'clr-seed-2',
    worker_id: 'w-10',
    worker_name: 'Agus Setiawan',
    worker_nik_last4: '0010',
    vessel_id: 'v-1',
    vessel_name: 'KM Sinar Laut 01',
    company_name: 'PT Samudera Bahari Indonesia',
    port: 'PPS Nizam Zachman Jakarta',
    timestamp: new Date(Date.now() - 25 * 86400000).toISOString(),
    status: 'bebas_tanggungan',
    notes: 'Peralatan kapal lengkap, bagi hasil diselesaikan penuh. Bebas transfer ke kapal manapun.',
    recorded_by_name: 'Hendra Gunawan'
  }
];

const STORAGE_KEYS = {
  WORKERS: 'abk_system_workers_v3',
  EVENTS: 'abk_system_events_v3',
  VESSELS: 'abk_system_vessels_v3',
  COMPANIES: 'abk_system_companies_v3',
  MANIFESTS: 'abk_system_manifests_v3',
  DISCREPANCIES: 'abk_system_discrepancies_v3',
  MOBILITY: 'abk_system_mobility_v3',
  DUPLICATES: 'abk_system_duplicates_v3',
  CLEARANCES: 'abk_system_clearance_v3',
  USER: 'abk_system_active_user_v3'
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

  private async init() {
    // Load companies
    const savedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    this.companies = savedCompanies ? JSON.parse(savedCompanies) : INITIAL_COMPANIES;

    // Load vessels
    const savedVessels = localStorage.getItem(STORAGE_KEYS.VESSELS);
    this.vessels = savedVessels ? JSON.parse(savedVessels) : INITIAL_VESSELS;

    // Load active user
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }

    // Load workers or seed
    const savedWorkers = localStorage.getItem(STORAGE_KEYS.WORKERS);
    if (savedWorkers) {
      const parsedWorkers: Worker[] = JSON.parse(savedWorkers);
      this.workers = parsedWorkers.map(w => {
        if (!w.last_vessel_id && w.last_vessel_name) {
          const matched = this.vessels.find(v => v.name.toLowerCase() === w.last_vessel_name?.toLowerCase());
          if (matched) return { ...w, last_vessel_id: matched.id };
        }
        return w;
      });

      // Synchronize any newly added seed workers (e.g., w-8 and w-9)
      for (const seed of INITIAL_WORKERS_SEED) {
        if (!this.workers.some(w => w.id === seed.id)) {
          this.workers.push({
            id: seed.id,
            name: seed.name,
            nik_hash: await hashNik(seed.nikRaw),
            nik_last4: seed.nikRaw.slice(-4),
            dob: seed.dob,
            phone: seed.phone,
            home_port: seed.home_port,
            current_status: seed.status,
            last_vessel_id: seed.vessel_id,
            last_vessel_name: seed.vessel_name,
            position: seed.position,
            performance_rating: seed.performance_rating,
            performance_notes: seed.performance_notes,
            pkl_number: seed.pkl_number,
            pkl_start_date: seed.pkl_start_date,
            pkl_expiry_date: seed.pkl_expiry_date,
            pkl_company_name: seed.pkl_company_name,
            pkl_status: seed.pkl_status,
            bst_number: seed.bst_number,
            bst_expiry: seed.bst_expiry,
            seaman_book_number: seed.seaman_book_number,
            seaman_book_expiry: seed.seaman_book_expiry,
            competency_cert: seed.competency_cert,
            mcu_status: seed.mcu_status,
            bpjs_tk_number: seed.bpjs_tk_number,
            bpjs_tk_active: seed.bpjs_tk_active,
            bpjs_kes_number: seed.bpjs_kes_number,
            bpjs_kes_active: seed.bpjs_kes_active,
            created_at: new Date().toISOString()
          });
        }
      }
      this.saveWorkers();
    } else {
      // Create seed workers with hashed NIKs
      this.workers = await Promise.all(
        INITIAL_WORKERS_SEED.map(async (seed) => ({
          id: seed.id,
          name: seed.name,
          nik_hash: await hashNik(seed.nikRaw),
          nik_last4: seed.nikRaw.slice(-4),
          dob: seed.dob,
          phone: seed.phone,
          home_port: seed.home_port,
          current_status: seed.status,
          last_vessel_id: seed.vessel_id,
          last_vessel_name: seed.vessel_name,
          position: seed.position,
          performance_rating: seed.performance_rating,
          performance_notes: seed.performance_notes,
          pkl_number: seed.pkl_number,
          pkl_start_date: seed.pkl_start_date,
          pkl_expiry_date: seed.pkl_expiry_date,
          pkl_company_name: seed.pkl_company_name,
          pkl_status: seed.pkl_status,
          bst_number: seed.bst_number,
          bst_expiry: seed.bst_expiry,
          seaman_book_number: seed.seaman_book_number,
          seaman_book_expiry: seed.seaman_book_expiry,
          passport_number: seed.passport_number,
          passport_expiry: seed.passport_expiry,
          competency_cert: seed.competency_cert,
          mcu_status: seed.mcu_status,
          bpjs_tk_number: seed.bpjs_tk_number,
          bpjs_tk_active: seed.bpjs_tk_active,
          bpjs_kes_number: seed.bpjs_kes_number,
          bpjs_kes_active: seed.bpjs_kes_active,
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)).toISOString()
        }))
      );
      this.saveWorkers();
    }

    // Load manifests or seed initial historical manifests
    const savedManifests = localStorage.getItem(STORAGE_KEYS.MANIFESTS);
    if (savedManifests) {
      this.manifests = JSON.parse(savedManifests);
    } else {
      this.manifests = [
        {
          id: 'm-1',
          manifest_number: 'MAN-KEBERANGKATAN-2026-001',
          vessel_id: 'v-1',
          vessel_name: 'KM Sinar Laut 01',
          vessel_registration: 'SIPI.321/KKP/2023',
          company_name: 'PT Samudera Bahari Indonesia',
          type: 'keberangkatan',
          timestamp: new Date(Date.now() - 35 * 86400000).toISOString(), // 35 hari lalu (Overdue test)
          port: 'PPS Nizam Zachman Jakarta',
          recorded_by_user_id: 'u-syahbandar-1',
          recorded_by_name: 'Budi Santoso (Syahbandar Utama)',
          recorded_by_role: 'syahbandar',
          total_workers: 2,
          workers: [
            { worker_id: 'w-4', worker_name: 'Dedi Kurniawan', worker_nik_last4: '0002', home_port: 'PPS Benoa', disembarked: false },
            { worker_id: 'w-6', worker_name: 'Rahmat Hidayat', worker_nik_last4: '0006', home_port: 'PPS Nizam Zachman Jakarta', disembarked: false }
          ],
          notes: 'Pelayaran penangkapan tuna Laut Arafura (30 Hari)'
        },
        {
          id: 'm-2',
          manifest_number: 'MAN-KEBERANGKATAN-2026-002',
          vessel_id: 'v-2',
          vessel_name: 'KM Mina Jaya 88',
          vessel_registration: 'SIPI.882/KKP/2022',
          company_name: 'PT Mina Jaya Lautan',
          type: 'keberangkatan',
          timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
          port: 'PPS Bitung',
          recorded_by_user_id: 'u-syahbandar-2',
          recorded_by_name: 'Siti Rahma (Syahbandar Bitung)',
          recorded_by_role: 'syahbandar',
          total_workers: 1,
          workers: [
            { worker_id: 'w-2', worker_name: 'Bambang Supriyanto', worker_nik_last4: '0003', home_port: 'PPS Bitung', disembarked: false }
          ],
          notes: 'Pelayaran rutin WPP-716'
        }
      ];
      this.saveManifests();
    }

    // Load discrepancies or seed
    const savedDiscrepancies = localStorage.getItem(STORAGE_KEYS.DISCREPANCIES);
    if (savedDiscrepancies) {
      this.discrepancies = JSON.parse(savedDiscrepancies);
    } else {
      this.discrepancies = [
        {
          id: 'disc-1',
          type: 'overdue_at_sea',
          worker_id: 'w-4',
          worker_name: 'Dedi Kurniawan',
          worker_nik_last4: '0002',
          vessel_id: 'v-1',
          vessel_name: 'KM Sinar Laut 01',
          departure_manifest_id: 'm-1',
          departure_manifest_number: 'MAN-KEBERANGKATAN-2026-001',
          departure_date: new Date(Date.now() - 35 * 86400000).toISOString(),
          days_at_sea: 35,
          port: 'PPS Nizam Zachman Jakarta',
          status: 'perlu_tinjauan',
          detected_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          notes: 'Pekerja berada di laut melebihi 30 hari tanpa manifest kedatangan terverifikasi. Perlu konfirmasi nahkoda.'
        },
        {
          id: 'disc-2',
          type: 'unlisted_on_departure',
          worker_id: 'w-5',
          worker_name: 'Asep Saepullah',
          worker_nik_last4: '0005',
          vessel_id: 'v-2',
          vessel_name: 'KM Mina Jaya 88',
          port: 'PPS Bitung',
          status: 'perlu_tinjauan',
          detected_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          notes: 'Pekerja dilaporkan turun dari kapal KM Mina Jaya 88 tetapi TIDAK tercatat di manifest keberangkatan resmi. Sinyal dugaan pekerja tidak berdokumen.'
        }
      ];
      this.saveDiscrepancies();
    }

    // Load legacy events or seed
    const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (savedEvents) {
      this.events = JSON.parse(savedEvents);
    } else {
      this.events = [
        {
          id: 'e-1',
          worker_id: 'w-2',
          worker_name: 'Bambang Supriyanto',
          worker_nik_last4: '0003',
          vessel_id: 'v-2',
          vessel_name: 'KM Mina Jaya 88',
          event_type: 'keluar',
          timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
          port: 'PPS Bitung',
          recorded_by_user_id: 'u-syahbandar-2',
          recorded_by_name: 'Siti Rahma (Syahbandar Bitung)',
          recorded_by_role: 'syahbandar',
          manifest_id: 'm-2',
          notes: 'Didaftarkan melalui Manifest Keberangkatan MAN-KEBERANGKATAN-2026-002'
        }
      ];
      this.saveEvents();
    }

    // Load mobility records or seed
    const savedMobility = localStorage.getItem(STORAGE_KEYS.MOBILITY);
    if (savedMobility) {
      this.mobilityRecords = JSON.parse(savedMobility);
    } else {
      this.mobilityRecords = INITIAL_MOBILITY_SEED;
      this.saveMobility();
    }

    // Load duplicate alerts or seed
    const savedDuplicates = localStorage.getItem(STORAGE_KEYS.DUPLICATES);
    if (savedDuplicates) {
      this.duplicateAlerts = JSON.parse(savedDuplicates);
    } else {
      this.duplicateAlerts = INITIAL_DUPLICATE_ALERTS;
      this.saveDuplicates();
    }

    // Load clearance records or seed
    const savedClearances = localStorage.getItem(STORAGE_KEYS.CLEARANCES);
    if (savedClearances) {
      this.clearanceRecords = JSON.parse(savedClearances);
    } else {
      this.clearanceRecords = INITIAL_CLEARANCES_SEED;
      this.saveClearances();
    }
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

    const companyName = data.company_name?.trim() || 'PT Samudera Bahari Indonesia';

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
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(this.companies));
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
    localStorage.setItem(STORAGE_KEYS.VESSELS, JSON.stringify(this.vessels));

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
