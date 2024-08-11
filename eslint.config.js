import js from "@eslint/js"
import pluginVue from "eslint-plugin-vue"
import ts from "typescript-eslint"

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  },
  {
    ignores: ["dist/"],
  },
]
