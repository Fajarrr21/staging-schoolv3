// Spec Kategori Pengumuman — KPG
// POM: cypress/support/pageobjects/KategoriPengumumanPage.js
// Fixture: cypress/fixtures/kategori_pengumuman.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI 19 Agustus 2026 (DOM + Network asli).
// =========================================================================
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata.
//    Setelah run, sapu dengan cleanup: cypress/e2e/stagingv3/cleanup/cleanupkategoripengumuman.cy.js
//
// Modul PALING unik (lihat POM):
//   - GLOBAL: TIDAK ada field/kolom Instansi.
//   - Add != Edit: dialog Tambah 1 field (Nama); dialog Edit 2 field (Nama + Status).
//   - Duplikat DITOLAK 400 (create POST & edit PUT) -> S-06 negative test.
//   - Edit = PUT /{id}. saveEditExpectSuccess() assert 200.
//   - Wording "harus diisi". Toast title spesifik + desc. Empty state "Belum Ada Kategori".
//   - Status di kolom 1 -> pakai shared cy.assertRowStatus.

import KategoriPengumuman from '../../../../../support/pageobjects/KategoriPengumumanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Kategori Pengumuman — KPG', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('kategori_pengumuman').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    KategoriPengumuman.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config (termasuk Add != Edit)
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-KPG-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      KategoriPengumuman.visit();
      cy.url().should('include', KategoriPengumuman.cfg.route);
      KategoriPengumuman.elements.table().should('be.visible');
    });

    it('TC-KPG-002 | Happy | Dialog Tambah = 1 field (Nama), TANPA Instansi', () => {
      KategoriPengumuman.visit().openAddModal();
      KategoriPengumuman.assertDialogOpen(d.labels.addButton);
      KategoriPengumuman.elements.fieldItem('nama').should('exist');
      // GLOBAL: tidak ada field Instansi & hanya 1 form-label di dialog Tambah.
      KategoriPengumuman.elements.dialog().find('[data-slot="form-label"]').should('have.length', 1);
      KategoriPengumuman.elements.dialog().find('[data-slot="form-label"]').should('not.contain.text', 'Instansi');
    });

    it('TC-KPG-003 | Happy | Dialog Edit = 2 field (Nama + Status)', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).openEditByText(nama);
      KategoriPengumuman.elements.fieldItem('nama').should('exist');
      cy.contains('[data-slot="dialog-content"] [data-slot="form-label"]', 'Status').should('exist');
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-KPG-010 | Happy | Tambah valid -> toast (title+desc) & muncul di list', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.assertToast(d.messages.addSuccess, d.messages.addSuccessDesc);
      KategoriPengumuman.assertRowExists(nama);
    });

    it('TC-KPG-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.assertPersisted(nama);
    });

    it('TC-KPG-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).closeByX();
      KategoriPengumuman.assertDialogClosed().assertRowNotExists(nama);
    });

    it('TC-KPG-013 | Happy | Data baru default berstatus Aktif', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama);
      cy.assertRowStatus(0, d.columns.status, d.labels.statusActive);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-KPG-020 | Negatif | Simpan nama kosong -> pesan "harus diisi"', () => {
      KategoriPengumuman.visit().openAddModal().save();
      KategoriPengumuman.assertFieldError('nama', d.messages.namaRequired);
    });

    it('TC-KPG-021 | Negatif | Simpan nama kosong -> dialog tetap terbuka', () => {
      KategoriPengumuman.visit().openAddModal().save();
      KategoriPengumuman.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-KPG-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-KPG-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).assertRowExists(nama);
    });

    // Empty-state wording pada search/filter-nihil belum diverifikasi (beda dari
    // "Belum Ada Kategori" yang state no-data). Jadi assert bahwa filter benar2
    // menyaring: data yang dibuat TIDAK muncul saat search istilah lain.
    it('TC-KPG-032 | Negatif | Search istilah lain -> data QA tidak muncul (filter bekerja)', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search('ZZZQA000TIDAKADA').assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-04 — Edit (PUT)
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-KPG-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).openEditByText(nama);
      KategoriPengumuman.assertFormPrefilled({ nama });
    });

    it('TC-KPG-041 | Happy | Perubahan nama tersimpan & persist (PUT 200)', () => {
      const nama = uniq();
      const namaBaru = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      KategoriPengumuman.assertPersisted(namaBaru);
    });

    it('TC-KPG-042 | Happy | Ubah Status ke "Tidak Aktif" -> badge baris ikut berubah', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).openEditByText(nama)
        .editStatus(d.testData.editStatus)
        .saveEditExpectSuccess();
      KategoriPengumuman.visit().search(nama);
      cy.assertRowStatus(0, d.columns.status, d.testData.editStatus);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-KPG-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).openDeleteByText(nama);
      KategoriPengumuman.assertDialogOpen();
    });

    it('TC-KPG-051 | Happy | Hapus data -> toast sukses, hilang & tidak persist', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().search(nama).deleteByText(nama);
      KategoriPengumuman.assertToast(d.messages.deleteSuccess, d.messages.deleteSuccessDesc);
      KategoriPengumuman.assertNotPersisted(nama);
    });
  });

  // ==========================================================================
  // S-06 — Duplikat DITOLAK (create POST 400 & edit PUT 400)
  // ==========================================================================
  describe('S-06 — Duplikat ditolak', () => {
    it('TC-KPG-060 | Negatif | Tambah nama duplikat ditolak (POST 400) + pesan', () => {
      const nama = uniq();
      KategoriPengumuman.visit().tambah({ nama });
      KategoriPengumuman.visit().openAddModal()
        .fillForm({ nama })
        .saveExpectDuplicate(d.messages.duplicate);
    });

    it('TC-KPG-061 | Negatif | Edit nama jadi duplikat ditolak (PUT 400) + pesan', () => {
      const namaA = uniq();
      const namaB = uniq();
      KategoriPengumuman.visit().tambah({ nama: namaA });
      KategoriPengumuman.visit().tambah({ nama: namaB });
      // Edit B -> ubah nama jadi namaA (sudah ada) -> ditolak PUT 400.
      KategoriPengumuman.visit().search(namaB).openEditByText(namaB)
        .fill('nama', namaA)
        .saveEditExpectDuplicate(d.messages.duplicate);
    });
  });
});
