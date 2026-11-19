import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['node_modules', 'data'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-undef': 'off' } },
);
