// Spec Pengingat Tagihan — PTG
// POM: cypress/support/pageobjects/PengingatTagihanPage.js
// Fixture: cypress/fixtures/pengingat_tagihan.json
//
// =========================================================================
// STATUS: SEBAGIAN TERVERIFIKASI (19 Agustus 2026).
// =========================================================================
// ⚠️ TARGET = PRODUCTION (v3.cazh.id). Spec ini membuat & menghapus data nyata
//    saat blok create diaktifkan → sapu dengan cleanup:
//    cypress/e2e/stagingv3/cleanup/cleanuppengingattagihan.cy.js
//
// Khas modul ini (lihat POM):
//   - Form Tambah = HALAMAN `/add`, BUKAN dialog. Klik "Tambah Pengingat" →
//     navigasi. Submit via tombol form (submitExpectSuccess/Validation),
//     BUKAN saveButton dialog.
//   - 8 field WAJIB (+ switch WA opsional). Submit kosong → 8 pesan "wajib diisi".
//   - Tabel TIDAK punya kolom judul/nama. Kolom terlihat: instansi(0),
//     tanggal(1), pesan(2), jadwal(3), status(4). Identitas data QA harus
//     ditaruh di field PESAN (kolom 2) supaya bisa dicari + di-cleanup.
//
// YANG SUDAH VERIFIED (ditulis penuh di bawah):
//   • S-00 Kontrak — route, halaman /add, ke-9 field ada.
//   • S-02 Validasi — 8 pesan wajib dengan TEKS pasti (bukan assertNotSilent).
//
// YANG MASIH PENDING element analysis (blok describe.skip di bawah, JANGAN
// ditebak — lihat komentar blok itu):
//   • S-01/S-03/S-04/S-05 butuh isi form lengkap → widget `tanggalMulai`
//     (datepicker popover) & `jam` (react-aria segment) DOM-nya BELUM
//     ter-capture (pickDate/fillTime masih best-effort di POM).
//   • Pesan editSuccess / deleteSuccess / emptyState masih TODO di fixture.

import PengingatTagihan from '../../../../../support/pageobjects/PengingatTagihanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';

describe('Pengingat Tagihan — PTG', () => {
  let d;

  before(() => {
    cy.fixture('pengingat_tagihan').then((data) => {
      d = data;
    });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    PengingatTagihan.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak config (VERIFIED)
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-PTG-001 | Happy | Halaman list bisa dibuka & tabel tampil', () => {
      PengingatTagihan.visit();
      cy.url().should('include', PengingatTagihan.cfg.route);
      PengingatTagihan.elements.table().should('be.visible');
    });

    it('TC-PTG-002 | Happy | Tombol Tambah membuka HALAMAN /add', () => {
      PengingatTagihan.visit().openAdd();
      cy.url().should('include', PengingatTagihan.cfg.addRoute);
      PengingatTagihan.elements.input('judul').should('be.visible');
    });

    it('TC-PTG-003 | Happy | Semua field (9) yang dideklarasikan ada di form', () => {
      PengingatTagihan.visit().openAdd();
      Object.keys(PengingatTagihan.cfg.fields).forEach((key) => {
        PengingatTagihan.elements.fieldItem(key).should('exist');
      });
    });
  });

  // ==========================================================================
  // S-02 — Validasi (VERIFIED — 8 pesan wajib dengan teks pasti)
  // ==========================================================================
  describe('S-02 — Validasi', () => {
    it('TC-PTG-020 | Negatif | Submit form kosong → tetap di /add & 8 pesan wajib tampil', () => {
      PengingatTagihan.visit().openAdd().submitExpectValidation();
      PengingatTagihan.assertRequiredCount(8);
    });

    it('TC-PTG-021 | Negatif | Submit kosong → tiap field wajib menampilkan pesannya', () => {
      PengingatTagihan.visit().openAdd().submitExpectValidation();
      PengingatTagihan.assertFieldError('instansi', d.messages.instansiRequired);
      PengingatTagihan.assertFieldError('tipe', d.messages.tipeRequired);
      PengingatTagihan.assertFieldError('judul', d.messages.judulRequired);
      PengingatTagihan.assertFieldError('pesan', d.messages.pesanRequired);
      PengingatTagihan.assertFieldError('target', d.messages.targetRequired);
      PengingatTagihan.assertFieldError('pengulangan', d.messages.pengulanganRequired);
      PengingatTagihan.assertFieldError('tanggalMulai', d.messages.tanggalMulaiRequired);
      PengingatTagihan.assertFieldError('jam', d.messages.jamRequired);
    });
  });

  // ==========================================================================
  // S-01/S-03/S-04/S-05 — PENDING element analysis (SENGAJA di-skip)
  // ==========================================================================
  // JANGAN aktifkan blok ini sampai 3 hal ini terverifikasi ke DOM/Network asli:
  //   1. Datepicker `tanggalMulai`: struktur popover kalender + tombol hari
  //      (POM.pickDate best-effort). Tanpa ini create tak bisa mengisi form.
  //   2. Time `jam`: segmen react-aria [role="spinbutton"] (POM.fillTime
  //      best-effort) — pastikan urutan jam→menit & format.
  //   3. Pesan editSuccess / deleteSuccess / emptyState (fixture masih TODO).
  //
  // Saat mengaktifkan: taruh nama QA rerun-safe di field PESAN (kolom 2), mis.
  //   const uniq = makeUniq(d.testData.prefix); const pesan = uniq();
  //   PengingatTagihan.visit().tambah({ ...d.testData, pesan });
  // lalu cari/verifikasi & cleanup lewat kolom `pesan` (bukan judul).
  describe.skip('S-01/S-03/S-04/S-05 — PENDING widget tanggal/jam + pesan edit/hapus/empty', () => {
    it('TC-PTG-010 | Happy | Tambah data valid → muncul di list (PENDING)', () => {});
    it('TC-PTG-030 | Happy | Data terbaru di baris teratas (PENDING)', () => {});
    it('TC-PTG-031 | Positif | Search menemukan data baru (PENDING)', () => {});
    it('TC-PTG-032 | Negatif | Search nihil → empty state (PENDING pesan emptyState)', () => {});
    it('TC-PTG-040 | Happy | Form edit ter-prefill (PENDING)', () => {});
    it('TC-PTG-041 | Happy | Perubahan tersimpan & persist (PENDING verb/status edit)', () => {});
    it('TC-PTG-050 | Positif | Dialog konfirmasi hapus muncul (PENDING)', () => {});
    it('TC-PTG-051 | Happy | Hapus → hilang & tidak persist (PENDING pesan deleteSuccess)', () => {});
  });
});
