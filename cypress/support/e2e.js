// FIX-005 — tahap 1: perilaku run TIDAK berubah (semua error app tetap tidak
// menggagalkan test), tapi error yang belum masuk daftar derau sekarang DICATAT
// ke Cypress log + console. Sebelumnya semuanya ditelan diam-diam, jadi bug JS
// asli di app — yang justru layak jadi temuan QA — tidak pernah kelihatan.
//
// Tahap 2 (setelah kelihatan error apa saja yang benar-benar muncul di run):
// pindahkan yang cuma derau ke NOISE, lalu ganti `return false` di bawah jadi
// `return true` supaya error app asli benar-benar menggagalkan test.
const NOISE = [
  /ResizeObserver loop/i, // derau browser standar, bukan bug app
]

Cypress.on('uncaught:exception', (err) => {
  if (NOISE.some((re) => re.test(err.message))) return false

  Cypress.log({
    name: 'uncaught',
    message: `app error diabaikan (FIX-005): ${err.message}`,
    consoleProps: () => ({ error: err }),
  })
  // eslint-disable-next-line no-console
  console.warn('[uncaught:exception] belum di-whitelist:', err.message)
  return false
})
// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'