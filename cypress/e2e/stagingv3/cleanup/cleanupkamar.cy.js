// Utility spec (BUKAN test case): bersihin SEMUA data Kamar berprefix "QA" (semua instansi).
// Tujuan: ngurangin data bloat dari rerun spec Tambah/Edit/Hapus yg bikin list berat & flaky.
// Cara: loop -> cari row pertama yg nama Kamar-nya diawali "QA" -> klik trash -> konfirmasi "Hapus" -> ulang.
// Jalankan manual saat perlu. Ada cap MAX_DELETE biar ga runaway; rerun kalau masih ada sisa.

import kamar from '../../../support/pageobjects/KamarPage';
import login from '../../../support/pageobjects/LoginPage';

const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const PREFIX = 'QA';
const MAX_DELETE = 400; // safety cap

describe('Cleanup — hapus semua data Kamar berprefix QA', () => {
  let d;

  before(() => { cy.fixture('kamar').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kamar.visit();
  });

  it('hapus semua kamar QA (semua instansi)', () => {
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
        // klik trash lewat icon-nya (anti salah tombol)
        cy.wrap(target).find('svg.lucide-trash').closest('button').click();
        // popup konfirmasi -> klik "Hapus" (filter exact match biar nggak nyangkut ke "Hapus Kamar" di title)
        cy.get(DIALOG, { timeout: d.timeouts.dialog }).should('be.visible')
          .find('[data-slot="dialog-footer"] [data-slot="button"]')
          .contains(/^\s*Hapus\s*$/).click();
        cy.get('[data-slot="dialog-content"]').should('not.exist'); // dialog ketutup = sukses
        cy.wait(d.timeouts.shortAction);                            // settle refetch list
        deleted += 1;
        purge();                                                    // lanjut row berikutnya
      });
    };

    cy.wait(d.timeouts.searchDebounce); // hydrate awal page sebelum klik pertama
    purge();
  });
});
