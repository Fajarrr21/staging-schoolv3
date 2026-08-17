// WaktuPerizinanPage.js — POM modul Pengaturan Perizinan (Waktu Perizinan)
// Menu: PENGATURAN > Kesiswaan > Perizinan
//
// ⚠️ STATUS: KERANGKA — belum lewat checkpoint element analysis.
//
// BENTUK: modal-dari-sidebar, sama seperti Legalitas.
// Di repo qa-cazh, POM modul ini cy.visit ke '/setting/student-affairs/violation-type'
// — halaman Tipe Pelanggaran, modul yang BEDA — lalu klik sidebar. Fixture mereka
// menyimpan DUA kandidat route (permission-time & permit-time), tanda bahwa
// route-nya memang tidak pernah dipastikan. Kita tidak menebak route sama sekali.
//
// POLA BARU BUAT KITA: input jam React Aria.
//   [data-slot="datefield"] dengan segmen terpisah [data-type="hour"] & [data-type="minute"].
//   BUKAN <input type="time"> — tidak bisa .clear().type("09:00").
//   Penanganannya ada di SidebarModalPage.fillTime().
//
// Perlu dikonfirmasi saat element analysis:
//   (?) anchorRoute & sidebarPath
//   (?) dialogTitle — qa-cazh menyebut "Pengaturan Perizinan"
//   (?) label switch & label time field
//   (?) apakah time field benar-benar hilang saat switch OFF
//   (?) perilaku input jam tidak valid (mis. 25:00) — auto-cap ke 23:59 atau ditolak?
//   (?) helper text saat ON vs OFF (qa-cazh mencatat dua kalimat berbeda,
//       lihat docs/REFERENSI_ELEMEN.md §4.3 — masih unverified)

import SidebarModalPage from './base/SidebarModalPage';

class WaktuPerizinanPage extends SidebarModalPage {
  constructor() {
    super({
      modul: 'Waktu Perizinan',
      anchorRoute: '/dashboard', // (?) halaman pijakan
      sidebarPath: ['Pengaturan', 'Kesiswaan', 'Perizinan'], // (?)
      dialogTitle: 'Pengaturan Perizinan', // (?)
      fields: {
        instansi: { type: 'select', label: 'Instansi' }, // (?)
        batasAktif: { type: 'switch', label: 'Batas Waktu Maksimal Pengajuan Perizinan' }, // (?)
        batasJam: { type: 'time', label: 'Batas Waktu Maksimal Pengajuan' }, // (?)
      },
      api: { save: null },
    });
  }

  aktifkanBatas(on = true) {
    return this.toggle('batasAktif', on);
  }

  setJam(hhmm) {
    return this.fillTime('batasJam', hhmm);
  }

  /** Saat switch OFF, field jam seharusnya tidak dirender sama sekali. */
  assertJamHidden() {
    return this.assertFieldHidden('batasJam');
  }

  assertJamVisible() {
    return this.assertFieldVisible('batasJam');
  }

  /**
   * Konfigurasi per instansi harus independen: mengubah Instansi A tidak boleh
   * mengubah Instansi B. Helper ini memudahkan TC multi-instansi.
   */
  bukaInstansi(nama) {
    return this.select('instansi', nama);
  }

  atur({ instansi, aktif = true, jam } = {}) {
    if (instansi) this.bukaInstansi(instansi);
    this.aktifkanBatas(aktif);
    if (aktif && jam) this.setJam(jam);
    return this;
  }
}

export default new WaktuPerizinanPage();
