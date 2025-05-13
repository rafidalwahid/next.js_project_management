# Code Quality Tools Setup

## What's Been Implemented

We've set up a comprehensive code quality toolchain for your project:

1. **ESLint** - For static code analysis
   - Using ESLint v9 with the new flat config format (`eslint.config.js`)
   - Configured with rules for React, TypeScript, and Next.js
   - Warns about common issues like unused variables and console logs

2. **Prettier** - For consistent code formatting
   - Configured with project-specific formatting rules
   - Integrated with ESLint to avoid conflicts
   - Set to use single quotes, 2-space indentation, and 100-character line length

3. **Husky** - For Git hooks
   - Pre-commit hook to run linters before code is committed
   - Prevents committing code that doesn't meet quality standards

4. **lint-staged** - For optimized linting
   - Only runs linters on files that are staged for commit
   - Makes the pre-commit process faster and more efficient

5. **TypeScript Configuration**
   - Added script to run type checking (`npm run type-check`)
   - Set up for future strict type checking

## New NPM Scripts

The following scripts have been added to your `package.json`:

- `npm run lint` - Run ESLint on all files
- `npm run lint:fix` - Fix automatically fixable ESLint issues
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files are formatted correctly
- `npm run type-check` - Run TypeScript type checking

## Configuration Files

The following configuration files have been added or modified:

- `eslint.config.js` - ESLint configuration (new flat config format)
- `.eslintrc.json` - Legacy ESLint configuration (kept for reference)
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to exclude from Prettier
- `.lintstagedrc.json` - lint-staged configuration
- `.husky/pre-commit` - Husky pre-commit hook

## Documentation

Detailed documentation has been added at:

- `docs/code-quality.md` - Comprehensive guide to the code quality tools

## Next Steps

1. **Fix Existing Issues**:
   - Run `npm run lint` to see all ESLint issues
   - Run `npm run format` to fix formatting issues
   - Address TypeScript errors gradually

2. **Enable Strict TypeScript Checking**:
   - Once most TypeScript errors are fixed, set `ignoreBuildErrors: false` in `next.config.mjs`

3. **Customize Rules**:
   - Adjust ESLint and Prettier rules to match your team's preferences
   - Add or remove rules as needed in `eslint.config.js` and `.prettierrc`

4. **Integrate with CI/CD**:
   - Add linting and type checking to your CI/CD pipeline
   - Fail builds that don't meet quality standards

## Usage Examples

### Fixing ESLint Issues

```bash
# See all issues
npm run lint

# Fix automatically fixable issues
npm run lint:fix
```

### Formatting Code

```bash
# Format all files
npm run format

# Check if files are formatted correctly
npm run format:check
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Committing Code

Simply use Git as normal. The pre-commit hook will automatically run linters on staged files:

```bash
git add .
git commit -m "Your commit message"
```

If there are issues that can't be automatically fixed, the commit will be aborted with error messages.
