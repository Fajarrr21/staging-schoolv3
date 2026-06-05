const { defineConfig } = require("cypress");

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
    baseUrl: "https://staging-new-school.cazh.id",
    viewportWidth: 1366,
    viewportHeight: 768,
    defaultCommandTimeout: 10000,
    video: false,
    retries: {
      runMode: 0,
      openMode: 0,
    },
    // 🎯 Cuma scan folder stagingv3
    specPattern: "cypress/e2e/stagingv3/**/*.cy.{js,ts}",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});