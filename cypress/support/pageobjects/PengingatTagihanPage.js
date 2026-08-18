// PengingatTagihanPage.js — POM modul Pengingat Tagihan
// Menu: PENGATURAN > Tagihan > Pengingat Tagihan
//
// ✅ STATUS: TERVERIFIKASI 18 Agustus 2026 (DOM + Network asli), MENGGANTIKAN
// kerangka lama. Empat kejutan yang membentuk POM ini:
//
//   1. Form Tambah = HALAMAN `/add`, BUKAN dialog. Klik "Tambah Pengingat"
//      -> navigasi ke /setting/invoice/invoice-reminder/add. Karena itu field
//      di-scope ke <form> (FORM), bukan ke [data-slot="dialog-content"] seperti
//      base CrudListPage. Dialog HANYA dipakai untuk konfirmasi Hapus (diwarisi).
//   2. "Nama Jenis Tagihan" = <select name="type"> NATIVE, walau placeholder-nya
//      "Masukkan...". Diisi via .select(value), by VALUE (label banyak yang kembar).
//   3. Tabel TANPA kolom checkbox -> index kolom 0-based apa adanya.
//   4. Ada 8 field wajib (bukan 4). Submit kosong -> 8 pesan "wajib diisi".
//
// Yang MASIH perlu dikonfirmasi run pertama (ditandai di kode):
//   (?) FORM scope: diasumsikan <form>. Kalau app membungkus lain, ganti 1 baris.
//   (?) instansi/target/pengulangan: diasumsikan Radix select ([role="option"]).
//       Kalau ternyata <select> native, pindahkan ke selectNative() (1 baris/field).
//   (?) DOM internal datepicker (popover kalender) & time (react-aria spinbutton)
//       belum ter-capture utuh -> pickDate()/fillTime() best-effort, lihat komentar.

import CrudListPage from './base/CrudListPage';
import { formItem, rx } from './helpers';

// Scope form halaman /add. Berbeda dari base yang memakai DIALOG.
// Kalau run pertama menunjukkan pembungkusnya bukan <form>, ubah HANYA konstanta ini.
const FORM = 'form';

class PengingatTagihanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/invoice/invoice-reminder',
      addRoute: '/setting/invoice/invoice-reminder/add',
      editRoute: (id) => `/setting/invoice/invoice-reminder/${id}`,
      modul: 'Pengingat Tagihan',
      addButtonText: 'Tambah Pengingat',
      titles: {
        // Form Tambah/Edit halaman (bukan dialog) — judul kartu, dipakai opsional.
        addCard: 'Tambah Pengingat',
        preview: 'Pratinjau',
        // titles.edit / titles.delete sengaja TIDAK diisi: teks belum diverifikasi,
        // biar base tidak meng-assert judul yang belum pasti.
      },
      emptyState: 'Data Pengingat Tagihan tidak ditemukan', // (?) belum ter-capture
      fields: {
        instansi: { type: 'select', name: 'office', label: 'Instansi', placeholder: 'Pilih Instansi' },
        tipe: { type: 'nativeSelect', name: 'type', label: 'Nama Jenis Tagihan', placeholder: 'Masukkan Nama Jenis Tagihan' },
        judul: { type: 'text', name: 'title', label: 'Judul', placeholder: 'Masukkan Judul' },
        pesan: { type: 'text', name: 'message', label: 'Pesan', placeholder: 'Masukkan Pesan' },
        target: { type: 'select', name: 'target', label: 'Target', placeholder: 'Pilih Target' },
        pengulangan: { type: 'select', name: 'bill_repetition', label: 'Pengulangan Tagihan', placeholder: 'Pilih Pengulangan Tagihan' },
        tanggalMulai: { type: 'date', name: 'start_date', label: 'Tanggal Mulai', placeholder: 'Pilih Tanggal Mulai' },
        jam: { type: 'time', label: 'Jam' },
        waSwitch: { type: 'switch', label: 'Kirim invoice melalui Whatsapp?' }, // default OFF
      },
      columns: {
        instansi: 0,
        tanggal: 1, // cth "August 18, 2026"
        pesan: 2,
        jadwal: 3, // cth "Tgl 2 • 03:00"
        status: 4, // badge "Aktif"
      },
      api: {
        list: '**/api/proxy-banking/bill-reminders*', // GET  ?page=1&limit=999 -> 200
        save: '**/api/proxy-banking/bill-reminders', // POST -> 201 Created
      },
    });
  }

  // =========================================================================
  // ELEMENTS — override field getter ke scope FORM (halaman), bukan DIALOG.
  // Getter list/row/hapus/dialog diwarisi apa adanya dari CrudListPage.
  // =========================================================================
  get elements() {
    return {
      ...super.elements,

      // Field di halaman /add (scope <form>).
      fieldItem: (key) => formItem(this._field(key).label, FORM),
      input: (key) =>
        cy.get(`${FORM} input[name="${this._field(key).name}"], ${FORM} textarea[name="${this._field(key).name}"]`, {
          timeout: this.t.dialog,
        }),
      nativeSelect: (key) => cy.get(`${FORM} select[name="${this._field(key).name}"]`, { timeout: this.t.dialog }),
      selectTrigger: (key) => formItem(this._field(key).label, FORM).find('[data-slot="select-trigger"]'),
      selectValue: (key) => formItem(this._field(key).label, FORM).find('[data-slot="select-value"]'),
      fieldError: (key) => formItem(this._field(key).label, FORM).find('[data-slot="form-message"]'),
      switchEl: (key) => formItem(this._field(key).label, FORM).find('button[role="switch"]'),

      // Datepicker: tombol pemicu di dalam form-item -> membuka popover kalender.
      dateTrigger: (key) => formItem(this._field(key).label, FORM).find('button'),

      // Time react-aria: 2 segmen spinbutton (jam, menit) — ambil by urutan supaya
      // tidak bergantung pada atribut data-type yang belum dipastikan.
      timeSegments: (key) => formItem(this._field(key).label, FORM).find('[role="spinbutton"]'),

      // Submit form halaman (bukan tombol di dalam dialog).
      submitButton: () => cy.get(`${FORM} button[type="submit"]`, { timeout: this.t.dialog }),

      // Semua pesan validasi yang sedang tampil di form (buat hitung 8 field wajib).
      allFieldErrors: () => cy.get(`${FORM} [data-slot="form-message"]`),
    };
  }

  // =========================================================================
  // NAVIGATION — Tambah = navigasi ke halaman /add, bukan buka dialog.
  // =========================================================================
  openAdd() {
    this.waitBodyUnlocked();
    this.elements.addButton().click();
    cy.url().should('include', this.cfg.addRoute);
    // Sinyal form siap: field text pertama mount & aktif.
    this.elements.input('judul').should('be.visible').and('not.be.disabled');
    return this;
  }

  /** Edit = navigasi ke /{id}. Belum diverifikasi; aktif saat TC Edit ditulis. */
  openEditByText(text) {
    this.waitBodyUnlocked();
    this.elements.rowByText(text).should('be.visible');
    this.elements.editIcon(text).scrollIntoView().should('be.visible').and('not.be.disabled').click();
    cy.url().should('include', this.cfg.route).and('not.include', '/add');
    this.elements.input('judul').should('be.visible');
    return this;
  }

  // =========================================================================
  // FORM ACTIONS — versi scope FORM + 4 tipe widget.
  // =========================================================================
  /** Isi field text/textarea. String kosong = kosongkan. */
  fill(key, value) {
    this.elements.input(key).should('be.visible').and('not.be.disabled').clear();
    if (value !== '' && value !== null && value !== undefined) {
      this.elements.input(key).type(String(value), { delay: 10 });
    }
    return this;
  }

  /** Radix select (instansi/target/pengulangan) — pilih by teks (exact-match). */
  select(key, value) {
    this.openSelectAndPick(() => this.elements.selectTrigger(key), value);
    this.elements.selectValue(key).should('contain.text', value);
    return this;
  }

  /** Native <select> (tipe) — pilih by VALUE, karena banyak label kembar. */
  selectNative(key, value) {
    this.elements.nativeSelect(key).should('be.visible').select(String(value));
    return this;
  }

  toggle(key, on = true) {
    return this.setSwitch(() => this.elements.switchEl(key), on);
  }

  /**
   * Datepicker (Tanggal Mulai): buka popover kalender lalu klik hari.
   * `day` = angka tanggal di bulan yang sedang tampil.
   * (?) DOM popover belum ter-capture — selector popover & tombol hari best-effort;
   *     kalau meleset, yang diperbaiki hanya 2 baris di sini.
   */
  pickDate(key, day) {
    this.elements.dateTrigger(key).click();
    cy.get('[data-slot="popover-content"], [role="dialog"]', { timeout: this.t.dropdown })
      .should('be.visible')
      .within(() => {
        cy.contains('button', rx(String(day))).click();
      });
    return this;
  }

  /**
   * Time react-aria (Jam): segmen jam & menit terpisah, BUKAN <input type=time>.
   * "HH:mm" -> ketik ke segmen jam lalu segmen menit.
   */
  fillTime(key, hhmm) {
    const [hh, mm] = String(hhmm).split(':');
    if (hh !== undefined) this.elements.timeSegments(key).eq(0).click().type(hh);
    if (mm !== undefined) this.elements.timeSegments(key).eq(1).type(mm);
    return this;
  }

  /** Dispatch semua field sesuai tipe. Nilai date = angka hari; time = "HH:mm". */
  fillForm(values = {}) {
    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined) return;
      const type = this._field(key).type;
      if (type === 'select') this.select(key, value);
      else if (type === 'nativeSelect') this.selectNative(key, value);
      else if (type === 'switch') this.toggle(key, value);
      else if (type === 'date') this.pickDate(key, value);
      else if (type === 'time') this.fillTime(key, value);
      else this.fill(key, value);
    });
    return this;
  }

  // =========================================================================
  // SUBMIT — tombol submit halaman + tunggu POST 201 + kembali ke list.
  // =========================================================================
  submit() {
    if (this.cfg.api.save) cy.intercept('POST', this.cfg.api.save).as('saveAPI');
    this.elements.submitButton().click();
    return this;
  }

  /** Simpan sukses = POST 201 lalu balik ke halaman list (keluar dari /add). */
  submitExpectSuccess() {
    this.submit();
    this.waitAlias('saveAPI', 201);
    cy.url({ timeout: this.t.api }).should('include', this.cfg.route).and('not.include', '/add');
    return this;
  }

  /** Simpan gagal validasi = tetap di /add, pesan wajib muncul. */
  submitExpectValidation() {
    this.submit();
    cy.url().should('include', this.cfg.addRoute);
    return this;
  }

  // =========================================================================
  // ASSERTIONS — versi scope FORM.
  // =========================================================================
  assertFieldError(key, text) {
    const chain = this.elements.fieldError(key).should('be.visible');
    if (text) chain.and('contain.text', text);
    return this;
  }

  /** Minimal `n` pesan wajib tampil sekaligus (kasus submit kosong = 8). */
  assertRequiredCount(n) {
    this.elements.allFieldErrors().filter(':visible').should('have.length.gte', n);
    return this;
  }

  // =========================================================================
  // KOMPOSISI — satu pintu isi form lengkap (dua widget ribet dibungkus di sini).
  // =========================================================================
  isiForm({ instansi, tipe, judul, pesan, target, pengulangan, tanggal, jam, wa } = {}) {
    this.fillForm({
      instansi,
      tipe,
      judul,
      pesan,
      target,
      pengulangan,
      tanggalMulai: tanggal,
      jam,
      waSwitch: wa,
    });
    return this;
  }

  tambah(data = {}) {
    this.openAdd().isiForm(data).submitExpectSuccess();
    return this;
  }
}

export default new PengingatTagihanPage();
