// Utility spec (BUKAN test case): bersihin SEMUA data Tag berprefix "QA" (semua instansi).
// Tujuan: ngurangin data bloat dari rerun spec Tambah/Edit/Hapus yg bikin list berat & flaky.
// Cara: loop -> cari row pertama yg Nama Tag-nya diawali "QA" -> klik trash -> konfirmasi "Hapus" -> ulang.
// Jalankan manual saat perlu. Ada cap MAX_DELETE biar ga runaway; rerun kalau masih ada sisa.
//
// Pola mengikuti cleanupjurusan.cy.js. Aman karena modul Tag memang memakai
// konvensi rerun-safe QA<6digit-ts><seq> (fixture: testData.prefix = "QA"),
// jadi tidak ada risiko kena data asli.

import tag from '../../../support/pageobjects/TagPage';
import login from '../../../support/pageobjects/LoginPage';

const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const MAX_DELETE = 400; // safety cap

describe('Cleanup — hapus semua data Tag berprefix QA', () => {
  let d;

  before(() => { cy.fixture('tag').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    tag.visit();
  });

  it('hapus semua tag QA (semua instansi)', () => {
    const PREFIX = d.testData.prefix;
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
        cy.wrap(target).find('svg.lucide-trash').closest('button').click({ force: true });
        // popup konfirmasi -> klik "Hapus"
        cy.get(DIALOG, { timeout: d.timeouts.dialog }).should('be.visible')
          .contains('button', /^\s*Hapus\s*$/).click({ force: true });
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
