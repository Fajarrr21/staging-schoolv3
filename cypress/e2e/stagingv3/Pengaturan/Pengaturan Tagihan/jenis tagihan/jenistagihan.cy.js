// Spec Jenis Tagihan — JTG
// POM: cypress/support/pageobjects/JenisTagihanPage.js
// Fixture: cypress/fixtures/jenis_tagihan.json
//
// =========================================================================
// STATUS: CONFIG TERVERIFIKASI 18 Agustus 2026 (DOM + Network asli).
// =========================================================================
// Route, field, kolom, endpoint, dan SEMUA pesan (sukses/validasi/duplikat/
// empty state) sudah dibuktikan langsung ke app — assertion di sini memakai
// TEKS pesan yang pasti, bukan lagi assertNotSilent().
//
// Bentuk khusus modul ini (lihat POM):
//   - Form via DIALOG.
//   - Form PROGRESIF: Mengulang Setiap + Tanggal Mulai/Akhir baru muncul setelah
//     Pengulangan dipilih. Karena itu S-00 hanya mengecek field non-kondisional,
//     dan TC-004 khusus membuktikan perilaku progresif ini.
//   - Uniqueness KOMPOSIT (nama+instansi+pengulangan+periode) -> POST 409.
//
// Yang masih perlu dikonfirmasi RUN PERTAMA (kalau merah, perbaikannya 1 baris):
//   - adanya kolom search (input[placeholder*="Cari"]) di halaman list,
//   - tombol tutup dialog (ikon X) untuk skenario Batal,
//   - verb/status HTTP Edit (saveEditExpectSuccess sengaja tidak assert status).

import JenisTagihan from '../../../../../support/pageobjects/JenisTagihanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Jenis Tagihan — JTG', () => {
  let d;
  let uniq;

  // Data create valid & lengkap (mengisi field kondisional dari fixture).
  const dataValid = (nama) => ({
    instansi: d.testData.instansi,
    nama,
    pengulangan: d.testData.pengulangan,
    mengulangSetiap: d.testData.mengulangSetiap,
    tanggalMulai: d.testData.tanggalMulai,
    tanggalAkhir: d.testData.tanggalAkhir,
  });

  before(() => {
    cy.fixture('jenis_tagihan').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    JenisTagihan.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-JTG-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      JenisTagihan.visit();
      cy.url().should('include', JenisTagihan.cfg.route);
      JenisTagihan.elements.table().should('be.visible');
    });

    it('TC-JTG-002 | Happy | Tombol Tambah membuka dialog dengan judul benar', () => {
      JenisTagihan.visit().openAddModal();
      JenisTagihan.assertDialogOpen(d.labels.addButton);
    });

    it('TC-JTG-003 | Happy | Field non-kondisional ada di form saat dialog dibuka', () => {
      JenisTagihan.visit().openAddModal();
      Object.entries(JenisTagihan.cfg.fields)
        .filter(([, f]) => !f.conditional)
        .forEach(([key]) => {
          JenisTagihan.elements.fieldItem(key).should('exist');
        });
    });

    it('TC-JTG-004 | Happy | Field periode MUNCUL setelah Pengulangan dipilih (form progresif)', () => {
      JenisTagihan.visit().openAddModal();
      // Sebelum pengulangan dipilih, field kondisional belum dirender.
      JenisTagihan.elements.fieldItem('tanggalMulai').should('not.exist');
      JenisTagihan.select('pengulangan', d.testData.pengulangan);
      // Setelah dipilih, field periode muncul.
      JenisTagihan.elements.fieldItem('tanggalMulai').should('exist');
      JenisTagihan.elements.fieldItem('tanggalAkhir').should('exist');
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-JTG-010 | Happy | Tambah data valid -> toast sukses & muncul di list', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.assertSuccessToast(d.messages.addSuccess);
      JenisTagihan.assertRowExists(nama);
    });

    it('TC-JTG-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.assertPersisted(nama);
    });

    it('TC-JTG-012 | Positif | Tutup dialog tanpa menyimpan -> data tidak dibuat', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().isiForm(dataValid(nama)).closeByX();
      JenisTagihan.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JTG-020 | Negatif | Simpan form kosong -> 3 pesan wajib tampil', () => {
      JenisTagihan.visit().openAddModal().save();
      JenisTagihan.assertFieldError('instansi', d.messages.instansiRequired);
      JenisTagihan.assertFieldError('nama', d.messages.namaRequired);
      JenisTagihan.assertFieldError('pengulangan', d.messages.pengulanganRequired);
    });

    it('TC-JTG-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      JenisTagihan.visit().openAddModal().save();
      JenisTagihan.assertDialogOpen();
    });

    it('TC-JTG-022 | Negatif | Duplikat komposit -> POST 409 & toast error', () => {
      const nama = uniq();
      // Buat pertama (sukses).
      JenisTagihan.visit().tambah(dataValid(nama));
      // Buat lagi dengan kombinasi identik -> ditolak.
      JenisTagihan.visit().openAddModal().isiForm(dataValid(nama)).saveExpectDuplicate();
      JenisTagihan.assertErrorToast(d.messages.duplicate);
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-JTG-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JTG-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().search(nama).assertRowExists(nama);
    });

    it('TC-JTG-032 | Negatif | Search tanpa hasil -> empty state', () => {
      JenisTagihan.visit().search('ZZZQA000TIDAKADA');
      JenisTagihan.assertEmptyState();
    });

    it('TC-JTG-033 | Positif | Dropdown Pengulangan berisi tepat 8 opsi', () => {
      JenisTagihan.visit().openAddModal();
      JenisTagihan.assertOpsiPengulangan(d.options.pengulangan);
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-JTG-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().search(nama).openEditByText(nama);
      JenisTagihan.assertFormPrefilled({ nama });
    });

    it('TC-JTG-041 | Happy | Perubahan nama tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru)
        .saveEditExpectSuccess();
      JenisTagihan.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JTG-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().search(nama).openDeleteByText(nama);
      JenisTagihan.assertDialogOpen();
    });

    it('TC-JTG-051 | Happy | Hapus data -> toast sukses, hilang dari list & tidak persist', () => {
      const nama = uniq();
      JenisTagihan.visit().tambah(dataValid(nama));
      JenisTagihan.visit().search(nama).deleteByText(nama);
      JenisTagihan.assertSuccessToast(d.messages.deleteSuccess);
      JenisTagihan.assertNotPersisted(nama);
    });
  });
});
