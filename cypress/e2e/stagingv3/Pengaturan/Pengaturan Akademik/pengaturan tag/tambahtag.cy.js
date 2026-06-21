// tambahtag.cy.js — Spec Tambah Tag
// Modul: Pengaturan > Akademik > Tag  |  Route: /setting/academic/tag
// Sumber TC: docs/test-cases/TC_Tag_Tambah.xlsx (TC-TAG-ADD-001..028).
// Konvensi: reuse cy.session via LoginPage.loginViaSession; naming rerun-safe QA<6digit-ts><seq>.
// Semua label/message/instansi/testData dibaca dari fixture tag.json (source of truth).
//
// CATATAN BUG yang sengaja TIDAK di-lock ke buggy behavior (assertion mengarah ke benar):
//   - BUG-020: FE silent saat duplikat kode  -> TC-016 pakai assertNotSilent() -> sengaja FAIL.
//   - BUG-021: toast description salah ("data Kelas") -> assert HANYA title; TC-028 informational.
//   - BUG-022: Nama/Kode Tag tanpa maxlength + FE silent saat >255 -> TC-019/020 pakai assertNotSilent().
// Cleanup tag QA tiap run -> utility cleanup nyusul bareng modul Hapus.

import tag from '../../../../../support/pageobjects/TagPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Tag — Tambah (CARDS School)', () => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  let d;

  const uniq = () => `${d.testData.prefix}${ts}${String(++seq).padStart(2, '0')}`; // QA<6digit><2digit-seq>

  before(() => {
    cy.fixture('tag').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    tag.visit();
  });

  // ---------- HAPPY ----------
  it('TC-TAG-ADD-001 | Happy | Tambah tag valid lengkap (Tipe=Semua)', () => {
    const nama = uniq();
    const kode = uniq();
    tag.addTag(d.instansi.primary, nama, kode, d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.assertModalClosed();
    tag.search(nama);
    tag.assertRowExists(nama);
  });

  it('TC-TAG-ADD-002 | Happy | Tambah tag Tipe Anggota = Siswa (STUDENT)', () => {
    const nama = uniq();
    const kode = uniq();
    tag.addTag(d.instansi.primary, nama, kode, d.tipeAnggota.siswa);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.assertModalClosed();
    // Verifikasi Tipe Anggota tersimpan -> reload + cek badge kolom Tipe
    tag.assertPersisted(nama);
    tag.assertRowTipe(nama, d.tipeAnggota.siswa);
  });

  it('TC-TAG-ADD-003 | Happy | Tambah tag Tipe Anggota = Guru & Staff', () => {
    const nama = uniq();
    const kode = uniq();
    tag.addTag(d.instansi.primary, nama, kode, d.tipeAnggota.guruStaff);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.assertModalClosed();
    tag.assertPersisted(nama);
    tag.assertRowTipe(nama, d.tipeAnggota.guruStaff);
  });

  // ---------- POSITIF ----------
  it('TC-TAG-ADD-004 | Positif | Form Tambah terbuka dengan field kosong', () => {
    tag.openAddModal();
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertFormEmpty();
  });

  it('TC-TAG-ADD-005 | Positif | Batal menutup form tanpa menambah data', () => {
    tag.openAddModal();
    tag.clickCancel();
    tag.assertModalClosed();
  });

  it('TC-TAG-ADD-006 | Positif | Isi form valid lalu Batal -> data tidak tersimpan', () => {
    const nama = uniq();
    const kode = uniq();
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(nama);
    tag.fillKode(kode);
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickCancel();
    tag.assertModalClosed();
    tag.search(nama);
    tag.assertRowNotExists(nama);
  });

  it('TC-TAG-ADD-007 | Positif | Dropdown Tipe Anggota: tepat 3 opsi PRD (urutan UI bebas)', () => {
    // PRD: "Semua, Siswa, Guru & Staff" — label & urutan opsi configurable di app.
    // Assert SET (bukan array order) supaya tahan perubahan urutan di Pengaturan.
    tag.openAddModal();
    tag.assertTipeOptionsSet([
      d.tipeAnggota.semua,      // "Semua"
      d.tipeAnggota.siswa,      // "Siswa"
      d.tipeAnggota.guruStaff,  // "Guru & Staff"
    ]);
  });

  it('TC-TAG-ADD-008 | Positif | Tambah beberapa tag berbeda dalam 1 instansi', () => {
    tag.addTag(d.instansi.primary, uniq(), uniq(), d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.addTag(d.instansi.primary, uniq(), uniq(), d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-TAG-ADD-009 | Positif | Kode tag sama pada instansi berbeda -> sukses', () => {
    const kode = uniq();
    tag.addTag(d.instansi.primary, uniq(), kode, d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.addTag(d.instansi.secondary, uniq(), kode, d.tipeAnggota.semua);
    // PRD batasi duplikat HANYA pada instansi yang sama -> beda instansi diasumsikan boleh
    tag.assertSuccessToast(d.messages.addSuccess);
  });

  it('TC-TAG-ADD-010 | Positif | Nama tag sama pada instansi berbeda -> sukses [ASUMSI]', () => {
    const nama = uniq();
    tag.addTag(d.instansi.primary, nama, uniq(), d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.addTag(d.instansi.secondary, nama, uniq(), d.tipeAnggota.semua);
    // PRD tidak melarang nama tag duplikat (hanya kode) -> diasumsikan boleh.
    tag.assertSuccessToast(d.messages.addSuccess);
  });

  // ---------- NEGATIF ----------
  it('TC-TAG-ADD-011 | Negatif | Simpan dengan Instansi kosong', () => {
    tag.openAddModal();
    tag.fillNama(uniq());
    tag.fillKode(uniq());
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickSave();
    tag.assertInstansiError(d.messages.instansiRequired);
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNoSuccessToast();
  });

  it('TC-TAG-ADD-012 | Negatif | Simpan dengan Nama Tag kosong', () => {
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillKode(uniq());
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickSave();
    tag.assertNamaError(d.messages.namaRequired);
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNoSuccessToast();
  });

  it('TC-TAG-ADD-013 | Negatif | Simpan dengan Kode Tag kosong', () => {
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(uniq());
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickSave();
    tag.assertKodeError(d.messages.kodeRequired);
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNoSuccessToast();
  });

  it('TC-TAG-ADD-014 | Negatif | Simpan dengan Tipe Anggota kosong', () => {
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(uniq());
    tag.fillKode(uniq());
    tag.clickSave();
    tag.assertTipeError(d.messages.tipeRequired);
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNoSuccessToast();
  });

  it('TC-TAG-ADD-015 | Negatif | Simpan dengan semua field required kosong', () => {
    tag.openAddModal();
    tag.clickSave();
    tag.assertInstansiError(d.messages.instansiRequired);
    tag.assertNamaError(d.messages.namaRequired);
    tag.assertKodeError(d.messages.kodeRequired);
    tag.assertTipeError(d.messages.tipeRequired);
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNoSuccessToast();
  });

  it('TC-TAG-ADD-016 | Negatif | Duplikat Kode Tag pada instansi sama [BUG-020 FE silent]', () => {
    const kode = uniq();
    // seed
    tag.addTag(d.instansi.primary, uniq(), kode, d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    // duplikat (nama beda)
    tag.addTag(d.instansi.primary, uniq(), kode, d.tipeAnggota.semua);
    // Expected BENAR: ditolak rapi -> FE tampilkan toast/inline error 'Kode tag sudah digunakan di instansi ini'.
    // Aktual (BUG-020): BE benar tolak (status:false) tapi FE SILENT - tidak tampilkan apapun.
    // assertNotSilent SENGAJA fail di sini = bukti bug, bukan lock buggy behavior.
    tag.assertNoSuccessToast();              // data TIDAK boleh tersimpan diam-diam (tidak ada toast sukses)
    tag.assertModalOpen(d.labels.addTitle);   // modal tetap kebuka (request ditolak)
    tag.assertNotSilent();                    // <- FAIL sampai BUG-020 diperbaiki
  });

  // ---------- EDGE ----------
  it('TC-TAG-ADD-017 | Edge | Nama/Kode whitespace-only (spasi saja)', () => {
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(d.testData.spaceOnly);
    tag.fillKode(d.testData.spaceOnly);
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickSave();
    // Expected: spasi ter-trim -> dianggap kosong -> error required di Nama & Kode
    tag.assertNamaError(d.messages.namaRequired);
    tag.assertKodeError(d.messages.kodeRequired);
    tag.assertModalOpen(d.labels.addTitle);
  });

  it('TC-TAG-ADD-018 | Edge | Leading/trailing space Nama/Kode -> trim saat simpan', () => {
    const core = uniq();
    const kodeCore = uniq();
    tag.addTag(d.instansi.primary, `  ${core}  `, `  ${kodeCore}  `, d.tipeAnggota.semua);
    tag.assertSuccessToast(d.messages.addSuccess);
    tag.search(core);
    tag.assertRowExists(core); // ketemu tanpa spasi tepi = ter-trim
  });

  it('TC-TAG-ADD-019 | Edge | Nama Tag >255 char ditolak rapi [kandidat bug-pola BUG-013/015]', () => {
    const len = d.testData.boundaries.nameOverflow; // 300 > batas DB varchar(255)
    const nama = `${d.testData.prefix}${ts}${'X'.repeat(len - (d.testData.prefix.length + 6))}`;
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(nama);
    tag.fillKode(uniq());
    tag.selectTipe(d.tipeAnggota.semua);
    tag.elements.namaInput().invoke('val').then((v) => {
      cy.log(`panjang Nama ke-set: ${v.length} (target ${len}) - cek apakah ada maxlength`);
    });
    tag.clickSave();
    // Expected BENAR: ditolak rapi -> FE batasi maxlength / pesan validasi ramah.
    // Pola pre-existing BUG-013 (Jurusan) & BUG-015 (Kamar): API balas RAW SQL "value too long ... (255)",
    //   FE silent. Kalau Tag juga kena -> log bug baru via /bug.
    tag.assertNoSuccessToast();
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNotSilent(); // FE wajib kasih feedback; sengaja fail kalau silent
  });

  it('TC-TAG-ADD-020 | Edge | Kode Tag >255 char ditolak rapi [kandidat bug-pola BUG-013/015]', () => {
    const len = d.testData.boundaries.nameOverflow;
    const kode = `${d.testData.prefix}${ts}${'X'.repeat(len - (d.testData.prefix.length + 6))}`;
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(uniq());
    tag.fillKode(kode);
    tag.selectTipe(d.tipeAnggota.semua);
    tag.elements.kodeInput().invoke('val').then((v) => {
      cy.log(`panjang Kode ke-set: ${v.length} (target ${len}) - cek apakah ada maxlength`);
    });
    tag.clickSave();
    tag.assertNoSuccessToast();
    tag.assertModalOpen(d.labels.addTitle);
    tag.assertNotSilent();
  });

  it('TC-TAG-ADD-021 | Edge | Nama & Kode 1 karakter (min boundary) tidak ditolak validasi panjang', () => {
    // Boundary 1 char "A" statis. Kalau "A" sudah ada dari run sebelumnya, save bisa gagal (duplikat).
    // Maka JANGAN assert toast/persist - cukup buktikan 1 char DITERIMA sbg panjang sah (data-invalid=false).
    tag.openAddModal();
    tag.selectInstansi(d.instansi.primary);
    tag.fillNama(d.testData.minName);
    tag.fillKode(d.testData.minName);
    tag.selectTipe(d.tipeAnggota.semua);
    tag.clickSave();
    tag.assertNamaFieldValid();
    tag.assertKodeFieldValid();
  });

  // ---------- DEFERRED (fitur konsumen belum ada) ----------
  // TC-022..027: tag dipakai di Data Diri Siswa / Presensi Kegiatan / Buat Tagihan + filter per Tipe Anggota.
  // DITUNDA per instruksi user - aktifkan setelah modul-modul tsb tersedia.
  it.skip('TC-TAG-ADD-022 | Positif | Tag dipakai di Data Diri Siswa [DEFERRED]', () => {});
  it.skip('TC-TAG-ADD-023 | Positif | Tag dipakai di Pengaturan Presensi Kegiatan [DEFERRED]', () => {});
  it.skip('TC-TAG-ADD-024 | Positif | Tag dipakai di Buat Tagihan [DEFERRED]', () => {});
  it.skip('TC-TAG-ADD-025 | Positif | Tipe=Semua dapat dipakai semua tipe anggota [DEFERRED]', () => {});
  it.skip('TC-TAG-ADD-026 | Positif | Tipe=Siswa (STUDENT) hanya untuk Siswa [DEFERRED]', () => {});
  it.skip('TC-TAG-ADD-027 | Positif | Tipe=Guru & Staff hanya untuk Guru/Staff [DEFERRED]', () => {});

  // ---------- OBSERVASI BUG (toast copy) ----------
  it('TC-TAG-ADD-028 | Positif | Toast sukses: title OK, description SALAH modul [BUG-021]', () => {
    const nama = uniq();
    const kode = uniq();
    tag.addTag(d.instansi.primary, nama, kode, d.tipeAnggota.semua);
    // Title benar
    tag.elements.successToast().should('be.visible')
      .find('[data-title]').should('contain.text', d.messages.addSuccess);
    // Bukti BUG-021: description nyebut "Kelas" alih-alih konteks Tag.
    // Test ini SENGAJA tidak gunakan locked-buggy assertion. Cuma cek:
    //   - description ada,
    //   - log isinya buat report,
    //   - assert description TIDAK boleh mengandung 'Kelas' (akan fail sampai BUG-021 fixed).
    tag.elements.successToast().find('[data-description]')
      .should('exist')
      .invoke('text')
      .then((txt) => {
        cy.log(`toast description aktual: "${txt}"`);
        expect(txt, 'description toast Tambah Tag tidak boleh menyebut modul "Kelas"').to.not.match(/Kelas/i);
      });
  });
});
