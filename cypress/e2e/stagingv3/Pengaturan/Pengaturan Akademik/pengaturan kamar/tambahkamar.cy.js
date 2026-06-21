// tambahkamar.cy.js — Spec Tambah Kamar
// Modul: Pengaturan > Akademik > Kamar  |  Route: /setting/academic/room
// Sumber TC: docs/test-cases/TC_Kamar_Tambah.xlsx (TC-KMR-ADD-001..019).
// Konvensi: reuse cy.session via LoginPage.loginViaSession; naming rerun-safe QA<6digit-ts><seq>.
// Semua label/message/instansi/testData dibaca dari fixture kamar.json (source of truth).
// CATATAN DATA: spec ini bikin row QA tiap run -> cleanup utility (cleanupkamar) nyusul bareng modul Hapus.

import kamar from '../../../../../support/pageobjects/KamarPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kamar — Tambah (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit-seq>

  before(() => {
    cy.fixture('kamar').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kamar.visit();
  });

  // ---------- HAPPY ----------
  it('TC-KMR-ADD-001 | Happy | Tambah kamar valid (hanya field required: Instansi + Nama)', () => {
    const nama = uniq();
    kamar.addKamar(d.instansi.primary, nama); // PIC & Lokasi dibiarkan kosong (opsional)
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.assertModalClosed();
    kamar.search(nama);
    kamar.assertRowExists(nama); // row baru muncul (default Status = Aktif)
  });

  it('TC-KMR-ADD-002 | Happy | Tambah kamar lengkap (Instansi + Nama + PIC + Lokasi)', () => {
    const nama = uniq();
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.selectFirstPic();             // pilih guru pertama -> alias @picName
    kamar.fillLokasi(d.testData.lokasiSample);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.assertModalClosed();
    // verifikasi PIC & Lokasi BENERAN tersimpan -> reload + cek kolom
    kamar.assertPersisted(nama);
    kamar.assertRowLokasi(nama, d.testData.lokasiSample);
    cy.get('@picName').then((pic) => { if (pic) kamar.assertRowPic(nama, pic); });
  });

  // ---------- POSITIF ----------
  it('TC-KMR-ADD-003 | Positif | Form Tambah terbuka dengan field kosong', () => {
    kamar.openAddModal();
    kamar.assertModalOpen(d.labels.addTitle);
    kamar.assertFormEmpty();
  });

  it('TC-KMR-ADD-004 | Positif | Batal menutup form tanpa menambah data', () => {
    kamar.openAddModal();
    kamar.clickCancel();
    kamar.assertModalClosed();
  });

  it('TC-KMR-ADD-005 | Positif | Isi form valid lalu Batal -> data tidak tersimpan', () => {
    const nama = uniq();
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.clickCancel();
    kamar.assertModalClosed();
    kamar.search(nama);
    kamar.assertRowNotExists(nama);
  });

  it('TC-KMR-ADD-006 | Positif | Tambah beberapa kamar berbeda dalam 1 instansi', () => {
    kamar.addKamar(d.instansi.primary, uniq());
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.addKamar(d.instansi.primary, uniq());
    kamar.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-KMR-ADD-007 | Positif | Dropdown PIC berisi guru/staff instansi terpilih', () => {
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.assertPicHasTeacherOptions();
  });

  it('TC-KMR-ADD-008 | Positif | Ganti Instansi -> PIC ter-reset [ASUMSI]', () => {
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.selectFirstPic();
    kamar.selectInstansi(d.instansi.secondary); // ganti instansi
    // Expected (asumsi): pilihan PIC dari instansi lama di-reset ke placeholder.
    // Kalau tidak reset -> TC fail = info behavior (bukan lock buggy).
    kamar.assertPicReset();
  });

  it('TC-KMR-ADD-009 | Positif | Nama sama beda instansi -> sukses [ASUMSI per-instansi]', () => {
    const nama = uniq();
    kamar.addKamar(d.instansi.primary, nama);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.addKamar(d.instansi.secondary, nama);
    kamar.assertSuccessToast(d.messages.addSuccess); // gagal -> uniqueness ternyata GLOBAL
  });

  // ---------- NEGATIF ----------
  it('TC-KMR-ADD-010 | Negatif | Simpan dengan Nama Kamar kosong', () => {
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.clickSave();
    kamar.assertKamarError(d.messages.nameRequired);
    kamar.assertModalOpen(d.labels.addTitle);
    kamar.assertNoSuccessToast();
  });

  it('TC-KMR-ADD-011 | Negatif | Simpan dengan Instansi kosong', () => {
    kamar.openAddModal();
    kamar.fillKamar(uniq());
    kamar.clickSave();
    kamar.assertInstansiError(d.messages.instansiRequired);
    kamar.assertModalOpen(d.labels.addTitle);
    kamar.assertNoSuccessToast();
  });

  it('TC-KMR-ADD-012 | Negatif | Simpan dengan kedua field required kosong', () => {
    kamar.openAddModal();
    kamar.clickSave();
    kamar.assertInstansiError(d.messages.instansiRequired);
    kamar.assertKamarError(d.messages.nameRequired);
    kamar.assertModalOpen(d.labels.addTitle);
    kamar.assertNoSuccessToast();
  });

  it('TC-KMR-ADD-013 | Negatif | Duplikat: nama sama pada instansi sama [KANDIDAT BUG]', () => {
    const nama = uniq();
    kamar.addKamar(d.instansi.primary, nama); // seed
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.addKamar(d.instansi.primary, nama); // duplikat
    // Expected benar: ditolak -> TANPA success toast, dialog tetap kebuka.
    // Kalau malah sukses & nutup modal = FE-silent -> log BUG baru.
    kamar.assertNoSuccessToast();
    kamar.assertModalOpen(d.labels.addTitle);
  });

  // ---------- EDGE ----------
  it('TC-KMR-ADD-014 | Edge | Nama whitespace-only (spasi saja)', () => {
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(d.testData.spaceOnly);
    kamar.clickSave();
    kamar.assertKamarError(d.messages.nameRequired); // expected: ter-trim -> dianggap kosong
    kamar.assertModalOpen(d.labels.addTitle);
  });

  it('TC-KMR-ADD-015 | Edge | Leading/trailing space -> trim saat simpan', () => {
    const core = uniq();
    kamar.addKamar(d.instansi.primary, `  ${core}  `);
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.search(core);
    kamar.assertRowExists(core); // ketemu tanpa spasi tepi = ter-trim
  });

  it('TC-KMR-ADD-016 | Edge | Nama >255 char ditolak rapi [BUG-015: FE silent]', () => {
    const len = d.testData.boundaries.nameOverflow; // 300 > batas DB varchar(255)
    const nama = `${d.testData.prefix}${ts}${'X'.repeat(len - (d.testData.prefix.length + 6))}`;
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.elements.kamarInput().invoke('val').then((v) => {
      cy.log(`panjang value ke-set: ${v.length} (target ${len}) — no maxlength di field`);
    });
    kamar.clickSave();
    // Expected BENAR: ditolak rapi -> FE batasi maxlength / tampilkan pesan validasi ramah.
    // Aktual (BUG-015): API balas RAW SQL "value too long ... (255)", FE SILENT (tanpa toast
    //   sukses MAUPUN error). assertNotSilent SENGAJA fail di sini = bukti bug, bukan lock buggy.
    kamar.assertNoSuccessToast();            // data TIDAK boleh tersimpan diam-diam
    kamar.assertModalOpen(d.labels.addTitle); // modal tetap kebuka (request ditolak)
    kamar.assertNotSilent();                  // <- FAIL sampai BUG-015 diperbaiki
  });

  it('TC-KMR-ADD-017 | Edge | Nama 1 karakter (min boundary) — tidak ditolak validasi panjang', () => {
    // Boundary 1 char tak bisa di-uniq-kan (nama "A" statis). Kalau "A" sudah ada dari run
    //   sebelumnya & app tolak duplikat, toast sukses tak muncul -> maka JANGAN assert toast/persist
    //   (jalur create sudah dicover TC-001 dgn nama unik). Cukup buktikan 1 char DITERIMA sbg
    //   panjang sah: field Kamar tetap valid (data-invalid="false"), bukan error required/min-length.
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(d.testData.minName); // "A"
    kamar.clickSave();
    kamar.assertKamarFieldValid();
  });

  it('TC-KMR-ADD-018 | Edge | Lokasi diisi teks panjang (field opsional)', () => {
    const nama = uniq();
    kamar.openAddModal();
    kamar.selectInstansi(d.instansi.primary);
    kamar.fillKamar(nama);
    kamar.fillLokasi(d.testData.longLokasi);
    kamar.clickSave();
    kamar.assertSuccessToast(d.messages.addSuccess);
    kamar.assertPersisted(nama);
    kamar.assertRowLokasi(nama, d.testData.longLokasi); // tersimpan apa adanya
  });

  // ---------- DEFERRED ----------
  // TC-KMR-ADD-019: kamar dipakai di Data Diri Siswa & Pengaturan Presensi Kegiatan.
  // DITUNDA — fitur tsb belum dikerjakan (masih fase CRUD Kamar). Aktifkan setelah modul tersedia.
  it.skip('TC-KMR-ADD-019 | Positif | Kamar dapat dipakai di Data Diri Siswa & Presensi [DEFERRED]', () => {});
});
