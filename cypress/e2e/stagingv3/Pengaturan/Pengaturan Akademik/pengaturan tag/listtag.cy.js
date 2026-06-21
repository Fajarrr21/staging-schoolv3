// listtag.cy.js — Spec List Tag
// Modul: Pengaturan > Akademik > Tag  |  Route: /setting/academic/tag
// Sumber TC: docs/test-cases/TC_Tag_List.xlsx (TC-TAG-LST-001..025).
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit-ts><seq>.
//
// Strategi seeding:
//   before() ngebikin 3 tag (SDIT-Semua, SDIT-Siswa, Sekolah Alam-Guru&Staff) lewat addTag,
//   biar coverage filter Instansi/Status/Tipe terpenuhi tanpa nge-seed inline tiap TC.
//
// Bug-pola hasil run:
//   - TC-007 (filter Status tunggal) PASS -> BUG-016 Kamar TIDAK reproduce di Tag
//   - TC-013/015 (Status di kombinasi) FAIL -> BUG-023 (pola BUG-009/014)
//     Assertion sengaja PRD-correct (assertHasRows) supaya tetap fail sampai bug fixed.
//
// Catatan TC-008 (Filter Status=Tidak Aktif): butuh >=1 tag Tidak Aktif di staging.
//   Karena default Tambah = Aktif & modul Edit Tag belum siap, TC ini di-`it.skip` dulu
//   -> aktifkan setelah modul Edit ready & bisa seed status Tidak Aktif programatik.

import tag from '../../../../../support/pageobjects/TagPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Tag — List (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit-seq>

  // Seed records dibuat di before() & di-share antar TC
  const seedA = {}; // SDIT + Semua (default Aktif)
  const seedB = {}; // SDIT + Siswa
  const seedC = {}; // Sekolah Alam + Guru & Staff

  before(() => {
    cy.fixture('tag').then((data) => {
      d = data;
      seedA.instansi = d.instansi.primary;
      seedA.nama = uniq();
      seedA.kode = uniq();
      seedA.tipe = d.tipeAnggota.semua;

      seedB.instansi = d.instansi.primary;
      seedB.nama = uniq();
      seedB.kode = uniq();
      seedB.tipe = d.tipeAnggota.siswa;

      seedC.instansi = d.instansi.secondary;
      seedC.nama = uniq();
      seedC.kode = uniq();
      seedC.tipe = d.tipeAnggota.guruStaff;

      login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
      tag.visit();
      tag.addTag(seedA.instansi, seedA.nama, seedA.kode, seedA.tipe);
      tag.assertSuccessToast(d.messages.addSuccess);
      tag.visit();
      tag.addTag(seedB.instansi, seedB.nama, seedB.kode, seedB.tipe);
      tag.assertSuccessToast(d.messages.addSuccess);
      tag.visit();
      tag.addTag(seedC.instansi, seedC.nama, seedC.kode, seedC.tipe);
      tag.assertSuccessToast(d.messages.addSuccess);
    });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    tag.visit();
  });

  // ---------- DISPLAY ----------
  it('TC-TAG-LST-001 | Happy | List menampilkan kolom lengkap sesuai PRD', () => {
    tag.assertHasRows();
    tag.assertColumns(); // Instansi|Nama|Kode|Tipe(badge)|Status(badge)|Dibuat|Edit|Hapus = 8 sel
  });

  it('TC-TAG-LST-002 | Happy | Setiap baris punya aksi Edit & Hapus', () => {
    tag.assertHasRows();
    // Pakai .should(callback) supaya retry sampai tabel selesai render (vs .each yg sinkron).
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'jumlah baris >0').to.be.gt(0);
      [...$rows].forEach((tr, i) => {
        const $tr = Cypress.$(tr);
        expect($tr.find('svg.lucide-square-pen').length, `row #${i + 1} icon Edit ada`).to.be.gt(0);
        expect($tr.find('svg.lucide-trash').length, `row #${i + 1} icon Hapus ada`).to.be.gt(0);
      });
    });
  });

  // ---------- SORT & DEFAULT ----------
  it('TC-TAG-LST-003 | Positif | Urutan default terbaru -> terlama', () => {
    const nama = uniq();
    tag.addTag(d.instansi.primary, nama, uniq(), d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.visit(); // back to list bersih (tanpa search/filter)
    tag.assertFirstRowName(nama); // newest at top
  });

  it('TC-TAG-LST-004 | Positif | Default status tag baru = Aktif (PRD validasi c)', () => {
    const nama = uniq();
    tag.addTag(d.instansi.primary, nama, uniq(), d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.visit();
    tag.search(nama);
    tag.assertRowStatus(nama, d.labels.statusActive);
  });

  // ---------- FILTER ----------
  it('TC-TAG-LST-005 | Happy | Filter by Instansi -> hanya tag instansi tsb', () => {
    tag.filterByInstansi(d.instansi.primary);
    tag.assertActiveFilter(d.filter.labels.instansi, d.instansi.primary);
    tag.assertHasRows();
    tag.assertAllRowsInstansi(d.instansi.primary);
  });

  it('TC-TAG-LST-006 | Positif | Ganti filter Instansi -> list ter-update', () => {
    tag.filterByInstansi(d.instansi.primary);
    tag.assertAllRowsInstansi(d.instansi.primary);
    // Ganti: hapus chip lama lalu apply yang baru
    tag.removeFilter(d.filter.labels.instansi);
    tag.filterByInstansi(d.instansi.secondary);
    tag.assertActiveFilter(d.filter.labels.instansi, d.instansi.secondary);
    tag.assertAllRowsInstansi(d.instansi.secondary);
  });

  it('TC-TAG-LST-007 | Positif | Filter Status=Aktif tunggal [kandidat BUG-016 pattern]', () => {
    tag.filterByStatus(d.labels.statusActive);
    tag.assertActiveFilter(d.filter.labels.status, d.labels.statusActive);
    // Expected: list terisi tag Aktif (seed semua default Aktif -> minimal 3 row).
    // Kalau BUG-016 (Kamar) reproduce di Tag: list balik empty padahal data Aktif ada -> assertHasRows fail.
    tag.assertHasRows();
    tag.assertAllRowsStatus(d.labels.statusActive);
  });

  it.skip('TC-TAG-LST-008 | Positif | Filter Status=Tidak Aktif tunggal [butuh modul Edit Tag]', () => {
    // Precondition: butuh >=1 tag berstatus Tidak Aktif. Default Tambah = Aktif,
    // dan modul Edit Tag belum siap utk seed status Tidak Aktif programatik.
    // Aktifkan setelah modul Edit Tag ready.
    tag.filterByStatus(d.labels.statusInactive);
    tag.assertActiveFilter(d.filter.labels.status, d.labels.statusInactive);
    tag.assertHasRows();
    tag.assertAllRowsStatus(d.labels.statusInactive);
  });

  it('TC-TAG-LST-009 | Positif | Filter Status=Semua -> reset / tampil semua', () => {
    tag.filterByStatus(d.labels.statusActive);
    tag.assertAllRowsStatus(d.labels.statusActive);
    tag.filterByStatus(d.filter.options.statusAll); // pilih opsi "Semua" -> reset
    // Setelah pilih "Semua", chip Status seharusnya hilang (atau berubah jadi Semua).
    // PRD tidak spesifik soal chip behavior -> cukup pastikan list muncul lagi (tidak empty).
    tag.assertHasRows();
  });

  it('TC-TAG-LST-010 | Happy | Filter Tipe Member=Siswa -> hanya tag Tipe=Siswa', () => {
    tag.filterByTipe(d.tipeAnggota.siswa);
    tag.assertActiveFilter(d.filter.labels.tipeAnggota, d.tipeAnggota.siswa);
    tag.assertHasRows();
    tag.assertAllRowsTipe(d.tipeAnggota.siswa);
  });

  it('TC-TAG-LST-011 | Positif | Filter Tipe Member=Guru & Staff', () => {
    tag.filterByTipe(d.tipeAnggota.guruStaff);
    tag.assertActiveFilter(d.filter.labels.tipeAnggota, d.tipeAnggota.guruStaff);
    tag.assertHasRows();
    tag.assertAllRowsTipe(d.tipeAnggota.guruStaff);
  });

  it('TC-TAG-LST-012 | Positif | Filter Tipe Member=Semua -> tampil semua', () => {
    tag.filterByTipe(d.tipeAnggota.siswa);
    tag.assertAllRowsTipe(d.tipeAnggota.siswa);
    tag.filterByTipe(d.filter.options.tipeAll); // pilih opsi "Semua" -> reset
    tag.assertHasRows();
  });

  it('TC-TAG-LST-013 | Positif | Filter kombinasi: Instansi + Status=Aktif [BUG-023]', () => {
    // BUG-023: kombinasi Instansi+Status balik empty padahal data ada (pola BUG-009/014).
    // Assertion PRD-correct (assertHasRows) -> sengaja FAIL sampai BE fix kombinasi office+status.
    tag.filterByInstansi(d.instansi.primary);
    tag.filterByStatus(d.labels.statusActive);
    tag.assertActiveFilter(d.filter.labels.instansi, d.instansi.primary);
    tag.assertActiveFilter(d.filter.labels.status, d.labels.statusActive);
    tag.assertHasRows();
    tag.assertAllRowsInstansi(d.instansi.primary);
    tag.assertAllRowsStatus(d.labels.statusActive);
  });

  it('TC-TAG-LST-014 | Positif | Filter kombinasi: Instansi + Tipe Member', () => {
    tag.filterByInstansi(d.instansi.primary);
    tag.filterByTipe(d.tipeAnggota.siswa);
    tag.assertHasRows();
    tag.assertAllRowsInstansi(d.instansi.primary);
    tag.assertAllRowsTipe(d.tipeAnggota.siswa);
  });

  it('TC-TAG-LST-015 | Positif | Filter kombinasi 3: Instansi + Status + Tipe Member [BUG-023]', () => {
    // BUG-023: kombinasi 3 ikut kena karena Status digabung dgn filter lain (lihat TC-013).
    // Assertion PRD-correct -> sengaja FAIL sampai BE fix.
    tag.filterByInstansi(d.instansi.primary);
    tag.filterByStatus(d.labels.statusActive);
    tag.filterByTipe(d.tipeAnggota.semua); // seedA = SDIT + Aktif + Semua
    tag.assertHasRows();
    tag.assertAllRowsInstansi(d.instansi.primary);
    tag.assertAllRowsStatus(d.labels.statusActive);
    tag.assertAllRowsTipe(d.tipeAnggota.semua);
  });

  // ---------- SEARCH ----------
  it('TC-TAG-LST-016 | Happy | Cari by Nama Tag', () => {
    tag.search(seedA.nama);
    tag.assertRowExists(seedA.nama);
  });

  it('TC-TAG-LST-017 | Happy | Cari by Kode Tag', () => {
    tag.search(seedA.kode);
    cy.contains('table tbody tr', seedA.kode).should('exist');
  });

  it('TC-TAG-LST-018 | Positif | Clear search -> list kembali tampil penuh', () => {
    tag.search(seedA.nama);
    tag.assertRowExists(seedA.nama);
    tag.clearSearch();
    tag.assertHasRows();
    cy.get('table tbody tr').its('length').should('be.gt', 1); // bukan cuma 1 baris hasil search
  });

  // ---------- EDGE & NEGATIF ----------
  it('TC-TAG-LST-019 | Edge | Cari case-insensitive (huruf kecil) menemukan data', () => {
    const lower = seedA.nama.toLowerCase();
    tag.search(lower);
    tag.assertRowExists(seedA.nama); // tetap ketemu walau keyword lowercase
  });

  // NOTE: TC-020 (search teks Tipe Member -> tidak menemukan, PRD strict) di-HAPUS.
  //       Alasan: staging punya data lama yg Nama/Kode-nya mengandung "Siswa" -> false positive
  //       (search yg seharusnya cuma match Tipe ternyata juga match Nama/Kode lama).
  //       Coverage search PRD sudah cukup di TC-016 (Nama), TC-017 (Kode), TC-019 (case-insensitive).

  it('TC-TAG-LST-020 | Negatif | Cari keyword tidak ada -> halaman kosong', () => {
    tag.search(d.testData.noMatchSearch);
    tag.assertEmptyState();
  });

  it('TC-TAG-LST-021 | Negatif | Filter kombinasi tanpa data cocok -> halaman kosong', () => {
    // Pakai kombo yg kecil kemungkinan punya data: Sekolah Alam + Tipe Siswa (seedC = SekAlam + GuruStaff,
    // seedB = SDIT + Siswa; jadi kombo SekAlam+Siswa tidak ada di seed kami).
    // Jika staging punya data manual yg match, TC ini akan fail -- bukan bug, butuh adjust kombo.
    cy.log('Asumsi: kombo "Sekolah Alam + Tipe=Siswa" tidak ada di staging. Adjust kalau ternyata ada.');
    tag.filterByInstansi(d.instansi.secondary);
    tag.filterByTipe(d.tipeAnggota.siswa);
    tag.assertEmptyState();
  });

  // ---------- DEFERRED (asosiasi Member -- per instruksi user, butuh fitur konsumen) ----------
  it.skip('TC-TAG-LST-022 | Positif | Tag Tipe=Siswa dipakai di picker Data Diri Siswa [DEFERRED]', () => {});
  it.skip('TC-TAG-LST-023 | Positif | Tag Tipe=Guru&Staff dipakai di picker Data Guru/Staff [DEFERRED]', () => {});
  it.skip('TC-TAG-LST-024 | Positif | Tag Tipe=Semua dipakai di semua picker member [DEFERRED]', () => {});
});
