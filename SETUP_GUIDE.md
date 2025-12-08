# SandboxSDK - Setup & Development Guide

Complete guide to set up and develop the SandboxSDK locally.

## Prerequisites

- **Node.js**: >= 16.0.0 (recommended 18.x or 20.x)
- **npm**: >= 8.0.0 (or use yarn/pnpm)
- **Git**: for version control
- **TypeScript Knowledge**: basic understanding required

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sdb-x-sdk.git
cd sdb-x-sdk
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file (optional):

```bash
cp .env.example .env
```

Update with your values:

```env
SDK_API_KEY=your-api-key
SDK_SERVER_URL=http://localhost:3000
DEBUG=true
```

## Development Workflow

### Build Commands

**Development (Watch Mode)**
```bash
npm run dev
```
Automatically rebuilds TypeScript when files change.

**Production Build**
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/` directory.

**Build ESM Version**
```bash
npm run build:esm
```
Creates ES modules version in `dist/esm/`.

**Clean Build**
```bash
npm run clean
npm run build
```
Removes old build files and rebuilds.

### Testing

**Run Tests**
```bash
npm test
```
Runs all tests once.

**Watch Mode**
```bash
npm run test:watch
```
Reruns tests when files change.

**Coverage Report**
```bash
npm run test:coverage
```
Generates test coverage report in `coverage/` directory.

### Code Quality

**Lint Code**
```bash
npm run lint
```
Check code for linting errors.

**Fix Linting Issues**
```bash
npm run lint:fix
```
Automatically fix linting errors.

**Format Code**
```bash
npm run format
```
Format code using Prettier.

**Check Format**
```bash
npm run format:check
```
Check if code needs formatting.

**Type Check**
```bash
npm run type-check
```
Run TypeScript compiler without emitting files.

### Documentation

**Generate Documentation**
```bash
npm run docs
```
Generates API documentation in `docs/` folder using TypeDoc.

### Validation

**Validate Everything**
```bash
npm run validate
```
Runs: type-check → lint → test (all in one command)

## Project Structure

```
sdb-x-sdk/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── SandboxSDK.ts            # Main SDK class
│   ├── types.ts                 # Type definitions
│   ├── v2.ts                    # Core classes (Result, Execution, etc)
│   └── errors/
│       └── CustomErrors.ts      # Error classes
├── dist/                        # Compiled output
├── docs/                        # Generated documentation
├── coverage/                    # Test coverage reports
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions CI/CD
├── .eslintrc.json              # ESLint configuration
├── .prettierrc.json            # Prettier configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Package metadata
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore rules
```

## Working with TypeScript

### Type Checking

TypeScript is configured with strict mode enabled. Always ensure types are correct:

```bash
npm run type-check
```

### Adding New Features

1. Create a new TypeScript file in `src/`
2. Define types in `types.ts`
3. Implement functionality
4. Export from `index.ts`

Example:

```typescript
// src/myFeature.ts
export interface MyFeatureOptions {
  timeout: number;
  retries: number;
}

export class MyFeature {
  constructor(private options: MyFeatureOptions) {}
  
  async execute(): Promise<string> {
    // Implementation
    return "result";
  }
}

// src/index.ts
export { MyFeature, MyFeatureOptions } from './myFeature.js';
```

## Writing Tests

Create test files with `.test.ts` extension:

```typescript
// src/myFeature.test.ts
import { MyFeature } from './myFeature';

describe('MyFeature', () => {
  it('should execute successfully', async () => {
    const feature = new MyFeature({ timeout: 1000, retries: 3 });
    const result = await feature.execute();
    expect(result).toBe('result');
  });
});
```

Run tests:

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Building & Publishing

### Pre-release Checklist

```bash
# 1. Validate everything
npm run validate

# 2. Build production version
npm run build

# 3. Run full test suite
npm test

# 4. Generate documentation
npm run docs

# 5. Check for unused code/imports
npm run lint
```

### Publishing to npm

#### First Time Setup

1. Create npm account: https://www.npmjs.com/signup
2. Login locally:
   ```bash
   npm login
   ```
3. Create `.npmrc` in home directory (if needed)

#### Publishing Steps

```bash
# 1. Update version in package.json or use npm version
npm version minor  # or patch, major

# 2. This runs prepublishOnly script automatically
npm publish

# 3. Verify on npm
npm view sdb-x-sdk
```

**Note**: The `prepublishOnly` script will:
- Run linter
- Run tests
- Build the package
- Then publish

### GitHub Actions CI/CD

The `.github/workflows/ci-cd.yml` file automatically:

1. **On PR/Push to develop**: Runs tests and lint
2. **On push to main**: Builds, tests, lints, and publishes to npm

Required secrets in GitHub (Settings → Secrets):
- `NPM_TOKEN`: Your npm authentication token

## Debugging

### Enable Debug Logging

```typescript
import SandboxSDK from 'sdb-x-sdk';

const sdk = new SandboxSDK({
  apiKey: 'your-key',
  serverUrl: 'http://localhost:3000',
  enableLogging: true,
  logLevel: 'debug'
});
```

### Debug in VSCode

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug SDK",
      "preLaunchTask": "npm: dev",
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

### Node Inspector

```bash
# Terminal 1: Run with inspector
node --inspect-brk dist/index.js

# Terminal 2: Connect debugger
# Visit chrome://inspect in Chrome
```

## Common Issues & Solutions

### TypeScript Compilation Error

```bash
# Clear cache and rebuild
npm run clean
npm run build
```

### Module Not Found

Ensure all paths in `tsconfig.json` are correct and files exist.

### ESLint Errors

```bash
# Auto-fix most issues
npm run lint:fix

# Check remaining issues
npm run lint
```

### Test Failures

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test
npm test -- myFeature.test.ts
```

### Build Size Too Large

Check bundle with:

```bash
npm install -g webpack-bundle-analyzer
```

## Performance Optimization

### Production Build

The production build outputs:
- `dist/index.js` - CommonJS (Node.js)
- `dist/esm/index.js` - ES Modules
- `dist/**/*.d.ts` - Type definitions

Both versions are optimized and tree-shakeable.

### Monitoring

```typescript
const metrics = sdk.getMetrics();
console.log(metrics);
```

## Contributing

1. Create a new branch
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create PR
   ```bash
   git push origin feature/my-feature
   ```

4. Ensure all checks pass in GitHub

## Version Management

Follows Semantic Versioning:

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

## Useful npm Scripts Summary

| Command | Purpose |
|---------|---------|
| `npm run build` | Build for production |
| `npm run dev` | Watch mode (development) |
| `npm test` | Run all tests |
| `npm run lint` | Check code quality |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Check TypeScript types |
| `npm run validate` | Run all checks |
| `npm run docs` | Generate documentation |
| `npm run clean` | Remove build artifacts |

## Additional Resources

- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **ESLint Docs**: https://eslint.org/docs/
- **Jest Testing**: https://jestjs.io/docs/
- **npm Scripts**: https://docs.npmjs.com/cli/run-script

## Support

For issues during setup:
- Check existing GitHub issues
- Create a new issue with details
- Ask in discussions

---

**Happy coding! 🚀**