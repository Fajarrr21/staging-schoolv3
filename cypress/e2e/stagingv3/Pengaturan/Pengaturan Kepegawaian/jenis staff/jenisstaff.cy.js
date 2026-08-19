// Spec Jenis Staff — JST
// POM: cypress/support/pageobjects/JenisStaffPage.js
// Fixture: cypress/fixtures/jenis_staff.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli).
// =========================================================================
// TWIN Jenis Guru. Route, field, kolom, endpoint, dan SEMUA pesan
// (sukses+desc/validasi/empty) sudah dibuktikan ke app. Assertion memakai TEKS
// pesan yang pasti.
//
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata.
//    Setelah run, sapu dengan cleanup: cypress/e2e/stagingv3/cleanup/cleanupjenisstaff.cy.js
//
// Khas modul ini (lihat POM):
//   - Form dialog 2 field (Instansi + Jenis Staff). Tidak ada field Status.
//   - Save POST balik 200 (bukan 201). Tombol Simpan type=submit.
//   - Toast punya title + description.
//   - DUPLIKAT DIIZINKAN (tidak ada 409) — S-06 mendokumentasikan behavior AKTUAL,
//     BUKAN expect error. Pola SISTEMIK bareng Jenis Guru (dua-duanya staffing).
//     Kalau PRD memutuskan harus unique per instansi, balik S-06 jadi
//     expect-penolakan + log BUG (1 tiket gabung Jenis Guru).

import JenisStaff from '../../../../../support/pageobjects/JenisStaffPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Jenis Staff — JST', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('jenis_staff').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    JenisStaff.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-JST-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      JenisStaff.visit();
      cy.url().should('include', JenisStaff.cfg.route);
      JenisStaff.elements.table().should('be.visible');
    });

    it('TC-JST-002 | Happy | Tombol Tambah membuka dialog dengan judul benar', () => {
      JenisStaff.visit().openAddModal();
      JenisStaff.assertDialogOpen(d.labels.addButton);
    });

    it('TC-JST-003 | Happy | Semua field (2) ada di form', () => {
      JenisStaff.visit().openAddModal();
      Object.keys(JenisStaff.cfg.fields).forEach((key) => {
        JenisStaff.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-JST-010 | Happy | Tambah valid -> toast (title+desc) & muncul di list', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.assertToast(d.messages.addSuccess, d.messages.addSuccessDesc);
      JenisStaff.assertRowExists(nama);
    });

    it('TC-JST-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.assertPersisted(nama);
    });

    it('TC-JST-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.testData.instansi, nama }).closeByX();
      JenisStaff.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JST-020 | Negatif | Simpan form kosong -> 2 pesan wajib tampil', () => {
      JenisStaff.visit().openAddModal().save();
      JenisStaff.assertFieldError('instansi', d.messages.instansiRequired);
      JenisStaff.assertFieldError('nama', d.messages.namaRequired);
    });

    it('TC-JST-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      JenisStaff.visit().openAddModal().save();
      JenisStaff.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-JST-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JST-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().search(nama).assertRowExists(nama);
    });

    it('TC-JST-032 | Negatif | Search tanpa hasil -> empty state', () => {
      JenisStaff.visit().search('ZZZQA000TIDAKADA');
      JenisStaff.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-JST-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().search(nama).openEditByText(nama);
      JenisStaff.assertFormPrefilled({ nama });
    });

    it('TC-JST-041 | Happy | Perubahan nama tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      JenisStaff.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JST-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().search(nama).openDeleteByText(nama);
      JenisStaff.assertDialogOpen();
    });

    it('TC-JST-051 | Happy | Hapus data -> toast sukses, hilang & tidak persist', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.visit().search(nama).deleteByText(nama);
      JenisStaff.assertToast(d.messages.deleteSuccess, d.messages.deleteSuccessDesc);
      JenisStaff.assertNotPersisted(nama);
    });
  });

  // ==========================================================================
  // S-06 — Duplikat (TEMUAN, mendokumentasikan behavior AKTUAL)
  // ==========================================================================
  describe('S-06 — Duplikat (temuan: diizinkan)', () => {
    // Jenis Staff MENGIZINKAN nama+instansi duplikat (POST tetap 200, tidak 409),
    // SAMA seperti Jenis Guru → pola sistemik di /setting/staffing/.
    // TC ini membuktikan behavior aktual itu, BUKAN mengunci sebagai "benar".
    // Jika PRD memutuskan harus unique per instansi -> ubah jadi expect-penolakan
    // + assertErrorToast + log BUG (gabung 1 tiket dgn Jenis Guru).
    it('TC-JST-060 | Temuan | Duplikat nama+instansi DIIZINKAN (ter-create 2x)', () => {
      const nama = uniq();
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      // Buat lagi dengan kombinasi identik — masih sukses (bukan ditolak).
      JenisStaff.visit().tambah({ instansi: d.testData.instansi, nama });
      JenisStaff.assertToast(d.messages.addSuccess);
      // Terbukti ada >= 2 baris dengan nama sama.
      JenisStaff.visit().search(nama);
      cy.get('table tbody tr').should('have.length.gte', 2);
    });
  });
});
