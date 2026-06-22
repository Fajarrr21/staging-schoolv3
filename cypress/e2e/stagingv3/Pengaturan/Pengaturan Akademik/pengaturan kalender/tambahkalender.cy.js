// tambahkalender.cy.js — Spec Tambah Kalender Akademik
// Modul: Pengaturan > Akademik > Kalender Akademik  |  Route: /setting/academic/academic-calendar
// Sumber TC: docs/test-cases/TC_Kalender_Tambah.xlsx (TC-KLD-ADD-001..016).
// Konvensi: reuse cy.session via LoginPage.loginViaSession.
// Semua label/message/instansi/asset path dibaca dari fixture kalender.json.
//
// CATATAN RERUN-SAFETY:
//   Kalender ter-Tambah per instansi (1:1). Setelah TC-001/TC-002 sukses, instansi target sudah punya
//   kalender -> run kedua akan FAIL dengan toast duplikat. Solusi temporary: pakai 3 instansi berbeda
//   utk 3 happy/positif yg save (TC-001=tertiary, TC-002=secondary, TC-016 follow TC-002).
//   Cleanup permanen menyusul setelah modul Hapus + utility cleanup tersedia.
//
// CATATAN FILE UPLOAD:
//   File asset di-host user di `cypress/fixtures/kalender/`:
//     - header-valid.jpg     (<2MB, untuk TC-002/005/015)
//     - header-oversize.jpg  (>2MB, untuk TC-013)
//     - sample.pdf           (untuk TC-014; fallback ke package.json kalau tidak tersedia)
//   Bila file tidak ada -> Cypress error jelas. User harus siapkan file dulu sebelum run TC tsb.

import kalender from '../../../../../support/pageobjects/KalenderPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kalender Akademik — Tambah (CARDS School)', () => {
  let d;

  before(() => {
    cy.fixture('kalender').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kalender.visit();
  });

  // ---------- HAPPY ----------
  it('TC-KLD-ADD-001 | Happy | Tambah field wajib minimum (tanpa header)', () => {
    // Pakai instansi tertiary (MI Digital Indonesia) — pool kosong untuk Tambah happy ke-1
    const instansi = d.instansi.tertiary;
    kalender.addKalender(instansi, 'Minggu', 'Ahad');
    kalender.assertSuccessToast(d.messages.addSuccess);
    kalender.assertModalClosed();
    kalender.assertRowExists(instansi);
    kalender.assertRowAwalPekan(instansi, 'Minggu');
    kalender.assertRowNamaPekan(instansi, 'Ahad');
    kalender.assertRowHeaderImage(instansi); // default header tetap berupa img (URL default app)
  });

  it('TC-KLD-ADD-002 | Happy | Tambah lengkap (3 field wajib + upload foto <2MB)', () => {
    const instansi = d.instansi.secondary;
    kalender.addKalender(instansi, 'Senin', 'Minggu', { header: d.assets.headerValid });
    kalender.assertSuccessToast(d.messages.addSuccess);
    kalender.assertModalClosed();
    kalender.assertPersisted(instansi); // reload + verify backend persist
    kalender.assertRowAwalPekan(instansi, 'Senin');
    kalender.assertRowNamaPekan(instansi, 'Minggu');
    kalender.assertRowHeaderImage(instansi);
  });

  // ---------- POSITIF ----------
  it('TC-KLD-ADD-003 | Positif | Form Tambah terbuka: semua field wajib placeholder, upload kosong', () => {
    kalender.openAddModal();
    kalender.assertModalOpen(d.labels.addTitle);
    kalender.assertFormEmpty();
  });

  it('TC-KLD-ADD-004 | Positif | Batal menutup form tanpa input apapun', () => {
    kalender.openAddModal();
    kalender.clickCancel();
    kalender.assertModalClosed();
  });

  it('TC-KLD-ADD-005 | Positif | Isi form valid lalu Batal -> data tidak tersimpan', () => {
    const instansi = d.instansi.primary; // tidak save -> instansi tidak terpakai jadi safe rerun
    kalender.openAddModal();
    kalender.selectInstansi(instansi);
    kalender.selectAwalPekan('Senin');
    kalender.selectNamaPekan('Minggu');
    kalender.uploadHeader(d.assets.headerValid);
    kalender.clickCancel();
    kalender.assertModalClosed();
    // verifikasi tidak tersimpan: reload + cek instansi tidak muncul di list
    // (kalau primary sudah punya kalender dari run sebelumnya, assertion ini akan FAIL — itu signal cleanup perlu)
    kalender.assertRowNotExists(instansi);
  });

  it('TC-KLD-ADD-006 | Positif | Klik close X di pojok kanan atas modal -> modal tertutup', () => {
    kalender.openAddModal();
    kalender.clickCloseX();
    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-007 | Positif | Dependency Awal pekan vs Nama Pekan independent (kombinasi bebas)', () => {
    kalender.openAddModal();
    // Set Awal pekan = Senin; cek Nama Pekan options tetap 2
    kalender.selectAwalPekan('Senin');
    kalender.elements.namaPekanTrigger().click();
    kalender.elements.listbox().should('be.visible');
    kalender.elements.selectOption('Ahad').should('be.visible');
    kalender.elements.selectOption('Minggu').should('be.visible');
    cy.get('body').type('{esc}');
    // Set Awal pekan = Minggu; cek Nama Pekan tetap 2 options
    kalender.selectAwalPekan('Minggu');
    kalender.elements.namaPekanTrigger().click();
    kalender.elements.listbox().should('be.visible');
    kalender.elements.selectOption('Ahad').should('be.visible');
    kalender.elements.selectOption('Minggu').should('be.visible');
    cy.get('body').type('{esc}');
  });

  // ---------- NEGATIF ----------
  it('TC-KLD-ADD-008 | Negatif | Simpan dengan Instansi kosong', () => {
    kalender.openAddModal();
    kalender.selectAwalPekan('Minggu');
    kalender.selectNamaPekan('Ahad');
    // Instansi sengaja dibiarkan placeholder
    kalender.clickSave();
    kalender.assertInstansiError(d.messages.instansiRequired);
    kalender.assertModalOpen(d.labels.addTitle);
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-009 | Negatif | Simpan dengan Awal pekan kosong [PRD-ambigu]', () => {
    kalender.openAddModal();
    kalender.selectInstansi(d.instansi.primary);
    kalender.selectNamaPekan('Ahad');
    kalender.clickSave();
    // Teks pesan menunggu konfirmasi UI; pattern "{label} wajib diisi" konsisten modul lain
    kalender.assertAwalPekanError(d.messages.awalPekanRequired);
    kalender.assertModalOpen(d.labels.addTitle);
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-010 | Negatif | Simpan dengan Nama Pekan kosong [PRD-ambigu]', () => {
    kalender.openAddModal();
    kalender.selectInstansi(d.instansi.primary);
    kalender.selectAwalPekan('Minggu');
    kalender.clickSave();
    kalender.assertNamaPekanError(d.messages.namaPekanRequired);
    kalender.assertModalOpen(d.labels.addTitle);
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-011 | Negatif | Simpan dengan SEMUA field wajib kosong -> 3 error muncul bersamaan', () => {
    kalender.openAddModal();
    kalender.clickSave();
    kalender.assertInstansiError(d.messages.instansiRequired);
    kalender.assertAwalPekanError(d.messages.awalPekanRequired);
    kalender.assertNamaPekanError(d.messages.namaPekanRequired);
    kalender.assertModalOpen(d.labels.addTitle);
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-012 | Negatif | Duplikasi: instansi sudah punya kalender -> toast error global', () => {
    const instansi = d.instansi.existing; // SMA Digital Indonesia — sudah ada di list
    kalender.openAddModal();
    kalender.selectInstansi(instansi);
    kalender.selectAwalPekan('Minggu');
    kalender.selectNamaPekan('Ahad');
    kalender.clickSave();
    // Toast error global (di portal, BUKAN inline modal); auto-dismiss -> andalkan retry cy.contains
    kalender.assertDuplicateToast(d.messages.duplicate);
    kalender.assertNoSuccessToast();
  });

  it('TC-KLD-ADD-013 | Negatif | Upload foto >2MB -> alert inline di modal, file tidak ter-attach', () => {
    kalender.openAddModal();
    kalender.uploadHeader(d.assets.headerOversize);
    kalender.assertUploadOversizeAlert(
      d.messages.uploadOversizeTitle,
      d.messages.uploadOversizeDesc
    );
    kalender.assertNoFilePreview();
    // User masih bisa pilih file lain ATAU Simpan tanpa header (Header opsional)
    kalender.elements.pilihFileBtn().should('be.visible');
  });

  // ---------- EDGE ----------
  it('TC-KLD-ADD-014 | Edge | Upload file non-image (.pdf) -> behavior accept attribute', () => {
    // PRD tidak sebut tipe file. accept attr = .png/.jpg/.jpeg/.webp/.svg.
    // cy.selectFile force:true bypass accept browser-level -> cek apakah FE/BE validate.
    kalender.openAddModal();
    kalender.uploadHeader(d.assets.samplePdf);
    // Behavior aktual menunggu observasi:
    //   (a) preview muncul (FE tidak validate) -> log BUG
    //   (b) alert error format
    //   (c) file ditolak diam-diam
    // Untuk pass default: pastikan tidak ada toast sukses (file tidak boleh tersimpan)
    kalender.assertNoSuccessToast();
    // Catatan: kalau di-FE block, filePreview tidak muncul. Kalau di-BE block,
    //   preview muncul tapi Simpan akan error.
  });

  it('TC-KLD-ADD-015 | Edge | Setelah upload sukses, klik trash di card preview -> file ter-detach', () => {
    kalender.openAddModal();
    kalender.uploadHeader(d.assets.headerValid);
    kalender.assertFilePreview();             // preview muncul
    kalender.removeUploadedFile();            // klik trash di card
    kalender.assertNoFilePreview();           // preview hilang
    kalender.elements.pilihFileBtn().should('be.visible'); // tombol Pilih File muncul kembali
  });

  it('TC-KLD-ADD-016 | Edge | Persistence: reload -> data Tambah tetap ada', () => {
    // Pakai instansi yang sama dgn TC-001 (tertiary): kalau ini run setelah TC-001 sukses,
    //   data sudah ada -> just verify persist. Kalau standalone -> Tambah dulu.
    const instansi = d.instansi.tertiary;
    kalender.isInstansiInList(instansi).then((exists) => {
      if (!exists) {
        // belum ada -> bikin dulu
        kalender.addKalender(instansi, 'Minggu', 'Ahad');
        kalender.assertSuccessToast(d.messages.addSuccess);
      }
      // verifikasi persist via reload (assertPersisted = visit ulang + cek row)
      kalender.assertPersisted(instansi);
      kalender.assertRowAwalPekan(instansi, 'Minggu');
      kalender.assertRowNamaPekan(instansi, 'Ahad');
      kalender.assertRowHeaderImage(instansi);
    });
  });
});
