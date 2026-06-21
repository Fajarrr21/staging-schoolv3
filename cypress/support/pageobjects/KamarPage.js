// KamarPage.js — POM modul Kamar (Pengaturan > Akademik > Kamar)
// Route: /setting/academic/room
// Strategi tunggu: FIXED-WAIT (pola Kelas/Tingkat/Mapel) — TANPA cy.intercept.
//   (cuma modul Jurusan yg pakai intercept; modul lain debounce via cy.wait.)
// Select di-scope BY LABEL (pola Jurusan) krn form Kamar punya 2 select (Instansi + PIC),
//   plus Status di modal Edit -> .eq(index) rawan ketuker.
// Field form Tambah: Instansi* (select) | Kamar* input[name=name] | Lokasi (opsional) input[name=location]
//   | PIC (opsional) select -> DISABLED sampai Instansi dipilih (opsi = guru/staff instansi terpilih).
// Opsi dipilih via EXACT match (rx) -> hindari tabrakan substring "Sekolah Alam" vs "Sekolah Alam Raya".

const ROUTE = '/setting/academic/room';
const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const SETTLE = 1200;       // settle modal re-mount (form shadcn load async)
const PIC_WAIT = 1000;     // jeda fetch daftar PIC (guru) setelah pilih Instansi
const DEBOUNCE = 800;      // debounce search
const PIC_PLACEHOLDER = 'Tidak ada PIC';

const rx = (t) => new RegExp(`^\\s*${String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
// form-item di dalam dialog yang label-nya mengandung `label`
const formItem = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, label).closest('[data-slot="form-item"]');

class KamarPage {
  elements = {
    // ---------- LIST ----------
    addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Kamar'),
    searchInput: () => cy.get('input[placeholder*="Cari" i]', { timeout: 15000 }),
    table: (opts) => cy.get('table', opts),
    tableRows: () => cy.get('table tbody tr'),
    rowByName: (name) => cy.contains('table tbody tr', name),
    emptyStateTitle: () => cy.contains('Data Kamar tidak ditemukan'),

    // toolbar filter (di luar dialog) — [0]=Instansi, [1]=Status
    filterInstansiTrigger: () => cy.get('[data-slot="card-toolbar"] [data-slot="select-trigger"]').eq(0),
    filterStatusTrigger: () => cy.get('[data-slot="card-toolbar"] [data-slot="select-trigger"]').eq(1),

    // ---------- MODAL (re-use Tambah + Edit) ----------
    dialog: () => cy.get(DIALOG, { timeout: 15000 }),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
    kamarInput: () => cy.get(`${DIALOG} input[name="name"]`),
    lokasiInput: () => cy.get(`${DIALOG} input[name="location"]`),
    saveButton: () => cy.get(`${DIALOG} button[type="submit"][data-slot="button"]`),
    cancelButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, 'Batal'),
    closeXButton: () => cy.get(DIALOG).find('svg.lucide-x').closest('button'),

    // SELECT (label-scoped)
    instansiTrigger: () => formItem('Instansi').find('[data-slot="select-trigger"]'),
    instansiValue: () => formItem('Instansi').find('[data-slot="select-value"]'),
    instansiError: () => formItem('Instansi').find('[data-slot="form-message"]'),
    picTrigger: () => formItem('PIC').find('[data-slot="select-trigger"]'),
    picValue: () => formItem('PIC').find('[data-slot="select-value"]'),
    statusTrigger: () => formItem('Status').find('[data-slot="select-trigger"]'),
    statusValue: () => formItem('Status').find('[data-slot="select-value"]'),

    kamarError: () =>
      cy.get(`${DIALOG} input[name="name"]`).closest('[data-slot="form-item"]').find('[data-slot="form-message"]'),

    // OPSI select (portal, di luar dialog) — exact match
    selectOption: (text) => cy.contains('[role="option"]', rx(text)),
    listbox: () => cy.get('[role="listbox"]', { timeout: 6000 }),

    // TOAST
    successToast: () => cy.get('[data-sonner-toast][data-type="success"]', { timeout: 8000 }),

    // DELETE — popup konfirmasi pakai dialog-content yg sama
    deleteIcon: (name) => cy.contains('table tbody tr', name).find('svg.lucide-trash').closest('button'),
    editIcon: (name) => cy.contains('table tbody tr', name).find('svg.lucide-square-pen').closest('button'),
    deleteConfirmBtn: () => cy.contains(`${DIALOG} [data-slot="dialog-footer"] [data-slot="button"]`, /^\s*Hapus\s*$/),
  };

  // ===== NAVIGATION =====
  visit() {
    cy.visit(ROUTE);
    this.elements.table({ timeout: 15000 }).should('exist');
    return this;
  }

  openAddModal() {
    this.elements.addButton().click();
    this.elements.dialog().should('be.visible');
    cy.wait(SETTLE);
    this.elements.kamarInput().should('be.visible'); // form benar-benar siap
    return this;
  }

  // ===== FORM ACTIONS =====
  selectInstansi(name) {
    this.elements.instansiTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    cy.wait(PIC_WAIT); // tunggu daftar PIC (guru) ke-fetch utk instansi ini
    return this;
  }

  fillKamar(name) {
    this.elements.kamarInput().should('be.visible').and('not.be.disabled');
    this.elements.kamarInput().clear();
    if (name && name.length) this.elements.kamarInput().type(name);
    return this;
  }
  clearKamar() { this.elements.kamarInput().should('not.be.disabled').clear(); return this; }

  fillLokasi(text) {
    this.elements.lokasiInput().should('be.visible').and('not.be.disabled').clear();
    if (text && text.length) this.elements.lokasiInput().type(text);
    return this;
  }

  // pilih PIC berdasarkan teks (termasuk placeholder "Tidak ada PIC" untuk menghapus PIC)
  selectPic(value) {
    this.elements.picTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.listbox().should('be.visible');
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.picValue().should('contain.text', value);
    return this;
  }

  // buka dropdown PIC (trigger enabled hanya setelah Instansi dipilih)
  openPicDropdown() {
    this.elements.picTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.listbox().should('be.visible');
    return this;
  }

  // pilih PIC pertama yang BUKAN placeholder "Tidak ada PIC"; simpan namanya ke alias @picName
  selectFirstPic() {
    this.openPicDropdown();
    cy.get('[role="option"]').should('have.length.at.least', 1);
    cy.get('[role="option"]').then(($opts) => {
      const teacher = [...$opts].find(
        (o) => o.textContent.trim() && o.textContent.trim() !== PIC_PLACEHOLDER
      );
      const name = teacher ? teacher.textContent.trim() : null;
      cy.wrap(name).as('picName');
      if (teacher) {
        cy.wrap(teacher).scrollIntoView().click({ force: true });
        this.elements.picValue().should('contain.text', name);
      } else {
        cy.get('body').type('{esc}'); // tidak ada guru -> tutup dropdown
      }
    });
    return this;
  }

  selectStatus(value) {
    this.elements.statusTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.statusValue().should(($el) => { expect($el.text().trim()).to.eq(value); });
    return this;
  }

  clickSave() { this.elements.saveButton().click(); return this; }
  clickCancel() { this.elements.cancelButton().click(); return this; }

  // opts: { pic: 'first', lokasi: '...' }
  addKamar(instansi, nama, opts = {}) {
    this.openAddModal();
    if (instansi) this.selectInstansi(instansi);
    if (typeof nama !== 'undefined') this.fillKamar(nama);
    if (opts.pic === 'first') this.selectFirstPic();
    if (opts.lokasi) this.fillLokasi(opts.lokasi);
    this.clickSave();
    return this;
  }

  search(term) {
    this.elements.searchInput().clear().type(term);
    cy.wait(DEBOUNCE);
    return this;
  }
  clearSearch() { this.elements.searchInput().clear(); cy.wait(DEBOUNCE); return this; }

  filterByInstansi(name) {
    this.elements.filterInstansiTrigger().should('be.visible').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    cy.wait(DEBOUNCE);
    return this;
  }
  filterByStatus(value) {
    this.elements.filterStatusTrigger().should('be.visible').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    cy.wait(DEBOUNCE);
    return this;
  }

  // ===== DELETE ACTIONS (dipakai modul Hapus & cleanup) =====
  openDeleteByName(name) {
    this.search(name);
    this.elements.rowByName(name).should('be.visible');
    cy.wait(500); // beri waktu re-render tabel selesai (anti detached-DOM)
    this.elements.deleteIcon(name).scrollIntoView();
    this.elements.deleteIcon(name).should('be.visible').and('not.be.disabled');
    this.elements.deleteIcon(name).click({ force: true });
    // tunggu dialog Hapus benar-benar OPEN (data-state) sebelum lanjut
    cy.get(`${DIALOG}[data-state="open"]`, { timeout: 15000 }).should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Hapus Kamar');
    cy.wait(SETTLE);
    return this;
  }
  confirmDelete() { this.elements.deleteConfirmBtn().click(); return this; }
  deleteByName(name) { this.openDeleteByName(name); this.confirmDelete(); return this; }

  // tutup popup pakai ESC (Radix dialog listen ke document-level keydown)
  pressEscape() { cy.get('body').type('{esc}'); return this; }

  // pastikan popup konfirmasi Hapus menampilkan nama kamar + instansi (PRD: pesan konfirmasi)
  assertDeleteDialogShows(name, instansi) {
    this.elements.dialog().should(($d) => {
      const txt = $d.text();
      expect(txt, 'pesan konfirmasi memuat nama kamar').to.contain(name);
      expect(txt, 'pesan konfirmasi memuat instansi').to.contain(instansi);
    });
    return this;
  }

  openEditByName(name) {
    this.search(name);
    // tunggu row hadir & beri waktu re-render tabel selesai (anti detached-DOM saat click)
    this.elements.rowByName(name).should('be.visible');
    cy.wait(500);
    // re-query editIcon biar Cypress retry chain dengan referensi DOM terbaru
    this.elements.editIcon(name).scrollIntoView();
    this.elements.editIcon(name).should('be.visible').and('not.be.disabled');
    this.elements.editIcon(name).click({ force: true });
    // tunggu dialog Edit benar-benar OPEN (lebih kuat dari sekedar 'visible')
    cy.get(`${DIALOG}[data-state="open"]`, { timeout: 15000 }).should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Edit Kamar');
    // form Edit punya 5 field: Instansi, Kamar, Lokasi, PIC, Status.
    //   Render bertahap karena instansi pre-populated -> fetch PIC async.
    //   TUNGGU semua field ter-mount sebelum lanjut (anti race formItem('PIC'/'Status')).
    cy.get(`${DIALOG} form [data-slot="form-item"]`, { timeout: 10000 }).should('have.length', 5);
    cy.wait(SETTLE);
    this.elements.kamarInput().should('be.visible').and('not.be.disabled');
    // PIC dropdown butuh fetch guru/staff (walau instansi pre-selected)
    cy.wait(PIC_WAIT);
    return this;
  }

  // ===== ASSERTIONS: MODAL =====
  assertModalOpen(title = 'Tambah Kamar') {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', title);
    return this;
  }
  assertModalClosed() { cy.get(DIALOG).should('not.exist'); return this; }

  assertFormEmpty() {
    this.elements.instansiValue().should('contain.text', 'Pilih Instansi');
    this.elements.kamarInput().should('have.value', '');
    this.elements.lokasiInput().should('have.value', '');
    this.elements.picValue().should('contain.text', PIC_PLACEHOLDER);
    this.elements.saveButton().should('exist');
    this.elements.cancelButton().should('exist');
    return this;
  }

  assertSuccessToast(text = 'Kamar berhasil ditambahkan') {
    // assert hanya ke data-title; data-description app punya typo ("...data Kelas...") -> jangan di-lock
    this.elements.successToast().should('be.visible').find('[data-title]').should('contain.text', text);
    return this;
  }
  assertNoSuccessToast() { cy.get('[data-sonner-toast][data-type="success"]').should('not.exist'); return this; }

  // FE TIDAK boleh silent: harus ada feedback ke user — toast sukses, toast error,
  // ATAU form-message non-kosong di dialog. Dipakai TC nama >255 char (BUG-015):
  //   saat ini ketiganya absen (silent) -> assertion ini SENGAJA fail sampai bug fixed.
  assertNotSilent() {
    cy.get('body').should(() => {
      const success = Cypress.$('[data-sonner-toast][data-type="success"]').length > 0;
      const errToast = Cypress.$('[data-sonner-toast][data-type="error"]').length > 0;
      const msg = Cypress.$(`${DIALOG} [data-slot="form-message"]`)
        .toArray()
        .some((el) => el.textContent.trim().length > 0);
      expect(success || errToast || msg, 'FE harus kasih feedback (toast sukses/error atau pesan validasi), bukan silent').to.be.true;
    });
    return this;
  }

  assertInstansiError(text = 'Instansi wajib diisi') {
    this.elements.instansiError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertKamarError(text = 'Kamar wajib diisi') {
    this.elements.kamarError().should('be.visible').and('contain.text', text);
    return this;
  }
  // field Kamar dalam kondisi valid (tidak di-flag error). Dipakai TC min-boundary (1 char):
  //   buktikan 1 char tidak memicu validasi required/min-length (data-invalid tetap "false").
  assertKamarFieldValid() {
    cy.get(`${DIALOG} input[name="name"]`).closest('[data-slot="form-item"]')
      .should('have.attr', 'data-invalid', 'false');
    return this;
  }

  // PIC dropdown berisi opsi guru/staff (selain placeholder) untuk instansi terpilih
  assertPicHasTeacherOptions() {
    this.openPicDropdown();
    cy.get('[role="option"]').then(($opts) => {
      const teachers = [...$opts].filter(
        (o) => o.textContent.trim() && o.textContent.trim() !== PIC_PLACEHOLDER
      );
      expect(teachers.length, 'jumlah opsi guru/staff PIC').to.be.greaterThan(0);
    });
    cy.get('body').type('{esc}'); // tutup dropdown
    return this;
  }
  // setelah ganti Instansi, pilihan PIC ter-reset ke placeholder (Asumsi)
  assertPicReset() {
    this.elements.picValue().should('contain.text', PIC_PLACEHOLDER);
    return this;
  }

  // ===== ASSERTIONS: ROW / PERSIST =====
  assertRowExists(name) { cy.contains('table tbody tr', name).should('exist'); return this; }
  assertRowNotExists(name) {
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', name).should('not.exist');
    });
    return this;
  }
  assertRowInstansi(name, instansi) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(0).text().trim()).to.eq(instansi);
    });
    return this;
  }
  assertRowLokasi(name, lokasi) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(2).text().trim()).to.eq(lokasi);
    });
    return this;
  }
  assertRowNoLokasi(name) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(2).text().trim()).to.eq('');
    });
    return this;
  }
  assertRowNoPic(name) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(3).text().trim()).to.eq('');
    });
    return this;
  }
  assertRowPic(name, pic) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(3).text().trim()).to.contain(pic);
    });
    return this;
  }
  assertRowStatus(name, status) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('[data-slot="badge"]').text().trim()).to.eq(status);
    });
    return this;
  }

  // verifikasi persist di backend: reload -> search -> row ada
  assertPersisted(name) {
    this.visit();
    this.search(name);
    cy.contains('table tbody tr', name, { timeout: 10000 }).should('exist');
    return this;
  }
  assertNotPersisted(name) {
    this.visit();
    this.search(name);
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', name).should('not.exist');
    });
    return this;
  }

  // ===== ASSERTIONS: LIST =====
  // Validasi struktur kolom via baris data (header kolom tak punya HTML acuan).
  // Urutan PRD: Instansi|Kamar|Lokasi|PIC|Status(badge)|Dibuat Pada|Edit|Hapus = 8 sel.
  assertColumns() {
    cy.get('table tbody tr').first().within(() => {
      cy.get('td').should('have.length', 8);
      cy.get('[data-slot="badge"]').should('exist');   // kolom Status = badge
      cy.get('svg.lucide-square-pen').should('exist');  // aksi Edit
      cy.get('svg.lucide-trash').should('exist');       // aksi Hapus
    });
    return this;
  }
  assertHasRows() { cy.get('table tbody tr').its('length').should('be.gt', 0); return this; }
  assertEmptyState() { this.elements.emptyStateTitle().should('be.visible'); return this; }

  assertRowHasActions() {
    cy.get('table tbody tr').first().within(() => {
      cy.get('svg.lucide-square-pen').should('exist');
      cy.get('svg.lucide-trash').should('exist');
    });
    return this;
  }
  // baris paling atas = data terbaru (sort default newest-first)
  assertFirstRowName(name) {
    cy.get('table tbody tr').first().should(($row) => {
      expect(Cypress.$($row).find('td').eq(1).text().trim()).to.eq(name);
    });
    return this;
  }
  // .should(callback) + Cypress.$ -> auto-retry anti detached-DOM saat list re-render
  assertAllRowsInstansi(instansi) {
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'jumlah baris').to.be.greaterThan(0);
      $rows.each((i, row) => {
        expect(Cypress.$(row).find('td').eq(0).text().trim()).to.eq(instansi);
      });
    });
    return this;
  }
  assertAllRowsStatus(status) {
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'jumlah baris').to.be.greaterThan(0);
      $rows.each((i, row) => {
        expect(Cypress.$(row).find('[data-slot="badge"]').text().trim()).to.eq(status);
      });
    });
    return this;
  }
}

export default new KamarPage();
