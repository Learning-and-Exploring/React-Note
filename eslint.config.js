import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // ✅ Disable React Compiler rules (added in react-hooks v5)
      'react-hooks/react-compiler': 'off',

      // ✅ Keep as warn instead of error if you want
      'react-hooks/exhaustive-deps': 'warn',

      // ✅ Disable unused vars errors → warnings
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
])