// Utility spec (BUKAN test case): bersihin SEMUA data Pengingat Tagihan yang
// kolom PESAN-nya diawali "QA".
//
// ⚠️ TARGET = PRODUCTION (https://v3.cazh.id). Spec ini MENGHAPUS data nyata.
// Proteksi biar aman di prod:
//   1. Hanya baris yang kolom PESAN-nya (d.columns.pesan = 2) diawali "QA".
//      Pengingat Tagihan TIDAK punya kolom judul/nama, jadi identitas data QA
//      ditaruh di field Pesan — kolom itulah yang di-scope di sini. Data prod
//      asli tidak tersentuh selama pesannya tidak diawali "QA".
//   2. Cap MAX_DELETE biar tidak runaway.
//   3. Setiap habis hapus, RELOAD list penuh (visit) sebelum scan berikutnya —
//      deterministik, tanpa cy.wait(angka).
//
// PRASYARAT: aktif hanya kalau spec create menaruh nama QA rerun-safe di field
// PESAN (lihat catatan di pengingattagihan.cy.js). Selama create belum ditulis,
// spec ini jalan tapi tidak menemukan apa-apa (aman).
//
// Jalankan MANUAL.
// Run: npx cypress run --spec "cypress/e2e/stagingv3/cleanup/cleanuppengingattagihan.cy.js" --env environment=production

import pengingatTagihan from '../../../support/pageobjects/PengingatTagihanPage';
import login from '../../../support/pageobjects/LoginPage';

const PREFIX = 'QA';
const MAX_DELETE = 400; // safety cap

describe('Cleanup — hapus semua Pengingat Tagihan berprefix QA (kolom Pesan)', () => {
  let d;

  before(() => {
    cy.fixture('pengingat_tagihan').then((data) => {
      d = data;
    });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    pengingatTagihan.withTimeouts(d.timeouts).visit();
  });

  it('hapus semua Pengingat Tagihan QA (semua instansi)', () => {
    let deleted = 0;

    const purge = () => {
      if (deleted >= MAX_DELETE) {
        cy.log(`Cap ${MAX_DELETE} tercapai. Jalankan ulang spec ini kalau masih ada data QA.`);
        return;
      }
      cy.get('body').then(($b) => {
        const rows = Array.from($b.find('table tbody tr'));
        const target = rows.find((tr) => {
          const cell = tr.querySelectorAll('td')[d.columns.pesan];
          return cell && cell.textContent.trim().startsWith(PREFIX);
        });

        if (!target) {
          cy.log(`Selesai — tidak ada lagi row QA. Total terhapus: ${deleted}`);
          return;
        }

        const pesan = target.querySelectorAll('td')[d.columns.pesan].textContent.trim();

        // deleteByText: klik trash by-icon -> dialog konfirmasi -> "Hapus" -> dialog tertutup.
        pengingatTagihan.deleteByText(pesan);
        // Reload list penuh (deterministik) sebelum scan lagi.
        pengingatTagihan.visit();

        deleted += 1;
        purge();
      });
    };

    purge();
  });
});
