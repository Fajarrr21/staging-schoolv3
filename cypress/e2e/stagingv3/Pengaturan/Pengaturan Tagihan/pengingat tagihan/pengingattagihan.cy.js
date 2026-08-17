// Spec Pengingat Tagihan — PTG
// POM: cypress/support/pageobjects/PengingatTagihanPage.js
// Fixture: cypress/fixtures/pengingat_tagihan.json
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

import PengingatTagihan from '../../../../../support/pageobjects/PengingatTagihanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Pengingat Tagihan — PTG', () => {
  let d;
  let uniq;

  before(() => {
    cy.fixture('pengingat_tagihan').then((data) => {
      d = data;
      uniq = makeUniq(d.testData.prefix);
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    PengingatTagihan.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-PTG-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      PengingatTagihan.visit();
      cy.url().should('include', PengingatTagihan.cfg.route);
      PengingatTagihan.elements.table().should('be.visible');
    });

    it('TC-PTG-002 | Happy | Tombol Tambah ada & membuka form', () => {
      PengingatTagihan.visit().openAddModal();
      PengingatTagihan.assertDialogOpen();
    });

    it('TC-PTG-003 | Happy | Semua field di config benar-benar ada di form', () => {
      PengingatTagihan.visit().openAddModal();
      Object.keys(PengingatTagihan.cfg.fields).forEach((key) => {
        PengingatTagihan.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-PTG-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.assertRowExists(nama);
    });

    it('TC-PTG-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.assertPersisted(nama);
    });

    it('TC-PTG-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).cancel();
      PengingatTagihan.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-PTG-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      PengingatTagihan.visit().openAddModal().save();
      PengingatTagihan.assertNotSilent();
    });

    it('TC-PTG-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      PengingatTagihan.visit().openAddModal().save();
      PengingatTagihan.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-PTG-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().assertFirstRowCell('judul', nama);
    });

    it('TC-PTG-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().search(nama).assertRowExists(nama);
    });

    it('TC-PTG-032 | Negatif | Search tanpa hasil -> empty state', () => {
      PengingatTagihan.visit().search('ZZZQA000TIDAKADA');
      PengingatTagihan.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-PTG-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().search(nama).openEditByText(nama);
      PengingatTagihan.assertFormPrefilled({ judul: nama });
    });

    it('TC-PTG-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().search(nama).openEditByText(nama)
        .fill('judul', namaBaru).saveExpectSuccess();
      PengingatTagihan.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-PTG-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().search(nama).openDeleteByText(nama);
      PengingatTagihan.assertDialogOpen();
    });

    it('TC-PTG-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      PengingatTagihan.visit().openAddModal().fillForm({ instansi: d.instansi.primary, judul: nama }).saveExpectSuccess();
      PengingatTagihan.visit().search(nama).deleteByText(nama);
      PengingatTagihan.assertNotPersisted(nama);
    });
  });
});
