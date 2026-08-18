// environments.js — URL per environment (production & staging).
//
// ⚠️ KREDENSIAL TIDAK di sini. Email/password ada di `cypress.env.json`
// (di-git-ignore, RAHASIA) di bawah key `creds.<environment>`. cypress.config.js
// menggabungkan URL dari file ini + kredensial dari cypress.env.json, lalu
// menaruhnya ke Cypress.env. LoginPage memakainya — jadi TIDAK ada spec/fixture
// yang perlu diedit saat pindah env.
//
// Cara memilih environment (WAJIB eksplisit, tidak ada default):
//   npx cypress run  --env environment=production   (LIVE — https://v3.cazh.id)
//   npx cypress run  --env environment=staging
//   npm run cy:<modul> -- --env environment=staging
//
// ⚠️ production = https://v3.cazh.id adalah SISTEM LIVE (lihat CLAUDE.md).

module.exports = {
  production: {
    baseUrl: 'https://v3.cazh.id',
    loginPath: '/auth/login',
  },

  staging: {
    // Akses direkam 18 Agustus 2026. BELUM diverifikasi lewat run (fokus prod dulu).
    // Catatan: data REFERENSI (instansi, tipeValue, dsb) di fixture masih milik
    // production — sebelum spec dijalankan di staging, nilai-nilai itu perlu
    // dicatat ulang dari staging (lihat rencana per-env `data` di CLAUDE.md).
    baseUrl: 'https://sekolah-digital-indonesia.cazh.id',
    loginPath: '/auth/login',
  },
};
