// Spec Tipe Pelanggaran — TPL
// POM: cypress/support/pageobjects/TipePelanggaranPage.js
// Fixture: cypress/fixtures/tipe_pelanggaran.json
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

  // ==========================================================================
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-TPL-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      TipePelanggaran.visit();
      cy.url().should('include', TipePelanggaran.cfg.route);
      TipePelanggaran.elements.table().should('be.visible');
    });

    it('TC-TPL-002 | Happy | Tombol Tambah ada & membuka form', () => {
      TipePelanggaran.visit().openAddModal();
      TipePelanggaran.assertDialogOpen();
    });

    it('TC-TPL-003 | Happy | Semua field di config benar-benar ada di form', () => {
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
    it('TC-TPL-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.assertRowExists(nama);
    });

    it('TC-TPL-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.assertPersisted(nama);
    });

    it('TC-TPL-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).cancel();
      TipePelanggaran.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-TPL-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      TipePelanggaran.visit().openAddModal().save();
      TipePelanggaran.assertNotSilent();
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
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-TPL-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
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
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.visit().search(nama).openEditByText(nama);
      TipePelanggaran.assertFormPrefilled({ nama: nama });
    });

    it('TC-TPL-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      TipePelanggaran.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-TPL-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.visit().search(nama).openDeleteByText(nama);
      TipePelanggaran.assertDialogOpen();
    });

    it('TC-TPL-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      TipePelanggaran.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama, minPoin: 5, maxPoin: 15 }).saveExpectSuccess();
      TipePelanggaran.visit().search(nama).deleteByText(nama);
      TipePelanggaran.assertNotPersisted(nama);
    });
  });
});
