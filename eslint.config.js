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
      // Disable React Compiler lint rules — not using React Compiler transform
      'react-hooks/react-compiler': 'off',

      // Downgrade unused vars from error to warning
      '@typescript-eslint/no-unused-vars': 'warn',

      // Keep exhaustive-deps as warning only
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])