import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.webpack/**', 'node_modules/**', 'out/**'],
  },
  ...tseslint.configs.recommended,
);
