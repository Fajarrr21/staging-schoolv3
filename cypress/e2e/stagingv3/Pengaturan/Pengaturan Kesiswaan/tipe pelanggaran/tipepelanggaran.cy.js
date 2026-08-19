// Spec Tipe Pelanggaran — TPL
// POM: cypress/support/pageobjects/TipePelanggaranPage.js
// Fixture: cypress/fixtures/tipe_pelanggaran.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI (INTI) 19 Agustus 2026 (DOM + Network asli).
// =========================================================================
// Route, 4 field, kolom, endpoint, 8 pesan (4 required + duplikat + 3 sukses)
// sudah dibuktikan. 4 pesan validasi range poin (6-9) masih TODO capture →
// blok S-07 di-skip (jangan tebak teksnya).
//
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata.
//    Setelah run, sapu dengan cleanup: cypress/e2e/stagingv3/cleanup/cleanuptipepelanggaran.cy.js
//
// Khas modul ini (lihat POM):
//   - 4 field: Instansi + Tipe Pelanggaran + Poin Minimum + Poin Maksimum.
//   - Endpoint /api/proxy/violation-types (hyphen). POST 201 sukses / 400 gagal.
//   - DUPLIKAT DITOLAK (400) → S-06 negative test beneran (bukan dokumentasi).
//   - Toast title KONSTAN "Berhasil!", pesan di description → assertToast(toastTitle, pesan).
//   - Dialog scrollable + name poin belum verified → POM scope poin by label.

import TipePelanggaran from '../../../../../support/pageobjects/TipePelanggaranPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Tipe Pelanggaran — TPL', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('tipe_pelanggaran').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    TipePelanggaran.withTimeouts(d.timeouts);
  });

  const dataValid = (nama) => ({
    instansi: d.testData.instansi,
    nama,
    poinMin: d.testData.poinMin,
    poinMax: d.testData.poinMax,
  });

  // ==========================================================================
  // S-00 — Kontrak config
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-TPL-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      TipePelanggaran.visit();
      cy.url().should('include', TipePelanggaran.cfg.route);
      TipePelanggaran.elements.table().should('be.visible');
    });

    it('TC-TPL-002 | Happy | Tombol Tambah membuka dialog dengan judul benar', () => {
      TipePelanggaran.visit().openAddModal();
      TipePelanggaran.assertDialogOpen(d.labels.addButton);
    });

    it('TC-TPL-003 | Happy | Semua field (4) ada di form', () => {
      TipePelanggaran.visit().openAddModal();
      Object.keys(TipePelanggaran.cfg.fields).forEach((key) => {
        TipePelanggaran.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-TPL-010 | Happy | Tambah valid -> toast "Berhasil!" (desc) & muncul di list', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.assertToast(d.messages.toastTitle, d.messages.addSuccess);
      TipePelanggaran.assertRowExists(nama);
    });

    it('TC-TPL-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.assertPersisted(nama);
    });

    it('TC-TPL-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().isiForm(dataValid(nama)).closeByX();
      TipePelanggaran.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi (4 field wajib)
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-TPL-020 | Negatif | Simpan form kosong -> 4 pesan wajib tampil', () => {
      TipePelanggaran.visit().openAddModal().save();
      TipePelanggaran.assertFieldError('instansi', d.messages.instansiRequired);
      TipePelanggaran.assertFieldError('nama', d.messages.namaRequired);
      TipePelanggaran.assertFieldError('poinMin', d.messages.poinMinRequired);
      TipePelanggaran.assertFieldError('poinMax', d.messages.poinMaxRequired);
    });

    it('TC-TPL-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      TipePelanggaran.visit().openAddModal().save();
      TipePelanggaran.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-TPL-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-TPL-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().search(nama).assertRowExists(nama);
    });

    it('TC-TPL-032 | Negatif | Search tanpa hasil -> empty state', () => {
      TipePelanggaran.visit().search('ZZZQA000TIDAKADA');
      TipePelanggaran.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-TPL-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().search(nama).openEditByText(nama);
      TipePelanggaran.assertFormPrefilled({ nama });
    });

    it('TC-TPL-041 | Happy | Perubahan nama tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      TipePelanggaran.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-TPL-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().search(nama).openDeleteByText(nama);
      TipePelanggaran.assertDialogOpen();
    });

    it('TC-TPL-051 | Happy | Hapus data -> toast sukses, hilang & tidak persist', () => {
      const nama = uniq();
      TipePelanggaran.visit().tambah(dataValid(nama));
      TipePelanggaran.visit().search(nama).deleteByText(nama);
      TipePelanggaran.assertToast(d.messages.toastTitle, d.messages.deleteSuccess);
      TipePelanggaran.assertNotPersisted(nama);
    });
  });

  // ==========================================================================
  // S-06 — Duplikat DITOLAK (negative test, POST 400)
  // ==========================================================================
  describe('S-06 — Duplikat ditolak', () => {
    it('TC-TPL-060 | Negatif | Duplikat nama+instansi ditolak (400) + pesan error', () => {
      const nama = uniq();
      // Buat pertama (sukses) dgn range 51-66.
      TipePelanggaran.visit().tambah(dataValid(nama));
      // Buat lagi: nama+instansi identik, tapi RANGE berbeda & tidak tumpuk
      // (100-120) supaya yang memicu penolakan murni duplikat NAMA, bukan overlap.
      TipePelanggaran.visit().openAddModal()
        .isiForm({ instansi: d.testData.instansi, nama, poinMin: 100, poinMax: 120 })
        .saveExpectDuplicate(d.messages.duplicate);
    });
  });

  // ==========================================================================
  // S-07 — Validasi range poin (INLINE) — muncul tanpa POST
  // ==========================================================================
  // Rule inline: isi nilai invalid, klik Simpan (submit ke-block RHF, tidak ada
  // POST), pesan tampil di form-message. Assertion field-agnostic (pesan ada di
  // salah satu form-message dalam dialog).
  describe('S-07 — Validasi range poin (inline)', () => {
    it('TC-TPL-070 | Negatif | Poin minimum < 1 -> pesan "tidak boleh kurang"', () => {
      TipePelanggaran.visit().openAddModal()
        .isiForm({ instansi: d.testData.instansi, nama: uniq(), poinMin: 0, poinMax: 66 });
      TipePelanggaran.saveExpectInlineError(d.messages.poinKurangMin);
    });

    it('TC-TPL-071 | Negatif | Poin maksimum > 999 -> pesan "tidak boleh lebih dari 999"', () => {
      TipePelanggaran.visit().openAddModal()
        .isiForm({ instansi: d.testData.instansi, nama: uniq(), poinMin: 51, poinMax: 1000 });
      TipePelanggaran.saveExpectInlineError(d.messages.poinLebihMax);
    });

    it('TC-TPL-072 | Negatif | Poin min >= max -> pesan "minimal harus lebih kecil dari maksimal"', () => {
      TipePelanggaran.visit().openAddModal()
        .isiForm({ instansi: d.testData.instansi, nama: uniq(), poinMin: 66, poinMax: 51 });
      TipePelanggaran.saveExpectInlineError(d.messages.poinMinMax);
    });

    // poinKurangMax (max < 1) sengaja TIDAK diaktifkan: input max<1 juga memicu
    // aturan min>=max, jadi tidak bisa diisolasi dari poinMinMax tanpa konfirmasi
    // urutan prioritas validasi app. Pesan sudah ada di fixture kalau nanti dipakai.
    it.skip('TC-TPL-073 | Negatif | Poin maksimum < 1 -> poinKurangMax (trigger ambigu vs min>=max)', () => {});
  });

  // ==========================================================================
  // S-08 — Validasi range poin (SERVER-SIDE) — overlap antar tipe
  // ==========================================================================
  describe('S-08 — Overlap range (server-side, 400)', () => {
    it('TC-TPL-080 | Negatif | Range bertumpuk tipe lain (instansi sama) ditolak (400) + toast', () => {
      const namaA = uniq();
      const namaB = uniq();
      // Tipe A: range 51-66 (sukses).
      TipePelanggaran.visit().tambah({ instansi: d.testData.instansi, nama: namaA, poinMin: 51, poinMax: 66 });
      // Tipe B: nama BEDA (bukan uji duplikat), instansi SAMA, range 60-70 yang
      // bertumpuk dgn 51-66 -> ditolak server 400 + toast overlap.
      TipePelanggaran.visit().openAddModal()
        .isiForm({ instansi: d.testData.instansi, nama: namaB, poinMin: 60, poinMax: 70 })
        .saveExpectServerError(d.messages.poinOverlap);
    });
  });
});
