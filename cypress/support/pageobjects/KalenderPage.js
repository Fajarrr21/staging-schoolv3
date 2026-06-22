// KalenderPage.js — POM modul Kalender Akademik (Pengaturan > Akademik > Kalender Akademik)
// Route: /setting/academic/academic-calendar
// Strategi tunggu: FIXED-WAIT (pola Kamar/Kelas/Tingkat/Mapel) — TANPA cy.intercept.
// Select di-scope BY LABEL (pola Jurusan/Kamar) krn form punya 3 select dgn label berbeda.
// Field form Tambah:
//   Instansi*           - Select Radix; payload key=office; placeholder "Pilih Instansi"
//   Awal pekan dimulai* - Select Radix; placeholder; options: Minggu, Senin; key=start_day
//   Nama Pekan*         - Select Radix; placeholder; options: Ahad, Minggu; key=weekend_name
//   Header (Opsional)   - file upload; accept .png/.jpg/.jpeg/.webp/.svg; max 2MB; tip dimensi 500x300
//
// Pesan error PENTING:
//   - Field wajib kosong: form-message inline di bawah field (data-slot="form-message" destructive)
//   - Upload >2MB: ALERT INLINE di modal (data-slot="alert") — title "Gagal mengunggah file",
//                   desc "File melebihi ukuran maksimal 2MB."
//   - Duplikasi instansi: TOAST GLOBAL di portal (BUKAN child modal),
//                         text "Pengaturan kalender untuk office ini sudah ada", auto-dismiss
//
// Cypress hint utk toast duplikat: query global (TANPA scope DIALOG), andalkan retry cy.contains,
//   JANGAN cy.wait fixed yg kelamaan (auto-dismiss bisa keburu hilang).

const ROUTE = '/setting/academic/academic-calendar';
const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const SETTLE = 1200;       // settle modal re-mount (form shadcn load async)
const DEBOUNCE = 800;      // debounce filter/search
const UPLOAD_WAIT = 1000;  // jeda render preview / alert setelah selectFile

const rx = (t) => new RegExp(`^\\s*${String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
// form-item di dalam dialog yang label-nya mengandung `label`
const formItem = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, label).closest('[data-slot="form-item"]');

class KalenderPage {
  elements = {
    // ---------- LIST ----------
    addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Kalender Akademik'),
    table: (opts) => cy.get('table', opts),
    tableRows: () => cy.get('table tbody tr'),
    rowByInstansi: (instansi) => cy.contains('table tbody tr', instansi),

    // toolbar filter Instansi (placeholder "Instansi")
    filterInstansiTrigger: () =>
      cy.get('[data-slot="card-toolbar"] [data-slot="select-trigger"]').eq(0),

    // row actions (per ikon, lalu .closest('button'))
    editIcon: (instansi) =>
      cy.contains('table tbody tr', instansi).find('svg.lucide-square-pen').closest('button'),
    deleteIcon: (instansi) =>
      cy.contains('table tbody tr', instansi).find('svg.lucide-trash').closest('button'),

    // ---------- MODAL (re-use Tambah + Edit) ----------
    dialog: () => cy.get(DIALOG, { timeout: 15000 }),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
    saveButton: () => cy.get(`${DIALOG} button[type="submit"][data-slot="button"]`),
    cancelButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, 'Batal'),
    closeXButton: () => cy.get(DIALOG).find('svg.lucide-x').closest('button'),

    // SELECT (label-scoped)
    instansiTrigger: () => formItem('Instansi').find('[data-slot="select-trigger"]'),
    instansiValue: () => formItem('Instansi').find('[data-slot="select-value"]'),
    instansiError: () => formItem('Instansi').find('[data-slot="form-message"]'),

    awalPekanTrigger: () => formItem('Awal pekan dimulai').find('[data-slot="select-trigger"]'),
    awalPekanValue: () => formItem('Awal pekan dimulai').find('[data-slot="select-value"]'),
    awalPekanError: () => formItem('Awal pekan dimulai').find('[data-slot="form-message"]'),

    namaPekanTrigger: () => formItem('Nama Pekan').find('[data-slot="select-trigger"]'),
    namaPekanValue: () => formItem('Nama Pekan').find('[data-slot="select-value"]'),
    namaPekanError: () => formItem('Nama Pekan').find('[data-slot="form-message"]'),

    // FILE UPLOAD (Header - Opsional)
    fileInput: () => cy.get(`${DIALOG} input[type="file"]`),
    pilihFileBtn: () => cy.contains(`${DIALOG} button`, 'Pilih File'),
    // dropzone area (untuk drag/drop click target)
    uploadDropzone: () => cy.get(`${DIALOG} [role="button"]`).first(),

    // alert inline >2MB (di dalam modal, BUKAN toast)
    uploadFailAlert: () => cy.get(`${DIALOG} [data-slot="alert"]`),
    uploadFailTitle: () => cy.get(`${DIALOG} [data-slot="alert-title"]`),
    uploadFailDesc: () => cy.get(`${DIALOG} [data-slot="alert-description"]`),

    // preview card setelah upload sukses (nama file + trash button)
    filePreviewCard: () => cy.get(`${DIALOG} .rounded-lg.border.bg-card`),
    filePreviewName: () => cy.get(`${DIALOG} .rounded-lg.border.bg-card span.text-sm`),
    filePreviewTrash: () =>
      cy.get(`${DIALOG} .rounded-lg.border.bg-card svg.lucide-trash2`).closest('button'),

    // OPSI select (portal, di luar dialog) — exact match
    selectOption: (text) => cy.contains('[role="option"]', rx(text)),
    listbox: () => cy.get('[role="listbox"]', { timeout: 6000 }),

    // TOAST (global, di portal)
    successToast: () => cy.get('[data-sonner-toast][data-type="success"]', { timeout: 8000 }),
    errorToast: () => cy.get('[data-sonner-toast][data-type="error"]', { timeout: 8000 }),
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
    this.elements.instansiTrigger().should('be.visible'); // form siap
    return this;
  }

  // ===== FORM ACTIONS =====
  selectInstansi(name) {
    this.elements.instansiTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    return this;
  }

  selectAwalPekan(value) {
    this.elements.awalPekanTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.awalPekanValue().should(($el) => { expect($el.text().trim()).to.eq(value); });
    return this;
  }

  selectNamaPekan(value) {
    this.elements.namaPekanTrigger().should('be.visible').and('not.be.disabled').click();
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.namaPekanValue().should(($el) => { expect($el.text().trim()).to.eq(value); });
    return this;
  }

  // upload file via native input[type=file]. Input pakai class sr-only -> wajib force.
  uploadHeader(filePath) {
    this.elements.fileInput().selectFile(filePath, { force: true });
    cy.wait(UPLOAD_WAIT); // beri waktu FE validate ukuran/format + render preview/alert
    return this;
  }

  // hapus file dari preview (klik trash icon di card preview)
  removeUploadedFile() {
    this.elements.filePreviewTrash().click();
    return this;
  }

  clickSave() { this.elements.saveButton().click(); return this; }
  clickCancel() { this.elements.cancelButton().click(); return this; }
  clickCloseX() { this.elements.closeXButton().click(); return this; }

  // Helper compose. opts: { header: '<path>' }
  addKalender(instansi, awalPekan, namaPekan, opts = {}) {
    this.openAddModal();
    if (instansi) this.selectInstansi(instansi);
    if (awalPekan) this.selectAwalPekan(awalPekan);
    if (namaPekan) this.selectNamaPekan(namaPekan);
    if (opts.header) this.uploadHeader(opts.header);
    this.clickSave();
    return this;
  }

  // ===== ASSERTIONS: MODAL =====
  assertModalOpen(title = 'Tambah Kalender Akademik') {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', title);
    return this;
  }
  assertModalClosed() { cy.get(DIALOG).should('not.exist'); return this; }

  // form default: 3 field wajib placeholder, area upload kosong
  assertFormEmpty() {
    this.elements.instansiValue().should('contain.text', 'Pilih Instansi');
    this.elements.awalPekanValue().should('contain.text', 'Pilih Awal pekan dimulai');
    this.elements.namaPekanValue().should('contain.text', 'Pilih Nama Pekan');
    this.elements.filePreviewCard().should('not.exist');
    this.elements.pilihFileBtn().should('be.visible');
    this.elements.saveButton().should('exist');
    this.elements.cancelButton().should('exist');
    return this;
  }

  // ===== ASSERTIONS: TOAST =====
  assertSuccessToast(text = 'Kalender Akademik berhasil ditambahkan') {
    this.elements.successToast().should('be.visible').find('[data-title]').should('contain.text', text);
    return this;
  }
  assertNoSuccessToast() {
    cy.get('[data-sonner-toast][data-type="success"]').should('not.exist');
    return this;
  }

  // duplicate -> toast global error, query global (BUKAN scope DIALOG)
  // andalkan retry cy.contains, jangan cy.wait fixed (auto-dismiss)
  assertDuplicateToast(text = 'Pengaturan kalender untuk office ini sudah ada') {
    cy.contains('[data-sonner-toast]', text, { timeout: 8000 }).should('be.visible');
    return this;
  }

  // ===== ASSERTIONS: FORM ERRORS =====
  assertInstansiError(text = 'Instansi wajib diisi') {
    this.elements.instansiError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertAwalPekanError(text) {
    this.elements.awalPekanError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertNamaPekanError(text) {
    this.elements.namaPekanError().should('be.visible').and('contain.text', text);
    return this;
  }

  // ===== ASSERTIONS: UPLOAD =====
  assertUploadOversizeAlert(
    title = 'Gagal mengunggah file',
    desc = 'File melebihi ukuran maksimal 2MB.'
  ) {
    this.elements.uploadFailAlert().should('be.visible');
    this.elements.uploadFailTitle().should('contain.text', title);
    this.elements.uploadFailDesc().should('contain.text', desc);
    return this;
  }
  // preview card muncul dgn nama file
  assertFilePreview(fileName) {
    this.elements.filePreviewCard().should('be.visible');
    if (fileName) this.elements.filePreviewName().should('contain.text', fileName);
    return this;
  }
  assertNoFilePreview() {
    this.elements.filePreviewCard().should('not.exist');
    return this;
  }

  // ===== ASSERTIONS: ROW / PERSIST =====
  // Kolom row (per HTML real, 6 td):
  //   0=Instansi (span.font-medium) | 1=Awal pekan (badge) | 2=Nama pekan (badge)
  //   3=Header (img alt="header")   | 4=Edit (button)       | 5=Hapus (button)
  assertRowExists(instansi) {
    cy.contains('table tbody tr', instansi).should('exist');
    return this;
  }
  assertRowNotExists(instansi) {
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', instansi).should('not.exist');
    });
    return this;
  }
  assertRowInstansi(instansi) {
    cy.contains('table tbody tr', instansi).should(($row) => {
      expect(Cypress.$($row).find('td').eq(0).text().trim()).to.eq(instansi);
    });
    return this;
  }
  assertRowAwalPekan(instansi, awalPekan) {
    cy.contains('table tbody tr', instansi)
      .find('td').eq(1).find('[data-slot="badge"]')
      .should('contain.text', awalPekan);
    return this;
  }
  assertRowNamaPekan(instansi, namaPekan) {
    cy.contains('table tbody tr', instansi)
      .find('td').eq(2).find('[data-slot="badge"]')
      .should('contain.text', namaPekan);
    return this;
  }
  assertRowHeaderImage(instansi) {
    cy.contains('table tbody tr', instansi)
      .find('td').eq(3).find('img[alt="header"]')
      .should('exist');
    return this;
  }

  // reload-based persistence
  assertPersisted(instansi) {
    this.visit();
    cy.contains('table tbody tr', instansi, { timeout: 10000 }).should('exist');
    return this;
  }
  assertNotPersisted(instansi) {
    this.visit();
    cy.get('table tbody').then(($b) => {
      if ($b.find('tr').length) cy.contains('table tbody tr', instansi).should('not.exist');
    });
    return this;
  }

  // ===== UTILITAS: cek apakah instansi sudah punya kalender di list =====
  // Dipakai conditional helper di spec (skip seed kalau sudah ada).
  // Note: ini optimistik — kalau filter instansi aktif, hasilnya bisa false negative.
  isInstansiInList(instansi) {
    return cy.get('table tbody').then(($b) => {
      const rows = $b.find('tr');
      if (!rows.length) return false;
      return rows.toArray().some((r) => r.textContent.includes(instansi));
    });
  }
}

export default new KalenderPage();
