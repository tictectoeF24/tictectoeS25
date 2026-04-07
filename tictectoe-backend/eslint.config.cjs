const js = require("@eslint/js");
const globals = require("globals");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    plugins: { js },
    extends: ["js/recommended"],
  },

  // Ignore test files and folders
  {
    ignores: [
      "tests/**",
      "**/*.test.js",
      "**/*.spec.js",
      "coverage/**",
    ],
  },
]);
