# SandboxSDK

A powerful, scalable TypeScript SDK for managing isolated code execution environments (sandboxes) with real-time output streaming, file management, and template-based setup.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)

## Features

- 🚀 **Lightweight & Scalable** - Efficient resource management with proper cleanup
- 🐳 **Template-Based** - Pre-built templates for Python, Node.js, and more
- 💻 **Code Execution** - Run code in isolated sandboxes with real-time streaming
- 📁 **File Management** - Read, write, delete, and list files in sandboxes
- 🔄 **Context Persistence** - Maintain state across multiple code executions
- 🖥️ **Terminal Support** - Execute shell commands within sandboxes
- 📦 **Batch Operations** - Execute multiple jobs efficiently
- 📊 **Metrics & Monitoring** - Track performance and resource usage
- 🛡️ **Rate Limiting** - Built-in protection against abuse
- ⚠️ **Robust Error Handling** - Comprehensive error types and handling
- 🔍 **Configurable Logging** - Debug-friendly logging system
- 🌐 **Socket.IO Based** - Real-time bidirectional communication

## Installation

```bash
npm install sdb-x-sdk
# or
yarn add sdb-x-sdk
# or
pnpm add sdb-x-sdk
```

## Quick Start

### Basic Usage

```typescript
import SandboxSDK from 'sdb-x-sdk';

// Initialize SDK
const sdk = new SandboxSDK({
  apiKey: 'your-api-key',
  serverUrl: 'http://localhost:3000',
  enableLogging: true,
  logLevel: 'info'
});

// Connect to server
await sdk.waitForConnection();

// Create a sandbox
const { sandbox } = await sdk.createSandbox({
  templateId: 'python-3-11',
  name: 'My Python Project'
});

// Run code
const result = await sdk.runCode(sandbox.id, `
  print("Hello from sandbox!")
  x = 10 + 20
  print(f"Result: {x}")
`);

console.log(result.execution.logs.stdout);

// Cleanup
await sdk.deleteSandbox(sandbox.id);
sdk.disconnect();
```

## Configuration

```typescript
interface SandboxSDKConfig {
  apiKey: string;                    // Required: API key for authentication
  serverUrl: string;                 // Required: Server URL (e.g., http://localhost:3000)
  timeout?: number;                  // Default execution timeout in ms (default: 60000)
  maxRetries?: number;               // Number of retries on failure (default: 3)
  retryDelay?: number;               // Delay between retries in ms (default: 1000)
  enableLogging?: boolean;           // Enable console logging (default: false)
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Log level (default: 'info')
  enableMetrics?: boolean;           // Enable metrics collection (default: false)
  metricsInterval?: number;          // Metrics collection interval in ms (default: 30000)
  socketOptions?: Record<string, unknown>; // Custom Socket.IO options
}
```

## Core Concepts

### Sandboxes

A sandbox is an isolated environment where you can execute code. Each sandbox has:
- Unique ID
- Status (creating, ready, running, stopped, error, terminated)
- Assigned template
- Optional expiration time
- Environment variables
- File system

```typescript
// Create sandbox
const { sandbox } = await sdk.createSandbox({
  templateId: 'python-3-11',
  name: 'Data Analysis',
  expiryTime: 3600000, // 1 hour
  initialEnvVars: {
    DEBUG: 'true',
    API_KEY: 'secret123'
  }
});

// Check sandbox status
const status = await sdk.getSandboxStatus(sandbox.id);

// List all sandboxes
const sandboxes = await sdk.listSandboxes();

// Delete sandbox
await sdk.deleteSandbox(sandbox.id);
```

### Templates

Templates are pre-configured environments with default packages and configurations.

```typescript
// Get available templates
const templates = await sdk.getTemplates(1, 10); // page 1, 10 items per page

// Get specific template
const template = await sdk.getTemplate('python-3-11');

// Create custom template
const customTemplate = await sdk.createTemplate({
  name: 'Custom ML Stack',
  language: 'python',
  version: '3.11',
  dockerImage: 'python:3.11-slim',
  dependencies: ['pandas', 'numpy', 'scikit-learn'],
  installCommand: 'pip install -r requirements.txt',
  defaultEnvVars: {
    ML_ENV: 'production'
  }
});
```

### Code Execution

Execute code with real-time output streaming and callbacks.

```typescript
const result = await sdk.runCode(
  sandbox.id,
  `
    import pandas as pd
    print("Loading data...")
    df = pd.read_csv('data.csv')
    print(df.head())
  `,
  {
    timeoutMs: 30000,
    onStdout: (output) => {
      console.log('Output:', output.line);
    },
    onStderr: (output) => {
      console.error('Error:', output.line);
    },
    onResult: (result) => {
      console.log('Result:', result.text);
    },
    onError: (error) => {
      console.error('Execution error:', error.name);
    },
    envs: {
      CUSTOM_VAR: 'value'
    }
  }
);

// Access execution results
console.log('Stdout:', result.execution.logs.stdout);
console.log('Stderr:', result.execution.logs.stderr);
console.log('Results:', result.execution.results);
console.log('Metadata:', result.metadata);
```

### File Management

Work with files in the sandbox file system.

```typescript
// Write file
await sdk.writeFile(
  {
    sandboxId: sandbox.id,
    path: '/workspace/hello.py',
    createParents: true
  },
  `print("Hello from file!")`
);

// Read file
const content = await sdk.readFile({
  sandboxId: sandbox.id,
  path: '/workspace/hello.py'
});

// List files
const files = await sdk.listFiles(sandbox.id, '/workspace');

// Delete file
await sdk.deleteFile({
  sandboxId: sandbox.id,
  path: '/workspace/hello.py'
});
```

### Contexts

Maintain state across multiple code executions.

```typescript
// Create context
const context = await sdk.createCodeContext({
  sandboxId: sandbox.id,
  language: 'python',
  cwd: '/workspace/project'
});

// Run code in context (variables persist)
await sdk.runCode(sandbox.id, 'x = 10');
await sdk.runCode(sandbox.id, 'print(x)'); // prints 10

// List contexts
const contexts = await sdk.listCodeContexts(sandbox.id);

// Delete context
await sdk.deleteCodeContext(context.id);
```

### Terminal Commands

Execute shell commands in the sandbox.

```typescript
const output = await sdk.runTerminal(
  sandbox.id,
  'pip install numpy pandas matplotlib',
  {
    timeoutMs: 60000,
    onStdout: (output) => {
      console.log(output.line);
    }
  }
);

console.log('Installation output:', output);
```

### Batch Operations

Execute multiple jobs efficiently.

```typescript
const jobs = [
  {
    id: 'job-1',
    code: 'print("Job 1")',
    timeout: 10000,
    priority: 1
  },
  {
    id: 'job-2',
    code: 'print("Job 2")',
    timeout: 10000,
    priority: 2
  }
];

const results = await sdk.executeBatch(sandbox.id, jobs);

results.forEach(result => {
  console.log(`${result.jobId}: ${result.success ? 'Success' : result.error}`);
  console.log(`Duration: ${result.duration}ms`);
});
```

## Error Handling

The SDK provides specific error types for different failure scenarios.

```typescript
import SandboxSDK, {
  SandboxSDKError,
  ConnectionError,
  TimeoutError,
  SandboxError,
  RateLimitError
} from 'sdb-x-sdk';

try {
  await sdk.runCode(sandboxId, code);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof TimeoutError) {
    console.log('Operation timed out');
  } else if (error instanceof ConnectionError) {
    console.log('Connection failed');
  } else if (error instanceof SandboxError) {
    console.log('Sandbox error:', error.message);
  } else if (error instanceof SandboxSDKError) {
    console.log('SDK error:', error.message);
  }
}
```

## Monitoring & Metrics

Track SDK performance and resource usage.

```typescript
const sdk = new SandboxSDK({
  apiKey: 'your-api-key',
  serverUrl: 'http://localhost:3000',
  enableMetrics: true,
  metricsInterval: 30000, // collect every 30s
  enableLogging: true,
  logLevel: 'debug'
});

// Get current metrics
const metrics = sdk.getMetrics();

console.log({
  totalRequests: metrics.totalRequests,
  successfulRequests: metrics.successfulRequests,
  failedRequests: metrics.failedRequests,
  averageResponseTime: metrics.averageResponseTime,
  totalExecutionTime: metrics.totalExecutionTime,
  activeSandboxes: metrics.activeSandboxes
});
```

## Advanced Usage

### Multi-Sandbox Orchestration

```typescript
// Create multiple sandboxes
const [pythonSandbox, nodeSandbox] = await Promise.all([
  sdk.createSandbox({ templateId: 'python-3-11' }),
  sdk.createSandbox({ templateId: 'nodejs-18' })
]);

// Run parallel tasks
const [pythonResult, nodeResult] = await Promise.all([
  sdk.runCode(pythonSandbox.sandbox.id, 'print("Python")'),
  sdk.runCode(nodeSandbox.sandbox.id, 'console.log("Node")')
]);

// Cleanup
await Promise.all([
  sdk.deleteSandbox(pythonSandbox.sandbox.id),
  sdk.deleteSandbox(nodeSandbox.sandbox.id)
]);
```

### Environment-Specific Configuration

```typescript
// Development
const devSdk = new SandboxSDK({
  apiKey: process.env.SDK_API_KEY,
  serverUrl: process.env.SDK_SERVER_URL,
  enableLogging: true,
  logLevel: 'debug',
  enableMetrics: true,
  timeout: 120000 // longer timeout for dev
});

// Production
const prodSdk = new SandboxSDK({
  apiKey: process.env.SDK_API_KEY,
  serverUrl: process.env.SDK_SERVER_URL,
  enableLogging: false,
  enableMetrics: true,
  timeout: 60000,
  maxRetries: 3
});
```

### Graceful Shutdown

```typescript
async function shutdown() {
  const sandboxes = await sdk.listSandboxes();
  
  // Delete all sandboxes
  await Promise.all(
    sandboxes.map(sb => sdk.deleteSandbox(sb.id))
  );
  
  // Disconnect
  sdk.disconnect();
  
  console.log('SDK shutdown complete');
}

// Cleanup on exit
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

## API Reference

### SDK Methods

#### Connection Management

- `waitForConnection(timeoutMs?: number): Promise<void>`
- `isReady(): boolean`
- `disconnect(): void`

#### Sandbox Management

- `createSandbox(options: CreateSandboxOptions): Promise<SandboxCreationResponse>`
- `deleteSandbox(sandboxId: string): Promise<void>`
- `getSandboxStatus(sandboxId: string): Promise<SandboxStatus>`
- `listSandboxes(): Promise<SandboxConfig[]>`

#### Template Management

- `getTemplates(page?: number, pageSize?: number): Promise<TemplateListResponse>`
- `getTemplate(templateId: string): Promise<SandboxTemplate>`
- `createTemplate(template: TemplateConfig): Promise<SandboxTemplate>`

#### Code Execution

- `runCode(sandboxId: string, code: string, opts?: RunCodeOptions): Promise<ExecutionResult>`
- `runTerminal(sandboxId: string, command: string, opts?: RunCodeOptions): Promise<string>`

#### File Management

- `readFile(options: FileOperationOptions): Promise<string>`
- `writeFile(options: FileOperationOptions, content: string): Promise<string>`
- `deleteFile(options: Omit<FileOperationOptions, 'encoding'>): Promise<void>`
- `listFiles(sandboxId: string, dirPath?: string): Promise<FileListResponse>`

#### Context Management

- `createCodeContext(options: CreateContextOptions): Promise<CodeContext>`
- `deleteCodeContext(contextId: string): Promise<void>`
- `listCodeContexts(sandboxId: string): Promise<CodeContext[]>`

#### Batch Operations

- `executeBatch(sandboxId: string, jobs: BatchExecutionJob[], opts?: RunCodeOptions): Promise<BatchExecutionResult[]>`

#### Monitoring

- `getMetrics(): MetricsData`

## Examples

### Data Analysis

```typescript
const { sandbox } = await sdk.createSandbox({
  templateId: 'python-data-science',
  name: 'Data Analysis'
});

await sdk.writeFile(
  { sandboxId: sandbox.id, path: '/workspace/analysis.py' },
  `
import pandas as pd
import numpy as np

df = pd.read_csv('data.csv')
print(df.describe())
print(f"Mean: {df['value'].mean()}")
  `
);

const result = await sdk.runCode(
  sandbox.id,
  'exec(open("/workspace/analysis.py").read())'
);
```

### Web Server

```typescript
const { sandbox } = await sdk.createSandbox({
  templateId: 'nodejs-18',
  name: 'Express Server'
});

await sdk.writeFile(
  { sandboxId: sandbox.id, path: '/workspace/server.js' },
  `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from sandbox!' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
  `
);

await sdk.runTerminal(sandbox.id, 'node /workspace/server.js');
```

## Performance Tips

1. **Reuse Contexts** - Keep contexts alive to maintain state
2. **Batch Operations** - Execute multiple jobs together
3. **Enable Metrics** - Monitor performance in production
4. **Set Appropriate Timeouts** - Avoid unnecessary waiting
5. **Cleanup Sandboxes** - Always delete unused sandboxes
6. **Use Rate Limiting** - Respect the rate limit errors

## Troubleshooting

### Connection Timeout

```typescript
// Increase timeout
await sdk.waitForConnection(30000); // 30 seconds

// Check server URL and API key
console.log(sdk.isReady());
```

### Rate Limit Exceeded

```typescript
// Handle rate limit error
try {
  await sdk.runCode(sandboxId, code);
} catch (error) {
  if (error instanceof RateLimitError) {
    await new Promise(resolve => 
      setTimeout(resolve, error.retryAfter)
    );
    // Retry
  }
}
```

### Execution Timeout

```typescript
// Increase execution timeout
const result = await sdk.runCode(sandboxId, code, {
  timeoutMs: 120000 // 2 minutes
});
```

### Missing Files

```typescript
// Ensure parent directories exist
await sdk.writeFile(
  {
    sandboxId,
    path: '/workspace/data/result.txt',
    createParents: true // creates all parent directories
  },
  'content'
);
```

## Best Practices

1. **Always Clean Up Resources**
   ```typescript
   try {
     // Your code
   } finally {
     await sdk.deleteSandbox(sandboxId);
   }
   ```

2. **Use Environment Variables**
   ```typescript
   const { sandbox } = await sdk.createSandbox({
     templateId: 'python-3-11',
     initialEnvVars: {
       DATABASE_URL: process.env.DATABASE_URL,
       API_KEY: process.env.API_KEY
     }
   });
   ```

3. **Implement Error Handling**
   ```typescript
   const result = await sdk.runCode(sandboxId, code, {
     onError: (error) => {
       logger.error('Code execution failed', { error });
     }
   });
   ```

4. **Monitor Resource Usage**
   ```typescript
   const metrics = sdk.getMetrics();
   if (metrics.activeSandboxes > MAX_SANDBOXES) {
     // Implement cleanup logic
   }
   ```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests:
- 📧 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 📖 Docs: [Full documentation](https://docs.example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/example/sdb-x-sdk/issues)

## Changelog

### v1.0.0 (Current)
- Initial release
- Core SDK implementation
- Template management
- Sandbox lifecycle management
- Code execution with streaming
- File management
- Context persistence
- Batch operations
- Metrics and monitoring
- Rate limiting
- Comprehensive error handling

---

**Made with ❤️ for developers**