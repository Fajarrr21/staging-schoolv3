// Utility spec (BUKAN test case): bersihin SEMUA data Kategori Pengumuman yang
// kolom NAMA-nya diawali "QA".
//
// ⚠️ TARGET = PRODUCTION (https://v3.cazh.id). Spec ini MENGHAPUS data nyata.
// Proteksi biar aman di prod:
//   1. Hanya baris yang kolom NAMA-nya (d.columns.nama = 0) diawali "QA" — data
//      prod asli tidak tersentuh selama namanya tidak diawali "QA".
//   2. Cap MAX_DELETE biar tidak runaway.
//   3. Setiap habis hapus, RELOAD list penuh (visit) sebelum scan berikutnya —
//      deterministik, tanpa cy.wait(angka). (Modul ini menolak duplikat, jadi
//      nama QA unik; reload tetap dipakai biar konsisten & aman.)
//
// Modul GLOBAL (tanpa instansi). Jalankan MANUAL.
// Endpoint: DELETE **/api/proxy/announcement-categories/{id}.
// Run: npx cypress run --spec "cypress/e2e/stagingv3/cleanup/cleanupkategoripengumuman.cy.js" --env environment=production

import kategoriPengumuman from '../../../support/pageobjects/KategoriPengumumanPage';
import login from '../../../support/pageobjects/LoginPage';

const PREFIX = 'QA';
const MAX_DELETE = 400; // safety cap

describe('Cleanup — hapus semua data Kategori Pengumuman berprefix QA', () => {
  let d;

  before(() => {
    cy.fixture('kategori_pengumuman').then((data) => {
      d = data;
    });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kategoriPengumuman.withTimeouts(d.timeouts).visit();
  });

  it('hapus semua Kategori Pengumuman QA', () => {
    let deleted = 0;

    const purge = () => {
      if (deleted >= MAX_DELETE) {
        cy.log(`Cap ${MAX_DELETE} tercapai. Jalankan ulang spec ini kalau masih ada data QA.`);
        return;
      }
      cy.get('body').then(($b) => {
        const rows = Array.from($b.find('table tbody tr'));
        const target = rows.find((tr) => {
          const cell = tr.querySelectorAll('td')[d.columns.nama];
          return cell && cell.textContent.trim().startsWith(PREFIX);
        });

        if (!target) {
          cy.log(`Selesai — tidak ada lagi row QA. Total terhapus: ${deleted}`);
          return;
        }

        const nama = target.querySelectorAll('td')[d.columns.nama].textContent.trim();

        // deleteByText: klik trash by-icon -> dialog konfirmasi -> "Hapus" -> dialog tertutup.
        kategoriPengumuman.deleteByText(nama);
        // Reload list penuh sebelum scan lagi.
        kategoriPengumuman.visit();

        deleted += 1;
        purge();
      });
    };

    purge();
  });
});
