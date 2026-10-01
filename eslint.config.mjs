import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['dist/**', 'node_modules/**', 'Chrome-Font-Modifier/**'],
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.browser,
                chrome: 'readonly',
            },
        },
        rules: {
            // TypeScript already reports undefined identifiers and does not
            // understand the base ESLint rule's handling of types/globals.
            'no-undef': 'off',
            'no-unused-vars': 'off',
        },
    },
);
