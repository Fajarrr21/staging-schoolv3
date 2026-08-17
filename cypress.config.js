const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

module.exports = defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/reports",
    overwrite: false,
    html: false,
    json: true,
    timestamp: "mmddyyyy_HHMMss",
  },
  e2e: {
    baseUrl: "https://v3.cazh.id",
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    // 🎥 Video & screenshot untuk dokumentasi bug
    video: true,
    videoCompression: 32,
    videosFolder: "cypress/videos",
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/screenshots",
    retries: {
      runMode: 0,
      openMode: 0,
    },
    // 🎯 Cuma scan folder stagingv3
    specPattern: "cypress/e2e/stagingv3/**/*.cy.{js,ts}",
    downloadsFolder: "cypress/downloads",
    setupNodeEvents(on, config) {
      // ⬇️ FIX-007 — task untuk menguji fitur Export/Download.
      // Sebelumnya modul yang punya tombol Export cuma bisa dicek "tombolnya keklik",
      // tidak sampai isi filenya. Task ini jalan di Node (punya akses fs), dipanggil
      // dari spec lewat cy.task(...).
      //
      // Pola pakai di spec:
      //   cy.task('clearDownloads')                       // sebelum klik Export
      //   ...klik tombol Export...
      //   cy.task('findDownload', { ext: '.xlsx' })       // retry sampai file muncul
      //     .should('not.be.null')
      //     .then((file) => cy.task('readSheet', { filePath: file }))
      //     .then((rows) => { expect(rows).to.have.length.gt(0) })
      const DOWNLOADS = path.join(__dirname, "cypress", "downloads");

      on("task", {
        /** Kosongkan folder downloads. Panggil SEBELUM klik Export biar tidak
         *  tertukar dengan file sisa run sebelumnya. */
        clearDownloads() {
          if (fs.existsSync(DOWNLOADS)) {
            for (const f of fs.readdirSync(DOWNLOADS)) {
              try {
                fs.unlinkSync(path.join(DOWNLOADS, f));
              } catch (_) {
                /* file terkunci proses lain; abaikan */
              }
            }
          }
          return null;
        },

        /** File terbaru dengan ekstensi tertentu. null kalau belum ada —
         *  supaya bisa di-retry pakai .should('not.be.null'). */
        findDownload({ ext = ".xlsx" } = {}) {
          if (!fs.existsSync(DOWNLOADS)) return null;
          const files = fs
            .readdirSync(DOWNLOADS)
            .filter((f) => f.toLowerCase().endsWith(ext.toLowerCase()))
            // .crdownload = unduhan Chrome yang BELUM selesai — jangan dianggap ada
            .filter((f) => !f.endsWith(".crdownload"))
            .map((f) => path.join(DOWNLOADS, f))
            .filter((f) => fs.statSync(f).isFile());
          if (!files.length) return null;
          files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
          return files[0];
        },

        /** Metadata file: ukuran & waktu modifikasi. Berguna untuk assert file
         *  tidak kosong tanpa perlu mem-parse isinya. */
        statDownload({ filePath }) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          const s = fs.statSync(filePath);
          return { size: s.size, mtimeMs: s.mtimeMs, name: path.basename(filePath) };
        },

        /** Baca isi .xlsx jadi array of object (sheet pertama).
         *  Butuh dependency `xlsx` — BELUM terpasang. Selama belum ada, task ini
         *  mengembalikan objek error yang jelas, BUKAN melempar exception yang
         *  bikin spec gagal dengan pesan membingungkan.
         *  Pasang dengan: npm i -D xlsx */
        readSheet({ filePath, sheet } = {}) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          let XLSX;
          try {
            // eslint-disable-next-line global-require
            XLSX = require("xlsx");
          } catch (_) {
            return {
              error:
                "dependency 'xlsx' belum terpasang — jalankan: npm i -D xlsx",
            };
          }
          const wb = XLSX.readFile(filePath);
          const name = sheet || wb.SheetNames[0];
          return XLSX.utils.sheet_to_json(wb.Sheets[name]);
        },

        /** Baca file teks (CSV / TXT) apa adanya. Tidak butuh dependency apa pun. */
        readTextFile({ filePath }) {
          if (!filePath || !fs.existsSync(filePath)) return null;
          return fs.readFileSync(filePath, "utf8");
        },
      });

      // 🗑️ Hapus video kalau spec lulus semua (hemat disk; cuma keep video FAIL).
      // Screenshot otomatis hanya muncul saat fail (per screenshotOnRunFailure),
      // jadi tidak perlu cleanup tambahan untuk screenshots.
      on("after:spec", (spec, results) => {
        if (!results || !results.video) return;
        const failed = (results.tests || []).some((t) =>
          (t.attempts || []).some((a) => a.state === "failed")
        );
        if (!failed) {
          try {
            fs.unlinkSync(results.video);
          } catch (_) {
            // file mungkin sudah ke-hapus / belum sempat ter-write; abaikan.
          }
        }
      });
    },
  },
});
