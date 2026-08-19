// commands.js — custom command shared lintas modul.
//
// =========================================================================
// STATUS BADGE — komponen shared (semua tabel yang punya kolom Status)
// =========================================================================
// Badge status identik di semua modul (Radix/shadcn):
//   <span data-slot="badge" class="...(warna britel)...">
//     <span data-slot="badge-dot"></span>
//     <p>Aktif</p>            // atau "Tidak Aktif"
//   </span>
//
// Yang STABIL untuk assert = teks di <p> ("Aktif" / "Tidak Aktif").
// Class warna (CSS var panjang) BRITEL — jangan dipakai assert kecuali terpaksa.
//
// SELALU scope ke kolom Status via nth-child (1-based = index 0-based + 1),
// JANGAN pakai '[data-slot="badge"] p' global (bisa nyangkut chip nama/lain).
//
// Peta kolom Status (0-based) per modul:
//   Pengingat Tagihan = 4 | Jenis Tagihan = 4 | Jenis Guru = 2 | Jenis Staff = 2
//   Kategori Inventaris = (tidak ada) | Tipe Pelanggaran = (belum dipetakan)
// Modul baru yang punya kolom Status: daftarkan index-nya di fixture (columns.status)
// lalu pakai command yang sama — tidak perlu selector baru.
//
// Nilai status yang mungkin sejauh ini: "Aktif" (hijau) & "Tidak Aktif" (abu).
// Kalau nemu nilai ketiga di modul lain, tambahkan ke catatan ini.

/** Selector <p> teks badge di kolom Status baris tertentu. */
const statusCellSelector = (statusCol) =>
  `td:nth-child(${statusCol + 1}) [data-slot="badge"] p`;

/**
 * Ambil teks status 1 baris (ter-trim).
 * @param {number} rowIndex 0-based index baris di tbody
 * @param {number} statusCol 0-based index kolom Status (dari fixture columns.status)
 * @returns {Cypress.Chainable<string>}
 */
Cypress.Commands.add('rowStatus', (rowIndex, statusCol) =>
  cy
    .get('tbody tr')
    .eq(rowIndex)
    .find(statusCellSelector(statusCol))
    .invoke('text')
    .then((t) => t.trim()),
);

/**
 * Assert status 1 baris tepat sama dengan nilai yang diharapkan.
 * @param {number} rowIndex 0-based index baris
 * @param {number} statusCol 0-based index kolom Status
 * @param {string} expected 'Aktif' | 'Tidak Aktif'
 */
Cypress.Commands.add('assertRowStatus', (rowIndex, statusCol, expected) => {
  cy.get('tbody tr')
    .eq(rowIndex)
    .find(statusCellSelector(statusCol))
    .should('have.text', expected);
});
