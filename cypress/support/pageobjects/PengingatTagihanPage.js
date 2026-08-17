// PengingatTagihanPage.js — POM modul Pengingat Tagihan
// Menu: PENGATURAN > Tagihan > Pengingat Tagihan
//
// ⚠️ STATUS: KERANGKA, hipotesis tinggi. qa-cazh tidak punya POM/fixture untuk
// modul ini; ROUTE DI BAWAH MURNI DUGAAN.
//
// ⚠️ CATATAN SCOPE — BACA SEBELUM BIKIN TC:
// Sebagian expected di TC mereka menyebut "notifikasi akan dikirim via push
// notification pada tanggal & jam yang di-set". Itu TIDAK BISA diverifikasi
// lewat UI Cypress. Saat menyusun TC sheet, pilah dulu:
//   - yang bisa diotomasi  -> form tersimpan, nilai persist, muncul di list
//   - yang tidak bisa      -> pengiriman push/WA yang sesungguhnya
// Jangan menulis TC yang expected-nya tidak mungkin dibuktikan — itu bikin
// suite terlihat luas tapi sebenarnya bohong.
//
// Field menurut judul TC mereka (perlu divalidasi ke PRD):
//   Instansi, Jenis Tagihan, Judul, Pesan, Target, Tanggal, Jam, toggle WA
//
// Perlu dikonfirmasi saat element analysis:
//   (?) SEMUA nilai config
//   (?) tipe field Tanggal (date picker?) & Jam (React Aria datefield?)
//       -> kalau Jam memakai [data-slot="datefield"], polanya sama dengan
//          WaktuPerizinanPage dan penanganannya perlu dipindah ke sini

import CrudListPage from './base/CrudListPage';

class PengingatTagihanPage extends CrudListPage {
  constructor() {
    super({
      route: '/setting/invoice/invoice-reminder', // (?) DUGAAN — qa-cazh pernah
      // cy.visit ke path ini, tapi sebagai PIJAKAN untuk membuka modal Legalitas,
      // bukan sebagai halaman Pengingat Tagihan. Jadi ini petunjuk, bukan bukti.
      modul: 'Pengingat Tagihan',
      addButtonText: 'Tambah Pengingat', // (?)
      titles: {
        add: 'Tambah Pengingat', // (?)
        edit: 'Edit Pengingat', // (?)
        delete: 'Hapus Pengingat', // (?)
      },
      emptyState: 'Data Pengingat Tagihan tidak ditemukan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi' }, // (?)
        jenisTagihan: { type: 'select', label: 'Jenis Tagihan' }, // (?)
        judul: { type: 'text', label: 'Judul', name: 'title' }, // (?)
        pesan: { type: 'text', label: 'Pesan', name: 'message' }, // (?) bisa jadi <textarea>
        target: { type: 'select', label: 'Target' }, // (?)
        // Tanggal & Jam sengaja BELUM dideklarasikan: tipenya belum diketahui
        // (date picker / React Aria time field). Menebaknya di sini justru
        // menyembunyikan bahwa kita belum tahu.
        wa: { type: 'select', label: 'Kirim via WhatsApp' }, // (?) kemungkinan switch
      },
      columns: {
        instansi: 0, // (?)
        jenisTagihan: 1, // (?)
        judul: 2, // (?)
        target: 3, // (?)
        status: 4, // (?)
      },
      api: { list: null, save: null },
    });
  }

  tambah({ instansi, jenisTagihan, judul, pesan, target } = {}) {
    this.openAddModal();
    this.fillForm({ instansi, jenisTagihan, judul, pesan, target });
    this.save();
    return this;
  }
}

export default new PengingatTagihanPage();
