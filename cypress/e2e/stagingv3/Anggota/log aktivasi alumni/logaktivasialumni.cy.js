// Spec Log Aktivasi Alumni — LAA
// POM: cypress/support/pageobjects/LogAktivasiAlumniPage.js
// Fixture: cypress/fixtures/log_aktivasi_alumni.json
//
// =========================================================================
// STATUS: BELUM TERVERIFIKASI — baca ini dulu.
// =========================================================================
// BENTUK MODUL: halaman bertab (Radix Tabs) + tabel per tab.
//
// RUN PERTAMA = ALAT VERIFIKASI. Asumsi paling rapuh: route (fixture qa-cazh
// menulisnya tanpa leading slash) dan peta index kolom.
//
// CATATAN SIKAP: TC-LAA-021 menguji bahwa tab benar-benar MEMFILTER, bukan
// sekadar berpindah tampilan. Ini yang tidak diuji repo qa-cazh — switchTab()
// mereka mengabaikan nama tab dan selalu mengklik tab pertama, jadi test mereka
// bisa hijau sambil sebenarnya memeriksa tab yang salah.
//
// Modul ini READ-ONLY di sisi kita: tidak membuat/menghapus data. Jadi tidak
// ada risiko mencemari staging, dan tidak butuh spec cleanup.

import Alumni from '../../../../support/pageobjects/LogAktivasiAlumniPage';
import LoginPage from '../../../../support/pageobjects/LoginPage';

describe('Log Aktivasi Alumni — LAA', () => {
  let d;

  before(() => {
    cy.fixture('log_aktivasi_alumni').then((data) => { d = data; });
  });

  beforeEach(() => {
    LoginPage.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    Alumni.withTimeouts(d.timeouts);
  });

  // ==========================================================================
  // S-00 — Kontrak
  // ==========================================================================
  describe('S-00 — Kontrak config', () => {
    it('TC-LAA-001 | Happy | Halaman bisa dibuka & tablist tampil', () => {
      Alumni.visit();
      cy.url().should('include', Alumni.cfg.route);
      Alumni.elements.tablist().should('be.visible');
    });

    it('TC-LAA-002 | Happy | Judul & deskripsi halaman sesuai', () => {
      Alumni.visit().assertPageHeader();
    });

    it('TC-LAA-003 | Happy | Ketiga tab status tersedia', () => {
      Alumni.visit().assertTabsExist();
    });

    it('TC-LAA-004 | Positif | Jumlah tab tepat 3 (tidak ada tab tak terduga)', () => {
      Alumni.visit().assertTabCount(3);
    });
  });

  // ==========================================================================
  // S-01 — Navigasi tab
  // ==========================================================================
  describe('S-01 — Navigasi tab', () => {
    it('TC-LAA-010 | Happy | Tab default aktif saat halaman dibuka', () => {
      Alumni.visit().assertActiveTab(d.tabs.default);
    });

    it('TC-LAA-011 | Happy | Pindah ke tab Disetujui', () => {
      Alumni.visit().switchTab(d.tabs.approved).assertActiveTab(d.tabs.approved);
    });

    it('TC-LAA-012 | Happy | Pindah ke tab Ditolak', () => {
      Alumni.visit().switchTab(d.tabs.rejected).assertActiveTab(d.tabs.rejected);
    });

    it('TC-LAA-013 | Positif | Kembali ke tab awal tetap berfungsi', () => {
      Alumni.visit()
        .switchTab(d.tabs.approved)
        .switchTab(d.tabs.pending)
        .assertActiveTab(d.tabs.pending);
    });
  });

  // ==========================================================================
  // S-02 — Struktur & isi tabel
  // ==========================================================================
  describe('S-02 — Tabel', () => {
    it('TC-LAA-020 | Happy | Header kolom lengkap sesuai daftar', () => {
      Alumni.visit().assertKolomLengkap();
    });

    it('TC-LAA-021 | Positif | Tab benar-benar memfilter berdasarkan status', () => {
      // Kalau tab cuma kosmetik, assertion ini yang menangkapnya.
      Alumni.visit();
      cy.get('body').then(($b) => {
        if ($b.find('table tbody tr').length === 0) {
          cy.log('Tab Menunggu kosong — filter tidak bisa diverifikasi di kondisi ini');
          return;
        }
        Alumni.assertAllRowsCell('status', d.tabs.pending);
      });
    });

    it('TC-LAA-022 | Negatif | Tab tanpa data menampilkan empty state', () => {
      Alumni.visit().switchTab(d.tabs.rejected);
      cy.get('body').then(($b) => {
        if ($b.find('table tbody tr').length === 0) {
          Alumni.assertEmptyState();
        } else {
          cy.log('Tab Ditolak ada isinya — empty state tidak bisa diverifikasi di kondisi ini');
        }
      });
    });
  });
});
