// Spec Legalitas Bukti Bayar — LGL
// POM: cypress/support/pageobjects/LegalitasBuktiBayarPage.js
// Fixture: cypress/fixtures/legalitas_bukti_bayar.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// BENTUK MODUL: modal-dari-sidebar. Tidak ada cy.visit ke modul ini —
// masuknya lewat anchorRoute lalu klik jalur sidebar.
//
// RUN PERTAMA = ALAT VERIFIKASI. Blok S-00 memverifikasi asumsi paling rapuh
// di modul ini: apakah jalur sidebar benar dan dialognya memang terbuka.
// Kalau S-00 merah, blok lain tidak ada artinya.
//
// BLOK UPLOAD SENGAJA DI-SKIP: file uji tanda tangan BELUM ada di repo kita.
// Kita tidak menyalin file dari repo qa-cazh. Siapkan sendiri di
// cypress/fixtures/signature/ (PNG/JPG/JPEG valid, satu file >2MB, satu .pdf),
// isi fixture blok `upload`, lalu hapus .skip-nya.

import Legalitas from '../../../../../support/pageobjects/LegalitasBuktiBayarPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';

describe('Legalitas Bukti Bayar — LGL', () => {
  let d;

  before(() => {
    cy.fixture('legalitas_bukti_bayar').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Legalitas.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak: jalur sidebar & dialog
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-LGL-001 | Happy | Dialog terbuka lewat jalur sidebar', () => {
      Legalitas.open();
      Legalitas.assertDialogOpen();
    });

    it('TC-LGL-002 | Happy | Field Instansi ada di dialog', () => {
      Legalitas.open();
      Legalitas.elements.fieldItem('instansi').should('exist');
    });

    it('TC-LGL-003 | Happy | Dialog bisa ditutup', () => {
      Legalitas.open().close();
      Legalitas.assertDialogClosed();
    });
  });

  // ==========================================================================
  // S-01 — Pemilihan instansi & switch
  // ==========================================================================
  describe('S-01 — Instansi & switch aktif', () => {
    it('TC-LGL-010 | Happy | Pilih instansi memuat konfigurasi legalitasnya', () => {
      Legalitas.open().select('instansi', d.instansi.primary);
      Legalitas.elements.selectValue('instansi').should('contain.text', d.instansi.primary);
    });

    it('TC-LGL-011 | Positif | Switch ON memunculkan sub-field', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(true);
      Legalitas.assertSubFieldsVisible();
    });

    it('TC-LGL-012 | Positif | Switch OFF menyembunyikan sub-field', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(false);
      Legalitas.assertSubFieldsHidden();
    });
  });

  // ==========================================================================
  // S-02 — Form & validasi
  // ==========================================================================
  describe('S-02 — Form & validasi', () => {
    it('TC-LGL-020 | Happy | Isi form lengkap lalu simpan', () => {
      Legalitas.open().isi({
        instansi: d.instansi.primary,
        pengesahan: d.validForm.pengesahan,
        jabatan: d.validForm.jabatan,
        namaTerang: d.validForm.namaTerang,
      }).save();
      Legalitas.assertNotSilent();
    });

    it('TC-LGL-021 | Negatif | Simpan dengan sub-field kosong -> FE tidak boleh diam', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(true);
      Legalitas.fillForm({ pengesahan: '', jabatan: '', namaTerang: '' }).save();
      Legalitas.assertNotSilent();
    });

    it('TC-LGL-022 | Happy | Konfigurasi persist setelah dialog dibuka ulang', () => {
      Legalitas.open().isi({
        instansi: d.instansi.primary,
        pengesahan: d.validForm.pengesahan,
        jabatan: d.validForm.jabatan,
        namaTerang: d.validForm.namaTerang,
      }).save();
      // Untuk modul modal-dari-sidebar, "reload" = tutup lalu buka lagi.
      Legalitas.assertPersisted({
        pengesahan: d.validForm.pengesahan,
        jabatan: d.validForm.jabatan,
        namaTerang: d.validForm.namaTerang,
      });
    });
  });

  // ==========================================================================
  // S-03 — Upload tanda tangan
  // SKIP: file uji belum disiapkan. Lihat header spec.
  // ==========================================================================
  describe.skip('S-03 — Upload tanda tangan (butuh file uji)', () => {
    it('TC-LGL-030 | Happy | Upload PNG valid diterima', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(true)
        .uploadTandaTangan(d.upload.validPng);
      Legalitas.assertNotSilent();
    });

    it('TC-LGL-031 | Negatif | File melebihi batas ukuran ditolak', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(true)
        .uploadTandaTangan(d.upload.largeFile);
      Legalitas.assertErrorToast();
    });

    it('TC-LGL-032 | Negatif | Tipe file tidak didukung ditolak', () => {
      Legalitas.open().select('instansi', d.instansi.primary).aktifkan(true)
        .uploadTandaTangan(d.upload.invalidType);
      Legalitas.assertErrorToast();
    });
  });
});
