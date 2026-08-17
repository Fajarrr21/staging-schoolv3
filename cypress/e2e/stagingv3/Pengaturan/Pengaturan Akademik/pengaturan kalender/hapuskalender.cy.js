// hapuskalender.cy.js — Spec Hapus Kalender Akademik
// Modul: Pengaturan > Akademik > Kalender Akademik  |  Route: /setting/academic/academic-calendar
// Sumber TC: docs/test-cases/TC_Kalender_Hapus.xlsx (TC-KLD-HPS-001..008).
//
// Dialog Hapus (dikonfirmasi user 02 Juli 2026 via HTML real):
//   - Radix Dialog reguler (role="dialog", data-slot="dialog-content"), SAMA pola Add/Edit
//   - Title: "Hapus Kalender Akademik"
//   - Description mention nama instansi 2x: "Apakah anda yakin ingin menghapus
//     Kalender Akademik <instansi> dari instansi <instansi>?"
//   - Footer: [Batal] (dialog-close, text) + [Hapus] (data-slot="button", bg-destructive)
//   - Close X pojok kanan atas + support ESC + overlay click default Radix
//
// Test data strategi (v3 4-instansi, rerun-safe):
//   - Target: `unusedAlt` = Academy Cazh (sandbox destruktif, awal run kosong).
//   - beforeEach: idempotent seed via ensureRowExists (Tambah baru kalau row belum ada).
//   - Setelah delete sukses, iterasi berikutnya beforeEach seed ulang.
//   - unusedAlt & unusedForEdit SAMA (AC) — edit spec restore ke primary di akhir tiap TC,
//     jadi AC kosong lagi saat hapus spec mulai.
//   - TC-008 di akhir siklus delete-then-add-then-delete biar AC bersih di akhir spec
//     (buat listkalender TC-010 empty state test & tambahkalender TC-016 persist).
//
// Assumsi Sumber = pola standar modul Hapus (PRD Kalender tidak menyebut delete flow).

import kalender from '../../../../../support/pageobjects/KalenderPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kalender Akademik — Hapus (CARDS School)', () => {
  let d;

  before(() => {
    cy.fixture('kalender').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kalender.visit();
    // Idempotent seed row target (Tambah kalau belum ada, skip kalau sudah)
    kalender.ensureRowExists(d.instansi.unusedAlt, 'Minggu', 'Ahad');
  });

  // ---------- HAPPY ----------
  it('TC-KLD-HPS-001 | Happy | Delete row -> toast sukses + row hilang dari list', () => {
    const target = d.instansi.unusedAlt;
    kalender.assertRowExists(target);

    kalender.openDeleteDialog(target);
    kalender.assertDeleteDialogOpen();
    kalender.clickConfirmDelete();

    kalender.assertDeleteSuccessToast(d.messages.deleteSuccess);
    kalender.assertModalClosed();
    kalender.assertRowNotExists(target);
  });

  it('TC-KLD-HPS-002 | Happy | Persistence: delete + reload -> row tetap tidak muncul', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    kalender.clickConfirmDelete();
    kalender.assertDeleteSuccessToast(d.messages.deleteSuccess);
    kalender.assertModalClosed();
    kalender.assertRowNotExists(target);

    // Reload -> row TETAP hilang (BE persist)
    cy.reload();
    kalender.elements.table({ timeout: 15000 }).should('exist');
    kalender.assertRowNotExists(target);
  });

  // ---------- POSITIF ----------
  it('TC-KLD-HPS-003 | Positif | Dialog konfirmasi: title benar + description mention nama instansi', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    kalender.elements.dialogTitle().should('contain.text', d.labels.deleteTitle);
    kalender.assertDeleteDescMentions(target);

    // Cleanup: batal
    kalender.clickCancelDelete();
    kalender.assertModalClosed();
    kalender.assertRowExists(target);
  });

  it('TC-KLD-HPS-004 | Positif | Klik Batal di dialog konfirmasi -> row tidak terhapus', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    kalender.clickCancelDelete();

    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();
    kalender.assertRowExists(target);
  });

  it('TC-KLD-HPS-005 | Positif | Klik icon X di dialog konfirmasi -> row tidak terhapus', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    kalender.clickCloseX();

    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();
    kalender.assertRowExists(target);
  });

  it('TC-KLD-HPS-006 | Positif | Tekan ESC saat dialog terbuka -> row tidak terhapus', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    cy.get('body').type('{esc}');

    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();
    kalender.assertRowExists(target);
  });

  it('TC-KLD-HPS-007 | Positif | Klik overlay di luar dialog -> row tidak terhapus', () => {
    const target = d.instansi.unusedAlt;

    kalender.openDeleteDialog(target);
    // Radix Dialog overlay: data-slot="dialog-overlay". Kalau app custom-render, fallback
    // ke pointerdown-outside via klik pojok body (0,0).
    cy.get('body').then(($b) => {
      const $overlay = $b.find('[data-slot="dialog-overlay"]');
      if ($overlay.length) {
        cy.wrap($overlay).click({ force: true });
      } else {
        // Fallback: klik di area body luar dialog (koordinat pojok kiri atas)
        cy.get('body').click(5, 5, { force: true });
      }
    });

    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();
    kalender.assertRowExists(target);
  });

  // ---------- EDGE ----------
  it('TC-KLD-HPS-008 | Edge | Delete lalu Tambah ulang instansi yg sama -> sukses (unique constraint lepas)', () => {
    const target = d.instansi.unusedAlt;

    // Step 1: Delete
    kalender.openDeleteDialog(target);
    kalender.clickConfirmDelete();
    kalender.assertDeleteSuccessToast(d.messages.deleteSuccess);
    kalender.assertModalClosed();
    kalender.assertRowNotExists(target);

    // Step 2: Tambah ulang dgn instansi yg SAMA -> harus sukses (bukan duplicate)
    kalender.addKalender(target, 'Senin', 'Minggu');
    kalender.assertSuccessToast(d.messages.addSuccess);
    kalender.assertModalClosed();
    kalender.assertRowExists(target);
    kalender.assertRowAwalPekan(target, 'Senin');
    kalender.assertRowNamaPekan(target, 'Minggu');

    // Step 3: Delete lagi biar AC bersih di akhir spec (rerun-safe untuk list & tambah).
    kalender.openDeleteDialog(target);
    kalender.clickConfirmDelete();
    kalender.assertDeleteSuccessToast(d.messages.deleteSuccess);
    kalender.assertModalClosed();
    kalender.assertRowNotExists(target);
  });
});
