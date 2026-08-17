// Spec Kategori Pengumuman — KPU
// POM: cypress/support/pageobjects/KategoriPengumumanPage.js
// Fixture: cypress/fixtures/kategori_pengumuman.json
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

import KategoriPengumuman from '../../../../../support/pageobjects/KategoriPengumumanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';
import { makeUniq } from '../../../../../support/pageobjects/base/helpers';

describe('Kategori Pengumuman — KPU', () => {
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
  // S-00 — Kontrak config. Kalau blok ini merah, jangan lanjut menilai blok lain.
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-KPU-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      KategoriPengumuman.visit();
      cy.url().should('include', KategoriPengumuman.cfg.route);
      KategoriPengumuman.elements.table().should('be.visible');
    });

    it('TC-KPU-002 | Happy | Tombol Tambah ada & membuka form', () => {
      KategoriPengumuman.visit().openAddModal();
      KategoriPengumuman.assertDialogOpen();
    });

    it('TC-KPU-003 | Happy | Semua field di config benar-benar ada di form', () => {
      KategoriPengumuman.visit().openAddModal();
      Object.keys(KategoriPengumuman.cfg.fields).forEach((key) => {
        KategoriPengumuman.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-01 — Tambah
  // ==========================================================================
  describe('S-01 — Tambah', () => {
    it('TC-KPU-010 | Happy | Tambah data valid -> muncul di list', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.assertRowExists(nama);
    });

    it('TC-KPU-011 | Happy | Data persist setelah reload halaman', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.assertPersisted(nama);
    });

    it('TC-KPU-012 | Positif | Batal menutup form tanpa menyimpan', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).cancel();
      KategoriPengumuman.assertDialogClosed().assertRowNotExists(nama);
    });
  });

  // ==========================================================================
  // S-02 — Validasi
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-KPU-020 | Negatif | Simpan form kosong -> FE tidak boleh diam', () => {
      KategoriPengumuman.visit().openAddModal().save();
      KategoriPengumuman.assertNotSilent();
    });

    it('TC-KPU-021 | Negatif | Simpan form kosong -> dialog tetap terbuka', () => {
      KategoriPengumuman.visit().openAddModal().save();
      KategoriPengumuman.assertDialogOpen();
    });
  });

  // ==========================================================================
  // S-03 — List
  // ==========================================================================
  describe('S-03 — List', () => {
    it('TC-KPU-030 | Happy | Data terbaru muncul di baris teratas', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().assertFirstRowCell('nama', nama);
    });

    it('TC-KPU-031 | Positif | Search menemukan data yang baru dibuat', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().search(nama).assertRowExists(nama);
    });

    it('TC-KPU-032 | Negatif | Search tanpa hasil -> empty state', () => {
      KategoriPengumuman.visit().search('ZZZQA000TIDAKADA');
      KategoriPengumuman.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-04 — Edit
  // ==========================================================================
  describe('S-04 — Edit', () => {
    it('TC-KPU-040 | Happy | Form edit ter-prefill sesuai baris', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().search(nama).openEditByText(nama);
      KategoriPengumuman.assertFormPrefilled({ nama: nama });
    });

    it('TC-KPU-041 | Happy | Perubahan tersimpan & persist', () => {
      const nama = uniq();
      const namaBaru = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().search(nama).openEditByText(nama)
        .fill('nama', namaBaru).saveExpectSuccess();
      KategoriPengumuman.assertPersisted(namaBaru);
    });
  });

  // ==========================================================================
  // S-05 — Hapus
  // ==========================================================================
  describe('S-05 — Hapus', () => {
    it('TC-KPU-050 | Positif | Dialog konfirmasi muncul sebelum menghapus', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().search(nama).openDeleteByText(nama);
      KategoriPengumuman.assertDialogOpen();
    });

    it('TC-KPU-051 | Happy | Hapus data -> hilang dari list & tidak persist', () => {
      const nama = uniq();
      KategoriPengumuman.visit().openAddModal().fillForm({ nama }).saveExpectSuccess();
      KategoriPengumuman.visit().search(nama).deleteByText(nama);
      KategoriPengumuman.assertNotPersisted(nama);
    });
  });
});
