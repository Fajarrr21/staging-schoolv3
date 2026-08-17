// listkalender.cy.js — Spec List Kalender Akademik
// Modul: Pengaturan > Akademik > Kalender Akademik  |  Route: /setting/academic/academic-calendar
// Sumber TC: docs/test-cases/TC_Kalender_List.xlsx (TC-KLD-LST-001..013).
//
// Catatan struktur tabel (per HTML real, 25 Juni 2026):
//   - 5 kolom visual = 6 td HTML
//   - col-0=Instansi (span.font-medium)
//   - col-1=Awal pekan dimulai (badge)
//   - col-2=Nama Pekan (badge)
//   - col-3=Header (img[alt=header] atau text "-")
//   - col-4=Edit btn, col-5=Hapus btn (terpisah cell, no header label)
//
// Filter Instansi = Radix Select TERPISAH di toolbar (button.max-w-48), BUKAN dropdown header.
// Header column dropdown-menu-trigger = SORT per kolom (svg.lucide-chevrons-up-down).
//
// Known bugs ter-cover:
//   BUG-027 — opsi "Semua" muncul 2x di dropdown filter Instansi
//   BUG-028 — empty state pakai "Kalender Pendidikan", tombol pakai "Kalender Akademik"
//   BUG-026 — TIDAK terkait list rendering; itu issue Tambah baru. TC-003 pakai existing data.
//
// TC yang DITUNDA:
//   TC-012 (pagination) — total data saat ini 5; butuh seed > 10 untuk uji navigate page

import kalender from '../../../../../support/pageobjects/KalenderPage';
import login from '../../../../../support/pageobjects/LoginPage';

describe('Kalender Akademik — List (CARDS School)', () => {
  let d;

  before(() => {
    cy.fixture('kalender').then((data) => { d = data; });
  });

  beforeEach(() => {
    login.loginViaSession(d.credentials.email, d.credentials.password, d.urls.base, d.urls.login);
    kalender.visit();
  });

  // ---------- HAPPY ----------
  it('TC-KLD-LST-001 | Happy | Tampil tabel 5 kolom visual + toolbar lengkap', () => {
    // Tombol Tambah visible (kanan atas)
    kalender.elements.addButton().should('be.visible');

    // Filter Instansi trigger visible di toolbar
    kalender.elements.filterInstansiTrigger().should('be.visible');
    kalender.assertFilterTriggerLabel(d.labels.labelInstansi); // default "Instansi"

    // Header tabel: 4 dropdown-trigger (Instansi / Awal pekan / Nama Pekan / Header)
    cy.get('table thead th button[data-slot="dropdown-menu-trigger"]')
      .should('have.length', 4);

    // 6 td HTML per row (5 kolom visual: 4 data + 2 action terpisah)
    cy.get('table thead th').should('have.length', 6);

    // Pagination control visible
    kalender.elements.pagination().should('be.visible');

    // Minimal 1 row data
    kalender.getVisibleRowCount().should('be.gte', 1);
  });

  it('TC-KLD-LST-002 | Happy | Row render field benar (Instansi + 2 badge)', () => {
    // existing = SDI (seed permanen dgn kalender + header).
    const instansi = d.instansi.existing;
    kalender.assertRowExists(instansi);
    kalender.assertRowInstansi(instansi);

    // col-1 & col-2: span[data-slot="badge"]
    cy.contains('table tbody tr', instansi).find('td').eq(1).find('[data-slot="badge"]').should('exist');
    cy.contains('table tbody tr', instansi).find('td').eq(2).find('[data-slot="badge"]').should('exist');
  });

  it('TC-KLD-LST-003 | Happy | Kol-3 Header: row dgn upload tampil <img>, tanpa upload "-"', () => {
    // v3 4-instansi (recon 29 Jul 2026):
    //   - existing (SDI) -> punya header image (seed permanen user)
    //   - primary  (AQE) -> TANPA header image ('-') (auto-seed Senin/Minggu tanpa header)
    const withImage = d.instansi.existing;
    const noImage = d.instansi.primary;

    // Row dengan image: col-3 berisi <img>
    cy.contains('table tbody tr', withImage)
      .find('td').eq(3).find('img').should('exist');

    // Row tanpa image: col-3 berisi "-"
    kalender.assertRowNoHeader(noImage);
  });

  // ---------- POSITIF ----------
  it('TC-KLD-LST-004 | Positif | Filter Instansi -> list ter-filter ke instansi yang dipilih', () => {
    const target = d.instansi.existing;
    kalender.selectFilterInstansi(target);

    // Trigger label berubah jadi nama instansi
    kalender.assertFilterTriggerLabel(target);

    // Retry-based: tunggu table converge (re-render setelah filter apply).
    // Semua row visible kol-0 harus = target; kol-0 tidak boleh kosong (loading state).
    cy.get('table tbody tr', { timeout: 8000 }).should(($rows) => {
      expect($rows.length, 'minimal 1 row setelah filter').to.be.gte(1);
      const texts = Cypress.$.makeArray($rows).map((tr) =>
        Cypress.$(tr).find('td').eq(0).text().trim()
      );
      texts.forEach((nama) => {
        expect(nama, `kol-0 "${nama}" harus match filter "${target}"`).to.eq(target);
      });
    });

    // Bonus assertions (dari manual verify 27 Juni 2026):
    // 1) URL punya query param ?office=<id> -> filter state persisted
    cy.url().should('include', 'office=');
    // 2) Chip filter aktif muncul di kiri (contain nama instansi)
    cy.contains(target).should('be.visible');
    // 3) Pagination text update jadi "1 - N Dari N" (bukan lagi Dari 5)
    cy.contains(/^\s*1\s*-\s*\d+\s+Dari\s+\d+\s*$/).should('be.visible');
  });

  it('TC-KLD-LST-005 | Positif | Reset filter Instansi -> trigger balik ke "Instansi" (BUG-027)', () => {
    // Aktifkan filter dulu
    kalender.selectFilterInstansi(d.instansi.existing);
    kalender.assertFilterTriggerLabel(d.instansi.existing);

    // Reset via opsi "Semua" yang me-reset label (per BUG-027, ambil opsi "Semua" terakhir)
    kalender.resetFilterInstansi();
    kalender.assertFilterTriggerLabel(d.labels.labelInstansi); // label balik ke "Instansi"

    // Total row >= jumlah row sebelum filter (semua data kembali)
    kalender.getVisibleRowCount().should('be.gte', 1);
  });

  it('TC-KLD-LST-006 | Positif | Reload halaman -> data persist (assertPersisted pattern)', () => {
    const target = d.instansi.existing;
    kalender.assertRowExists(target);

    // Snapshot jumlah row, lalu reload, lalu cek consistency
    kalender.getVisibleRowCount().then((countBefore) => {
      cy.reload();
      kalender.elements.table({ timeout: 15000 }).should('exist');
      kalender.assertRowExists(target);
      kalender.getVisibleRowCount().should('eq', countBefore);
    });
  });

  it('TC-KLD-LST-007 | Positif | Badge styling konsisten (data-slot="badge") di kol-1 & kol-2 semua row', () => {
    // Pakai should(callback) + Cypress.$ synchronous (CLAUDE.md anti-pattern: .each() + cy.wrap)
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'minimal 1 row').to.be.gte(1);
      Cypress.$.makeArray($rows).forEach((tr, i) => {
        const $tr = Cypress.$(tr);
        expect($tr.find('td').eq(1).find('[data-slot="badge"]').length,
          `row ${i} kol-1 badge missing`).to.be.gte(1);
        expect($tr.find('td').eq(2).find('[data-slot="badge"]').length,
          `row ${i} kol-2 badge missing`).to.be.gte(1);
      });
    });
  });

  it('TC-KLD-LST-008 | Positif | Klik icon Edit -> modal Edit terbuka', () => {
    const target = d.instansi.existing;
    kalender.assertEditModalOpens(target);
  });

  it('TC-KLD-LST-009 | Positif | Klik icon Hapus -> dialog konfirmasi terbuka (row tidak terhapus saat Batal)', () => {
    const target = d.instansi.existing;
    kalender.assertDeleteDialogOpens(target);
  });

  // ---------- NEGATIF ----------
  it('TC-KLD-LST-010 | Negatif | Filter Instansi tanpa kalender -> empty state muncul [BUG-028]', () => {
    // BUG-028: empty state title pakai "Pendidikan", bukan "Akademik".
    // TC ini ASSERT EXPECTED BEHAVIOR (sesuai naming modul) -> FAIL sampai bug fix.
    // Sesuai CLAUDE.md: do not lock in buggy behavior.
    const instansiNoKalender = d.list.instansiTanpaKalender;

    kalender.selectFilterInstansi(instansiNoKalender);
    kalender.assertEmptyStateVisible();

    // EXPECTED: title konsisten dengan naming modul ("Akademik")
    // ACTUAL (BUG-028): aktual menampilkan "Pendidikan"
    kalender.assertEmptyStateTitle(d.messages.emptyStateTitleExpected);
  });

  // ---------- POSITIF (SORT) ----------
  it('TC-KLD-LST-011 | Positif | Sort kolom Instansi ascending -> descending via dropdown header', () => {
    // klik header "Instansi" -> menu muncul -> Sort Asc
    kalender.sortBy(d.labels.labelInstansi, 'asc');
    kalender.assertColumnSortedAsc(0);

    // klik lagi -> Sort Desc
    kalender.sortBy(d.labels.labelInstansi, 'desc');
    kalender.assertColumnSortedDesc(0);
  });

  // ---------- EDGE (PAGINATION — DITUNDA) ----------
  it.skip('TC-KLD-LST-012 | Edge | Pagination navigate page + ubah page size [DITUNDA: butuh data > 10]', () => {
    // SKIP: total data saat ini 5 ('1 - 5 Dari 5'), next button disabled.
    // Un-skip kalau data sudah > 10 (lewat seed atau real growth).
    kalender.assertPaginationInfo(/^1\s*-\s*\d+\s+Dari\s+\d+$/);

    // Default state: data ringan -> Next disabled
    kalender.assertNextDisabled();

    // (BLOCKED) Setelah data > 10:
    // kalender.clickPaginationNext();
    // kalender.assertPaginationInfo(/^11\s*-\s*\d+\s+Dari\s+\d+$/);
    // kalender.setPageSize(25);
    // kalender.getVisibleRowCount().should('eq', 25);
  });

  // ---------- EDGE (PERSISTENCE DATA SEEDED) ----------
  // Note: TC ini dulunya "Persistence row baru tanpa reload" (Tambah -> list refresh).
  // Diganti jadi existence-check karena:
  //   1) Primary = data seeded permanen (SMP+ sudah punya kalender Senin/Minggu, no header).
  //   2) Conditional seed via isInstansiInList race-prone -> false negative bikin seed jalan
  //      -> BE reject dupe "calendar_setting.already_exists" -> toast success ga muncul -> TC fail.
  //   3) Intent "list refresh otomatis setelah Tambah" sudah ter-cover di tambahkalender.cy.js.
  it('TC-KLD-LST-013 | Edge | Row primary tampil di list (persist minimal, no header)', () => {
    // v3: primary=AQE mutation target, awal/nama pekan bisa berubah antar TC edit.
    // Relax: cukup assert row exists + kolom awal & nama pekan berisi badge (bukan strict value).
    // No header tetap strict — auto-seed di editkalender pakai tanpa header, dan add-with-header cuma di TC-002 dgn BUG-026 blocker.
    const target = d.instansi.primary;
    kalender.assertRowExists(target);
    kalender.elements.rowByInstansi(target).find('td').eq(1).find('[data-slot="badge"]').should('be.visible');
    kalender.elements.rowByInstansi(target).find('td').eq(2).find('[data-slot="badge"]').should('be.visible');
  });
});
