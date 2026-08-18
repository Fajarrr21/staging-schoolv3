// Spec Jenis Guru — JGR
// POM: cypress/support/pageobjects/JenisGuruPage.js
// Fixture: cypress/fixtures/jenis_guru.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI 18 Agustus 2026 (DOM + Network asli).
// =========================================================================
// Route, field, kolom, endpoint, dan SEMUA pesan (sukses+desc/validasi/empty)
// sudah dibuktikan ke app. Assertion memakai TEKS pesan yang pasti.
//
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata.
//    Setelah run, sapu dengan cleanup: cypress/e2e/stagingv3/cleanup/cleanupjenisguru.cy.js
//
// Khas modul ini (lihat POM):
//   - Form dialog 2 field (Instansi + Jenis Guru). Tidak ada field Status.
//   - Save POST balik 200 (bukan 201). Tombol Simpan type=submit.
//   - Toast punya title + description.
//   - DUPLIKAT DIIZINKAN (tidak ada 409) — S-06 mendokumentasikan behavior AKTUAL,
//     BUKAN expect error. Kalau PRD memutuskan Jenis Guru harus unique per instansi,
//     balik S-06 jadi expect-penolakan + log BUG.

import JenisGuru from '../../../../../support/pageobjects/JenisGuruPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Jenis Guru — JGR', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('jenis_guru').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    JenisGuru.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-JGR-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      JenisGuru.visit();
      cy.url().should('include', JenisGuru.cfg.route);
      JenisGuru.elements.table().should('be.visible');
    });

    it('TC-JGR-002 | Happy | Tombol Tambah membuka dialog dengan judul benar', () => {
      JenisGuru.visit().openAddModal();
      JenisGuru.assertDialogOpen(d.labels.addButton);
    });

    it('TC-JGR-003 | Happy | Semua field (2) ada di form', () => {
      JenisGuru.visit().openAddModal();
      Object.keys(JenisGuru.cfg.fields).forEach((key) => {
        JenisGuru.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-JGR-010 | Happy | Tambah valid -> toast (title+desc) & muncul di list', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.assertToast(d.messages.addSuccess, d.messages.addSuccessDesc);
      JenisGuru.assertRowExists(nama);
    });

    it('TC-JGR-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.assertPersisted(nama);
    });

    it('TC-JGR-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.testData.instansi, nama }).closeByX();
      JenisGuru.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JGR-020 | Negatif | Simpan form kosong -> 2 pesan wajib tampil', () => {
      JenisGuru.visit().openAddModal().save();
      JenisGuru.assertFieldError('instansi', d.messages.instansiRequired);
      JenisGuru.assertFieldError('nama', d.messages.namaRequired);
    });

    it('TC-JGR-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      JenisGuru.visit().openAddModal().save();
      JenisGuru.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-JGR-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JGR-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().search(nama).assertRowExists(nama);
    });

    it('TC-JGR-032 | Negatif | Search tanpa hasil -> empty state', () => {
      JenisGuru.visit().search('ZZZQA000TIDAKADA');
      JenisGuru.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-JGR-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().search(nama).openEditByText(nama);
      JenisGuru.assertFormPrefilled({ nama });
    });

    it('TC-JGR-041 | Happy | Perubahan nama tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      JenisGuru.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JGR-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().search(nama).openDeleteByText(nama);
      JenisGuru.assertDialogOpen();
    });

    it('TC-JGR-051 | Happy | Hapus data -> toast sukses, hilang & tidak persist', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.visit().search(nama).deleteByText(nama);
      JenisGuru.assertToast(d.messages.deleteSuccess, d.messages.deleteSuccessDesc);
      JenisGuru.assertNotPersisted(nama);
    });
  });

  // ==========================================================================
  // S-06 — Duplikat (TEMUAN, mendokumentasikan behavior AKTUAL)
  // ==========================================================================
  describe('S-06 — Duplikat (temuan: diizinkan)', () => {
    // Jenis Guru MENGIZINKAN nama+instansi duplikat (POST tetap 200, tidak 409).
    // TC ini membuktikan behavior aktual itu, BUKAN mengunci sebagai "benar".
    // Jika PRD memutuskan harus unique per instansi -> ubah jadi expect-penolakan
    // + assertErrorToast + log BUG.
    it('TC-JGR-060 | Temuan | Duplikat nama+instansi DIIZINKAN (ter-create 2x)', () => {
      const nama = uniq();
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      // Buat lagi dengan kombinasi identik — masih sukses (bukan ditolak).
      JenisGuru.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisGuru.assertToast(d.messages.addSuccess);
      // Terbukti ada >= 2 baris dengan nama sama.
      JenisGuru.visit().search(nama);
      cy.get('table tbody tr').should('have.length.gte', 2);
    });
  });
});
