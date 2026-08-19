// Spec Kategori Inventaris — KIN
// POM: cypress/support/pageobjects/KategoriInventarisPage.js
// Fixture: cypress/fixtures/kategori_inventaris.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli).
// =========================================================================
// Route, field, kolom, endpoint, dan SEMUA pesan sudah dibuktikan ke app.
//
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata.
//    Setelah run, sapu dengan cleanup: cypress/e2e/stagingv3/cleanup/cleanupkategoriinventaris.cy.js
//
// Khas modul ini (lihat POM):
//   - Endpoint /api/proxy/inventory-categories (hyphen, tidak nurut URL). POST 200.
//   - Tabel TANPA kolom Status.
//   - Toast: title KONSTAN "Berhasil", pesan di description → assertToast(toastTitle, pesan).
//   - Empty state <h3>"Data inventaris tidak ditemukan"</h3> (naming app "inventaris").
//   - DUPLIKAT DIIZINKAN (tidak 409) — S-06 dokumentasi behavior AKTUAL, bukan expect
//     error. 3 dari 4 master data izinkan → kemungkinan by-design, konfirmasi PRD.

import KategoriInventaris from '../../../../../support/pageobjects/KategoriInventarisPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Kategori Inventaris — KIN', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('kategori_inventaris').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    KategoriInventaris.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-KIN-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      KategoriInventaris.visit();
      cy.url().should('include', KategoriInventaris.cfg.route);
      KategoriInventaris.elements.table().should('be.visible');
    });

    it('TC-KIN-002 | Happy | Tombol Tambah membuka dialog dengan judul benar', () => {
      KategoriInventaris.visit().openAddModal();
      KategoriInventaris.assertDialogOpen(d.labels.addButton);
    });

    it('TC-KIN-003 | Happy | Semua field (2) ada di form', () => {
      KategoriInventaris.visit().openAddModal();
      Object.keys(KategoriInventaris.cfg.fields).forEach((key) => {
        KategoriInventaris.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-KIN-010 | Happy | Tambah valid -> toast "Berhasil" (desc) & muncul di list', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.assertToast(d.messages.toastTitle, d.messages.addSuccess);
      KategoriInventaris.assertRowExists(nama);
    });

    it('TC-KIN-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.assertPersisted(nama);
    });

    it('TC-KIN-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.testData.instansi, nama }).closeByX();
      KategoriInventaris.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-KIN-020 | Negatif | Simpan form kosong -> 2 pesan wajib tampil', () => {
      KategoriInventaris.visit().openAddModal().save();
      KategoriInventaris.assertFieldError('instansi', d.messages.instansiRequired);
      KategoriInventaris.assertFieldError('nama', d.messages.namaRequired);
    });

    it('TC-KIN-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      KategoriInventaris.visit().openAddModal().save();
      KategoriInventaris.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-KIN-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-KIN-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().search(nama).assertRowExists(nama);
    });

    it('TC-KIN-032 | Negatif | Search tanpa hasil -> empty state', () => {
      KategoriInventaris.visit().search('ZZZQA000TIDAKADA');
      KategoriInventaris.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-KIN-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().search(nama).openEditByText(nama);
      KategoriInventaris.assertFormPrefilled({ nama });
    });

    it('TC-KIN-041 | Happy | Perubahan nama tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      KategoriInventaris.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-KIN-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().search(nama).openDeleteByText(nama);
      KategoriInventaris.assertDialogOpen();
    });

    it('TC-KIN-051 | Happy | Hapus data -> toast sukses, hilang & tidak persist', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.visit().search(nama).deleteByText(nama);
      KategoriInventaris.assertToast(d.messages.toastTitle, d.messages.deleteSuccess);
      KategoriInventaris.assertNotPersisted(nama);
    });
  });

  // ==========================================================================
  // S-06 — Duplikat (TEMUAN, mendokumentasikan behavior AKTUAL)
  // ==========================================================================
  describe('S-06 — Duplikat (temuan: diizinkan)', () => {
    // Kategori Inventaris MENGIZINKAN nama+instansi duplikat (POST 200, tidak 409).
    // 3 dari 4 master data izinkan → kemungkinan by-design. TC ini membuktikan
    // behavior aktual, BUKAN mengunci sebagai "benar". Kalau PRD memutuskan harus
    // unique -> ubah jadi expect-penolakan + log BUG.
    it('TC-KIN-060 | Temuan | Duplikat nama+instansi DIIZINKAN (ter-create 2x)', () => {
      const nama = uniq();
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      // Buat lagi dengan kombinasi identik — masih sukses (bukan ditolak).
      KategoriInventaris.visit().tambah({ instansi: d.testData.instansi, nama });
      KategoriInventaris.assertToast(d.messages.toastTitle, d.messages.addSuccess);
      // Terbukti ada >= 2 baris dengan nama sama.
      KategoriInventaris.visit().search(nama);
      cy.get('table tbody tr').should('have.length.gte', 2);
    });
  });
});
