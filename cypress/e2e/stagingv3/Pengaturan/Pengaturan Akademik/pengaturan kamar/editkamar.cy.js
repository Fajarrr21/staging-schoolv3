// editkamar.cy.js — Spec Edit Kamar
// Modul: Pengaturan > Akademik > Kamar  |  Route: /setting/academic/room
// Sumber TC: docs/test-cases/TC_Kamar_Edit.xlsx (TC-KMR-EDT-001..015).
// Konvensi: reuse cy.session; fixed-wait (no intercept); naming rerun-safe QA<6digit-ts><seq>.
// Bug-target (fail-on-bug): TC-014 duplikat nama -> BUG-019; TC-015 >255 char -> pola BUG-015.
// TC-012 di-skip: Instansi tidak dapat dikosongkan via UI di modal Edit (tidak ada opsi kosong).

import kamar from '../../../../../support/pageobjects/KamarPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kamar — Edit (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`;
  const uniqLok = () => `LOK${ts}${String(++seq).padStart(2, '0')}`;

  before(() => {
    cy.fixture('kamar').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kamar.visit();
  });

  // helper: tambah 1 kamar lalu reload ke list bersih
  const seed = (instansi, nama, opts = {}) => {
    kamar.addKamar(instansi, nama, opts);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.visit();
  };

  // ---------- HAPPY ----------
  it('TC-KMR-EDT-001 | Happy | Edit nama kamar berhasil → perubahan tersimpan & persist', () => {
    const namaAwal = uniq();
    const namaBaru = uniq();
    seed(d.instansi.primary, namaAwal);
    kamar.openEditByName(namaAwal);
    kamar.assertModalOpen(d.labels.editTitle);
    kamar.fillKamar(namaBaru);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.assertModalClosed();
    kamar.assertPersisted(namaBaru);
    kamar.assertNotPersisted(namaAwal);
  });

  it('TC-KMR-EDT-002 | Happy | Edit PIC berhasil → kolom PIC ter-update di list', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama); // tanpa PIC
    kamar.openEditByName(nama);
    kamar.selectFirstPic(); // sets @picName alias
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    cy.get('@picName').then((pic) => {
      if (!pic) { cy.log('Instansi tidak punya guru/staff -> skip assert kolom PIC'); return; }
      kamar.visit();
      kamar.search(nama);
      kamar.assertRowPic(nama, pic);
    });
  });

  it('TC-KMR-EDT-003 | Happy | Edit lokasi berhasil → kolom Lokasi ter-update di list', () => {
    const nama = uniq();
    const lok = uniqLok();
    seed(d.instansi.primary, nama);
    kamar.openEditByName(nama);
    kamar.fillLokasi(lok);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    kamar.search(nama);
    kamar.assertRowLokasi(nama, lok);
  });

  it('TC-KMR-EDT-004 | Happy | Edit status Aktif → Tidak Aktif → badge di list berubah', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama); // default Aktif
    kamar.openEditByName(nama);
    kamar.selectStatus(d.labels.statusInactive);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    kamar.search(nama);
    kamar.assertRowStatus(nama, d.labels.statusInactive);
  });

  it('TC-KMR-EDT-005 | Happy | Edit status Tidak Aktif → Aktif → badge di list berubah', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    // setup: bawa ke Tidak Aktif dulu
    kamar.openEditByName(nama);
    kamar.selectStatus(d.labels.statusInactive);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    // test: ubah kembali ke Aktif
    kamar.openEditByName(nama);
    kamar.selectStatus(d.labels.statusActive);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    kamar.search(nama);
    kamar.assertRowStatus(nama, d.labels.statusActive);
  });

  // ---------- POSITIF ----------
  it('TC-KMR-EDT-006 | Positif | Modal Edit terbuka dengan data pre-populated', () => {
    const nama = uniq();
    const lok = uniqLok();
    // seed kamar dengan nama + lokasi
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.fillLokasi(lok);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.visit();
    // buka edit dan verifikasi semua field pre-populated
    kamar.openEditByName(nama);
    kamar.assertModalOpen(d.labels.editTitle);
    kamar.elements.kamarInput().should('have.value', nama);
    kamar.elements.lokasiInput().should('have.value', lok);
    kamar.elements.instansiValue().should('contain.text', d.instansi.primary);
    kamar.elements.statusValue().should('contain.text', d.labels.statusActive); // default Aktif
  });

  it('TC-KMR-EDT-007 | Positif | Ganti Instansi di Edit → dropdown PIC ter-reset ke placeholder', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama, { pic: 'first' }); // seed dengan PIC -> @picName
    cy.get('@picName').then((pic) => {
      if (!pic) { cy.log('SDIT tidak punya guru/staff -> skip TC-007'); return; }
      kamar.openEditByName(nama);
      kamar.elements.picValue().should('contain.text', pic); // pre-populated dengan PIC lama
      kamar.selectInstansi(d.instansi.secondary); // ganti instansi -> PIC_WAIT di dalam
      kamar.assertPicReset(); // PIC harus ter-reset ke "Tidak ada PIC"
      kamar.clickCancel(); // tutup modal tanpa simpan
    });
  });

  it('TC-KMR-EDT-008 | Positif | Hapus PIC → tersimpan, kolom PIC kosong di list', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama, { pic: 'first' }); // seed dengan PIC -> @picName
    cy.get('@picName').then((pic) => {
      if (!pic) { cy.log('SDIT tidak punya guru/staff -> skip TC-008'); return; }
      kamar.openEditByName(nama);
      kamar.elements.picValue().should('contain.text', pic); // pre-populated
      kamar.selectPic(d.labels.placeholderPic); // set ke "Tidak ada PIC"
      kamar.clickSave();
      kamar.assertSuccessToast(d.messages.editSuccess);
      kamar.visit();
      kamar.search(nama);
      kamar.assertRowNoPic(nama);
    });
  });

  it('TC-KMR-EDT-009 | Positif | Hapus Lokasi → tersimpan, kolom Lokasi kosong di list', () => {
    const nama = uniq();
    const lok = uniqLok();
    seed(d.instansi.primary, nama, { lokasi: lok });
    kamar.openEditByName(nama);
    kamar.elements.lokasiInput().should('have.value', lok); // pre-populated
    kamar.fillLokasi(''); // clear -> hanya .clear() dipanggil, tidak type
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.visit();
    kamar.search(nama);
    kamar.assertRowNoLokasi(nama);
  });

  it('TC-KMR-EDT-010 | Positif | Simpan tanpa perubahan → data tetap sama', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.openEditByName(nama);
    kamar.clickSave(); // tidak ada perubahan
    kamar.assertSuccessToast(d.messages.editSuccess);
    kamar.assertModalClosed();
    kamar.assertPersisted(nama);
  });

  it('TC-KMR-EDT-011 | Positif | Klik Batal → modal tutup, data tidak berubah', () => {
    const nama = uniq();
    const namaEdit = uniq();
    seed(d.instansi.primary, nama);
    kamar.openEditByName(nama);
    kamar.fillKamar(namaEdit); // ubah tapi JANGAN simpan
    kamar.clickCancel();
    kamar.assertModalClosed();
    // nama awal tetap ada; nama edit tidak tersimpan
    kamar.search(nama);
    kamar.assertRowExists(nama);
  });

  // ---------- NEGATIF ----------
  it.skip('TC-KMR-EDT-012 | Negatif | Submit tanpa Instansi → SKIP: UI tidak mengizinkan pengosongan Instansi', () => {
    // Select Instansi di modal Edit selalu terisi (tidak ada opsi kosong/clear).
    // Validasi "Instansi wajib diisi" sudah dicover di TC Tambah (TC-KMR-ADD-006).
    // Kalau UI berubah (ditambah opsi reset Instansi), TC ini bisa di-un-skip.
  });

  it('TC-KMR-EDT-013 | Negatif | Submit dengan Nama Kamar kosong → error validasi', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    kamar.openEditByName(nama);
    kamar.clearKamar();
    kamar.clickSave();
    kamar.assertKamarError(d.messages.nameRequired);
    kamar.assertModalOpen(d.labels.editTitle);
    kamar.assertNoSuccessToast();
  });

  it('TC-KMR-EDT-014 | Negatif | Edit nama jadi duplikat (instansi sama) → error [BUG-019]', () => {
    const namaA = uniq();
    const namaB = uniq();
    seed(d.instansi.primary, namaA);
    seed(d.instansi.primary, namaB);
    kamar.openEditByName(namaB);
    kamar.fillKamar(namaA); // nama duplikat
    kamar.clickSave();
    // PRD: sistem menampilkan pesan error. Aktual (BUG-019): FE silent — backend balik
    //   {"message":"Nama kamar sudah ada di instansi ini"} tapi FE tidak tampilkan apapun.
    //   assertNotSilent SENGAJA fail sampai bug fixed.
    kamar.assertNotSilent();
  });

  // ---------- EDGE ----------
  it('TC-KMR-EDT-015 | Edge | Edit nama kamar >255 char → FE wajib beri feedback [Kandidat pola BUG-015]', () => {
    const nama = uniq();
    seed(d.instansi.primary, nama);
    const overflow = 'A'.repeat(d.testData.boundaries.nameOverflow);
    kamar.openEditByName(nama);
    kamar.fillKamar(overflow);
    kamar.clickSave();
    // Expected: FE beri feedback (maxlength / pesan error ramah). Aktual: kemungkinan silent
    //   seperti BUG-015 (Tambah) -> assertNotSilent fail jika FE diam.
    kamar.assertNotSilent();
  });
});
