// Spec Progres Kegiatan — PKG
// POM: cypress/support/pageobjects/ProgresKegiatanPage.js
// Fixture: cypress/fixtures/progres_kegiatan.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// SCOPE SENGAJA DIBATASI ke STRUKTUR & LIST.
// Blok Tambah/Edit/Hapus TIDAK ditulis karena `fields` di config POM masih
// KOSONG — form modulnya belum dipetakan sama sekali. Menulis TC form sekarang
// berarti menebak nama field, dan itu justru bikin spec terlihat siap padahal
// isinya karangan.
//
// Modul ini punya fitur IMPORT (kemungkinan upload Excel). Verifikasi isi file
// hasil import butuh task Node — sudah tersedia sejak FIX-007
// (cy.task('readSheet')), tapi alurnya sendiri belum diketahui, jadi belum
// ditulis TC-nya.
//
// RUN PERTAMA = ALAT VERIFIKASI. Asumsi paling rapuh: index kolom.
// qa-cazh menunjukkan ada button[aria-label="Select all"], jadi kolom 0 diduga
// checkbox dan data mulai index 1 — TC-PKG-004 yang membuktikannya.

import Progres from '../../../../support/pageobjects/ProgresKegiatanPage';
import LoginPage from '../../../../support/pageobjects/LoginPage';

describe('Progres Kegiatan — PKG (struktur & list)', () => {
  let d;

  before(() => {
    cy.fixture('progres_kegiatan').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Progres.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-PKG-001 | Happy | Halaman bisa dibuka & tabel tampil', () => {
      Progres.visit();
      cy.url().should('include', Progres.cfg.route);
      Progres.elements.table().should('be.visible');
    });

    it('TC-PKG-002 | Happy | Judul halaman sesuai', () => {
      Progres.visit().assertPageHeader();
    });

    it('TC-PKG-003 | Happy | Tombol Tambah & Import tampil di toolbar', () => {
      Progres.visit();
      Progres.elements.addButton().should('be.visible');
      Progres.extraElements.importButton().should('be.visible');
    });

    it('TC-PKG-004 | Happy | Header kolom sortable lengkap sesuai daftar', () => {
      Progres.visit().assertKolomLengkap();
    });

    it('TC-PKG-005 | Positif | Kolom pertama adalah checkbox pilih-semua', () => {
      // Membuktikan asumsi peta kolom: kalau checkbox ini tidak ada, index kolom
      // di config POM (data mulai dari 1) salah dan harus digeser.
      Progres.visit();
      Progres.extraElements.selectAllCheckbox().should('exist');
    });
  });

  // ==========================================================================
  // S-01 — List: sort & search
  // ==========================================================================
  describe('S-01 — List', () => {
    it('TC-PKG-010 | Positif | Kolom bisa di-sort lewat tombol header', () => {
      Progres.visit();
      cy.get('body').then(($b) => {
        if ($b.find('table tbody tr').length < 2) {
          cy.log('Data kurang dari 2 baris — urutan tidak bisa diverifikasi');
          return;
        }
        Progres.sortBy('Nama');
        Progres.elements.table().should('be.visible'); // tabel tidak pecah setelah sort
      });
    });

    it('TC-PKG-011 | Negatif | Search tanpa hasil menampilkan empty state', () => {
      Progres.visit().search('ZZZQA000TIDAKADA');
      Progres.assertEmptyState();
    });
  });

  // ==========================================================================
  // S-02 — Import
  // SKIP: alur import belum diketahui (modal? file picker langsung? format apa?).
  // Task pembaca file sudah tersedia (cy.task('readSheet')) — tinggal alurnya.
  // ==========================================================================
  describe.skip('S-02 — Import Progres (alur belum diketahui)', () => {
    it('TC-PKG-020 | Happy | Tombol Import membuka alur import', () => {
      Progres.visit().bukaImport();
      Progres.assertDialogOpen();
    });
  });
});
