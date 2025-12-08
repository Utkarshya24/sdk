# SandboxSDK - Quick Start Guide ⚡

Get started with SandboxSDK in 5 minutes!

## 1️⃣ Installation

```bash
npm install sdb-x-sdk
```

## 2️⃣ Basic Setup

```typescript
import SandboxSDK from 'sdb-x-sdk';

const sdk = new SandboxSDK({
  apiKey: 'your-api-key',
  serverUrl: 'http://localhost:3000'
});

// Wait for connection
await sdk.waitForConnection();
```

## 3️⃣ Create & Run Sandbox

```typescript
// Create sandbox
const { sandbox } = await sdk.createSandbox({
  templateId: 'python-3-11',
  name: 'My First Sandbox'
});

// Run code
const result = await sdk.runCode(sandbox.id, `
  print("Hello from sandbox!")
  print("2 + 2 =", 2 + 2)
`);

console.log(result.execution.logs.stdout);

// Cleanup
await sdk.deleteSandbox(sandbox.id);
sdk.disconnect();
```

## 4️⃣ Available Commands

### Development
```bash
npm run dev              # Watch mode
npm run test:watch      # Watch tests
npm run validate        # Check everything
```

### Building
```bash
npm run build           # Build for production
npm run clean          # Clean build files
npm run build:esm      # ESM version
```

### Quality
```bash
npm run lint           # Check code
npm run format         # Format code
npm run test           # Run tests
```

### Publishing
```bash
npm version minor      # Update version
npm publish           # Publish to npm
```

## 📁 Project Setup

```bash
# Initialize project
mkdir my-sandbox-app
cd my-sandbox-app

# Clone SDK
git clone https://github.com/utkarshya24/sdb-x-sdk.git

cd sdb-x-sdk
npm install

# Start development
npm run dev
```

## 🔧 Configuration Files

Already included:
- ✅ `tsconfig.json` - TypeScript config
- ✅ `.eslintrc.json` - Code quality rules
- ✅ `.prettierrc.json` - Code formatting
- ✅ `package.json` - Dependencies & scripts
- ✅ `.github/workflows/ci-cd.yml` - Auto-publish
- ✅ `.gitignore` - Git ignore rules

## 📊 Build Output

After `npm run build`:

```
dist/
├── index.js            ← Main file
├── index.d.ts          ← Type definitions
├── SandboxSDK.js
├── v2.js
└── esm/               ← ES Module version
    ├── index.js
    └── types.d.ts
```

## 🎯 Common Tasks

### Create & Run Code
```typescript
const result = await sdk.runCode(sandboxId, `
  x = [1, 2, 3, 4, 5]
  print(f"Sum: {sum(x)}")
`);
```

### Manage Files
```typescript
// Write file
await sdk.writeFile({
  sandboxId,
  path: '/workspace/data.csv'
}, csvContent);

// Read file
const content = await sdk.readFile({
  sandboxId,
  path: '/workspace/data.csv'
});

// List files
const files = await sdk.listFiles(sandboxId);
```

### Run Terminal Commands
```typescript
const output = await sdk.runTerminal(
  sandboxId,
  'pip install pandas numpy'
);
```

### Real-time Output
```typescript
const result = await sdk.runCode(sandboxId, code, {
  onStdout: (output) => console.log('OUT:', output.line),
  onStderr: (output) => console.log('ERR:', output.line),
  onError: (error) => console.log('ERROR:', error.name)
});
```

## 🛡️ Error Handling

```typescript
import SandboxSDK, { RateLimitError, TimeoutError } from 'sdb-x-sdk';

try {
  await sdk.runCode(sandboxId, code);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof TimeoutError) {
    console.log('Execution timed out');
  }
}
```

## 📈 Templates Available

```typescript
// Get all templates
const templates = await sdk.getTemplates();

// Popular templates:
// - python-3-11
// - python-3-10
// - nodejs-18
// - nodejs-20
// - ubuntu-22-04
// - custom (create your own)
```

## ✨ Features at a Glance

| Feature | Command |
|---------|---------|
| Create Sandbox | `sdk.createSandbox()` |
| Run Code | `sdk.runCode()` |
| Execute Terminal | `sdk.runTerminal()` |
| Read File | `sdk.readFile()` |
| Write File | `sdk.writeFile()` |
| Delete File | `sdk.deleteFile()` |
| List Files | `sdk.listFiles()` |
| Create Context | `sdk.createCodeContext()` |
| Batch Jobs | `sdk.executeBatch()` |
| Get Metrics | `sdk.getMetrics()` |

## 🚀 Deploy to Production

### Automatic (GitHub Actions)
- Push to `main` branch
- Automatically builds & publishes to npm
- Requires `NPM_TOKEN` secret

### Manual
```bash
npm run validate    # Run all checks
npm version minor   # Update version
npm publish        # Publish to npm
```

## 📚 Documentation

- **README.md** - Full documentation
- **SETUP_GUIDE.md** - Detailed setup guide
- **BUILD_COMMANDS.md** - All npm scripts
- **docs/** - Generated API docs (after `npm run docs`)

## 🔗 Useful Links

- 📦 [npm Package](https://www.npmjs.com/package/sdb-x-sdk)
- 🐙 [GitHub Repository](https://github.com/utkarshya24/sdb-x-sdk)
- 📖 [Full API Reference](./README.md)
- 🛠️ [Development Guide](./SETUP_GUIDE.md)

## 💡 Pro Tips

1. **Use Contexts for Persistent State**
   ```typescript
   const ctx = await sdk.createCodeContext({ sandboxId });
   // Variables persist across executions
   ```

2. **Batch Multiple Jobs**
   ```typescript
   const results = await sdk.executeBatch(sandboxId, jobs);
   ```

3. **Monitor with Metrics**
   ```typescript
   const metrics = sdk.getMetrics();
   console.log('Active sandboxes:', metrics.activeSandboxes);
   ```

4. **Stream Large Outputs**
   ```typescript
   await sdk.runCode(sandboxId, code, {
     onStdout: (output) => handleOutput(output.line)
   });
   ```

5. **Always Cleanup**
   ```typescript
   try {
     // Your code
   } finally {
     await sdk.deleteSandbox(sandboxId);
     sdk.disconnect();
   }
   ```

## ❓ Common Questions

**Q: How do I set environment variables?**
```typescript
const { sandbox } = await sdk.createSandbox({
  initialEnvVars: { DEBUG: 'true' }
});
```

**Q: Can I run multiple sandboxes?**
```typescript
const sb1 = await sdk.createSandbox(...);
const sb2 = await sdk.createSandbox(...);
```

**Q: How long do sandboxes live?**
```typescript
// Set expiry time
const { sandbox } = await sdk.createSandbox({
  expiryTime: 3600000  // 1 hour
});
```

**Q: What languages are supported?**
All languages supported by templates (Python, Node, etc.)

## 🎓 Next Steps

1. Read [README.md](./README.md) for full documentation
2. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for development
3. Review examples in [examples/](./examples/)
4. Try building something cool! 🚀

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Run `npm run validate`
5. Create pull request

## 📞 Support

- Issues: [GitHub Issues](https://github.com/utkarshya24/sdb-x-sdk/issues)
- Discussions: [GitHub Discussions](https://github.com/utkarshya24/sdb-x-sdk/discussions)
- Email: support@example.com

---

**Happy Coding! 🎉**

Built with ❤️ by Utkarsh Yadav