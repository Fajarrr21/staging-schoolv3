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
// DIALOG constant sengaja INCLUDE `[role="dialog"]` untuk menghindari match ghost/portal
// wrapper Radix yg juga punya `data-slot="dialog-content"`. Loosen sempat dicoba tapi bikin
// TC-009 (svg.lucide-x tidak ketemu di descendant search) & masih fail di TC-013 juga.
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

    // toolbar filter Instansi — Radix Select (BUKAN dropdown-menu).
    // Class `.max-w-48` membedakan dari page-size select (`.w-fit`).
    // Default label: "Instansi"; setelah pilih: nama instansi; setelah reset (opsi system): "Instansi".
    filterInstansiTrigger: () =>
      cy.get('button[data-slot="select-trigger"].max-w-48').first(),
    filterInstansiLabel: () =>
      cy.get('button[data-slot="select-trigger"].max-w-48').first().find('[data-slot="select-value"]'),

    // pagination — div[data-slot="data-grid-pagination"]
    pagination: () => cy.get('[data-slot="data-grid-pagination"]'),
    pageSizeTrigger: () =>
      cy.get('[data-slot="data-grid-pagination"] [data-slot="select-trigger"]'),
    pageInfo: () =>
      cy.get('[data-slot="data-grid-pagination"]').contains(/\d+\s*-\s*\d+\s+Dari\s+\d+/),
    pagePrevBtn: () =>
      cy.get('[data-slot="data-grid-pagination"] svg.lucide-move-left').closest('button'),
    pageNextBtn: () =>
      cy.get('[data-slot="data-grid-pagination"] svg.lucide-move-right').closest('button'),
    pageNumberBtn: (n) =>
      cy.get('[data-slot="data-grid-pagination"]').contains('button', new RegExp(`^${n}$`)),

    // header tabel dropdown-menu (sort per kolom)
    // tiap <th> punya button[data-slot="dropdown-menu-trigger"] dengan teks label kolom.
    headerSortTrigger: (label) =>
      cy.contains('table thead th button[data-slot="dropdown-menu-trigger"]', label),
    // menu items yang muncul setelah klik trigger (di portal, role=menuitem)
    sortMenuItem: (text) =>
      cy.contains('[role="menuitem"]', text),

    // empty state — H3 + inline CTA button
    emptyStateTitle: () => cy.contains('h3', /tidak ditemukan/i),
    emptyStateCta: () =>
      cy.contains('button', /Tambah Kalender (Akademik|Pendidikan)/i).filter(':not([data-slot="dialog-trigger"])'),

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
    // `.first()` guard: pada modal Edit dgn existing header, kadang render 2 input[type=file]
    // (upload area + hidden re-upload dalam preview). selectFile() gagal kalau subject
    // multiple -> ambil yg pertama saja.
    fileInput: () => cy.get(`${DIALOG} input[type="file"]`).first(),
    pilihFileBtn: () => cy.contains(`${DIALOG} button`, 'Pilih File'),
    // dropzone area (untuk drag/drop click target)
    uploadDropzone: () => cy.get(`${DIALOG} [role="button"]`).first(),

    // alert inline >2MB (di dalam modal, BUKAN toast).
    // Selector di-loosen dari `${DIALOG} [data-slot="alert"]` -> global `[data-slot="alert"][role="alert"]`
    // (dikonfirmasi user 02 Juli 2026 via TC-KLD-EDT-012): alert element muncul di DOM
    // dgn atribut role="alert", tapi dialog-content modal Edit tidak selalu carry role="dialog"
    // sehingga descendant selector `${DIALOG} ...` gagal match. Filter role="alert" cukup unik
    // (Sonner toast pakai [data-sonner-toast], bukan [data-slot="alert"]) -> aman dari collision.
    uploadFailAlert: () => cy.get('[data-slot="alert"][role="alert"]'),
    uploadFailTitle: () => cy.get('[data-slot="alert"][role="alert"] [data-slot="alert-title"]'),
    uploadFailDesc: () => cy.get('[data-slot="alert"][role="alert"] [data-slot="alert-description"]'),

    // preview card setelah upload sukses (nama file + trash button)
    filePreviewCard: () => cy.get(`${DIALOG} .rounded-lg.border.bg-card`),
    filePreviewName: () => cy.get(`${DIALOG} .rounded-lg.border.bg-card span.text-sm`),
    filePreviewTrash: () =>
      cy.get(`${DIALOG} .rounded-lg.border.bg-card svg.lucide-trash`).closest('button'),

    // OPSI select (portal, di luar dialog) — exact match
    selectOption: (text) => cy.contains('[role="option"]', rx(text)),
    listbox: () => cy.get('[role="listbox"]', { timeout: 6000 }),

    // TOAST (global, di portal)
    // opts diteruskan ke cy.get — sebelumnya getter ini ()=>, jadi successToast({ timeout })
    // di pemanggil dibuang diam-diam dan yang berlaku tetap 8000.
    successToast: (opts = {}) => cy.get('[data-sonner-toast][data-type="success"]', { timeout: 8000, ...opts }),
    errorToast: () => cy.get('[data-sonner-toast][data-type="error"]', { timeout: 8000 }),

    // ---------- HAPUS (dialog konfirmasi) ----------
    // Modal Hapus pakai role="dialog" (bukan alertdialog), reuse DIALOG selector.
    // Button "Hapus" (destructive): [data-slot="button"] tanpa type="submit" -> distinguish
    // dari saveButton (Edit/Tambah) via text match. Class bg-destructive juga present.
    confirmDeleteButton: () =>
      cy.contains(`${DIALOG} button[data-slot="button"]`, /^\s*Hapus\s*$/),
    // Description paragraph (yg menyebut nama instansi 2x). Ada 2 <p> di dialog:
    //   1) "Perhatian !" (class font-semibold text-lg text-center) — subheader
    //   2) "Apakah anda yakin ingin menghapus Kalender Akademik <X> dari instansi <X>?"
    // Filter via prefix text.
    deleteDialogDesc: () =>
      cy.contains(`${DIALOG} p`, /Apakah anda yakin/i),
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
    this.elements.instansiTrigger().should('not.be.disabled').click();
    // Option di Radix Select bisa ke-cover dialog-overlay / di luar viewport.
    // Pakai exist + scrollIntoView + click force biar bypass visibility check.
    this.elements.selectOption(name).should('exist').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    return this;
  }

  selectAwalPekan(value) {
    this.elements.awalPekanTrigger().should('not.be.disabled').click();
    this.elements.selectOption(value).should('exist').scrollIntoView().click({ force: true });
    this.elements.awalPekanValue().should(($el) => { expect($el.text().trim()).to.eq(value); });
    return this;
  }

  selectNamaPekan(value) {
    this.elements.namaPekanTrigger().should('not.be.disabled').click();
    this.elements.selectOption(value).should('exist').scrollIntoView().click({ force: true });
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
  // cy.contains single-command (bukan chain .find(...)): Sonner toast bisa re-render
  // / dismiss saat modal close + list refresh -> chain sering detach mid-assertion.
  assertSuccessToast(text = 'Kalender Akademik berhasil ditambahkan') {
    cy.contains('[data-sonner-toast][data-type="success"]', text, { timeout: 8000 }).should('exist');
    return this;
  }
  assertNoSuccessToast() {
    cy.get('[data-sonner-toast][data-type="success"]').should('not.exist');
    return this;
  }

  // duplicate -> toast global error, query global (BUKAN scope DIALOG)
  // andalkan retry cy.contains, jangan cy.wait fixed (auto-dismiss).
  // PAKAI should('exist') BUKAN should('be.visible'): Sonner auto-dismiss bisa
  // bikin element ke-detach antara muncul & visibility check.
  assertDuplicateToast(text = 'Pengaturan kalender untuk office ini sudah ada') {
    cy.contains('[data-sonner-toast]', text, { timeout: 12000 }).should('exist');
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
  // Row DENGAN upload header: col-3 berisi <img>. Alt-text bisa beragam (header / kalender / dll),
  // jadi cuma cek <img> exists. Kalau gagal, log isi col-3 supaya bisa diagnose actual HTML.
  assertRowHeaderImage(instansi) {
    cy.contains('table tbody tr', instansi)
      .find('td').eq(3)
      .then(($td) => {
        cy.log(`col-3 HTML untuk "${instansi}": ${$td.html()}`);
        const imgCount = $td.find('img').length;
        expect(
          imgCount,
          `col-3 harus berisi <img> (actual: "${$td.text().trim()}", img count: ${imgCount})`
        ).to.be.greaterThan(0);
      });
    return this;
  }

  // Row TANPA upload header: col-3 berisi teks "-" (placeholder), bukan <img>.
  assertRowNoHeader(instansi) {
    cy.contains('table tbody tr', instansi)
      .find('td').eq(3)
      .should(($td) => {
        expect($td.text().trim()).to.eq('-');
        expect($td.find('img').length, 'tidak ada img di col header').to.eq(0);
      });
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
  //
  // Race-safe: tunggu tbody stabil (min 1 row rendered) dulu sebelum cek text.
  // Sebelumnya .then() langsung eksekusi setelah visit() -> race ke phase sebelum
  // data settled -> bisa false negative -> masuk seed branch -> duplicate error.
  isInstansiInList(instansi) {
    // wait until table has rendered rows (visit() cuma verify table exist)
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.gte', 1);
    return cy.get('table tbody').then(($b) => {
      return $b.text().includes(instansi);
    });
  }

  // ===========================================================================
  // ==========================  EDIT (per row)  ===============================
  // ===========================================================================
  // Modal Edit HTML (dikonfirmasi user 27 Juni 2026):
  //   - Title: "Edit Kalender Akademik"
  //   - 4 field editable: Instansi (anomali - editable!), Awal Pekan, Nama Pekan,
  //     Header (opsional). Semua pola SAMA dgn modal Tambah (label-scoped form-item).
  //   - Preview card muncul kalau row sudah punya header existing (span.text-sm
  //     berisi filename asli dari BE, mis. "Screenshot_(1).png").
  //   - Trash preview card = svg.lucide-trash.text-destructive -> hapus header.
  //   - Save & Cancel/Close X sama pattern dgn Tambah.
  //   - Duplicate constraint (Instansi diubah ke instansi yg sudah punya kalender)
  //     -> toast error SAMA dgn Tambah: "Pengaturan kalender untuk office ini sudah ada"

  // Buka modal Edit untuk row instansi tertentu, tunggu form siap.
  //
  // Race async issue (dikonfirmasi 27 Juni 2026): dialog mount + title muncul
  // duluan, tapi form-fields lazy-load. Fixed cy.wait(1200) ga cukup buat kondisi
  // network lambat -> TC-2/3/6/8/9/... fail dgn "Instansi label not found".
  //
  // Fix: sebelum cek instansiTrigger, tunggu 4 form-label ke-render (Instansi /
  // Awal pekan dimulai / Nama Pekan / Header (Opsional)). Retry-based, timeout 10s.
  //
  // Juga: sebelum buka modal, pastikan dialog previous SUDAH tertutup (biar ga ada
  // race carry-over antara TC).
  openEditModal(instansi) {
    cy.get(DIALOG).should('not.exist'); // ensure clean slate
    this.elements.editIcon(instansi).click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Edit');
    // Async form mount: tunggu 4 form-label ter-render sebelum lanjut.
    cy.get(`${DIALOG} [data-slot="form-label"]`, { timeout: 10000 })
      .should('have.length.gte', 4);
    this.elements.instansiTrigger().should('be.visible');
    return this;
  }

  // ---- Assertion form pre-populated (Edit-only) ----
  assertInstansiFieldValue(text) {
    this.elements.instansiValue().should(($el) => {
      expect($el.text().trim()).to.eq(text);
    });
    return this;
  }
  assertAwalPekanFieldValue(text) {
    this.elements.awalPekanValue().should(($el) => {
      expect($el.text().trim()).to.eq(text);
    });
    return this;
  }
  assertNamaPekanFieldValue(text) {
    this.elements.namaPekanValue().should(($el) => {
      expect($el.text().trim()).to.eq(text);
    });
    return this;
  }
  // untuk Edit: Instansi trigger BUKAN disabled (per HTML konfirmasi user)
  assertInstansiEditable() {
    this.elements.instansiTrigger().should('not.be.disabled').and('not.have.attr', 'aria-disabled', 'true');
    return this;
  }
  // preview card muncul dgn nama file existing dari BE
  assertHasExistingHeaderPreview(fileNameContains) {
    this.elements.filePreviewCard().should('be.visible');
    if (fileNameContains) {
      this.elements.filePreviewName().should('contain.text', fileNameContains);
    }
    return this;
  }

  // ---- Aksi Edit ----
  // Compose helper: ubah field yg di-provide, klik Simpan.
  // opts: { instansi?, awalPekan?, namaPekan?, header?, removeHeader? }
  editKalender(opts = {}) {
    if (opts.removeHeader) this.removeUploadedFile();
    if (opts.instansi) this.selectInstansi(opts.instansi);
    if (opts.awalPekan) this.selectAwalPekan(opts.awalPekan);
    if (opts.namaPekan) this.selectNamaPekan(opts.namaPekan);
    if (opts.header) this.uploadHeader(opts.header);
    this.clickSave();
    return this;
  }

  // Toast sukses Edit (message beda dgn Tambah). Pattern cy.contains — konsisten dgn
  // assertSuccessToast / assertDeleteSuccessToast (anti-detach dari Sonner re-render).
  assertEditSuccessToast(text = 'Kalender Akademik berhasil diperbarui') {
    cy.contains('[data-sonner-toast][data-type="success"]', text, { timeout: 8000 }).should('exist');
    return this;
  }

  // Restore helper: ubah instansi dari srcInstansi ke targetInstansi (pakai Edit).
  // Dipakai buat idempotency (post-test cleanup: pindah balik ke instansi asal).
  moveKalenderInstansi(srcInstansi, targetInstansi) {
    this.openEditModal(srcInstansi);
    this.selectInstansi(targetInstansi);
    this.clickSave();
    this.elements.successToast({ timeout: 8000 }).should('exist'); // sukses atau minimal muncul
    return this;
  }

  // ===========================================================================
  // ====================  LIST: Filter / Sort / Pagination  ===================
  // ===========================================================================

  // ---------- FILTER INSTANSI ----------
  // Pengalaman iterasi 1-3:
  //   Iter1 (click force)       -> label update tapi refetch ngga jalan
  //   Iter2 (pointer + click)   -> sama, label OK table ngga refresh
  //   Iter3 (native click force)-> sama juga
  // Hipotesis final: `{force: true}` SKIP full actionability chain (hover state,
  // focus, obstruction check) -> Radix internal state machine anggap event synthetic
  // dan skip onValueChange trigger. Solusi: `.click()` TANPA force setelah
  // scrollIntoView block:center. Cypress verifikasi actionable dulu lalu fire
  // full mouse+click sequence yang Radix consume dengan benar.
  _radixSelectOption(textOrIdx) {
    const target = typeof textOrIdx === 'number'
      ? cy.get('[role="option"]').eq(textOrIdx)
      : cy.contains('[role="option"]', rx(textOrIdx)).first();
    target.scrollIntoView({ block: 'center' }).click();
    return this;
  }

  openFilterInstansi() {
    this.elements.filterInstansiTrigger().click();
    // Jangan cek first-option visible: opsi #0 sering punya text-muted-foreground
    // + ancestor position:fixed yang ke-overflow visually walau secara DOM ada.
    // Cukup tunggu container listbox + minimal 1 opsi exist.
    cy.get('[role="listbox"]', { timeout: 6000 }).should('exist');
    cy.get('[role="option"]', { timeout: 6000 }).should('have.length.gte', 1);
    return this;
  }

  selectFilterInstansi(text) {
    this.openFilterInstansi();
    this._radixSelectOption(text);
    return this;
  }

  // pilih opsi by index — untuk reproduce BUG-027 (2 opsi "Semua")
  selectFilterByIndex(idx) {
    this.openFilterInstansi();
    this._radixSelectOption(idx);
    return this;
  }

  // pilih opsi "Semua" terakhir (system reset) — yg me-reset label ke "Instansi"
  resetFilterInstansi() {
    this.openFilterInstansi();
    // ambil opsi "Semua" terakhir (per BUG-027, opsi reset ada di posisi ke-2)
    // Konsisten dgn _radixSelectOption: .click() tanpa force setelah scrollIntoView center.
    cy.contains('[role="option"]', rx('Semua')).last()
      .scrollIntoView({ block: 'center' })
      .click();
    return this;
  }

  assertFilterTriggerLabel(text) {
    this.elements.filterInstansiLabel().should('contain.text', text);
    return this;
  }

  // hitung opsi "Semua" di dropdown filter (BUG-027 expects 1, actual 2)
  assertSemuaOptionCount(expectedCount) {
    this.openFilterInstansi();
    cy.contains('[role="option"]', rx('Semua')).should(($els) => {
      expect($els.length, `Jumlah opsi "Semua" harus = ${expectedCount}`).to.eq(expectedCount);
    });
    return this;
  }

  // ---------- SORT (via dropdown-menu di header kolom) ----------
  // Pattern Radix DropdownMenu: klik trigger di header -> menu muncul -> klik menu item.
  // Common labels Radix table: "Sort Ascending", "Sort Descending" (or Indonesian variant).
  openHeaderMenu(headerLabel) {
    this.elements.headerSortTrigger(headerLabel).click();
    cy.get('[role="menu"]', { timeout: 6000 }).should('be.visible');
    return this;
  }

  sortBy(headerLabel, direction) {
    // direction: 'asc' | 'desc'
    // Per manual verify 27 Juni 2026:
    //   - Menu 6 opsi (BAHASA INDONESIA): Menaik / Menurun / Sematkan ke kiri /
    //     Sematkan ke kanan / Pindah ke kiri (disabled) / Pindah ke kanan (disabled)
    //   - Sort behavior manual OK: asc = Digital I. School dulu, desc = SMP+ dulu
    //
    // Iterasi 4-5 (plain click / force click): menu close tapi onSelect ga fire ->
    //   table stay di default order (SMP+, Digital I., SD, SMA - bukan asc/desc).
    //   Root cause: Radix DropdownMenu onSelect handler skip synthetic mouse events.
    //
    // FIX iterasi 6: KEYBOARD NAV (bypass click machinery entirely).
    // Radix DropdownMenu auto-focus item pertama saat menu open. Order menu:
    //   [0] Menaik  [1] Menurun  [2] Sematkan kiri  [3] Sematkan kanan
    //   (Pindah kiri/kanan disabled -> Radix skip di keyboard nav)
    // asc  = {enter}  (Menaik sudah focused)
    // desc = {downArrow}{enter}  (turun ke Menurun lalu enter)
    this.openHeaderMenu(headerLabel);
    // pastikan menu punya menuitem sebelum type
    cy.get('[role="menuitem"]').should('have.length.gte', 2);
    const keys = direction === 'asc' ? '{enter}' : '{downArrow}{enter}';
    cy.focused().type(keys, { force: true });
    return this;
  }

  // ambil isi kolom (eq idx) di semua row visible -> array string trimmed
  getColumnTexts(colIdx) {
    return cy.get('table tbody tr').then(($rows) =>
      Cypress.$.makeArray($rows).map((tr) =>
        Cypress.$(tr).find('td').eq(colIdx).text().trim()
      )
    );
  }

  assertColumnSortedAsc(colIdx) {
    // Retry-based — tunggu re-render sort selesai
    cy.get('table tbody tr', { timeout: 8000 }).should(($rows) => {
      const arr = Cypress.$.makeArray($rows).map((tr) =>
        Cypress.$(tr).find('td').eq(colIdx).text().trim()
      );
      const sorted = [...arr].sort((a, b) => a.localeCompare(b, 'id', { sensitivity: 'base' }));
      expect(arr, `Kolom eq(${colIdx}) harus ascending (got: ${JSON.stringify(arr)})`)
        .to.deep.equal(sorted);
    });
    return this;
  }

  assertColumnSortedDesc(colIdx) {
    cy.get('table tbody tr', { timeout: 8000 }).should(($rows) => {
      const arr = Cypress.$.makeArray($rows).map((tr) =>
        Cypress.$(tr).find('td').eq(colIdx).text().trim()
      );
      const sorted = [...arr].sort((a, b) => b.localeCompare(a, 'id', { sensitivity: 'base' }));
      expect(arr, `Kolom eq(${colIdx}) harus descending (got: ${JSON.stringify(arr)})`)
        .to.deep.equal(sorted);
    });
    return this;
  }

  // ---------- PAGINATION ----------
  setPageSize(size) {
    this.elements.pageSizeTrigger().click();
    cy.contains('[role="option"]', rx(String(size)))
      .scrollIntoView()
      .trigger('pointerdown', { button: 0, force: true })
      .trigger('pointerup', { button: 0, force: true })
      .click({ force: true });
    return this;
  }

  clickPaginationPrev() { this.elements.pagePrevBtn().click({ force: true }); return this; }
  clickPaginationNext() { this.elements.pageNextBtn().click({ force: true }); return this; }

  assertPaginationInfo(regex) {
    this.elements.pageInfo().invoke('text').should('match', regex);
    return this;
  }
  assertPrevDisabled() { this.elements.pagePrevBtn().should('be.disabled'); return this; }
  assertNextDisabled() { this.elements.pageNextBtn().should('be.disabled'); return this; }

  // ---------- EMPTY STATE ----------
  assertEmptyStateVisible() {
    this.elements.emptyStateTitle().should('be.visible');
    cy.get('table tbody tr').should('have.length', 0);
    return this;
  }
  // current state (BUG-028): title pakai "Pendidikan", harusnya "Akademik"
  assertEmptyStateTitle(text) {
    this.elements.emptyStateTitle().should('contain.text', text);
    return this;
  }

  // ---------- ROW COUNT / VISIBILITY ----------
  assertVisibleRowCount(n) {
    cy.get('table tbody tr').should('have.length', n);
    return this;
  }
  getVisibleRowCount() {
    return cy.get('table tbody tr').its('length');
  }

  // ===========================================================================
  // ==========================  HAPUS (per row)  ==============================
  // ===========================================================================
  // Dialog Hapus HTML (dikonfirmasi user 02 Juli 2026):
  //   - Radix Dialog reguler (role="dialog", data-slot="dialog-content") — SAMA pola Add/Edit
  //   - Title h2: "Hapus Kalender Akademik"
  //   - Illustration SVG di tengah + <p>Perhatian !</p> subheader
  //   - Description <p>: "Apakah anda yakin ingin menghapus Kalender Akademik <instansi>
  //                        dari instansi <instansi>?"
  //   - Footer 2 tombol:
  //       * Batal:  button[data-slot="dialog-close"] text "Batal"  -> reuse cancelButton
  //       * Hapus:  button[data-slot="button"] class bg-destructive, text "Hapus"
  //                 (NO type="submit" -> beda dari saveButton di Edit/Tambah)
  //   - Close X pojok kanan atas: button[data-slot="dialog-close"] > svg.lucide-x
  //                               -> reuse closeXButton
  //   - ESC & overlay: Radix Dialog default behavior (bisa close via keduanya)

  openDeleteDialog(instansi) {
    cy.get(DIALOG).should('not.exist'); // clean slate
    this.elements.deleteIcon(instansi).click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Hapus Kalender Akademik');
    return this;
  }

  clickConfirmDelete() {
    // Stabilize sebelum click (pattern analog TC-14): tunggu button visible & enabled
    // biar Cypress retry sampai render settle, hindari "page updated while executing".
    this.elements.confirmDeleteButton().should('be.visible').and('not.be.disabled').click();
    return this;
  }

  clickCancelDelete() {
    // Reuse cancelButton (filter by 'Batal' text) — sama data-slot="dialog-close" pola.
    // Stabilize (analog clickConfirmDelete): tunggu button visible & enabled sebelum
    // click. Anti "page updated while executing" saat Radix DialogFooter re-render
    // sedikit setelah assertDeleteDescMentions bikin subject detach.
    this.elements.cancelButton().should('be.visible').and('not.be.disabled').click();
    return this;
  }

  // Compose helper: buka dialog konfirmasi + confirm delete
  deleteKalender(instansi) {
    this.openDeleteDialog(instansi);
    this.clickConfirmDelete();
    return this;
  }

  assertDeleteDialogOpen() {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Hapus Kalender Akademik');
    return this;
  }

  // Verify description paragraph menyebut nama instansi target
  assertDeleteDescMentions(instansi) {
    this.elements.deleteDialogDesc().should('be.visible').and('contain.text', instansi);
    return this;
  }

  // Toast sukses Hapus (message beda dari Add/Edit).
  // Pattern cy.contains single-command (bukan chain .find(...)): Sonner toast setelah
  // Hapus lebih agresif re-render/dismiss (portal + list re-render setelah row hilang)
  // -> chain .find('[data-title]') sering detach mid-assertion.
  assertDeleteSuccessToast(text = 'Kalender Akademik berhasil dihapus') {
    cy.contains('[data-sonner-toast][data-type="success"]', text, { timeout: 8000 }).should('exist');
    return this;
  }

  // Idempotent seed: ensure row target exists di list (skip Tambah kalau sudah ada).
  // Dipakai di beforeEach spec Hapus supaya setiap TC punya row target siap.
  //
  // Wait sampai tbody terisi min 1 row visible (React batch-render dari 1 fetch),
  // baru scan text tbody untuk instansi target. Kalau `anchorInstansi` diberikan,
  // wait dianchor ke row yg berisi nama tsb (lebih deterministik utk env yg punya
  // instansi permanent). Default: cukup any-row-visible.
  ensureRowExists(instansi, awalPekan = 'Minggu', namaPekan = 'Ahad', anchorInstansi = null) {
    if (anchorInstansi) {
      cy.contains('table tbody tr', anchorInstansi, { timeout: 10000 }).should('be.visible');
    } else {
      cy.get('table tbody tr', { timeout: 10000 }).its('length').should('be.gte', 1);
    }
    cy.get('table tbody').then(($b) => {
      if ($b.text().includes(instansi)) return;
      this.addKalender(instansi, awalPekan, namaPekan);
      this.assertSuccessToast('Kalender Akademik berhasil ditambahkan');
      this.assertModalClosed();
    });
    return this;
  }

  // ---------- TRIGGER (Edit/Hapus) checks tanpa execute action ----------
  assertEditModalOpens(instansi) {
    this.elements.editIcon(instansi).click();
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Edit');
    this.elements.closeXButton().click(); // tutup lagi (kita cuma cek trigger)
    this.assertModalClosed();
    return this;
  }
  assertDeleteDialogOpens(instansi) {
    this.elements.deleteIcon(instansi).click();
    cy.contains(`${DIALOG} [data-slot="dialog-title"]`, /Hapus/i).should('be.visible');
    cy.contains(`${DIALOG} button`, /Batal/i).click(); // batal — row TIDAK boleh terhapus
    this.assertModalClosed();
    this.assertRowExists(instansi);
    return this;
  }
}

export default new KalenderPage();
