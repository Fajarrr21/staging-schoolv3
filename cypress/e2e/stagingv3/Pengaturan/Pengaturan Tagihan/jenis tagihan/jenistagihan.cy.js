// Spec Jenis Tagihan — JTG
// POM: cypress/support/pageobjects/JenisTagihanPage.js
// Fixture: cypress/fixtures/jenis_tagihan.json
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

import JenisTagihan from '../../../../../support/pageobjects/JenisTagihanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Jenis Tagihan — JTG', () => {
  let d;
  let uniq;

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

    it('TC-JTG-002 | Happy | Tombol Tambah ada & membuka form', () => {
      JenisTagihan.visit().openAddModal();
      JenisTagihan.assertDialogOpen();
    });

    it('TC-JTG-003 | Happy | Semua field di config benar-benar ada di form', () => {
      JenisTagihan.visit().openAddModal();
      Object.keys(JenisTagihan.cfg.fields).forEach((key) => {
        JenisTagihan.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-JTG-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.assertRowExists(nama);
    });

    it('TC-JTG-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.assertPersisted(nama);
    });

    it('TC-JTG-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).cancel();
      JenisTagihan.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-JTG-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      JenisTagihan.visit().openAddModal().save();
      JenisTagihan.assertNotSilent();
    });

    it('TC-JTG-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      JenisTagihan.visit().openAddModal().save();
      JenisTagihan.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-JTG-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-JTG-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().search(nama).assertRowExists(nama);
    });

    it('TC-JTG-032 | Negatif | Search tanpa hasil -> empty state', () => {
      JenisTagihan.visit().search('ZZZQA000TIDAKADA');
      JenisTagihan.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-JTG-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().search(nama).openEditByText(nama);
      JenisTagihan.assertFormPrefilled({ nama: nama });
    });

    it('TC-JTG-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      JenisTagihan.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-JTG-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().search(nama).openDeleteByText(nama);
      JenisTagihan.assertDialogOpen();
    });

    it('TC-JTG-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      JenisTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      JenisTagihan.visit().search(nama).deleteByText(nama);
      JenisTagihan.assertNotPersisted(nama);
    });
  });
});
