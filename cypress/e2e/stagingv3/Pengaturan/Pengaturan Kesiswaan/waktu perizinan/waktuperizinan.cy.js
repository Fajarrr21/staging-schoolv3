// Spec Waktu Perizinan — WPZ
// POM: cypress/support/pageobjects/WaktuPerizinanPage.js
// Fixture: cypress/fixtures/waktu_perizinan.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// BENTUK MODUL: modal-dari-sidebar (tidak punya route sendiri).
//
// POLA BARU BUAT KITA: input jam React Aria — [data-slot="datefield"] dengan
// segmen terpisah [data-type="hour"] & [data-type="minute"]. BUKAN
// <input type="time">, jadi tidak bisa .clear().type('09:00').
// Penanganannya di SidebarModalPage.fillTime().
//
// RUN PERTAMA = ALAT VERIFIKASI. Dua asumsi paling rapuh di modul ini:
//   (1) jalur sidebar benar -> diuji di S-00
//   (2) input jam memang React Aria per-segmen -> diuji di TC-WPZ-020.
//       Kalau TC-020 gagal dengan "element not found" pada [data-type=hour],
//       berarti field jamnya BUKAN React Aria — ganti tipe field di config POM.
//
// TC-WPZ-022 (perilaku jam tidak valid) sengaja TIDAK meng-assert hasil
// tertentu: belum diketahui app menolaknya atau auto-cap ke 23:59. Yang
// di-assert cuma "app tidak boleh menerima 25 sebagai jam" — itu benar di
// kedua kemungkinan.

import Perizinan from '../../../../../support/pageobjects/WaktuPerizinanPage';
import LoginPage from '../../../../../support/pageobjects/LoginPage';

describe('Waktu Perizinan — WPZ', () => {
  let d;

  before(() => {
    cy.fixture('waktu_perizinan').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Perizinan.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-WPZ-001 | Happy | Dialog terbuka lewat jalur sidebar', () => {
      Perizinan.open();
      Perizinan.assertDialogOpen();
    });

    it('TC-WPZ-002 | Happy | Field Instansi & switch batas ada', () => {
      Perizinan.open();
      Perizinan.elements.fieldItem('instansi').should('exist');
      Perizinan.elements.switch('batasAktif').should('exist');
    });
  });

  // ==========================================================================
  // S-01 — Switch & conditional rendering
  // ==========================================================================
  describe('S-01 — Switch batas waktu', () => {
    it('TC-WPZ-010 | Happy | Switch ON memunculkan field jam', () => {
      Perizinan.open().bukaInstansi(d.instansi.primary).aktifkanBatas(true);
      Perizinan.assertJamVisible();
    });

    it('TC-WPZ-011 | Positif | Switch OFF menyembunyikan field jam', () => {
      Perizinan.open().bukaInstansi(d.instansi.primary).aktifkanBatas(false);
      Perizinan.assertJamHidden();
    });
  });

  // ==========================================================================
  // S-02 — Input jam (React Aria)
  // ==========================================================================
  describe('S-02 — Input jam', () => {
    it('TC-WPZ-020 | Happy | Jam valid terisi sesuai input', () => {
      Perizinan.open().atur({
        instansi: d.instansi.primary,
        aktif: true,
        jam: d.testData.validTime,
      });
      Perizinan.assertTime('batasJam', d.testData.validTime);
    });

    it('TC-WPZ-021 | Happy | Jam tersimpan & persist setelah dialog dibuka ulang', () => {
      Perizinan.open().atur({
        instansi: d.instansi.primary,
        aktif: true,
        jam: d.testData.validTime,
      }).save();
      Perizinan.assertPersisted({ batasJam: d.testData.validTime });
    });

    it('TC-WPZ-022 | Negatif | Jam di luar rentang 24 jam tidak diterima apa adanya', () => {
      const [hhInvalid] = d.testData.invalidTime.split(':');
      Perizinan.open().bukaInstansi(d.instansi.primary).aktifkanBatas(true)
        .setJam(d.testData.invalidTime);
      // Belum diketahui app menolak atau auto-cap. Yang pasti salah adalah
      // kalau segmen jam benar-benar berisi "25".
      Perizinan.elements.timeSegment('batasJam', 'hour')
        .should('not.have.text', hhInvalid);
    });
  });

  // ==========================================================================
  // S-03 — Independensi antar instansi
  // ==========================================================================
  describe('S-03 — Multi instansi', () => {
    it('TC-WPZ-030 | Edge | Ubah instansi A tidak mengubah instansi B', () => {
      // Set instansi A
      Perizinan.open().atur({
        instansi: d.instansi.primary,
        aktif: true,
        jam: d.testData.validTime,
      }).save();

      // Pindah ke instansi B — konfigurasinya harus berdiri sendiri
      Perizinan.close();
      Perizinan.open().bukaInstansi(d.instansi.secondary);
      Perizinan.elements.selectValue('instansi').should('contain.text', d.instansi.secondary);

      // Balik ke A, nilainya harus tetap seperti yang disimpan
      Perizinan.bukaInstansi(d.instansi.primary);
      Perizinan.assertTime('batasJam', d.testData.validTime);
    });
  });
});
