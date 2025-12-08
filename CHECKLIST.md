# SandboxSDK - Development & Release Checklist

Complete checklist for development, testing, and releasing the SDK.

## 📋 Pre-Development Checklist

- [ ] Node.js (v16+) installed
- [ ] npm/yarn/pnpm installed
- [ ] Git configured
- [ ] Text editor/IDE ready (VSCode recommended)
- [ ] `.env` file created if needed
- [ ] Repository cloned
- [ ] Dependencies installed: `npm install`

## 🔧 Development Checklist

### Before Starting Work
- [ ] Create feature branch: `git checkout -b feature/name`
- [ ] Update branch: `git pull origin develop`
- [ ] Install dependencies: `npm install`
- [ ] Verify setup: `npm run validate`

### During Development
- [ ] Run watch mode: `npm run dev`
- [ ] Run test watch: `npm run test:watch`
- [ ] Write/update tests for new code
- [ ] Follow TypeScript strict mode rules
- [ ] Follow naming conventions (camelCase, PascalCase for types)
- [ ] Add JSDoc comments to public methods

### Code Examples to Include
- [ ] Add usage examples in comments
- [ ] Update README if API changes
- [ ] Document new features in doc comments

## 🧪 Testing Checklist

### Unit Tests
- [ ] All new functions have tests
- [ ] All edge cases covered
- [ ] Error paths tested
- [ ] Mock external dependencies

### Test Execution
- [ ] `npm test` passes
- [ ] `npm run test:coverage` shows >80% coverage
- [ ] No console errors/warnings
- [ ] All tests pass locally

### Integration Tests (if applicable)
- [ ] Tests with real server connection
- [ ] Tests with actual sandboxes
- [ ] Cleanup tests properly

## 📝 Code Quality Checklist

### Linting
- [ ] `npm run lint` passes
- [ ] `npm run lint:fix` auto-fixes applied
- [ ] No ESLint warnings remain

### Formatting
- [ ] `npm run format:check` passes
- [ ] Code follows Prettier rules
- [ ] Consistent indentation (2 spaces)
- [ ] No trailing whitespace

### Type Safety
- [ ] `npm run type-check` passes
- [ ] No `any` types without `@ts-ignore` comment
- [ ] All function parameters typed
- [ ] All return types specified

## 📚 Documentation Checklist

- [ ] README.md updated (if public API changed)
- [ ] JSDoc comments added for new methods
- [ ] Complex logic has explanatory comments
- [ ] Examples added for new features
- [ ] Type definitions exported properly

## 🎯 Pre-Commit Checklist

```bash
# Run before committing
npm run validate
npm run format
git add .
git commit -m "type: description"
```

- [ ] Validation passes: `npm run validate`
- [ ] Code formatted: `npm run format`
- [ ] Commit message follows convention
- [ ] No debug logs/console.logs
- [ ] No commented-out code

## 🔄 Pull Request Checklist

### Before Creating PR
- [ ] All commits are meaningful
- [ ] Commit messages are clear
- [ ] Branch is up to date with main
- [ ] All checks pass locally

### Creating PR
- [ ] PR title is clear and concise
- [ ] Description explains changes
- [ ] Links related issues
- [ ] Screenshots/examples if applicable
- [ ] No merge conflicts

### PR Review
- [ ] Respond to review comments
- [ ] Request re-review after changes
- [ ] Pass all GitHub Actions checks
- [ ] Get approval from maintainers

## 🏗️ Build Checklist

### Pre-Build
- [ ] Clean previous build: `npm run clean`
- [ ] All tests pass: `npm test`
- [ ] Lint passes: `npm run lint`
- [ ] Type check passes: `npm run type-check`

### Build Execution
- [ ] Build succeeds: `npm run build`
- [ ] CommonJS output in `dist/`
- [ ] ESM output in `dist/esm/`
- [ ] Type definitions generated
- [ ] Source maps included

### Post-Build
- [ ] Check build size is reasonable
- [ ] Verify all entry points work
- [ ] Test with `node dist/index.js`
- [ ] No build warnings

## 📦 Release Checklist

### Pre-Release Review
- [ ] Version number decided (major/minor/patch)
- [ ] CHANGELOG updated
- [ ] README reviewed and updated
- [ ] Examples tested and working
- [ ] Dependencies are up to date

### Version Update
```bash
npm run validate          # All checks pass
npm version patch         # or minor/major
npm run build            # Rebuild with new version
```

- [ ] Version bumped correctly
- [ ] Git tags created
- [ ] Commit message generated

### Pre-Publish Validation
- [ ] Full validation runs: `npm run validate`
- [ ] All tests pass
- [ ] Build is clean
- [ ] No console errors
- [ ] Package.json is valid

### Publishing
```bash
npm publish
```

- [ ] Published successfully to npm
- [ ] Tags pushed to GitHub
- [ ] Release notes created on GitHub
- [ ] Announce release (if major)

### Post-Publish
- [ ] Verify on npm: `npm view sdb-x-sdk`
- [ ] Test install: `npm install sdb-x-sdk`
- [ ] Verify documentation updated
- [ ] GitHub Actions passed
- [ ] No errors in CI/CD logs

## 🐛 Bug Fix Checklist

### When Fixing a Bug
1. [ ] Create issue with reproduction steps
2. [ ] Create branch: `git checkout -b fix/issue-name`
3. [ ] Write test that reproduces bug
4. [ ] Implement fix
5. [ ] Verify test passes
6. [ ] Run full validation: `npm run validate`
7. [ ] Create PR with reference to issue
8. [ ] Get code review
9. [ ] Merge and close issue

## ✨ Feature Checklist

### When Adding a Feature
1. [ ] Create issue/discussion describing feature
2. [ ] Create branch: `git checkout -b feature/name`
3. [ ] Write tests first (TDD)
4. [ ] Implement feature
5. [ ] Update type definitions
6. [ ] Add JSDoc comments
7. [ ] Update README if public API
8. [ ] Create examples
9. [ ] Run `npm run validate`
10. [ ] Create PR with description
11. [ ] Address review comments
12. [ ] Merge after approval

## 🔐 Security Checklist

- [ ] No secrets in code or git
- [ ] Dependencies scanned for vulnerabilities
- [ ] Input validation implemented
- [ ] Error messages don't leak info
- [ ] No unsafe eval or dynamic code
- [ ] Dependencies are from trusted sources

## 🚀 Deployment Checklist

### GitHub Actions Setup
- [ ] `.github/workflows/ci-cd.yml` configured
- [ ] `NPM_TOKEN` secret added
- [ ] Tests run on PR
- [ ] Auto-publish on main branch

### Before Deploying
- [ ] All GitHub Actions pass
- [ ] Code review approved
- [ ] Tests pass in CI/CD
- [ ] Build succeeds in CI/CD

## 📊 Metrics Checklist

- [ ] Test coverage > 80%
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No security vulnerabilities
- [ ] Build time reasonable
- [ ] Package size acceptable

## 🎓 Documentation Review

- [ ] README.md is comprehensive
- [ ] SETUP_GUIDE.md covers setup
- [ ] BUILD_COMMANDS.md lists all scripts
- [ ] API examples are working
- [ ] Troubleshooting section helpful
- [ ] Contributing guidelines clear

## 📋 Final Release Checklist

```
Development Complete
├─ [ ] All features implemented
├─ [ ] All tests passing
├─ [ ] Code reviewed
├─ [ ] Documentation updated
└─ [ ] Validation passes

Build Ready
├─ [ ] Build succeeds
├─ [ ] No errors or warnings
├─ [ ] All artifacts generated
└─ [ ] Size is acceptable

Ready to Release
├─ [ ] Version bumped
├─ [ ] Changelog updated
├─ [ ] All checks pass
└─ [ ] GitHub Actions pass

Published
├─ [ ] npm publish successful
├─ [ ] Package verified on npm
├─ [ ] GitHub tags created
└─ [ ] Release notes posted
```

## 🔄 Post-Release

- [ ] Monitor for user issues
- [ ] Check error reports
- [ ] Respond to feedback
- [ ] Plan next iteration
- [ ] Thank contributors

## 📞 When Stuck

1. [ ] Check existing issues/discussions
2. [ ] Review error messages carefully
3. [ ] Run `npm run validate`
4. [ ] Check git status: `git status`
5. [ ] Review recent changes
6. [ ] Ask in discussions or create issue
7. [ ] Check documentation

## 💾 Backup Checklist

- [ ] Code committed to git
- [ ] Branch pushed to remote
- [ ] Local backups not needed (git is backup)
- [ ] npm-shrinkwrap.json if needed

---

**Remember**: Checklist is helpful, but not gospel. Adapt as needed for your workflow. 🚀

Good luck with development! 💪