// ============ Type Definitions ============

import { ExecutionError, Result } from "./index.js";

export interface ChartType {
  type: string;
  title: string;
  elements: unknown[];
}

export interface RawData {
  [key: string]: unknown;
}

export interface Logs {
  stdout: string[];
  stderr: string[];
}

export interface OutputMessage {
  readonly line: string;
  readonly timestamp: number;
  readonly error: boolean;
}

// ============ Template Types ============

export interface TemplateConfig {
  name: string;
  language: string;
  framework?: string;
  version: string;
  dockerImage: string;
  dependencies?: string[];
  installCommand?: string;
  startCommand?: string;
  defaultEnvVars?: Record<string, string>;
  timeoutMs?: number;
  maxInstances?: number;
}

export interface SandboxTemplate {
  id: string;
  config: TemplateConfig;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  authorId?: string;
}

// ============ Sandbox Types ============

export enum SandboxStatus {
  CREATING = "creating",
  READY = "ready",
  RUNNING = "running",
  STOPPED = "stopped",
  ERROR = "error",
  TERMINATED = "terminated"
}

export interface SandboxConfig {
  id: string;
  userId: string;
  templateId: string;
  templateConfig: TemplateConfig;
  status: SandboxStatus;
  containerId?: string;
  port?: number;
  exposedUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SandboxEnvironment {
  sandboxId: string;
  variables: Record<string, string>;
  ports: Map<number, number>; // internal -> external
}

// ============ Context Types ============

export interface CodeContext {
  id: string;
  sandboxId: string;
  language: string;
  cwd: string;
  createdAt: Date;
}

// ============ Execution Types ============

export interface ExecutionMetadata {
  executionId: string;
  sandboxId: string;
  contextId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exitCode?: number;
}

export interface ExecutionResult {
  execution: Execution;
  metadata: ExecutionMetadata;
  timestamp: number;
}

// ============ Options Types ============

export interface RunCodeOptions {
  onStdout?: (output: OutputMessage) => Promise<void> | void;
  onStderr?: (output: OutputMessage) => Promise<void> | void;
  onResult?: (result: Result) => Promise<void> | void;
  onError?: (error: ExecutionError) => Promise<void> | void;
  envs?: Record<string, string>;
  timeoutMs?: number;
  requestTimeoutMs?: number;
  captureOutput?: boolean;
  maxOutputSize?: number; // bytes
}

export interface CreateSandboxOptions {
  templateId: string;
  name?: string;
  expiryTime?: number; // milliseconds
  initialEnvVars?: Record<string, string>;
  metadata?: Record<string, unknown>;
  autoStart?: boolean;
}

export interface CreateContextOptions {
  sandboxId: string;
  cwd?: string;
  language?: string;
  requestTimeoutMs?: number;
}

export interface FileOperationOptions {
  sandboxId: string;
  path: string;
  encoding?: BufferEncoding;
  createParents?: boolean;
}

// ============ Event Types ============

export enum SocketEvent {
  RESULT = "job:result",
  STREAM = "job:stream",
  STREAM_END = "job:stream:end",
  EXECUTE = "job:execute",
  TERMINAL = "job:terminal",
  FILE = "job:file",
  SANDBOX_CREATE = "sandbox:create",
  SANDBOX_DELETE = "sandbox:delete",
  SANDBOX_STATUS = "sandbox:status",
  CONTEXT_CREATE = "context:create",
  CONTEXT_DELETE = "context:delete",
}

export interface JobResultResponse<T = unknown> {
  jobId: string;
  success: boolean;
  output?: T;
  error?: string;
  timestamp?: number;
}

export interface StreamChunkResponse {
  jobId: string;
  chunk: string;
  timestamp?: number;
}

export interface StreamEndResponse {
  jobId: string;
  exitCode?: number;
  timestamp?: number;
}

// ============ Sandbox Creation Response ============

export interface SandboxCreationResponse {
  sandbox: SandboxConfig;
  connectionString?: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

// ============ Template Manager Response ============

export interface TemplateListResponse {
  templates: SandboxTemplate[];
  total: number;
  page: number;
  pageSize: number;
}

// ============ File System Types ============

export interface FileInfo {
  path: string;
  isDirectory: boolean;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface FileListResponse {
  files: FileInfo[];
  directory: string;
}

// ============ Error Response ============

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

// ============ Batch Execution Types ============

export interface BatchExecutionJob {
  id: string;
  code: string;
  language?: string;
  timeout?: number;
  priority?: number; // 1-10, higher = more important
}

export interface BatchExecutionResult {
  jobId: string;
  success: boolean;
  execution?: Execution;
  error?: string;
  duration: number;
}

// ============ SDK Configuration ============

export interface SandboxSDKConfig {
  apiKey: string;
  serverUrl: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
  enableMetrics?: boolean;
  metricsInterval?: number; // milliseconds
  socketOptions?: Record<string, unknown>;
}

// ============ Imports for v2.js compatibility ============

export interface Execution {
  results: Result[];
  logs: Logs;
  error?: ExecutionError;
  executionCount?: number;
}

// ============ Rate Limiting Types ============

export interface RateLimitConfig {
  maxRequestsPerMinute?: number;
  maxConcurrentJobs?: number;
  maxSandboxesPerUser?: number;
  maxStoragePerSandbox?: number; // bytes
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: Date;
}