// Utility spec (BUKAN test case): bersihin SEMUA data Kelas berprefix "QA" (semua instansi).
// Tujuan: ngurangin data bloat yg bikin page berat & test flaky.
// Cara: loop -> cari row pertama yg nama Kelas-nya diawali "QA" -> klik trash -> konfirmasi "Hapus" -> ulang.
// Catatan: data QA selalu yg terbaru (paling atas), jadi loop di page 1 cukup sampai habis.
// Jalankan manual saat perlu. Bisa makan waktu kalau data ratusan; ada cap MAX_DELETE biar ga runaway.

const kelasPage = require('../../../support/pageobjects/KelasPage');

const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const PREFIX = 'QA';
const MAX_DELETE = 400; // safety cap; rerun kalau masih ada sisa

describe('Cleanup — hapus semua data Kelas berprefix QA', () => {
  let data;
  const listUrl = () => `${data.urls.base}${data.urls.kelasList}`;

  before(() => {
    cy.fixture('kelas').then((d) => { data = d; });
  });

  beforeEach(() => {
    cy.session('admin-cazh-session', () => {
      cy.visit(`${data.urls.base}${data.urls.login}`);
      cy.get('input[type="email"], input[name="email"]').first().type(data.credentials.email);
      cy.get('input[type="password"], input[name="password"]').first()
        .type(data.credentials.password, { log: false });
      cy.contains('button', /masuk|login|sign in/i).click();
      cy.location('pathname', { timeout: data.timeouts.dialog }).should('not.include', data.urls.login);
    });
    kelasPage.visit(listUrl());
  });

  it('hapus semua kelas QA (semua instansi)', () => {
    let deleted = 0;

    const purge = () => {
      if (deleted >= MAX_DELETE) {
        cy.log(`Cap ${MAX_DELETE} tercapai. Jalankan ulang spec ini kalau masih ada data QA.`);
        return;
      }
      cy.get('body').then(($b) => {
        const rows = Array.from($b.find('table tbody tr'));
        const target = rows.find((tr) => {
          const cell = tr.querySelectorAll('td')[data.columns.nama];
          return cell && cell.textContent.trim().startsWith(PREFIX);
        });
        if (!target) {
          cy.log(`Selesai — tidak ada lagi row QA. Total terhapus: ${deleted}`);
          return;
        }
        // klik trash lewat icon-nya (anti salah tombol)
        cy.wrap(target).find('svg.lucide-trash').closest('button').click();
        // popup konfirmasi -> klik "Hapus"
        cy.get(DIALOG, { timeout: data.timeouts.dialog }).should('be.visible')
          .contains('button', 'Hapus').click();
        cy.get('[data-slot="dialog-content"]').should('not.exist'); // dialog ketutup = sukses
        cy.wait(data.timeouts.shortAction);                          // settle refetch list
        deleted += 1;
        purge();                                                     // lanjut row berikutnya
      });
    };

    cy.wait(data.timeouts.searchDebounce); // hydrate awal page (berat) sebelum klik pertama
    purge();
  });
});