/**
 * SandboxSDK - Main Entry Point
 * 
 * A powerful TypeScript SDK for managing isolated code execution environments
 * with real-time streaming, file management, and template-based setup.
 * 
 * @packageDocumentation
 */

// ============ Main SDK Export ============

export { default as SandboxSDK } from './sandboxSdk.js';

// ============ Error Classes Export ============

export {
  SandboxSDKError,
  ConnectionError,
  TimeoutError,
  SandboxError,
  RateLimitError,
  Result,
  ExecutionError,
  Execution,
} from './sandboxSdk.js';

// ============ Type Definitions Export ============

export type {
  // Chart Types
  ChartType,
  
  // Raw Data
  RawData,
  
  // Logging Types
  Logs,
  OutputMessage,
  
  // Template Types
  TemplateConfig,
  SandboxTemplate,
  
  // Sandbox Types
  SandboxConfig,
  SandboxStatus,
  SandboxEnvironment,
  
  // Context Types
  CodeContext,
  
  // Execution Types
  ExecutionMetadata,
  ExecutionResult,
  
  // Options Types
  RunCodeOptions,
  CreateSandboxOptions,
  CreateContextOptions,
  FileOperationOptions,
  
  // Event Types
  JobResultResponse,
  StreamChunkResponse,
  StreamEndResponse,
  
  // Response Types
  SandboxCreationResponse,
  TemplateListResponse,
  FileListResponse,
  FileInfo,
  ErrorResponse,
  
  // Batch Types
  BatchExecutionJob,
  BatchExecutionResult,
  
  // Configuration Types
  SandboxSDKConfig,
  
  // Rate Limiting Types
  RateLimitConfig,
  RateLimitInfo,
  SocketEvent,
} from './types.js';


// ============ Version Info ============

export const VERSION = '1.0.0';
export const SDK_NAME = 'sdb-x-sdk';

// ============ Default Export ============

import SandboxSDK from './sandboxSdk.js';

export default SandboxSDK;

/**
 * Quick Start Example:
 * 
 * ```typescript
 * import SandboxSDK from 'sdb-x-sdk';
 * 
 * const sdk = new SandboxSDK({
 *   apiKey: 'your-api-key',
 *   serverUrl: 'http://localhost:3000'
 * });
 * 
 * await sdk.waitForConnection();
 * 
 * const { sandbox } = await sdk.createSandbox({
 *   templateId: 'python-3-11'
 * });
 * 
 * const result = await sdk.runCode(sandbox.id, 'print("Hello!")');
 * 
 * await sdk.deleteSandbox(sandbox.id);
 * sdk.disconnect();
 * ```
 */