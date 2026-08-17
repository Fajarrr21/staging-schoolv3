// Spec Kategori Inventaris — KIN
// POM: cypress/support/pageobjects/KategoriInventarisPage.js
// Fixture: cypress/fixtures/kategori_inventaris.json
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
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-KIN-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      KategoriInventaris.visit();
      cy.url().should('include', KategoriInventaris.cfg.route);
      KategoriInventaris.elements.table().should('be.visible');
    });

    it('TC-KIN-002 | Happy | Tombol Tambah ada & membuka form', () => {
      KategoriInventaris.visit().openAddModal();
      KategoriInventaris.assertDialogOpen();
    });

    it('TC-KIN-003 | Happy | Semua field di config benar-benar ada di form', () => {
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
    it('TC-KIN-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.assertRowExists(nama);
    });

    it('TC-KIN-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.assertPersisted(nama);
    });

    it('TC-KIN-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).cancel();
      KategoriInventaris.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-KIN-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      KategoriInventaris.visit().openAddModal().save();
      KategoriInventaris.assertNotSilent();
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
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-KIN-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
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
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.visit().search(nama).openEditByText(nama);
      KategoriInventaris.assertFormPrefilled({ nama: nama });
    });

    it('TC-KIN-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      KategoriInventaris.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-KIN-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.visit().search(nama).openDeleteByText(nama);
      KategoriInventaris.assertDialogOpen();
    });

    it('TC-KIN-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      KategoriInventaris.visit().openAddModal().fillForm({ instansi: d.instansi.primary, nama }).saveExpectSuccess();
      KategoriInventaris.visit().search(nama).deleteByText(nama);
      KategoriInventaris.assertNotPersisted(nama);
    });
  });
});
