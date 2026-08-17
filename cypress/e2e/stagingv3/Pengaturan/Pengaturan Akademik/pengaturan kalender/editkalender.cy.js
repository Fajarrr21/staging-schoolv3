// editkalender.cy.js — Spec Edit Kalender Akademik
// Modul: Pengaturan > Akademik > Kalender Akademik  |  Route: /setting/academic/academic-calendar
// Sumber TC: docs/test-cases/TC_Kalender_Edit.xlsx (TC-KLD-EDT-001..014).
//
// Modal Edit (dikonfirmasi user 27 Juni 2026 via HTML real):
//   - Title "Edit Kalender Akademik"
//   - 4 field editable: Instansi (ANOMALI - PRD spek Instansi locked, actual editable),
//     Awal Pekan, Nama Pekan, Header (opsional preview + trash).
//   - Toast duplicate SAMA text dgn Tambah -> reuse assertDuplicateToast().
//
// Test data strategi (v3 4-instansi):
//   - primary = Academy QA Engineer (sandbox, mutation target). AUTO-SEED via ensureRowExists di beforeEach.
//   - existing = Sekolah Digital Indonesia (baseline dgn kalender + header — SEED PERMANEN, jangan modif kecuali via restore).
//   - unusedForEdit = Academy Cazh (empty pool, destinasi migrasi).
//   - RESTORE pattern in-test: mutation di-undo di akhir TC biar idempotent.
//   - Kalau restore step gagal, state pollutes -> next run bisa fail.
//     Reporter Fajar bakal manual cleanup kalau perlu.

import kalender from '../../../../../support/pageobjects/KalenderPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kalender Akademik — Edit (CARDS School)', () => {
  let d;

  before(() => {
    cy.fixture('kalender').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kalender.visit();
    // Auto-seed primary (AQE) kalau kosong — biar spec Edit self-contained.
    // Kalau AQE udah punya kalender (paling sering), skip (idempotent).
    kalender.ensureRowExists(d.instansi.primary, 'Senin', 'Minggu');
  });

  // ---------- HAPPY ----------
  it('TC-KLD-EDT-001 | Happy | Klik Edit -> modal muncul, title benar, field pre-populate dgn data existing', () => {
    // Row existing = SDI (seed permanen, punya header image).
    const target = d.instansi.existing;
    kalender.openEditModal(target);
    kalender.assertModalOpen(d.labels.editTitle);

    // Instansi pre-populate (editable, tapi value = nama row)
    kalender.assertInstansiFieldValue(target);
    kalender.assertInstansiEditable();

    // Awal Pekan & Nama Pekan pre-populate (bukan placeholder)
    kalender.elements.awalPekanValue().should(($el) => {
      const t = $el.text().trim();
      expect(t, 'awal pekan bukan placeholder').to.not.eq('Pilih Awal pekan dimulai');
      expect(d.options.awalPekan, 'value ada di list opsi valid').to.include(t);
    });
    kalender.elements.namaPekanValue().should(($el) => {
      const t = $el.text().trim();
      expect(t, 'nama pekan bukan placeholder').to.not.eq('Pilih Nama Pekan');
      expect(d.options.namaPekan, 'value ada di list opsi valid').to.include(t);
    });

    // Preview card header muncul (row existing punya image)
    kalender.assertHasExistingHeaderPreview();

    kalender.clickCancel();
    kalender.assertModalClosed();
  });

  it('TC-KLD-EDT-002 | Happy | Ubah Awal Pekan -> Simpan -> toast success + row col-1 badge update', () => {
    const target = d.instansi.primary;

    kalender.openEditModal(target);
    kalender.elements.awalPekanValue().invoke('text').then((rawCurrent) => {
      const current = rawCurrent.trim();
      // toggle ke value OTHER (rerun-safe: state cycle 2 nilai)
      const newValue = current === 'Senin' ? 'Minggu' : 'Senin';

      kalender.selectAwalPekan(newValue);
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertModalClosed();

      kalender.assertRowAwalPekan(target, newValue);
    });
  });

  it('TC-KLD-EDT-003 | Happy | Ubah Nama Pekan -> Simpan -> toast success + row col-2 badge update', () => {
    const target = d.instansi.primary;

    kalender.openEditModal(target);
    kalender.elements.namaPekanValue().invoke('text').then((rawCurrent) => {
      const current = rawCurrent.trim();
      const newValue = current === 'Ahad' ? 'Minggu' : 'Ahad';

      kalender.selectNamaPekan(newValue);
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertModalClosed();

      kalender.assertRowNamaPekan(target, newValue);
    });
  });

  it('TC-KLD-EDT-004 | Happy | Upload header baru (row TANPA header) -> preview -> Simpan -> col-3 tampil <img>', () => {
    // primary saat ini no header (col-3 = '-'). Add header, verify img, restore (remove).
    const target = d.instansi.primary;

    // Guard: skip kalau ternyata primary sudah punya header (state polusi dari prev run)
    kalender.elements.rowByInstansi(target).find('td').eq(3).then(($td) => {
      if ($td.find('img').length) {
        cy.log(`[skip] ${target} sudah punya header — TC-004 butuh row tanpa header`);
        return;
      }
      kalender.openEditModal(target);
      kalender.uploadHeader(d.assets.headerValid);
      kalender.assertFilePreview(); // preview card muncul
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertModalClosed();
      kalender.assertRowHeaderImage(target);

      // RESTORE: buka Edit lagi, remove header, save
      kalender.openEditModal(target);
      kalender.removeUploadedFile();
      kalender.assertNoFilePreview();
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertRowNoHeader(target);
    });
  });

  // ---------- POSITIF ----------
  it('TC-KLD-EDT-005 | Positif | Ubah semua field sekaligus -> Simpan -> semua update persist', () => {
    // primary -> pindah ke unusedForEdit + ubah pekan + upload header
    // Complex TC — cover skenario multi-field change dgn instansi migration.
    const src = d.instansi.primary;
    const dst = d.instansi.unusedForEdit;

    // Guard: skip kalau state ga clean (src ga ada / dst udah punya)
    kalender.isInstansiInList(src).then((srcExists) => {
      if (!srcExists) {
        cy.log(`[skip] ${src} tidak ada di list — state polusi prev run`);
        return;
      }
      kalender.isInstansiInList(dst).then((dstExists) => {
        if (dstExists) {
          cy.log(`[skip] ${dst} sudah punya kalender — state polusi prev run`);
          return;
        }

        // capture original values utk restore nanti
        let origAwal, origNama;
        kalender.openEditModal(src);
        kalender.elements.awalPekanValue().invoke('text').then((t) => { origAwal = t.trim(); });
        kalender.elements.namaPekanValue().invoke('text').then((t) => { origNama = t.trim(); });

        // ubah semua field
        const newAwal = 'Minggu';
        const newNama = 'Ahad';
        kalender.selectInstansi(dst);
        kalender.selectAwalPekan(newAwal);
        kalender.selectNamaPekan(newNama);
        kalender.uploadHeader(d.assets.headerValid);
        kalender.clickSave();
        kalender.assertEditSuccessToast();
        kalender.assertModalClosed();

        // assert
        kalender.assertRowNotExists(src);
        kalender.assertRowExists(dst);
        kalender.assertRowAwalPekan(dst, newAwal);
        kalender.assertRowNamaPekan(dst, newNama);
        kalender.assertRowHeaderImage(dst);

        // RESTORE: pindah balik ke src + reset field ke original + remove header
        cy.then(() => {
          kalender.openEditModal(dst);
          kalender.selectInstansi(src);
          kalender.selectAwalPekan(origAwal);
          kalender.selectNamaPekan(origNama);
          kalender.removeUploadedFile();
          kalender.clickSave();
          kalender.assertEditSuccessToast();
          kalender.assertRowExists(src);
          kalender.assertRowNotExists(dst);
        });
      });
    });
  });

  it('TC-KLD-EDT-006 | Positif | Remove header existing (trash preview) -> Simpan -> col-3 balik "-"', () => {
    // existing (SDI) punya header. Remove -> verify col-3='-' -> restore (re-upload).
    const target = d.instansi.existing;

    // Guard: skip kalau ternyata existing ga punya header
    kalender.elements.rowByInstansi(target).find('td').eq(3).then(($td) => {
      if (!$td.find('img').length) {
        cy.log(`[skip] ${target} tidak punya header — TC-006 butuh row dgn header existing`);
        return;
      }
      kalender.openEditModal(target);
      kalender.assertHasExistingHeaderPreview();

      kalender.removeUploadedFile();
      kalender.assertNoFilePreview();
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertRowNoHeader(target);

      // RESTORE: re-upload header
      kalender.openEditModal(target);
      kalender.uploadHeader(d.assets.headerValid);
      kalender.assertFilePreview();
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertRowHeaderImage(target);
    });
  });

  it('TC-KLD-EDT-007 | Positif | Ubah Instansi ke instansi yg BELUM punya kalender -> row instansi update', () => {
    // primary -> unusedForEdit. Assert row baru muncul, row lama hilang. Restore.
    const src = d.instansi.primary;
    const dst = d.instansi.unusedForEdit;

    kalender.isInstansiInList(dst).then((dstExists) => {
      if (dstExists) {
        cy.log(`[skip] ${dst} sudah punya kalender — state polusi`);
        return;
      }
      kalender.openEditModal(src);
      kalender.selectInstansi(dst);
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertModalClosed();

      kalender.assertRowExists(dst);
      kalender.assertRowNotExists(src);

      // RESTORE: pindah balik
      kalender.moveKalenderInstansi(dst, src);
      kalender.assertRowExists(src);
      kalender.assertRowNotExists(dst);
    });
  });

  it('TC-KLD-EDT-008 | Positif | Batal via tombol Batal -> modal close, tidak ada perubahan', () => {
    const target = d.instansi.primary;

    kalender.openEditModal(target);
    // capture original state (screenshot semantic)
    let origAwal;
    kalender.elements.awalPekanValue().invoke('text').then((t) => { origAwal = t.trim(); });

    // ubah tapi ga simpan
    const dummyAwal = 'Minggu';
    kalender.selectAwalPekan(dummyAwal);

    kalender.clickCancel();
    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();

    // row tidak berubah
    cy.then(() => {
      kalender.assertRowAwalPekan(target, origAwal);
    });
  });

  it('TC-KLD-EDT-009 | Positif | Batal via icon X -> modal close, tidak ada perubahan', () => {
    const target = d.instansi.primary;

    kalender.openEditModal(target);
    let origAwal;
    kalender.elements.awalPekanValue().invoke('text').then((t) => { origAwal = t.trim(); });

    kalender.selectAwalPekan('Minggu');

    kalender.clickCloseX();
    kalender.assertModalClosed();
    kalender.assertNoSuccessToast();

    cy.then(() => {
      kalender.assertRowAwalPekan(target, origAwal);
    });
  });

  it('TC-KLD-EDT-010 | Positif | Persistence: Edit -> reload halaman -> data tetap update', () => {
    const target = d.instansi.primary;

    kalender.openEditModal(target);
    kalender.elements.awalPekanValue().invoke('text').then((raw) => {
      const current = raw.trim();
      const newValue = current === 'Senin' ? 'Minggu' : 'Senin';

      kalender.selectAwalPekan(newValue);
      kalender.clickSave();
      kalender.assertEditSuccessToast();
      kalender.assertModalClosed();
      kalender.assertRowAwalPekan(target, newValue);

      // reload & re-verify (backend persist)
      cy.reload();
      kalender.elements.table({ timeout: 15000 }).should('exist');
      kalender.assertRowAwalPekan(target, newValue);
    });
  });

  // BUG-030: form Edit persist draft setelah Batal + reopen (form ga reset ke server).
  // Sesuai CLAUDE.md: assertion tetap correct expected behavior (form reset). TC ini FAIL
  // sampai bug fix — jangan ubah expected jadi "persist draft" (locking buggy behavior).
  it('TC-KLD-EDT-011 | Positif | Buka Edit -> tutup -> buka lagi: form reset ke data server terkini [BUG-030]', () => {
    const target = d.instansi.primary;

    // Buka pertama, catat nilai server
    kalender.openEditModal(target);
    let serverAwal;
    kalender.elements.awalPekanValue().invoke('text').then((t) => { serverAwal = t.trim(); });

    // Ubah field (draft state) lalu batal
    cy.then(() => {
      const draftValue = serverAwal === 'Senin' ? 'Minggu' : 'Senin';
      kalender.selectAwalPekan(draftValue);
      kalender.clickCancel();
      kalender.assertModalClosed();
    });

    // Buka lagi: value harus reset ke serverAwal (bukan draft yg batal)
    kalender.openEditModal(target);
    cy.then(() => {
      kalender.assertAwalPekanFieldValue(serverAwal);
    });
    kalender.clickCancel();
  });

  // ---------- NEGATIF ----------
  it('TC-KLD-EDT-012 | Negatif | Upload header >2MB -> alert inline, Simpan tidak apply file', () => {
    // Pakai row TANPA existing header (primary/SMP+) supaya state input file bersih
    // (existing header render preview card yg bisa multiplex input[type=file] -> selectFile fail).
    // Upload validation independen dari row target, jadi safe ganti dari existing ke primary.
    const target = d.instansi.primary;
    kalender.openEditModal(target);

    kalender.uploadHeader(d.assets.headerOversize);
    kalender.assertUploadOversizeAlert();
    kalender.assertNoFilePreview();

    kalender.clickCancel();
    kalender.assertModalClosed();
  });

  it('TC-KLD-EDT-013 | Negatif | Ubah Instansi ke instansi yg SUDAH punya kalender -> duplicate toast', () => {
    // primary (AQE) -> existing (SDI, sudah punya kalender). BE tolak dgn duplicate error.
    // Behavior modal setelah error masih uncertain (manual bilang keep-open, Cypress bilang
    // dialog-content ilang) -> TC ini FOKUS ke data integrity saja: toast error muncul &
    // primary tidak jadi pindah ke existing. Verifikasi via reload (bypass modal state).
    const src = d.instansi.primary;
    const dst = d.instansi.existing;

    kalender.openEditModal(src);
    kalender.selectInstansi(dst);
    kalender.clickSave();

    kalender.assertDuplicateToast(d.messages.duplicate);

    // Data integrity check: reload -> primary masih ada, dst tidak dobel jadi milik primary
    cy.reload();
    kalender.elements.table({ timeout: 15000 }).should('exist');
    kalender.assertRowExists(src); // primary tetap punya kalender sendiri
    kalender.assertRowExists(dst); // existing (SMA) juga tetap punya kalender sendiri
  });

  // ---------- EDGE ----------
  // Behavior aktual (dikonfirmasi manual 02 Juli 2026): Simpan tanpa perubahan tetap
  // submit ke BE, BE return success, toast sukses muncul, modal auto-close — persis
  // sama dgn happy path. Tidak ada guard "no dirty state" di FE maupun BE (no-op OK).
  it('TC-KLD-EDT-014 | Edge | Simpan tanpa perubahan -> toast sukses + modal close (no-op semantik)', () => {
    const target = d.instansi.primary;
    kalender.openEditModal(target);

    // Stabilize sebelum klik: form Edit lazy-load (react-hook-form async) dan button
    // sempat re-render setelah defaultValues hydrate -> click race "page updated while
    // executing" kalau langsung fire. Assert button visible + enabled dulu biar Cypress
    // retry sampai state settle.
    kalender.elements.saveButton().should('be.visible').and('not.be.disabled');
    kalender.clickSave();

    kalender.assertEditSuccessToast();
    kalender.assertModalClosed();
  });
});
