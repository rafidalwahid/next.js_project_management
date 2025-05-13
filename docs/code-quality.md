# Code Quality Tools

This document describes the code quality tools set up in this project and how to use them.

## Overview

The project uses the following tools to maintain code quality:

1. **ESLint**: For static code analysis to catch potential errors and enforce coding standards
2. **Prettier**: For consistent code formatting
3. **TypeScript**: For type checking
4. **Husky**: For Git hooks
5. **lint-staged**: For running linters on staged files

## ESLint

ESLint is configured to enforce coding standards and catch potential errors.

### Configuration

The ESLint configuration is in `eslint.config.js` (ESLint v9 flat config format) and includes:

- Next.js recommended rules
- TypeScript ESLint rules
- React and React Hooks rules
- Prettier integration

> Note: We're using the new ESLint v9 flat config format. The legacy `.eslintrc.json` file is kept for reference but is not active.

### Usage

```bash
# Run ESLint on all files
npm run lint

# Fix automatically fixable issues
npm run lint:fix
```

## Prettier

Prettier ensures consistent code formatting across the project.

### Configuration

The Prettier configuration is in `.prettierrc` and includes settings for:

- Semicolons
- Quotes
- Tab width
- Line length
- And more

### Usage

```bash
# Format all files
npm run format

# Check if files are formatted correctly
npm run format:check
```

## TypeScript

TypeScript provides static type checking to catch type-related errors early.

### Configuration

The TypeScript configuration is in `tsconfig.json` and includes:

- Strict type checking
- No implicit any
- Custom type roots

### Usage

```bash
# Run type checking
npm run type-check
```

## Husky and lint-staged

Husky and lint-staged work together to run linters and formatters on staged files before commits.

### Configuration

- Husky configuration is in `.husky/`
- lint-staged configuration is in `.lintstagedrc.json`

### What happens on commit

When you commit code:

1. lint-staged runs ESLint and Prettier on staged files
2. If there are any errors that can't be automatically fixed, the commit is aborted
3. If all checks pass, the commit proceeds

## Best Practices

1. **Run linters locally**: Run `npm run lint` and `npm run format` before pushing to catch issues early
2. **Fix TypeScript errors**: Address TypeScript errors highlighted by your IDE
3. **Don't bypass hooks**: Avoid using `--no-verify` with git commands
4. **Update configuration as needed**: Adjust ESLint and Prettier rules to match team preferences

## Disabling Rules

Sometimes you may need to disable specific rules:

### ESLint

```javascript
// Disable for a line
// eslint-disable-next-line no-console
console.log('Debug info');

// Disable for a file
/* eslint-disable react-hooks/exhaustive-deps */
```

### Prettier

```javascript
// Disable for a section
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
];
```

## Troubleshooting

### ESLint and Prettier conflicts

If you see conflicts between ESLint and Prettier, ensure that:

1. `eslint-config-prettier` is in your ESLint extends array
2. Prettier is the last item in the extends array

### Husky hooks not running

If Husky hooks aren't running:

1. Ensure the hooks are executable: `chmod +x .husky/*`
2. Check that Husky is installed: `npm run prepare`

### lint-staged failing

If lint-staged is failing:

1. Run the linters manually to see detailed errors
2. Fix the issues and try committing again
