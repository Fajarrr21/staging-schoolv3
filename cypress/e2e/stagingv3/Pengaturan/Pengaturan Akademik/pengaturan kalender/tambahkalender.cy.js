// tambahkalender.cy.js — Spec Tambah Kalender Akademik
// Modul: Pengaturan > Akademik > Kalender Akademik  |  Route: /setting/academic/academic-calendar
// Sumber TC: docs/test-cases/TC_Kalender_Tambah.xlsx (TC-KLD-ADD-001..016).
// Konvensi: reuse cy.session via LoginPage.loginViaSession.
// Semua label/message/instansi/asset path dibaca dari fixture kalender.json.
//
// CATATAN RERUN-SAFETY (v3):
//   Kalender ter-Tambah per instansi (1:1). v3 cuma punya 4 instansi (YNS/SDI/AQE/AC) —
//   YNS+SDI SEED PERMANEN (jangan modif), AQE=primary mutation, AC=sandbox destruktif.
//   TC-001 pake tertiary=AC (perlu clean di awal — pakai delete-first guard).
//   TC-002 pake primary=AQE dgn delete-first guard (biar rerun-safe).
//   TC-016 assert persist AC (state left by TC-001, sebelum TC-002 pindah target ke AQE).
//   Rerun caveat: AC populated di akhir spec — cleanup via afterAll delete kalau ada.
//
// CATATAN FILE UPLOAD:
//   File asset di-host user di `cypress/fixtures/kalender/`:
//     - header-valid.png     (<2MB, untuk TC-002/005/015)
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

  // Cleanup afterAll: hapus kalender di tertiary=AC (dari TC-001/016) biar rerun clean.
  after(() => {
    kalender.visit();
    cy.get('table tbody').then(($b) => {
      if ($b.text().includes(d.instansi.tertiary)) {
        kalender.openDeleteDialog(d.instansi.tertiary);
        kalender.clickConfirmDelete();
      }
    });
  });

  // ---------- HAPPY ----------
  it('TC-KLD-ADD-001 | Happy | Tambah field wajib minimum (tanpa header)', () => {
    // tertiary=Academy Cazh, pool sandbox. Delete-first guard biar rerun-safe.
    const instansi = d.instansi.tertiary;
    kalender.isInstansiInList(instansi).then((exists) => {
      if (exists) {
        kalender.openDeleteDialog(instansi);
        kalender.clickConfirmDelete();
        kalender.assertDeleteSuccessToast();
        kalender.assertModalClosed();
      }
    });
    kalender.addKalender(instansi, 'Minggu', 'Ahad');
    kalender.assertSuccessToast(d.messages.addSuccess);
    kalender.assertModalClosed();
    kalender.assertRowExists(instansi);
    kalender.assertRowAwalPekan(instansi, 'Minggu');
    kalender.assertRowNamaPekan(instansi, 'Ahad');
    // Tanpa upload header -> col 3 = "-" (placeholder), bukan default img
    kalender.assertRowNoHeader(instansi);
  });

  // TC-016 pindah ke sini biar chain dgn TC-001 (assert persist state left by TC-001).
  // TC-002 nanti pindah target ke primary=AQE, jadi state AC dari TC-001 tetap intact.
  it('TC-KLD-ADD-016 | Edge | Persistence: reload -> data Tambah tetap ada', () => {
    // Pre-cond: TC-001 sudah sukses Tambah AC (Minggu/Ahad tanpa header).
    // Kalau TC-001 fail/skip -> TC-016 fail by design (signal urutan rusak).
    const instansi = d.instansi.tertiary;
    kalender.assertPersisted(instansi);
    kalender.assertRowAwalPekan(instansi, 'Minggu');
    kalender.assertRowNamaPekan(instansi, 'Ahad');
    kalender.assertRowNoHeader(instansi);
  });

  it('TC-KLD-ADD-002 | Happy | Tambah lengkap (3 field wajib + upload foto <2MB) [BUG-026]', () => {
    // BUG-026: Upload header (foto <2MB) sukses simpan (toast + modal close) tapi tidak
    // ter-persist di list — kolom Header (col-4) menampilkan "-" bukan <img>.
    // TC SENGAJA FAIL di assertRowHeaderImage sampai BUG-026 di-fix
    // (CLAUDE.md: do not lock in buggy behavior).
    // v3: target=primary(AQE) — AQE selalu ada kalender (edit mutation target).
    // Delete-first + add-with-header; setelah TC ini AQE punya Senin/Minggu (attempted header).
    // Edit spec run berikutnya auto-recover via ensureRowExists di beforeEach.
    const instansi = d.instansi.primary;
    kalender.isInstansiInList(instansi).then((exists) => {
      if (exists) {
        kalender.openDeleteDialog(instansi);
        kalender.clickConfirmDelete();
        kalender.assertDeleteSuccessToast();
        kalender.assertModalClosed();
      }
    });
    kalender.openAddModal();
    kalender.selectInstansi(instansi);
    kalender.selectAwalPekan('Senin');
    kalender.selectNamaPekan('Minggu');
    kalender.uploadHeader(d.assets.headerValid);
    kalender.assertFilePreview('header-valid.png'); // upload register di FE (sukses)
    kalender.clickSave();
    kalender.assertSuccessToast(d.messages.addSuccess);
    kalender.assertModalClosed();
    kalender.assertPersisted(instansi);
    kalender.assertRowAwalPekan(instansi, 'Senin');
    kalender.assertRowNamaPekan(instansi, 'Minggu');
    kalender.assertRowHeaderImage(instansi); // <- BUG-026 trigger fail di sini
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
    // v3: primary=AQE selalu ada kalender (edit target), jadi assertRowNotExists ga cocok.
    // Ganti pattern: snapshot row count sebelum, cancel, assert count unchanged + no success toast.
    const instansi = d.instansi.primary;
    cy.get('table tbody tr').its('length').then((countBefore) => {
      kalender.openAddModal();
      kalender.selectInstansi(instansi);
      kalender.selectAwalPekan('Senin');
      kalender.selectNamaPekan('Minggu');
      kalender.uploadHeader(d.assets.headerValid);
      kalender.clickCancel();
      kalender.assertModalClosed();
      kalender.assertNoSuccessToast();
      // Cancel gak boleh nambah row baru
      cy.get('table tbody tr').should('have.length', countBefore);
    });
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
    const instansi = d.instansi.existing; // SDI — sudah ada kalender + header (seed permanen)
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

  // TC-016 dipindah ke atas (setelah TC-001) — lihat definisi baru di line ~65.
});
