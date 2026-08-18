// Utility spec (BUKAN test case): bersihin SEMUA data Jenis Tagihan berprefix "QA".
//
// ⚠️ TARGET = PRODUCTION (https://v3.cazh.id). Spec ini MENGHAPUS data nyata.
// Proteksi yang dipasang biar aman di prod:
//   1. Hanya baris yang kolom NAMA-nya diawali "QA" (pakai d.columns.nama),
//      BUKAN pencocokan di seluruh baris — data prod asli tidak akan tersentuh
//      selama namanya tidak diawali "QA".
//   2. Ada cap MAX_DELETE biar tidak runaway.
//   3. Sinyal selesai per-hapus = baris hilang dari DOM (deterministik), tanpa
//      cy.wait(angka).
//
// Tujuan: menyapu data sisa rerun spec Tambah/Edit/Hapus. Endpoint yang disentuh:
//   DELETE **/api/proxy-banking/bill-types/{id}
// Jalankan MANUAL saat perlu; rerun kalau masih ada sisa (lihat log "Total terhapus").
//
// Run: npx cypress run --spec "cypress/e2e/stagingv3/cleanup/cleanupjenistagihan.cy.js"

import jenisTagihan from '../../../support/pageobjects/JenisTagihanPage';
import login from '../../../support/pageobjects/LoginPage';

const PREFIX = 'QA';
const MAX_DELETE = 400; // safety cap

describe('Cleanup — hapus semua data Jenis Tagihan berprefix QA', () => {
  let d;

  before(() => {
    cy.fixture('jenis_tagihan').then((data) => {
      d = data;
    });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    jenisTagihan.withTimeouts(d.timeouts).visit();
  });

  it('hapus semua Jenis Tagihan QA (semua instansi)', () => {
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

        // Ambil teks nama persis untuk dipakai sebagai anchor hapus + verifikasi hilang.
        const nama = target.querySelectorAll('td')[d.columns.nama].textContent.trim();

        // deleteByText (POM): klik trash by-icon -> dialog konfirmasi -> klik "Hapus" -> dialog tertutup.
        jenisTagihan.deleteByText(nama);

        // Deterministik: baris benar-benar hilang dari list sebelum lanjut (tanpa jeda angka).
        cy.contains('table tbody tr', nama).should('not.exist');

        deleted += 1;
        purge();
      });
    };

    purge();
  });
});
