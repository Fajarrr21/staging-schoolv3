// edittag.cy.js — Spec Edit Tag
// Modul: Pengaturan > Akademik > Tag  |  Route: /setting/academic/tag
// Sumber TC: docs/test-cases/TC_Tag_Edit.xlsx (TC-TAG-EDT-001..024)
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit><2digit-seq>.
//
// Bug-pola yg sengaja dikonfirmasi via spec ini:
//   - BUG-024 (Edit kode duplikat -> FE silent) -> TC-017 PRD-correct, akan FAIL sampai fix
//   - BUG-022 (Nama/Kode >255 -> FE silent / raw SQL) -> TC-018/019 sengaja FAIL
//   - BUG-021 (description toast salah copy "data Kelas") di-mitigate via assertSuccessToast
//     (assertion title-only)
//
// Strategi seeding:
//   before(): seed 2 tag di SDIT (seedA & seedB) utk TC-017 (uji duplikat kode).
//   TC lain pakai helper seedFresh() utk dapat tag baru -- biar gak saling pengaruh data state.

import tag from '../../../../../support/pageobjects/TagPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Tag — Edit (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit>

  // Seeds di-share antar TC. seedA & seedB dipakai TC-017 (duplikat kode, instansi sama).
  const seedA = {};
  const seedB = {};

  before(() => {
    cy.fixture('tag').then((data) => {
      d = data;
      seedA.instansi = d.instansi.primary;   // SDIT
      seedA.nama = uniq();
      seedA.kode = uniq();
      seedA.tipe = d.tipeAnggota.semua;

      seedB.instansi = d.instansi.primary;   // SDIT (sama dgn A, utk uji duplikat kode)
      seedB.nama = uniq();
      seedB.kode = uniq();
      seedB.tipe = d.tipeAnggota.siswa;

      login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
      tag.visit();
      tag.addTag(seedA.instansi, seedA.nama, seedA.kode, seedA.tipe);
      tag.assertSuccessToast(d.messages.addSuccess);
      tag.visit();
      tag.addTag(seedB.instansi, seedB.nama, seedB.kode, seedB.tipe);
      tag.assertSuccessToast(d.messages.addSuccess);
    });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    tag.visit();
    // Ensure body interaktif sebelum aksi apapun (Radix kadang stuck even setelah cy.visit).
    tag.waitBodyUnlocked();
  });

  // Cleanup: paksa tutup dialog yg masih nyangkut + paksa unlock body kalau Radix lupa release.
  // Polusi state antar-TC (modal stuck, popper sisa, pointer-events:none) bikin TC berikutnya
  // gak bisa klik edit icon / form unmount mid-action. Cleanup di sini cegah cascade failure.
  afterEach(() => {
    cy.get('body', { log: false }).then(($b) => {
      const stuck = $b.find('[data-slot="dialog-content"][data-state="open"]').length > 0;
      if (stuck) {
        cy.get('body').type('{esc}', { force: true });
        cy.wait(300, { log: false });
      }
    });
    // waitBodyUnlocked: handle popper sisa (ESC) + force-clear body pointer-events kalau stuck
    tag.waitBodyUnlocked();
  });

  // Helper: seed 1 tag baru dgn override opsional, return obj-nya. Akhir di list page.
  const seedFresh = (over = {}) => {
    const t = {
      instansi: d.instansi.primary,
      nama: uniq(),
      kode: uniq(),
      tipe: d.tipeAnggota.semua,
      ...over,
    };
    tag.addTag(t.instansi, t.nama, t.kode, t.tipe);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.visit();
    tag.waitBodyUnlocked(); // ensure clean state before TC body action
    return t;
  };

  // PRD constraint: Nama Tag hanya boleh huruf/angka/spasi (NO hyphen / special chars).
  // Helper bikin nama edit yg valid (uniq + suffix alphanumeric).
  const editedName = (suffix = 'EDIT') => `${uniq()}${suffix}`;

  // ---------- DISPLAY & PRE-FILL ----------
  it('TC-TAG-EDT-001 | Happy | Form Edit pre-filled dgn data existing', () => {
    tag.openEditByName(seedA.nama);
    tag.assertModalOpen(d.labels.editTitle);
    tag.assertFormPrefilled({
      instansi: seedA.instansi,
      nama: seedA.nama,
      kode: seedA.kode,
      tipe: seedA.tipe,
      status: d.labels.statusActive, // default Tambah = Aktif
    });
  });

  it('TC-TAG-EDT-002 | Happy | Dropdown Tipe Anggota: tepat 3 opsi PRD (urutan UI bebas)', () => {
    tag.openEditByName(seedA.nama);
    tag.assertTipeOptionsSet([d.tipeAnggota.semua, d.tipeAnggota.siswa, d.tipeAnggota.guruStaff]);
  });

  // ---------- HAPPY (single-field edit) ----------
  it('TC-TAG-EDT-003 | Happy | Edit Nama Tag berhasil', () => {
    const t = seedFresh();
    const newName = editedName('EDIT');
    tag.openEditByName(t.nama);
    tag.fillNama(newName);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.assertModalClosed();
    tag.visit();
    tag.search(newName);
    tag.assertRowExists(newName);
  });

  it('TC-TAG-EDT-004 | Happy | Edit Kode Tag berhasil', () => {
    const t = seedFresh();
    const newKode = `${uniq()}X`;
    tag.openEditByName(t.nama);
    tag.fillKode(newKode);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(t.nama);
    tag.assertRowKode(t.nama, newKode);
  });

  it('TC-TAG-EDT-005 | Happy | Edit Tipe Anggota berhasil -> badge ter-update di list', () => {
    const t = seedFresh({ tipe: d.tipeAnggota.semua });
    tag.openEditByName(t.nama);
    tag.selectTipe(d.tipeAnggota.siswa);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(t.nama);
    tag.assertRowTipe(t.nama, d.tipeAnggota.siswa);
  });

  it('TC-TAG-EDT-006 | Happy | Edit Status Aktif -> Tidak Aktif', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.selectStatus(d.labels.statusInactive);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(t.nama);
    tag.assertRowStatus(t.nama, d.labels.statusInactive);
  });

  it('TC-TAG-EDT-007 | Happy | Edit Status Tidak Aktif -> Aktif (reverse)', () => {
    // Self-contained: seed -> set Tidak Aktif -> baru tes set ke Aktif
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.selectStatus(d.labels.statusInactive);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    // Sekarang tes reverse: Tidak Aktif -> Aktif
    tag.openEditByName(t.nama);
    tag.assertFormPrefilled({ status: d.labels.statusInactive });
    tag.selectStatus(d.labels.statusActive);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(t.nama);
    tag.assertRowStatus(t.nama, d.labels.statusActive);
  });

  // ---------- POSITIF (multi-field, cancel paths, no-regression) ----------
  it('TC-TAG-EDT-008 | Positif | Edit semua field sekaligus', () => {
    const t = seedFresh();
    const newName = editedName('ALL');
    const newKode = `${uniq()}A`;
    tag.openEditByName(t.nama);
    tag.fillNama(newName);
    tag.fillKode(newKode);
    tag.selectTipe(d.tipeAnggota.siswa);
    tag.selectStatus(d.labels.statusInactive);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(newName);
    tag.assertRowExists(newName);
    tag.assertRowKode(newName, newKode);
    tag.assertRowTipe(newName, d.tipeAnggota.siswa);
    tag.assertRowStatus(newName, d.labels.statusInactive);
  });

  it('TC-TAG-EDT-009 | Positif | Edit 1 field (Nama) -> field lain TIDAK berubah (no regression)', () => {
    const t = seedFresh({ tipe: d.tipeAnggota.siswa });
    const newName = editedName('NEW');
    tag.openEditByName(t.nama);
    tag.fillNama(newName);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(newName);
    tag.assertRowExists(newName);
    tag.assertRowInstansi(newName, t.instansi);
    tag.assertRowKode(newName, t.kode);
    tag.assertRowTipe(newName, t.tipe);
    tag.assertRowStatus(newName, d.labels.statusActive); // default tetap, tidak diubah
  });

  it('TC-TAG-EDT-010 | Positif | Klik Batal -> perubahan tidak tersimpan (PRD validasi b)', () => {
    const t = seedFresh();
    const fakeName = editedName('CANCEL');
    tag.openEditByName(t.nama);
    tag.fillNama(fakeName);
    tag.clickCancel();
    tag.assertModalClosed();
    tag.visit();
    tag.search(t.nama);
    tag.assertRowExists(t.nama);      // nama lama masih ada
    tag.assertRowNotExists(fakeName); // nama baru tidak tersimpan
  });

  it('TC-TAG-EDT-011 | Positif | Klik X close -> perubahan tidak tersimpan', () => {
    const t = seedFresh();
    const fakeName = editedName('X');
    tag.openEditByName(t.nama);
    tag.fillNama(fakeName);
    tag.elements.closeXButton().click({ force: true });
    tag.assertModalClosed();
    tag.visit();
    tag.search(t.nama);
    tag.assertRowExists(t.nama);
  });

  it('TC-TAG-EDT-012 | Positif | Ganti Instansi -> tag pindah ke instansi baru', () => {
    const t = seedFresh({ instansi: d.instansi.primary });
    tag.openEditByName(t.nama);
    tag.selectInstansi(d.instansi.secondary);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.visit();
    tag.search(t.nama);
    tag.assertRowInstansi(t.nama, d.instansi.secondary);
  });

  // ---------- NEGATIF (required) ----------
  it('TC-TAG-EDT-013 | Negatif | Clear Nama Tag -> error required, tidak tersimpan', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.clearNama();
    tag.clickSave();
    tag.assertNamaError(d.messages.namaRequired);
    tag.elements.dialog().should('be.visible'); // modal tetap terbuka
  });

  it('TC-TAG-EDT-014 | Negatif | Clear Kode Tag -> error required, tidak tersimpan', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.clearKode();
    tag.clickSave();
    tag.assertKodeError(d.messages.kodeRequired);
    tag.elements.dialog().should('be.visible');
  });

  it('TC-TAG-EDT-015 | Negatif | Nama whitespace saja -> error required (trim)', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.fillNama(d.testData.spaceOnly);
    tag.clickSave();
    tag.assertNamaError(d.messages.requiredGeneric);
  });

  it('TC-TAG-EDT-016 | Negatif | Kode whitespace saja -> error required (trim)', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.fillKode(d.testData.spaceOnly);
    tag.clickSave();
    tag.assertKodeError(d.messages.requiredGeneric);
  });

  // ---------- NEGATIF (duplikat code) ----------
  it('TC-TAG-EDT-017 | Negatif | Edit Kode jadi duplikat (instansi sama) [BUG-024]', () => {
    // BUG-024: FE silent saat duplikat -- BE balikin error, FE diam.
    // Assertion PRD-correct (assertNotSilent) -> sengaja FAIL sampai FE catch & tampilkan toast/inline.
    tag.openEditByName(seedB.nama);
    tag.fillKode(seedA.kode); // duplikat dgn Tag A (instansi sama)
    tag.clickSave();
    tag.waitSave();
    tag.assertNotSilent(); // butuh toast sukses ATAU error ATAU form-message non-kosong
  });

  // ---------- EDGE (boundary) ----------
  it('TC-TAG-EDT-018 | Edge | Edit Nama Tag >255 char [kandidat BUG-022]', () => {
    // Pola BUG-022 (Tambah): no maxlength, raw SQL error, FE silent. Cek apakah reproduce di Edit.
    const t = seedFresh();
    const longName = 'A'.repeat(d.testData.boundaries.nameOverflow);
    tag.openEditByName(t.nama);
    tag.fillNama(longName);
    tag.clickSave();
    tag.waitSave();
    tag.assertNotSilent();
  });

  it('TC-TAG-EDT-019 | Edge | Edit Kode Tag >255 char [kandidat BUG-022]', () => {
    const t = seedFresh();
    const longKode = 'A'.repeat(d.testData.boundaries.nameOverflow);
    tag.openEditByName(t.nama);
    tag.fillKode(longKode);
    tag.clickSave();
    tag.waitSave();
    tag.assertNotSilent();
  });

  it('TC-TAG-EDT-020 | Edge | Edit Nama Tag jadi 1 karakter -> tersimpan (min boundary)', () => {
    const t = seedFresh();
    tag.openEditByName(t.nama);
    tag.fillNama(d.testData.minName); // "A"
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
  });

  it('TC-TAG-EDT-021 | Edge | Edit Kode Tag jadi nilai pendek -> tersimpan (min boundary)', () => {
    // Note: pakai short-unique kode (bukan 1-char "A") karena 1-char universe sempit
    // & staging punya banyak data lama yg mungkin tabrakan (duplikat kode silent BUG-024).
    const t = seedFresh();
    const shortKode = `Z${ts.slice(-2)}${seq}`; // 4 char unique
    tag.openEditByName(t.nama);
    tag.fillKode(shortKode);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
  });

  // ---------- PERSISTENCE ----------
  it('TC-TAG-EDT-022 | Positif | Persistence: reload setelah Edit -> perubahan tetap', () => {
    const t = seedFresh();
    const newName = editedName('PERSIST');
    tag.openEditByName(t.nama);
    tag.fillNama(newName);
    tag.clickSave();
    tag.assertSuccessToast(d.messages.editSuccess);
    tag.assertPersisted(newName); // reload + cari -> tetap ada (verifikasi BE persist)
  });

  // ---------- DEFERRED (asosiasi Member -- per instruksi user, butuh fitur konsumen) ----------
  it.skip('TC-TAG-EDT-023 | Positif | Tag hasil Edit Tipe=Siswa muncul di picker Data Siswa [DEFERRED]', () => {});
  it.skip('TC-TAG-EDT-024 | Positif | Ubah Tipe Member -> visibility di picker konsumen ikut berubah [DEFERRED]', () => {});
});
