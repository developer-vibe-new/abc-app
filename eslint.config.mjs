import globals from "globals";
import pluginJs from "@eslint/js";
/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        __dirname: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "semi": ["error", "always"]
    },
  },
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
  pluginJs.configs.recommended,
];
