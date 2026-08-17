// LegalitasBuktiBayarPage.js — POM modul Legalitas Bukti Bayar
// Menu: PENGATURAN > Tagihan > Legalitas Bukti Bayar
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BENTUK: modal-dari-sidebar. Modul ini TIDAK punya halaman sendiri.
// Route-nya KONFLIK di repo qa-cazh (fixture bilang /setting/invoice/legality,
// POM mereka cy.visit ke /setting/invoice/invoice-reminder) — itu justru gejala
// bahwa modul ini memang bukan halaman. Di sini kita pakai anchorRoute +
// sidebarPath, jadi tidak perlu menebak route modulnya.
//
// Satu-satunya modul dengan UPLOAD FILE.
//
// Nama field yang mereka pakai TERLIHAT paling meyakinkan di antara semua POM
// mereka — komentarnya menyebut "explicit name attributes dari DOM untuk
// mencegah silent failure", dan memang dipakai berdiri sendiri (bukan OR-list):
//   input[name="endorsement"]  -> Pengesahan
//   input[name="position"]     -> Jabatan
//   input[name="full_name"]    -> Nama Terang
// Tetap ditandai (?) sampai kita lihat sendiri.
//
// Perlu dikonfirmasi saat element analysis:
//   (?) anchorRoute & sidebarPath — halaman pijakan dan label menu persisnya
//   (?) dialogTitle
//   (?) label tiap field (kita cari lewat label, mereka lewat name)
//   (?) aturan upload: ekstensi & batas ukuran (qa-cazh: PNG/JPG/JPEG < 2MB, tolak PDF)
//   (?) apakah sub-field muncul hanya saat switch ON

import SidebarModalPage from './base/SidebarModalPage';

class LegalitasBuktiBayarPage extends SidebarModalPage {
  constructor() {
    super({
      modul: 'Legalitas Bukti Bayar',
      anchorRoute: '/dashboard', // (?) halaman pijakan; modul ini modal, bukan halaman
      sidebarPath: ['Pengaturan', 'Tagihan', 'Legalitas Bukti Bayar'], // (?)
      dialogTitle: 'Legalitas Bukti Bayar', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi' }, // (?)
        aktif: { type: 'switch', label: 'Legalitas' }, // (?) label switch belum pasti
        pengesahan: { type: 'text', label: 'Pengesahan', name: 'endorsement' }, // (?)
        jabatan: { type: 'text', label: 'Jabatan', name: 'position' }, // (?)
        namaTerang: { type: 'text', label: 'Nama Terang', name: 'full_name' }, // (?)
      },
      api: { save: null }, // (?) isi dari tab Network
    });
  }

  /**
   * Sub-field (Pengesahan/Jabatan/Nama Terang) diduga hanya muncul saat switch ON.
   * Dipisah jadi method sendiri supaya TC conditional-rendering gampang ditulis.
   */
  aktifkan(on = true) {
    return this.toggle('aktif', on);
  }

  assertSubFieldsVisible() {
    ['pengesahan', 'jabatan', 'namaTerang'].forEach((k) => this.assertFieldVisible(k));
    return this;
  }

  assertSubFieldsHidden() {
    ['pengesahan', 'jabatan', 'namaTerang'].forEach((k) => this.assertFieldHidden(k));
    return this;
  }

  /**
   * Upload tanda tangan. File uji disimpan di cypress/fixtures/signature/.
   * CATATAN: file gambarnya BELUM ada di repo kita — qa-cazh punya
   * signature.png/jpg/jpeg + large_signature.png + document.pdf. Kalau modul ini
   * digarap, siapkan file sendiri (jangan salin buta), termasuk satu file >2MB
   * untuk menguji batas ukuran.
   */
  uploadTandaTangan(filePath) {
    return this.upload(filePath);
  }

  isi({ instansi, pengesahan, jabatan, namaTerang } = {}) {
    if (instansi) this.select('instansi', instansi);
    this.aktifkan(true);
    this.fillForm({ pengesahan, jabatan, namaTerang });
    return this;
  }
}

export default new LegalitasBuktiBayarPage();
