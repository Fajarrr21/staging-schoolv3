// Utility spec (BUKAN test case): bersihin data Jadwal Pelajaran yg dibuat oleh test run terakhir.
// Strategy: filter kolom "Dibuat Pada" (index 8) dalam window `cleanup.windowMinutes` menit terakhir.
// Kenapa: modul ini tidak punya field text bebas (semua Select) -> gak bisa filter prefix "QA".
// Assumption (per user): staging jarang ada create manual di window ini, jadi risiko hapus data legit minim.
//
// Cara: loop -> cari row pertama yg tanggal "Dibuat Pada" masuk window recent -> klik dropdown Aksi
//       -> klik "Hapus" -> konfirmasi "Hapus" di dialog -> ulang.
// Jalankan manual saat perlu. Cap MAX_DELETE biar ga runaway; rerun kalau masih ada sisa.

import login from '../../../support/pageobjects/LoginPage';
import jp from '../../../support/pageobjects/JadwalPelajaranPage';

const DIALOG = '[data-slot="dialog-content"][role="dialog"]';

// Parse Indonesian short date-time format: "Sabtu, 04 Jul 2026 14:48"
const parseIdDate = (str) => {
  if (!str) return null;
  const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
    Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
  };
  const mm = monthMap[m[2]];
  if (mm === undefined) return null;
  return new Date(+m[3], mm, +m[1], +m[4], +m[5]);
};

describe('Cleanup — hapus jadwal pelajaran yg dibuat dalam window recent', () => {
  let d;

  before(() => { cy.fixture('jadwal_pelajaran').then((data) => { d = data; }); });

  beforeEach(() => {
    login.loginViaSession(
      d.credentials.email,
      d.credentials.password,
      d.urls.base,
      d.urls.login
    );
    jp.visit();
  });

  it('hapus semua jadwal Dibuat Pada <= windowMinutes menit yg lalu', () => {
    const WINDOW_MS = d.cleanup.windowMinutes * 60 * 1000;
    const MAX_DELETE = d.cleanup.maxDelete;
    const CREATED_COL = d.columns.createdAt; // index 8
    let deleted = 0;
    let debugPrinted = false;

    const purge = () => {
      if (deleted >= MAX_DELETE) {
        cy.log(`Cap ${MAX_DELETE} tercapai. Rerun spec kalau masih ada data recent.`);
        return;
      }
      cy.get('body').then(($b) => {
        const now = Date.now();
        const rows = Array.from($b.find('table[data-slot="data-grid-table"] tbody tr'));

        // DEBUG: dump first 3 rows sekali di awal biar keliatan struktur & parsing
        if (!debugPrinted) {
          cy.log(`=== DEBUG: total ${rows.length} row(s) di list ===`);
          rows.slice(0, 3).forEach((tr, i) => {
            const tds = tr.querySelectorAll('td');
            const instansi = tds[0] ? tds[0].textContent.trim() : '(kosong)';
            const kelas = tds[4] ? tds[4].textContent.trim() : '(kosong)';
            const created = tds[CREATED_COL] ? tds[CREATED_COL].textContent.trim() : '(kosong)';
            const parsed = parseIdDate(created);
            const diffMin = parsed ? Math.floor((now - parsed.getTime()) / 60000) : 'unparseable';
            cy.log(`Row ${i}: instansi="${instansi}" | kelas="${kelas}" | createdAt="${created}" | diff=${diffMin} min`);
          });
          cy.log(`Window filter: <= ${d.cleanup.windowMinutes} min`);
          debugPrinted = true;
        }

        const target = rows.find((tr) => {
          const tds = tr.querySelectorAll('td');
          const created = tds[CREATED_COL] ? tds[CREATED_COL].textContent.trim() : '';
          const parsed = parseIdDate(created);
          return parsed && (now - parsed.getTime() <= WINDOW_MS);
        });
        if (!target) {
          cy.log(`Selesai — tidak ada row Dibuat Pada dalam ${d.cleanup.windowMinutes} menit terakhir. Total terhapus: ${deleted}`);
          return;
        }
        // Klik dropdown Aksi (ellipsis vertical) di row target
        cy.wrap(target).find('svg.lucide-ellipsis-vertical').closest('button').click();
        // Klik item "Hapus" di dropdown menu
        cy.contains('[data-slot="dropdown-menu-item"]', /^\s*Hapus\s*$/, { timeout: d.timeouts.dropdown })
          .should('be.visible')
          .click({ force: true });
        // Konfirmasi dialog "Hapus"
        cy.get(DIALOG, { timeout: d.timeouts.dialog }).should('be.visible')
          .contains('button', /^\s*Hapus\s*$/)
          .click();
        cy.get('[data-slot="dialog-content"]').should('not.exist'); // dialog tertutup
        cy.wait(d.timeouts.shortAction); // settle refetch list
        deleted += 1;
        purge(); // lanjut row berikutnya
      });
    };

    cy.wait(d.timeouts.searchDebounce); // hydrate awal page sebelum klik pertama
    purge();
  });
});
