import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.cache/**', 'work/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(JSXElement, JSXFragment) > JSXExpressionContainer > LogicalExpression[operator="&&"], LogicalExpression[operator="&&"] > :matches(JSXElement, JSXFragment)',
          message: 'Use a ternary (condition ? content : null) for conditional JSX rendering.',
        },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.{cjs,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
      },
    },
  },
  prettier,
);
