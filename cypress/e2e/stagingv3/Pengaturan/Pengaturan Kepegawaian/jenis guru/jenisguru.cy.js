// Spec Jenis Guru — JGR
// POM: cypress/support/pageobjects/JenisGuruPage.js
// Fixture: cypress/fixtures/jenis_guru.json
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
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-JGR-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      JenisGuru.visit();
      cy.url().should('include', JenisGuru.cfg.route);
      JenisGuru.elements.table().should('be.visible');
    });

    it('TC-JGR-002 | Happy | Tombol Tambah ada & membuka form', () => {
      JenisGuru.visit().openAddModal();
      JenisGuru.assertDialogOpen();
    });

    it('TC-JGR-003 | Happy | Semua field di config benar-benar ada di form', () => {
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
    it('TC-JGR-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.assertRowExists(nama);
    });

    it('TC-JGR-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.assertPersisted(nama);
    });

    it('TC-JGR-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).cancel();
      JenisGuru.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JGR-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      JenisGuru.visit().openAddModal().save();
      JenisGuru.assertNotSilent();
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
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JGR-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
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
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.visit().search(nama).openEditByText(nama);
      JenisGuru.assertFormPrefilled({ nama: nama });
    });

    it('TC-JGR-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      JenisGuru.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JGR-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.visit().search(nama).openDeleteByText(nama);
      JenisGuru.assertDialogOpen();
    });

    it('TC-JGR-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      JenisGuru.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisGuru.visit().search(nama).deleteByText(nama);
      JenisGuru.assertNotPersisted(nama);
    });
  });
});
