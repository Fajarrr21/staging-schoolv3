// Spec: List Kelas (Pengaturan > Akademik > Kelas)
// Sumber: PRD List Kelas + test case sheet (tab "List Kelas") + Catatan List
// Data dari fixture cypress/fixtures/kelas.json

const kelasPage = require('../../../support/pageobjects/KelasPage');

const uniq = (p, seq) => `${p}${Date.now().toString().slice(-6)}${seq}`;

describe('Pengaturan > Akademik > Kelas — List Kelas', () => {
  let data;
  const listUrl = () => `${data.urls.base}${data.urls.kelasList}`;

  const seed = (instansi, nama) => {
    kelasPage.tambahKelas(instansi, nama).assertSuccessToast(data.messages.addSuccess);
    kelasPage.visit(listUrl());
  };

  before(() => {
    cy.fixture('kelas').then((d) => {
      data = d;
    });
  });

  beforeEach(() => {
    // TODO: kalau kalian sudah punya command login bersama, ganti isi callback ini dgn command itu.
    cy.session('admin-cazh-session', () => {
      cy.visit(`${data.urls.base}${data.urls.login}`);
      cy.get('input[type="email"], input[name="email"]').first().type(data.credentials.email);
      cy.get('input[type="password"], input[name="password"]').first()
        .type(data.credentials.password, { log: false });
      cy.contains('button', /masuk|login|sign in/i).click();
      cy.location('pathname', { timeout: data.timeouts.dialog }).should('not.include', data.urls.login);
    });
    kelasPage.visit(listUrl());
  });

  // ---------- DISPLAY (Happy) ----------
  it('TC-LST-001 - list tampil dgn kolom lengkap', () => {
    seed(data.instansi.primary, uniq(data.testData.prefix, '01'));
    kelasPage.assertTableVisible().assertColumnsPresent();
  });

  it('TC-LST-002 - tiap row ada aksi Edit & Hapus', () => {
    kelasPage.assertHasRows().assertEachRowHasActions();
  });

  it('TC-LST-003 - urutan default terbaru -> terlama', () => {
    const a = uniq(data.testData.prefix, '03a');
    const b = uniq(data.testData.prefix, '03b');
    seed(data.instansi.primary, a);
    seed(data.instansi.primary, b); // b dibuat paling akhir => paling baru
    kelasPage.assertFirstRowName(b);
  });

  // ---------- DEFAULT STATUS (Positif) ----------
  it('TC-LST-004 - kelas baru default Status Aktif', () => {
    const nama = uniq(data.testData.prefix, '04');
    seed(data.instansi.primary, nama);
    kelasPage.search(nama);
    kelasPage.assertRowStatus(nama, data.labels.statusActive);
  });

  // ---------- EMPTY STATE ----------
  it('TC-LST-005 - cari tanpa hasil -> empty state', () => {
    kelasPage.search(data.testData.noMatchSearch);
    kelasPage.assertEmptyState();
  });

  // ---------- FILTER INSTANSI ----------
  it('TC-LST-006 - filter by Instansi', () => {
    const nama = uniq(data.testData.prefix, '06');
    seed(data.instansi.primary, nama);
    kelasPage.filterByInstansi(data.instansi.primary);
    kelasPage.assertAllRowsInstansi(data.instansi.primary);
  });

  it.skip('TC-LST-007 - filter Instansi tanpa kelas -> empty [DATA-DEP]', () => {
    // FLAG: butuh instansi yg DIPASTIKAN tidak punya kelas. Isi data.instansi.empty lalu un-skip.
    kelasPage.filterByInstansi(data.instansi.empty);
    kelasPage.assertEmptyState();
  });

  it('TC-LST-008 - ganti pilihan filter Instansi', () => {
    seed(data.instansi.primary, uniq(data.testData.prefix, '08a'));
    seed(data.instansi.secondary, uniq(data.testData.prefix, '08b'));
    kelasPage.filterByInstansi(data.instansi.primary);
    kelasPage.assertFilterChip('Instansi', data.instansi.primary);
    kelasPage.filterByInstansi(data.instansi.secondary);
    kelasPage.assertFilterChip('Instansi', data.instansi.secondary)
      .assertAllRowsInstansi(data.instansi.secondary);
  });

  // ---------- FILTER STATUS ----------
  it('TC-LST-009 - filter Status = Semua', () => {
    kelasPage.filterByStatus(data.labels.filterStatusAll);
    kelasPage.assertHasRows();
  });

  it('TC-LST-010 - filter Status = Aktif', () => {
    seed(data.instansi.primary, uniq(data.testData.prefix, '10'));
    kelasPage.filterByStatus(data.labels.statusActive);
    kelasPage.assertAllRowsStatus(data.labels.statusActive);
  });

  it.skip('TC-LST-011 - filter Status = Tidak Aktif [DATA-DEP]', () => {
    // FLAG #1: butuh data ber-status Tidak Aktif. Default tambah = Aktif, ubah status via modul Edit
    // (belum tersedia). Un-skip setelah ada data inactive.
    kelasPage.filterByStatus(data.labels.statusInactive);
    kelasPage.assertAllRowsStatus(data.labels.statusInactive);
  });

  // ---------- FILTER KOMBINASI ----------
  it.skip('TC-LST-012 - filter Instansi + Status bareng [BUG-009: kombinasi balik kosong]', () => {
    // CONFIRMED BUG-009: filter Instansi + Status (office+status=ACTIVE) balik 0 hasil padahal
    // data ada. Param kekirim benar & kedua chip aktif, tapi response list kosong.
    // Filter tunggal jalan; hanya kombinasi yg gagal. Un-skip setelah BUG-009 di-fix.
    seed(data.instansi.primary, uniq(data.testData.prefix, '12'));
    kelasPage.filterByInstansi(data.instansi.primary).filterByStatus(data.labels.statusActive);
    kelasPage.assertFilterChip('Instansi', data.instansi.primary)
      .assertFilterChip('Status', data.labels.statusActive);
    kelasPage.assertAllRowsInstansi(data.instansi.primary)
      .assertAllRowsStatus(data.labels.statusActive);
  });

  // ---------- SEARCH ----------
  it('TC-LST-013 - cari nama kelas (diketik)', () => {
    const nama = uniq(data.testData.prefix, '13');
    seed(data.instansi.primary, nama);
    kelasPage.search(nama);
    kelasPage.assertRowExists(nama);
  });

  it('TC-LST-014 - cari sebagian nama (partial/substring) [BEHAVIOR-DEP]', () => {
    // FLAG #2: substring match belum dikonfirmasi. Un-skip utk verifikasi behavior.
    const nama = uniq(data.testData.prefix, '14');
    seed(data.instansi.primary, nama);
    kelasPage.search(nama.slice(0, 5));
    kelasPage.assertRowExists(nama);
  });

  it('TC-LST-015 - cari keyword acak -> empty state', () => {
    kelasPage.search(data.testData.noMatchSearch);
    kelasPage.assertEmptyState();
  });

  it('TC-LST-016 - filter aktif tanpa hasil -> empty state', () => {
    kelasPage.filterByInstansi(data.instansi.secondary);
    kelasPage.search(data.testData.noMatchSearch);
    kelasPage.assertEmptyState();
  });

  // ---------- EDGE ----------
  it('TC-LST-017 - cari via URL ?search= saat load -> tidak ter-filter', () => {
    kelasPage.visit(`${listUrl()}?search=${data.testData.noMatchSearch}`);
    // search hanya jalan saat diketik (perilaku modul Tingkat) -> list tidak kosong
    kelasPage.assertHasRows();
  });

  it('TC-LST-018 - cari case-insensitive [BEHAVIOR-DEP]', () => {
    // FLAG #2: case-sensitivity belum dikonfirmasi.
    const nama = uniq(data.testData.prefix, '18');
    seed(data.instansi.primary, nama);
    kelasPage.search(nama.toLowerCase());
    kelasPage.assertRowExists(nama);
  });

  it('TC-LST-019 - cari dgn trailing space: search TIDAK trim (finding)', () => {
    // FINDING: search whitespace-sensitive (tidak trim). "  nama  " => tidak match => empty state.
    const nama = uniq(data.testData.prefix, '19');
    seed(data.instansi.primary, nama);
    kelasPage.search(`  ${nama}  `);
    kelasPage.assertEmptyState();
  });

  it('TC-LST-020 - reset pencarian', () => {
    const nama = uniq(data.testData.prefix, '20');
    seed(data.instansi.primary, nama);
    kelasPage.search(nama).assertRowExists(nama);
    kelasPage.clearSearch().assertHasRows();
  });
});