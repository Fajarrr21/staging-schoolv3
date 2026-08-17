// JadwalPelajaranPage.js — POM modul Jadwal Pelajaran (Pengaturan > Akademik > Jadwal Pelajaran)
// Route: /setting/academic/course-schedule  |  Redirect setelah Simpan: /setting/academic/course-schedule/{id}
//
// Catatan penting (dari element analysis):
// - Radix Select content DI-PORTAL ke <body> -> query global untuk selectItem, JANGAN .within(dialog).
// - Tag picker = inline dropdown checkbox multi-select (Radix Checkbox).
//   Toggle lewat KLIK LABEL ([data-slot="label"]), BUKAN cy.check().
//   Pakai regex exact /^...$/ biar gak nyangkut ke ratusan tag "QA...".
// - Multi Kelas Switch ON -> Jurusan HIDE + Kelas jadi multi-select.
// - Duplikasi ditolak -> toast [data-type="warning"] (bukan destructive; BUG-033), modal tetap terbuka.

const ROUTE = '/setting/academic/course-schedule';
const DIALOG = '[data-slot="dialog-content"]';
const SETTLE = 1200; // jeda settle modal re-mount (form shadcn load async)

const rx = (t) =>
  new RegExp(`^\\s*${String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);

// form-item scoped by label EXACT match (biar Jurusan/Jurusan (Opsional) & Kelas/Multi Kelas gak collide)
const formItem = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, rx(label))
    .closest('[data-slot="form-item"]');

// form-item scoped by label CONTAINS (buat "Jurusan (Opsional)", "Tag (Opsional)")
const formItemContains = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, label)
    .closest('[data-slot="form-item"]');

class JadwalPelajaranPage {
  elements = {
    // ===== LIST =====
    grid: (opts) => cy.get('table[data-slot="data-grid-table"]', opts),
    gridRows: () => cy.get('table[data-slot="data-grid-table"] tbody tr'),
    addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Jadwal Pelajaran'),
    rowByInstansi: (name) =>
      cy.contains('table[data-slot="data-grid-table"] tbody tr', name),

    // ===== MODAL =====
    dialog: () => cy.get(DIALOG),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),

    // ===== FIELD TRIGGERS (label-scoped, exact) =====
    tahunAjaranField: () => formItem('Tahun Ajaran'),
    semesterField: () => formItem('Semester').find('[data-slot="badge"]'),
    instansiTrigger: () => formItem('Instansi').find('[data-slot="select-trigger"]'),
    instansiValue: () => formItem('Instansi').find('[data-slot="select-value"]'),
    tingkatTrigger: () => formItem('Tingkat').find('[data-slot="select-trigger"]'),
    tingkatValue: () => formItem('Tingkat').find('[data-slot="select-value"]'),
    kelasTrigger: () => formItem('Kelas').find('[data-slot="select-trigger"]'),
    kelasValue: () => formItem('Kelas').find('[data-slot="select-value"]'),
    jurusanTrigger: () => formItemContains('Jurusan').find('[data-slot="select-trigger"]'),
    jurusanValue: () => formItemContains('Jurusan').find('[data-slot="select-value"]'),
    jurusanFormItem: () => formItemContains('Jurusan'),
    // Anchor by label "Multi Kelas" (partial match utk defensive). Attribute name di app bisa beda.
    multiKelasSwitch: () => formItemContains('Multi Kelas').find('[role="switch"]'),

    // ===== ERROR MESSAGES (inline text-destructive) =====
    instansiError: () => formItem('Instansi').find('[data-slot="form-message"]'),
    tingkatError: () => formItem('Tingkat').find('[data-slot="form-message"]'),
    kelasError: () => formItem('Kelas').find('[data-slot="form-message"]'),
    anyFormMessage: () => cy.get(`${DIALOG} [data-slot="form-message"]`),

    // ===== SELECT OPTIONS (portal, DI LUAR dialog — global query) =====
    selectContent: () => cy.get('[data-slot="select-content"]'),
    selectOption: (text) => cy.contains('[data-slot="select-item"]', rx(text)),

    // ===== TAG PICKER (inline, klik label, regex exact) =====
    tagFieldWrapper: () => formItemContains('Tag'),
    // Button trigger picker (buka dropdown inline). Filter out button[role="checkbox"]
    // biar gak keburu match ke checkbox item (setelah dropdown open).
    tagPickerButton: () =>
      formItemContains('Tag').find('button:not([role="checkbox"])').first(),
    // ⚠️ TOGGLE LEWAT KLIK LABEL (bukan cy.check() ke <input> tersembunyi).
    tagLabel: (name) => cy.contains(`${DIALOG} label[data-slot="label"]`, rx(name)),
    tagCheckboxByName: (name) =>
      cy.contains(`${DIALOG} label[data-slot="label"]`, rx(name))
        .parent().find('[data-slot="checkbox"]'),
    // Chip terpilih render di area tombol Tag. Cari langsung ke DIALOG (bukan lewat formItemContains)
    // biar gak brittle kalau label 'Tag' hilang / restructured setelah pick.
    tagChip: (name) =>
      cy.contains(`${DIALOG} [data-slot="badge"], ${DIALOG} span`, rx(name)),

    // ===== FOOTER BUTTONS =====
    simpanButton: () => cy.get(`${DIALOG} [data-slot="button"][type="submit"]`),
    batalButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, /^\s*Batal\s*$/),
    closeXButton: () => cy.get(`${DIALOG}`).find('svg.lucide-x').closest('button'),

    // ===== TOAST =====
    toastSuccess: () => cy.get('[data-sonner-toast][data-type="success"]'),
    toastWarning: () => cy.get('[data-sonner-toast][data-type="warning"]'),
    toastError: () => cy.get('[data-sonner-toast][data-type="error"]'),

    // ===== LIST ROW ACTIONS =====
    deleteIcon: (rowSelector) => rowSelector.find('svg.lucide-trash').closest('button'),
    editIcon: (rowSelector) => rowSelector.find('svg.lucide-square-pen').closest('button'),
  };

  // ============================================================
  // NAVIGATION
  // ============================================================
  visit() {
    cy.visit(ROUTE);
    this.elements.grid({ timeout: 15000 }).should('exist');
    return this;
  }

  openAddModal() {
    this.elements.addButton().click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Tambah Jadwal Pelajaran');
    cy.wait(SETTLE);
    return this;
  }

  // ============================================================
  // FIELD SELECTION (dependency chain: Instansi -> Tingkat -> Kelas -> Jurusan)
  // ============================================================
  selectInstansi(name) {
    this.elements.instansiTrigger().should('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    return this;
  }

  selectTingkat(name) {
    this.elements.tingkatTrigger().should('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.tingkatValue().should('contain.text', name);
    return this;
  }

  selectKelas(name) {
    this.elements.kelasTrigger().should('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.kelasValue().should('contain.text', name);
    return this;
  }

  // Multi Kelas ON -> field Kelas jadi checkbox inline (identik Tag picker: perlu klik TRIGGER dulu).
  // Struktur item: <button role="checkbox" data-slot="checkbox"> + <label data-slot="label">.
  // Klik LABEL (regex exact) — hindari cy.check() (input proxy tersembunyi).
  // JANGAN Esc — bisa nge-close modal.
  selectKelasMulti(names) {
    cy.wait(400); // settle re-render dari toggleMultiKelas(true)
    // Klik trigger Kelas multi (button non-checkbox di form-item Kelas)
    formItem('Kelas').find('button:not([role="checkbox"])').first().click({ force: true });
    cy.wait(400); // settle dropdown checkbox mount
    names.forEach((n) => {
      cy.contains(`${DIALOG} label[data-slot="label"]`, rx(n))
        .should('be.visible')
        .click({ force: true });
    });
    return this;
  }

  // Assert kelas kepilih di mode Multi (state data-state="checked" pada checkbox).
  assertKelasMultiChecked(name) {
    cy.contains(`${DIALOG} label[data-slot="label"]`, rx(name))
      .parent().find('[data-slot="checkbox"]')
      .should('have.attr', 'data-state', 'checked');
    return this;
  }

  selectJurusan(name) {
    this.elements.jurusanTrigger().should('not.be.disabled').click();
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.jurusanValue().should('contain.text', name);
    return this;
  }

  toggleMultiKelas(on = true) {
    this.elements.multiKelasSwitch().then(($sw) => {
      const state = $sw.attr('data-state') || $sw.attr('aria-checked');
      const isOn = state === 'checked' || state === 'true';
      if (isOn !== on) {
        cy.wrap($sw).click({ force: true });
      }
    });
    cy.wait(300); // settle re-render (Jurusan hide/show, Kelas mode switch)
    return this;
  }

  // Tag picker: buka dropdown -> klik label tag (exact regex). JANGAN pakai Esc — bisa
  // nge-close modal (Radix dialog listen Esc juga). Biar dropdown tetap terbuka; chip
  // sudah render di area trigger.
  pickTag(name) {
    this.elements.tagPickerButton().click();
    cy.wait(400); // settle: dropdown checkbox mount async
    this.elements.tagLabel(name).should('be.visible').click({ force: true });
    this.elements.tagCheckboxByName(name).should('have.attr', 'data-state', 'checked');
    return this;
  }

  // ============================================================
  // ACTIONS
  // ============================================================
  clickSimpan() {
    // { force: true } biar Cypress gak retry actionability — kalau valid, modal langsung tutup
    // + redirect ke halaman edit -> tombol lenyap dr DOM sebelum Cypress selesai retry.
    this.elements.simpanButton().click({ force: true });
    return this;
  }

  clickBatal() {
    this.elements.batalButton().click();
    return this;
  }

  clickX() {
    this.elements.closeXButton().click();
    return this;
  }

  pressEsc() {
    cy.get('body').type('{esc}');
    return this;
  }

  // ============================================================
  // ASSERTS - MODAL STATE
  // ============================================================
  assertDialogVisible() {
    this.elements.dialog().should('be.visible');
    return this;
  }

  assertDialogClosed() {
    cy.get(DIALOG).should('not.exist');
    return this;
  }

  // Radix Select trigger bisa pakai attribute `disabled`, `aria-disabled="true"`, atau `data-disabled`.
  // Cek semua kemungkinan biar robust.
  assertFieldDisabled(field) {
    const map = {
      Instansi: this.elements.instansiTrigger,
      Tingkat: this.elements.tingkatTrigger,
      Kelas: this.elements.kelasTrigger,
      Jurusan: this.elements.jurusanTrigger,
    };
    map[field]().then(($el) => {
      const isDisabled =
        $el.prop('disabled') === true ||
        $el.attr('disabled') !== undefined ||
        $el.attr('aria-disabled') === 'true' ||
        $el.attr('data-disabled') !== undefined;
      expect(isDisabled, `${field} trigger should be disabled`).to.eq(true);
    });
    return this;
  }

  assertFieldEnabled(field) {
    const map = {
      Instansi: this.elements.instansiTrigger,
      Tingkat: this.elements.tingkatTrigger,
      Kelas: this.elements.kelasTrigger,
      Jurusan: this.elements.jurusanTrigger,
    };
    map[field]().then(($el) => {
      const isDisabled =
        $el.prop('disabled') === true ||
        $el.attr('disabled') !== undefined ||
        $el.attr('aria-disabled') === 'true' ||
        $el.attr('data-disabled') !== undefined;
      expect(isDisabled, `${field} trigger should NOT be disabled`).to.eq(false);
    });
    return this;
  }

  // Cek langsung ke label — `cy.contains` + `.should('not.exist')` handle absence gracefully
  // (jauh lebih safe dibanding chain lewat .closest() yg gagal kalau label gak ada).
  assertJurusanHidden() {
    cy.contains(`${DIALOG} [data-slot="form-label"]`, 'Jurusan').should('not.exist');
    return this;
  }

  assertJurusanVisible() {
    cy.contains(`${DIALOG} [data-slot="form-label"]`, 'Jurusan').should('be.visible');
    return this;
  }

  // ============================================================
  // ASSERTS - ERROR MESSAGES (inline text-destructive)
  // ============================================================
  assertInstansiError(msg) {
    this.elements.instansiError()
      .should('be.visible')
      .and('have.class', 'text-destructive')
      .and('contain.text', msg);
    return this;
  }

  assertTingkatError(msg) {
    this.elements.tingkatError()
      .should('be.visible')
      .and('contain.text', msg);
    return this;
  }

  assertKelasError(msg) {
    this.elements.kelasError()
      .should('be.visible')
      .and('contain.text', msg);
    return this;
  }

  // ============================================================
  // ASSERTS - TOAST
  // ============================================================
  assertToastSuccess(title) {
    const t = this.elements.toastSuccess().should('be.visible');
    if (title) t.and('contain.text', title);
    return this;
  }

  assertToastWarning(text) {
    // Two-phase biar tahan variasi kapital/titik/prefix ("Peringatan\n...") dan kasih
    // debug log berisi text aktual toast — biar cepat ketauan kalo mismatch tipis.
    // .should('exist') (bukan 'be.visible') — tahan animasi Sonner (transform/opacity transition).
    cy.get('[data-sonner-toast]', { timeout: 10000 }).should('exist').then(($toasts) => {
      const dump = Array.from($toasts).map((t, i) =>
        `toast[${i}] type=${t.getAttribute('data-type')} text="${t.textContent.trim().slice(0, 200)}"`
      );
      dump.forEach((line) => cy.log(`[toast-debug] ${line}`));
      const combined = Array.from($toasts).map((t) => t.textContent).join(' | ');
      const escaped = String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(combined, `toast text should match: ${text}`).to.match(new RegExp(escaped, 'i'));
    });
    return this;
  }

  // ============================================================
  // ASSERTS - REDIRECT + CAPTURE ID
  // ============================================================
  // Chainable: menghasilkan wrapped id string. Pakai via `.then((id) => ...)`.
  captureIdFromDetailUrl(timeout = 10000) {
    cy.url({ timeout }).should('match', /\/setting\/academic\/course-schedule\/\d+$/);
    return cy.url().then((u) => {
      const m = u.match(/\/setting\/academic\/course-schedule\/(\d+)$/);
      return m ? m[1] : null;
    });
  }

  // ============================================================
  // LIST ROW HELPERS
  // ============================================================
  countRows() {
    return cy.get('body').then(($b) => {
      const rows = $b.find('table[data-slot="data-grid-table"] tbody tr');
      return rows.length;
    });
  }

  // Cari row berdasarkan kombinasi kolom (case exact). Return chainable jQuery element or null.
  findRowByCombo({ instansi, tingkat, kelas, tahunAjaran, semester }) {
    return cy.get('body').then(($b) => {
      const rows = Array.from($b.find('table[data-slot="data-grid-table"] tbody tr'));
      const match = rows.find((tr) => {
        const tds = tr.querySelectorAll('td');
        const get = (i) => (tds[i] ? tds[i].textContent.trim() : '');
        if (instansi && !get(0).includes(instansi)) return false;
        if (tahunAjaran && !get(1).includes(tahunAjaran)) return false;
        if (semester && !get(2).toUpperCase().includes(semester.toUpperCase())) return false;
        if (tingkat && get(3) !== String(tingkat)) return false;
        if (kelas && !get(4).includes(kelas)) return false;
        return true;
      });
      return match || null;
    });
  }

  // ============================================================
  // COMPOSITE FILLERS (dipakai spec buat compact test bodies)
  // ============================================================
  fillMinimum({ instansi, tingkat, kelas }) {
    this.selectInstansi(instansi);
    this.selectTingkat(tingkat);
    this.selectKelas(kelas);
    return this;
  }

  fillLengkap({ instansi, tingkat, kelas, jurusan, tag }) {
    this.selectInstansi(instansi);
    this.selectTingkat(tingkat);
    this.selectKelas(kelas);
    if (jurusan) this.selectJurusan(jurusan);
    if (tag) this.pickTag(tag);
    return this;
  }

  fillMultiKelas({ instansi, tingkat, kelasArr }) {
    this.selectInstansi(instansi);
    this.selectTingkat(tingkat);
    this.toggleMultiKelas(true);
    this.selectKelasMulti(kelasArr);
    return this;
  }

  // Submit + tunggu redirect + return captured id via .then((id) => ...).
  submitAndCaptureId() {
    this.clickSimpan();
    return this.captureIdFromDetailUrl();
  }
}

export default new JadwalPelajaranPage();
