// TagPage.js — POM modul Tag (Pengaturan > Akademik > Tag)
// Route: /setting/academic/tag
// Strategi tunggu: FIXED-WAIT (pola Kamar/Kelas/Tingkat/Mapel) — TANPA cy.intercept.
// Field form Tambah:
//   Instansi*       (select)            <- label "Instansi"
//   Nama Tag*       input[name=name]    <- label "Nama Tag"
//   Kode Tag*       input[name=code]    <- label "Kode Tag"
//   Tipe Anggota*   (select)            <- label "Tipe Anggota" (label field configurable; PRD nyebut "Tipe Member")
//     opsi UI: Semua | Siswa | Guru & Staff  (value=ALL | STUDENT | TEACHER) — label opsi configurable, mengikuti PRD
// Opsi select di-pilih via EXACT match (rx) -> hindari tabrakan substring
// (cth: "Sekolah Alam" vs "Sekolah Alam Raya").

const ROUTE = '/setting/academic/tag';
const DIALOG = '[data-slot="dialog-content"][role="dialog"]';
const SETTLE = 1200;       // settle modal re-mount (shadcn form load async)
const DEBOUNCE = 800;      // debounce search
const SAVE_WAIT = 1500;    // tunggu response Simpan (tanpa intercept)

const rx = (t) => new RegExp(`^\\s*${String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
// form-item di dalam dialog yang label-nya mengandung `label`
const formItem = (label) =>
  cy.contains(`${DIALOG} [data-slot="form-label"]`, label).closest('[data-slot="form-item"]');

class TagPage {
  elements = {
    // ---------- LIST ----------
    addButton: () => cy.contains('button[data-slot="dialog-trigger"]', 'Tambah Tag'),
    searchInput: () => cy.get('input[placeholder*="Cari" i]', { timeout: 15000 }),
    table: (opts) => cy.get('table', opts),
    tableRows: () => cy.get('table tbody tr'),
    rowByName: (name) => cy.contains('table tbody tr', name),
    rowByCode: (code) => cy.contains('table tbody tr', code),
    emptyStateTitle: () => cy.contains('Data Tag tidak ditemukan'),

    // toolbar filter — UI pattern: tombol "Filter" (lucide-settings2) -> buka dropdown-menu-content
    // berisi 3 select-trigger (Instansi/Status/Tipe Anggota). Pilih opsi -> auto-apply,
    // panel tutup, list refresh, dan muncul "chip" filter aktif di kiri tombol Filter.
    // Chip struktur: <span[badge]> <span.muted>LABEL</span> <span>VALUE</span> <button x/></span>
    filterButton: () => cy.get('button[data-slot="dropdown-menu-trigger"]').find('svg.lucide-settings2').closest('button'),
    filterPanel: () => cy.get('[data-slot="dropdown-menu-content"]', { timeout: 10000 }),
    filterFieldTrigger: (label) =>
      cy.contains('[data-slot="dropdown-menu-content"] [data-slot="dropdown-menu-label"]', rx(label))
        .parent()
        .find('[data-slot="select-trigger"]'),
    // chip aktif (badge dgn label muted di child pertama) -- exclude badge dalam <tr> tabel (tipe/status row)
    filterChip: (label) =>
      cy.contains('span[data-slot="badge"] > span.text-muted-foreground', rx(label)).parent(),
    removeFilterButton: (label) =>
      cy.contains('span[data-slot="badge"] > span.text-muted-foreground', rx(label))
        .parent()
        .find('button[data-slot="button"]'),

    // ---------- MODAL (re-use Tambah + Edit) ----------
    dialog: () => cy.get(DIALOG, { timeout: 15000 }),
    dialogTitle: () => cy.get(`${DIALOG} [data-slot="dialog-title"]`),
    namaInput: () => cy.get(`${DIALOG} input[name="name"]`),
    kodeInput: () => cy.get(`${DIALOG} input[name="code"]`),
    saveButton: () => cy.get(`${DIALOG} button[type="submit"][data-slot="button"]`),
    cancelButton: () => cy.contains(`${DIALOG} [data-slot="dialog-close"]`, 'Batal'),
    closeXButton: () => cy.get(DIALOG).find('svg.lucide-x').closest('button'),

    // SELECT (label-scoped)
    instansiTrigger: () => formItem('Instansi').find('[data-slot="select-trigger"]'),
    instansiValue: () => formItem('Instansi').find('[data-slot="select-value"]'),
    instansiError: () => formItem('Instansi').find('[data-slot="form-message"]'),
    tipeTrigger: () => formItem('Tipe Anggota').find('[data-slot="select-trigger"]'),
    tipeValue: () => formItem('Tipe Anggota').find('[data-slot="select-value"]'),
    tipeError: () => formItem('Tipe Anggota').find('[data-slot="form-message"]'),
    // Status field hanya ada di modal Edit (bukan Tambah). Pattern sama dgn Tipe (Radix Select).
    statusTrigger: () => formItem('Status').find('[data-slot="select-trigger"]'),
    statusValue: () => formItem('Status').find('[data-slot="select-value"]'),
    statusError: () => formItem('Status').find('[data-slot="form-message"]'),

    namaError: () =>
      cy.get(`${DIALOG} input[name="name"]`).closest('[data-slot="form-item"]').find('[data-slot="form-message"]'),
    kodeError: () =>
      cy.get(`${DIALOG} input[name="code"]`).closest('[data-slot="form-item"]').find('[data-slot="form-message"]'),

    // OPSI select (portal, di luar dialog) — exact match
    selectOption: (text) => cy.contains('[role="option"]', rx(text)),
    listbox: () => cy.get('[role="listbox"]', { timeout: 6000 }),

    // TOAST
    successToast: () => cy.get('[data-sonner-toast][data-type="success"]', { timeout: 12000 }),
    errorToast: () => cy.get('[data-sonner-toast][data-type="error"]', { timeout: 12000 }),

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
    this.waitBodyUnlocked(); // body lock dari TC sebelumnya bisa block addButton click
    this.elements.addButton().click({ force: true });
    this.elements.dialog().should('be.visible');
    cy.wait(SETTLE);
    this.elements.namaInput().should('be.visible'); // form ready
    return this;
  }

  // ===== FORM ACTIONS =====
  // Helper: klik select-trigger + tunggu listbox mount + retry sekali kalau listbox belum buka
  // dalam 300ms (Radix kadang miss first click dlm kondisi modal/portal stacking).
  _openSelectAndWait(triggerEl) {
    triggerEl().should('be.visible').and('not.be.disabled').click({ force: true });
    cy.wait(300);
    cy.get('body').then(($b) => {
      if (!$b.find('[role="option"]').length) {
        cy.log('Listbox tidak terbuka di first click, retry...');
        triggerEl().click({ force: true });
        cy.wait(300);
      }
    });
    cy.get('[role="option"]', { timeout: 8000 }).should('have.length.gte', 1);
    return this;
  }

  selectInstansi(name) {
    this._openSelectAndWait(() => this.elements.instansiTrigger());
    this.elements.selectOption(name).should('be.visible').scrollIntoView().click({ force: true });
    this.elements.instansiValue().should('contain.text', name);
    return this;
  }

  // fill methods: setiap step re-query DOM dgn timeout besar.
  // RHF kadang remount controlled input setelah validasi/state-change -> reference lama jadi
  // stale. Re-query bikin Cypress dapet element baru tiap step.
  fillNama(name) {
    const sel = `${DIALOG} input[name="name"]`;
    cy.get(sel, { timeout: 10000 }).should('be.visible').and('not.be.disabled');
    cy.get(sel).clear({ force: true });
    if (name && name.length) cy.get(sel).type(name, { delay: 10 });
    return this;
  }
  clearNama() {
    const sel = `${DIALOG} input[name="name"]`;
    cy.get(sel, { timeout: 10000 }).should('not.be.disabled').clear({ force: true });
    return this;
  }

  fillKode(code) {
    const sel = `${DIALOG} input[name="code"]`;
    cy.get(sel, { timeout: 10000 }).should('be.visible').and('not.be.disabled');
    cy.get(sel).clear({ force: true });
    if (code && code.length) cy.get(sel).type(code, { delay: 10 });
    return this;
  }
  clearKode() {
    const sel = `${DIALOG} input[name="code"]`;
    cy.get(sel, { timeout: 10000 }).should('not.be.disabled').clear({ force: true });
    return this;
  }

  selectTipe(value) {
    this._openSelectAndWait(() => this.elements.tipeTrigger());
    // hindari hard-depend ke [role=listbox] (Radix Select tidak selalu set role=listbox di popper)
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.tipeValue().should('contain.text', value);
    return this;
  }

  // Status (Edit modal only). Opsi: "Aktif" | "Tidak Aktif". Pattern sama Tipe.
  selectStatus(value) {
    this._openSelectAndWait(() => this.elements.statusTrigger());
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    this.elements.statusValue().should('contain.text', value);
    return this;
  }

  clickSave() { this.elements.saveButton().click({ force: true }); return this; }
  clickCancel() { this.elements.cancelButton().click({ force: true }); return this; }

  // ringkasan: buka modal & isi semua field valid
  addTag(instansi, nama, kode, tipe) {
    this.openAddModal();
    if (instansi) this.selectInstansi(instansi);
    if (typeof nama !== 'undefined') this.fillNama(nama);
    if (typeof kode !== 'undefined') this.fillKode(kode);
    if (tipe) this.selectTipe(tipe);
    this.clickSave();
    return this;
  }

  search(term) {
    this.elements.searchInput().clear().type(term, { delay: 0 });
    cy.wait(DEBOUNCE);
    return this;
  }
  clearSearch() { this.elements.searchInput().clear(); cy.wait(DEBOUNCE); return this; }

  // ===== FILTER ACTIONS (List Tag) =====
  // Flow: klik tombol "Filter" -> pilih opsi di salah satu dari 3 combobox (Instansi/Status/Tipe Anggota)
  //       -> panel auto-close, list refresh, chip filter aktif muncul di kiri tombol Filter.
  //
  // Catatan: Radix dropdown/select MENGUNCI scroll body via style="pointer-events: none"
  //          + data-scroll-locked="1" selama popper open. Auto-close filter panel setelah
  //          option click kadang miss/lag -> body tetap locked walau popper visual sudah hilang.
  //          waitBodyUnlocked() menanggulangi dua-duanya: tekan ESC kalau masih ada popper
  //          sisa, lalu paksa-clear style bila Radix lupa release.
  waitBodyUnlocked() {
    cy.get('body', { log: false }).then(($b) => {
      const hasPopper = $b.find(
        '[data-slot="dropdown-menu-content"], [data-slot="select-content"], [role="option"]'
      ).length > 0;
      if (hasPopper) {
        cy.get('body').type('{esc}', { force: true });
        cy.wait(200, { log: false });
        cy.get('body').type('{esc}', { force: true });
        cy.wait(200, { log: false });
      }
    });
    cy.get('body', { log: false }).then(($b) => {
      if ($b.css('pointer-events') === 'none') {
        cy.window({ log: false }).then((win) => {
          win.document.body.style.pointerEvents = '';
          win.document.body.removeAttribute('data-scroll-locked');
        });
      }
    });
    cy.get('body').should(($b) => {
      expect($b.css('pointer-events'), 'body pointer-events tidak none').not.to.eq('none');
    });
    return this;
  }

  openFilterPanel() {
    this.waitBodyUnlocked();
    this.elements.filterButton().click();
    this.elements.filterPanel().should('be.visible');
    cy.wait(300); // settle popper animation
    return this;
  }

  // Internal: buka panel + pilih opsi di combobox label tertentu.
  // Pakai exact-match (rx) supaya "Aktif" tidak collide "Tidak Aktif".
  applyFilter(label, value) {
    this.openFilterPanel();
    this.elements.filterFieldTrigger(label).should('be.visible').and('not.be.disabled').click({ force: true });
    this.elements.selectOption(value).should('be.visible').click({ force: true });
    // Panel filter & listbox tutup; list refresh (BE filter)
    cy.wait(SETTLE);
    this.waitBodyUnlocked();
    return this;
  }

  filterByInstansi(name) { return this.applyFilter('Instansi', name); }
  filterByStatus(status) { return this.applyFilter('Status', status); }
  filterByTipe(tipe)     { return this.applyFilter('Tipe Anggota', tipe); }

  // Hapus 1 chip filter aktif via tombol X di dalam chip
  removeFilter(label) {
    this.waitBodyUnlocked();
    this.elements.removeFilterButton(label).should('be.visible').click({ force: true });
    cy.wait(SETTLE);
    this.waitBodyUnlocked();
    return this;
  }

  // Hapus semua chip yang aktif (loop satu per satu). Aman dipanggil walau tidak ada chip.
  clearAllFilters() {
    const LABELS = ['Instansi', 'Status', 'Tipe Anggota'];
    LABELS.forEach((label) => {
      cy.get('body').then(($b) => {
        const exists = [...$b.find('span[data-slot="badge"] > span.text-muted-foreground')]
          .some((el) => el.textContent.trim() === label);
        if (exists) this.removeFilter(label);
      });
    });
    return this;
  }

  // ===== DELETE ACTIONS (dipakai modul Hapus & cleanup) =====
  openDeleteByName(name) {
    this.waitBodyUnlocked(); // body lock dari aksi sebelumnya bisa block deleteIcon click
    this.search(name);
    this.elements.rowByName(name).should('be.visible');
    cy.wait(500);
    this.elements.deleteIcon(name).scrollIntoView();
    this.elements.deleteIcon(name).should('be.visible').and('not.be.disabled');
    this.elements.deleteIcon(name).click({ force: true });
    // Defensive retry: kadang first click miss (Radix portal stacking / event race).
    cy.wait(300);
    cy.get('body').then(($b) => {
      if (!$b.find(`${DIALOG}[data-state="open"]`).length) {
        cy.log('Dialog Hapus tidak terbuka di first click, retry...');
        this.elements.deleteIcon(name).click({ force: true });
        cy.wait(300);
      }
    });
    cy.get(`${DIALOG}[data-state="open"]`, { timeout: 15000 }).should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Hapus Tag');
    cy.wait(SETTLE);
    return this;
  }
  confirmDelete() { this.elements.deleteConfirmBtn().click({ force: true }); return this; }
  deleteByName(name) { this.openDeleteByName(name); this.confirmDelete(); return this; }
  pressEscape() { cy.get('body').type('{esc}'); return this; }

  // Popup Hapus PRD memuat nama tag + instansi (cth: "menghapus tag QA123 dari instansi SDIT").
  assertDeletePopupMentions(name, instansi) {
    this.elements.dialog().should('contain.text', name);
    if (instansi) this.elements.dialog().should('contain.text', instansi);
    return this;
  }

  openEditByName(name) {
    this.waitBodyUnlocked(); // body lock dari aksi sebelumnya bisa block editIcon click
    this.search(name);
    this.elements.rowByName(name).should('be.visible');
    cy.wait(500);
    this.elements.editIcon(name).scrollIntoView();
    this.elements.editIcon(name).should('be.visible').and('not.be.disabled');
    this.elements.editIcon(name).click({ force: true });
    // Defensive retry: kadang first click miss (Radix portal stacking / event race) -> dialog gak buka.
    cy.wait(300);
    cy.get('body').then(($b) => {
      if (!$b.find(`${DIALOG}[data-state="open"]`).length) {
        cy.log('Dialog Edit tidak terbuka di first click, retry...');
        this.elements.editIcon(name).click({ force: true });
        cy.wait(300);
      }
    });
    cy.get(`${DIALOG}[data-state="open"]`, { timeout: 15000 }).should('be.visible');
    this.elements.dialogTitle().should('contain.text', 'Edit Tag');
    // Form-ready signal: namaInput mount + pre-fill non-kosong (per HTML, pre-fill instant).
    // Pakai cy.get langsung dgn timeout besar (15s) -- bukan namaInput() yg default 4s.
    // Verify BOTH inputs ready & pre-filled. Form benar-benar fully mounted sebelum return,
    // cegah race fillKode menemukan kodeInput unmount karena form RHF belum stabil.
    cy.get(`${DIALOG} input[name="name"]`, { timeout: 15000 })
      .should('be.visible')
      .and('not.be.disabled')
      .and(($el) => {
        expect($el.val(), 'pre-fill nama non-empty').to.have.length.gt(0);
      });
    cy.get(`${DIALOG} input[name="code"]`, { timeout: 15000 })
      .should('be.visible')
      .and('not.be.disabled')
      .and(($el) => {
        expect($el.val(), 'pre-fill kode non-empty').to.have.length.gt(0);
      });
    cy.wait(300); // buffer kecil supaya RHF benar-benar stabil sebelum aksi berikut
    return this;
  }

  // ===== ASSERTIONS: MODAL =====
  assertModalOpen(title = 'Tambah Tag') {
    this.elements.dialog().should('be.visible');
    this.elements.dialogTitle().should('contain.text', title);
    return this;
  }
  assertModalClosed() { cy.get(DIALOG).should('not.exist'); return this; }

  assertFormEmpty() {
    this.elements.instansiValue().should('contain.text', 'Pilih Instansi');
    this.elements.namaInput().should('have.value', '');
    this.elements.kodeInput().should('have.value', '');
    this.elements.tipeValue().should('contain.text', 'Pilih Tipe Anggota');
    this.elements.saveButton().should('exist');
    this.elements.cancelButton().should('exist');
    return this;
  }

  // Modal Edit: assert field-field pre-filled dgn nilai existing.
  // Field optional di parameter -- yg null/undefined dilewati.
  assertFormPrefilled({ instansi, nama, kode, tipe, status } = {}) {
    if (instansi) this.elements.instansiValue().should('contain.text', instansi);
    if (typeof nama !== 'undefined') this.elements.namaInput().should('have.value', nama);
    if (typeof kode !== 'undefined') this.elements.kodeInput().should('have.value', kode);
    if (tipe)   this.elements.tipeValue().should('contain.text', tipe);
    if (status) this.elements.statusValue().should('contain.text', status);
    return this;
  }

  // assert HANYA ke data-title; description app punya copy typo (BUG-021 "data Kelas") -> jangan di-lock
  // Pakai pola body+callback supaya satu timeout (15s) cover BOTH "toast muncul" & "title match" --
  // chain .get().should().find().should() kadang fallback ke 8s default & ngeretry-nya gak konsisten.
  assertSuccessToast(text = 'Tag berhasil ditambahkan') {
    cy.get('body', { timeout: 15000 }).should(() => {
      const $toasts = Cypress.$('[data-sonner-toast][data-type="success"]');
      expect($toasts.length, 'toast sukses muncul').to.be.gt(0);
      const titleText = $toasts.find('[data-title]').first().text().trim();
      expect(titleText, `toast title contains "${text}"`).to.include(text);
    });
    return this;
  }
  assertNoSuccessToast() { cy.get('[data-sonner-toast][data-type="success"]').should('not.exist'); return this; }

  // FE TIDAK boleh silent: harus ada feedback ke user — toast sukses, toast error,
  // ATAU form-message non-kosong di dialog. Dipakai TC duplikat kode (BUG-020):
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
  assertNamaError(text = 'Nama Tag wajib diisi') {
    this.elements.namaError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertKodeError(text = 'Kode Tag wajib diisi') {
    this.elements.kodeError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertTipeError(text = 'Tipe Anggota wajib diisi') {
    this.elements.tipeError().should('be.visible').and('contain.text', text);
    return this;
  }
  assertStatusError(text = 'Status wajib diisi') {
    this.elements.statusError().should('be.visible').and('contain.text', text);
    return this;
  }
  // field Nama/Kode dalam kondisi valid (tidak di-flag error). Dipakai TC min-boundary (1 char).
  assertNamaFieldValid() {
    cy.get(`${DIALOG} input[name="name"]`).closest('[data-slot="form-item"]')
      .should('have.attr', 'data-invalid', 'false');
    return this;
  }
  assertKodeFieldValid() {
    cy.get(`${DIALOG} input[name="code"]`).closest('[data-slot="form-item"]')
      .should('have.attr', 'data-invalid', 'false');
    return this;
  }

  // Dropdown Tipe Anggota -> 3 opsi sesuai PRD: Semua, Siswa, Guru & Staff.
  // Label & urutan opsi configurable di app (admin bisa set di Pengaturan),
  // jadi assertion bandingkan SET (sorted) -- bukan array order -- agar tahan
  // perubahan urutan label tanpa kehilangan kepastian "tepat 3 opsi PRD".
  assertTipeOptionsSet(expected = ['Semua', 'Siswa', 'Guru & Staff']) {
    this.elements.tipeTrigger().click();
    // tunggu listbox siap via existence salah satu opsi (bukan [role=listbox])
    this.elements.selectOption(expected[0]).should('be.visible');
    cy.get('[role="option"]').should(($opts) => {
      const labels = [...$opts].map((o) => o.textContent.trim()).sort();
      expect(labels, 'opsi Tipe Anggota harus tepat 3 (PRD)').to.deep.equal([...expected].sort());
    });
    cy.get('body').type('{esc}'); // tutup dropdown
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
  assertRowKode(name, kode) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(2).text().trim()).to.eq(kode);
    });
    return this;
  }
  assertRowTipe(name, tipe) {
    this.elements.rowByName(name).should(($row) => {
      expect(Cypress.$($row).find('td').eq(3).find('[data-slot="badge"]').text().trim()).to.eq(tipe);
    });
    return this;
  }
  assertRowStatus(name, status) {
    this.elements.rowByName(name).should(($row) => {
      const badges = Cypress.$($row).find('[data-slot="badge"]');
      // ada 2 badge: kolom Tipe (idx 0) + Status (idx 1). Status = badge terakhir.
      expect(badges.last().text().trim()).to.eq(status);
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
  // Kolom row: Instansi | Nama | Kode | Tipe(badge) | Status(badge) | Dibuat Pada | Edit | Hapus = 8 sel
  assertColumns() {
    cy.get('table tbody tr').first().within(() => {
      cy.get('td').should('have.length', 8);
      cy.get('[data-slot="badge"]').should('have.length', 2);
      cy.get('svg.lucide-square-pen').should('exist');
      cy.get('svg.lucide-trash').should('exist');
    });
    return this;
  }
  assertHasRows() { cy.get('table tbody tr').its('length').should('be.gt', 0); return this; }
  assertEmptyState() { this.elements.emptyStateTitle().should('be.visible'); return this; }

  // baris paling atas = data terbaru (sort default newest-first)
  assertFirstRowName(name) {
    cy.get('table tbody tr').first().should(($row) => {
      expect(Cypress.$($row).find('td').eq(1).text().trim()).to.eq(name);
    });
    return this;
  }

  // ===== ASSERTIONS: FILTER (chip aktif di kiri tombol Filter) =====
  assertActiveFilter(label, value) {
    this.elements.filterChip(label).should('be.visible').and('contain.text', value);
    return this;
  }
  assertNoFilterChip(label) {
    cy.get('body').then(($b) => {
      const matches = [...$b.find('span[data-slot="badge"] > span.text-muted-foreground')]
        .filter((el) => el.textContent.trim() === label);
      expect(matches, `chip filter "${label}" seharusnya tidak ada`).to.have.length(0);
    });
    return this;
  }
  assertNoActiveFilter() {
    ['Instansi', 'Status', 'Tipe Anggota'].forEach((l) => this.assertNoFilterChip(l));
    return this;
  }

  // Semua row tabel kolom-X harus sama dengan nilai expected (untuk asersi filter)
  // colIdx: 0=Instansi, 1=Nama, 2=Kode, 3=Tipe(badge), 4=Status(badge), 5=Dibuat, ...
  assertAllRowsCol(colIdx, expected) {
    cy.get('table tbody tr').should(($rows) => {
      expect($rows.length, 'baris tabel >0').to.be.gt(0);
      [...$rows].forEach((tr) => {
        const td = Cypress.$(tr).find('td').eq(colIdx);
        // pakai badge text kalau ada (kolom Tipe/Status), fallback ke text td biasa
        const text = (td.find('[data-slot="badge"]').first().text() || td.text()).trim();
        expect(text).to.eq(expected);
      });
    });
    return this;
  }
  assertAllRowsInstansi(name)  { return this.assertAllRowsCol(0, name); }
  assertAllRowsTipe(tipe)      { return this.assertAllRowsCol(3, tipe); }
  assertAllRowsStatus(status)  { return this.assertAllRowsCol(4, status); }

  // jeda generik utk operasi simpan tanpa intercept (BE silent / FE silent)
  waitSave() { cy.wait(SAVE_WAIT); return this; }
}

export default new TagPage();
