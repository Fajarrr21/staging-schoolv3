// helpers.js — utilitas murni (tanpa state) yang dipakai lintas POM.
//
// Dibangun sendiri mengikuti konvensi repo ini (lihat TagPage.js sebagai rujukan),
// BUKAN salinan dari repo qa-cazh. Yang kita ambil dari sana hanya informasi
// *apa* yang ada di app, bukan *bagaimana* menulis test-nya.
//
// Semua fungsi di sini deterministik & bebas efek samping supaya gampang dipakai
// di dalam .should(callback) yang sinkron.

/** Selector dialog shadcn/Radix — dipakai sebagai scope hampir semua form. */
export const DIALOG = '[data-slot="dialog-content"][role="dialog"]';

/** Dialog yang benar-benar terbuka (Radix menyisakan node saat animasi close). */
export const DIALOG_OPEN = `${DIALOG}[data-state="open"]`;

/**
 * Regex exact-match untuk opsi Radix.
 * Wajib dipakai saat memilih opsi select: tanpa ini "Aktif" ikut match "Tidak Aktif",
 * dan "Sekolah Alam" ikut match "Sekolah Alam Raya".
 */
export const rx = (text) =>
  new RegExp(`^\\s*${String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

/**
 * Cari [data-slot="form-item"] berdasarkan teks label-nya, di dalam scope tertentu.
 * Label-scoped: field dicari lewat label, bukan posisi — supaya tahan urutan field digeser.
 */
export const formItem = (label, scope = DIALOG) =>
  cy.contains(`${scope} [data-slot="form-label"]`, label).closest('[data-slot="form-item"]');

/**
 * Generator nama rerun-safe: QA<6 digit terakhir timestamp><seq 2 digit>.
 * Contoh: QA48211203. Pakai satu instance per spec supaya seq tidak tabrakan.
 *
 *   const uniq = makeUniq(data.testData.prefix)
 *   uniq()  // QA48211201
 *   uniq()  // QA48211202
 */
export const makeUniq = (prefix = 'QA') => {
  const ts = String(Date.now()).slice(-6);
  let seq = 0;
  return () => `${prefix}${ts}${String(++seq).padStart(2, '0')}`;
};

/**
 * Ambil teks sebuah sel baris secara sinkron. Kalau sel berisi badge, teks badge
 * yang diambil (kolom Status/Tipe), selain itu teks sel apa adanya.
 * Dipakai di dalam .should(callback) — JANGAN pakai .each() + cy.wrap() (detached DOM).
 */
export const cellText = (rowEl, colIdx) => {
  const td = Cypress.$(rowEl).find('td').eq(colIdx);
  const badge = td.find('[data-slot="badge"]').first();
  return (badge.length ? badge.text() : td.text()).trim();
};

/**
 * Default timeout tiap modul. Nilai NYATA harus datang dari fixture (`data.timeouts`)
 * lewat `page.withTimeouts(data.timeouts)` — ini cuma jaring pengaman supaya POM
 * tetap jalan kalau fixture belum lengkap.
 *
 * Catatan FIX-001: angka di sini BUKAN pengganti cy.intercept. Urutan preferensi
 * tetap: intercept + wait('@alias')  >  assertion elemen  >  jeda angka.
 */
export const DEFAULT_TIMEOUTS = {
  dialog: 15000,   // dialog mount / unmount
  table: 15000,    // tabel list muncul
  dropdown: 8000,  // opsi Radix ter-mount di portal
  toast: 12000,    // sonner toast muncul
  api: 15000,      // response XHR (dipakai cy.wait('@alias'))
};
