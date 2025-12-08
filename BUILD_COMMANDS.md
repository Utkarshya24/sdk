# SandboxSDK - Build & Commands Reference

Quick reference for all available npm scripts and build commands.

## 📦 Installation

```bash
npm install
```

## 🏗️ Build Commands

### Development Build (Watch Mode)
```bash
npm run dev
```
- Watches TypeScript files for changes
- Automatically recompiles on save
- Use this during development

### Production Build
```bash
npm run build
```
- Compiles TypeScript to JavaScript
- Generates CommonJS output in `dist/`
- Generates ES Modules in `dist/esm/`
- Creates type definitions (`.d.ts`)
- Optimized for production

### Build ESM Only
```bash
npm run build:esm
```
- Generates only ES Module version
- Output: `dist/esm/`

### Clean Build
```bash
npm run clean
npm run build
```
- Removes all previous build files
- Rebuilds from scratch
- Use when troubleshooting build issues

## 🧪 Testing Commands

### Run Tests Once
```bash
npm test
```
- Executes all test files
- Jest test runner
- Single run then exit

### Watch Mode Tests
```bash
npm run test:watch
```
- Reruns tests when files change
- Perfect for TDD workflow
- Press `q` to quit

### Test Coverage
```bash
npm run test:coverage
```
- Generates coverage report
- Output in `coverage/` directory
- Shows line coverage percentage

## 📝 Code Quality Commands

### Lint Code
```bash
npm run lint
```
- Checks TypeScript code quality
- ESLint with TypeScript rules
- Reports errors and warnings

### Fix Linting Issues
```bash
npm run lint:fix
```
- Automatically fixes linting issues
- Manual review recommended after

### Format Code
```bash
npm run format
```
- Formats code with Prettier
- Consistent code style
- Modifies files in place

### Check Format
```bash
npm run format:check
```
- Checks if code needs formatting
- Doesn't modify files
- Useful in CI/CD

### Type Check
```bash
npm run type-check
```
- Runs TypeScript compiler
- Reports type errors
- Doesn't emit files

## 📚 Documentation Commands

### Generate API Docs
```bash
npm run docs
```
- Generates TypeDoc documentation
- Output in `docs/` directory
- HTML format

## ✅ Validation Commands

### Validate Everything
```bash
npm run validate
```
- Runs all checks in sequence:
  1. `type-check` - TypeScript validation
  2. `lint` - Code quality check
  3. `test` - Run test suite
- Use before commits/PRs

## 🚀 Release Commands

### Patch Release (1.0.0 → 1.0.1)
```bash
npm version patch
npm publish
```

### Minor Release (1.0.0 → 1.1.0)
```bash
npm version minor
npm publish
```

### Major Release (1.0.0 → 2.0.0)
```bash
npm version major
npm publish
```

### Publish to npm
```bash
npm publish
```
- Runs `prepublishOnly` hook automatically
- Validates, builds, tests before publishing
- Requires npm authentication

## 📊 Workflow Examples

### Before Committing
```bash
npm run validate
npm run format
```

### During Development
```bash
# Terminal 1: Watch TypeScript compilation
npm run dev

# Terminal 2: Watch tests
npm run test:watch
```

### Before Push to Main
```bash
npm run clean
npm run build
npm run test:coverage
npm run lint
npm run docs
```

### Release to npm
```bash
npm run validate
npm version minor
npm publish
# GitHub Actions will run prepublishOnly
```

## 🔍 Understanding Build Output

### Directory Structure After Build

```
dist/
├── index.js                 # CommonJS entry point
├── index.d.ts              # Type definitions
├── index.js.map            # Source map
├── SandboxSDK.js            # Main class
├── SandboxSDK.d.ts         # Types
├── types.js                # Type exports
├── types.d.ts              # Type definitions
├── v2.js                   # Core classes
├── v2.d.ts                 # Type definitions
└── esm/                    # ES Module versions
    ├── index.js
    ├── index.d.ts
    ├── SandboxSDK.js
    ├── SandboxSDK.d.ts
    ├── types.js
    ├── types.d.ts
    ├── v2.js
    └── v2.d.ts
```

## 🔧 Advanced Options

### Build with Different Targets

```bash
# Already configured in tsconfig.json
npm run build

# Current target: ES2020
# Module: CommonJS for CJS, ESNext for ESM
```

### Run Tests with Options

```bash
# Specific test file
npm test -- myFile.test.ts

# Verbose output
npm test -- --verbose

# Watch specific test
npm run test:watch -- myFile.test.ts

# Update snapshots
npm test -- -u
```

### Run Linter with Options

```bash
# Check specific file
npm run lint -- src/myFile.ts

# Auto-fix specific file
npm run lint:fix -- src/myFile.ts
```

## 📋 Complete Command Reference Table

| Command | Purpose | Output | Time |
|---------|---------|--------|------|
| `npm run build` | Production build | `dist/` | ~3-5s |
| `npm run dev` | Watch mode | `dist/` (watch) | Instant |
| `npm run build:esm` | ESM build | `dist/esm/` | ~2-3s |
| `npm run clean` | Remove build | - | <1s |
| `npm test` | Run tests once | `coverage/` | ~5-10s |
| `npm run test:watch` | Tests watch | - | Instant |
| `npm run test:coverage` | Coverage report | `coverage/` | ~5-10s |
| `npm run lint` | Check quality | Report | ~2-3s |
| `npm run lint:fix` | Fix issues | Modified files | ~2-3s |
| `npm run format` | Format code | Modified files | ~1-2s |
| `npm run format:check` | Check format | Report | ~1-2s |
| `npm run type-check` | Type validation | Report | ~3-5s |
| `npm run docs` | Generate docs | `docs/` | ~5-10s |
| `npm run validate` | All checks | Report | ~15-25s |
| `npm publish` | Publish to npm | npm registry | ~10s |

## 🎯 Quick Start for New Contributors

```bash
# 1. Clone and install
git clone https://github.com/utkarshya24/sdb-x-sdk.git
cd sdb-x-sdk
npm install

# 2. Start development
npm run dev
npm run test:watch

# 3. Make changes in src/

# 4. Before pushing
npm run validate

# 5. Commit and push
git add .
git commit -m "feat: description"
git push origin feature-branch
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Type Errors

```bash
npm run type-check
# Check error messages and fix in code
```

### Test Failures

```bash
npm run test:watch
# Debug failing tests
npm test -- --verbose
```

### Format Issues

```bash
npm run format
npm run lint:fix
```

## 📖 File Descriptions

**package.json**
- Project metadata
- npm scripts
- Dependencies & devDependencies
- Publish configuration

**tsconfig.json**
- TypeScript compiler options
- Strict type checking enabled
- Path aliases for imports

**.eslintrc.json**
- Code quality rules
- TypeScript linting
- Naming conventions

**.prettierrc.json**
- Code formatting rules
- Consistency across codebase

**.github/workflows/ci-cd.yml**
- Automated testing on push/PR
- Auto-publish to npm on main branch

## 🚀 Deployment

### GitHub Actions CI/CD

On push to `main` branch:
1. ✅ Installs dependencies
2. ✅ Runs linter
3. ✅ Type checks
4. ✅ Runs tests
5. ✅ Builds project
6. ✅ Publishes to npm

On PR to `main`:
1. ✅ Installs dependencies
2. ✅ Runs all tests
3. ✅ Reports results

---

**For more details, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**