// Spec Jenis Staff — JST
// POM: cypress/support/pageobjects/JenisStaffPage.js
// Fixture: cypress/fixtures/jenis_staff.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// Config POM & fixture masih berisi nilai hipotesis bertanda (?) / TODO
// (sumber: repo qa-cazh, app-nya sama, tapi belum kita buktikan sendiri).
//
// RUN PERTAMA = ALAT VERIFIKASI, bukan laporan cakupan.
//   1) Lihat blok "S-00 — Kontrak config" duluan. Blok itu memverifikasi
//      asumsi paling dasar: route benar, tabel ada, tombol Tambah ada,
//      dan field yang dideklarasikan di config memang ada di form.
//   2) Kalau S-00 merah, SEMUA blok di bawahnya tidak ada artinya —
//      perbaiki config POM dulu, jangan menilai hasilnya.
//   3) Setelah S-00 hijau, kegagalan di blok lain baru bermakna dan bisa
//      langsung dipakai sebagai hasil element analysis.
//
// JANGAN dilaporkan sebagai cakupan resmi sebelum urutan CLAUDE.md dijalani:
// PRD -> TC sheet (ACC) -> element analysis (ACC) -> naikkan nilai (?) -> spec final.
//
// Assertion pesan validasi sengaja memakai assertNotSilent(), BUKAN teks
// tertentu: teks pesannya belum terverifikasi, jadi yang di-assert adalah
// kewajiban minimum app — tidak boleh diam.

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
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-JST-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      JenisStaff.visit();
      cy.url().should('include', JenisStaff.cfg.route);
      JenisStaff.elements.table().should('be.visible');
    });

    it('TC-JST-002 | Happy | Tombol Tambah ada & membuka form', () => {
      JenisStaff.visit().openAddModal();
      JenisStaff.assertDialogOpen();
    });

    it('TC-JST-003 | Happy | Semua field di config benar-benar ada di form', () => {
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
    it('TC-JST-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.assertRowExists(nama);
    });

    it('TC-JST-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.assertPersisted(nama);
    });

    it('TC-JST-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).cancel();
      JenisStaff.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JST-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      JenisStaff.visit().openAddModal().save();
      JenisStaff.assertNotSilent();
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
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JST-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
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
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.visit().search(nama).openEditByText(nama);
      JenisStaff.assertFormPrefilled({ nama: nama });
    });

    it('TC-JST-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      JenisStaff.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JST-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.visit().search(nama).openDeleteByText(nama);
      JenisStaff.assertDialogOpen();
    });

    it('TC-JST-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      JenisStaff.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisStaff.visit().search(nama).deleteByText(nama);
      JenisStaff.assertNotPersisted(nama);
    });
  });
});
