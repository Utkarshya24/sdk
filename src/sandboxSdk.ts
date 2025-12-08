import { io, Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import {
  SandboxSDKConfig,
  TemplateConfig,
  SandboxTemplate,
  SandboxConfig,
  SandboxStatus,
  CreateSandboxOptions,
  CodeContext,
  CreateContextOptions,
  RunCodeOptions,
  FileOperationOptions,
  ExecutionMetadata,
  ExecutionResult,
  SocketEvent,
  JobResultResponse,
  StreamChunkResponse,
  StreamEndResponse,
  SandboxCreationResponse,
  TemplateListResponse,
  FileListResponse,
  BatchExecutionJob,
  BatchExecutionResult,
  ChartType,
  RawData,
  Logs
} from "./types.js";

// ============ Custom Errors ============

export class SandboxSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxSDKError";
    Object.setPrototypeOf(this, SandboxSDKError.prototype);
  }
}

export class ExecutionError extends Error {
  constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly traceback: string
  ) {
    super(value);
    this.name = name;
  }
}

export class ConnectionError extends SandboxSDKError {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

export class TimeoutError extends SandboxSDKError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export class SandboxError extends SandboxSDKError {
  constructor(message: string) {
    super(message);
    this.name = "SandboxError";
  }
}

export class RateLimitError extends SandboxSDKError {
  constructor(public readonly retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = "RateLimitError";
  }
}

export class Execution {
  results: Result[];
  logs: Logs;
  error?: ExecutionError;
  executionCount?: number;

  constructor(
    results: Result[] = [],
    logs: Logs = { stdout: [], stderr: [] },
    error?: ExecutionError,
    executionCount?: number
  ) {
    this.results = results;
    this.logs = logs;
    this.error = error;
    this.executionCount = executionCount;
  }

  get text(): string | undefined {
    return this.results.find(result => result.isMainResult)?.text;
  }

  toJSON() {
    return {
      results: this.results,
      logs: this.logs,
      error: this.error,
    };
  }
}

export class Result {
  readonly isMainResult: boolean;
  readonly text?: string;
  readonly html?: string;
  readonly markdown?: string;
  readonly svg?: string;
  readonly png?: string;
  readonly jpeg?: string;
  readonly pdf?: string;
  readonly latex?: string;
  readonly json?: string;
  readonly javascript?: string;
  readonly data?: Record<string, unknown>;
  readonly chart?: ChartType;
  readonly extra: Record<string, unknown>;
  readonly raw: RawData;

  constructor(rawData: RawData, isMainResult: boolean) {
    this.isMainResult = isMainResult;
    this.raw = { ...rawData };

    this.text = rawData["text"] as string | undefined;
    this.html = rawData["html"] as string | undefined;
    this.markdown = rawData["markdown"] as string | undefined;
    this.svg = rawData["svg"] as string | undefined;
    this.png = rawData["png"] as string | undefined;
    this.jpeg = rawData["jpeg"] as string | undefined;
    this.pdf = rawData["pdf"] as string | undefined;
    this.latex = rawData["latex"] as string | undefined;
    this.json = rawData["json"] as string | undefined;
    this.javascript = rawData["javascript"] as string | undefined;
    this.data = rawData["data"] as Record<string, unknown> | undefined;
    this.chart = rawData["chart"] as ChartType | undefined;

    this.extra = {};
    const reservedKeys = [
      "text",
      "html",
      "markdown",
      "svg",
      "png",
      "jpeg",
      "pdf",
      "latex",
      "json",
      "javascript",
      "data",
      "chart",
      "type",
      "is_main_result",
    ];

    for (const key of Object.keys(rawData)) {
      if (!reservedKeys.includes(key)) {
        this.extra[key] = rawData[key];
      }
    }
  }

  formats(): string[] {
    const formats: string[] = [];
    if (this.text) formats.push("text");
    if (this.html) formats.push("html");
    if (this.markdown) formats.push("markdown");
    if (this.svg) formats.push("svg");
    if (this.png) formats.push("png");
    if (this.jpeg) formats.push("jpeg");
    if (this.pdf) formats.push("pdf");
    if (this.latex) formats.push("latex");
    if (this.json) formats.push("json");
    if (this.javascript) formats.push("javascript");
    if (this.data) formats.push("data");
    if (this.chart) formats.push("chart");
    for (const key of Object.keys(this.extra)) {
      formats.push(key);
    }
    return formats;
  }

  toJSON() {
    return {
      text: this.text,
      html: this.html,
      markdown: this.markdown,
      svg: this.svg,
      png: this.png,
      jpeg: this.jpeg,
      pdf: this.pdf,
      latex: this.latex,
      json: this.json,
      javascript: this.javascript,
      ...(Object.keys(this.extra).length > 0 ? { extra: this.extra } : {}),
    };
  }
}

// ============ Metrics Collector ============

interface MetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalExecutionTime: number;
  activeSandboxes: number;
  lastUpdated: Date;
}

class MetricsCollector {
  private metrics: MetricsData = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalExecutionTime: 0,
    activeSandboxes: 0,
    lastUpdated: new Date(),
  };

  private responseTimes: number[] = [];

  recordRequest(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
    this.updateAverageResponseTime();
  }

  private updateAverageResponseTime(): void {
    if (this.responseTimes.length === 0) return;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;
  }

  recordExecution(duration: number): void {
    this.metrics.totalExecutionTime += duration;
  }

  updateActiveSandboxes(count: number): void {
    this.metrics.activeSandboxes = count;
  }

  getMetrics(): MetricsData {
    return { ...this.metrics, lastUpdated: new Date() };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalExecutionTime: 0,
      activeSandboxes: 0,
      lastUpdated: new Date(),
    };
    this.responseTimes = [];
  }
}

// ============ Rate Limiter ============

class RateLimiter {
  private requestTimestamps: number[] = [];
  private concurrentJobs = 0;

  constructor(private maxRequestsPerMinute: number = 60) {}

  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      return false;
    }

    return true;
  }

  recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  getRetryAfter(): number {
    if (this.requestTimestamps.length === 0) return 0;
    const oldestTimestamp = this.requestTimestamps[0];
    const retryAfter = 60000 - (Date.now() - oldestTimestamp);
    return Math.max(retryAfter, 0);
  }

  incrementConcurrentJobs(): number {
    return ++this.concurrentJobs;
  }

  decrementConcurrentJobs(): number {
    return Math.max(--this.concurrentJobs, 0);
  }

  getConcurrentJobs(): number {
    return this.concurrentJobs;
  }
}

// ============ Main SDK Class ============

export default class SandboxSDK {
  private socket: Socket | null = null;
  private isConnected = false;
  private config: Required<SandboxSDKConfig>;
  private listeners: Map<string, Set<Function>> = new Map();
  private activeSandboxes: Map<string, SandboxConfig> = new Map();
  private activeContexts: Map<string, CodeContext> = new Map();
  private metricsCollector: MetricsCollector;
  private rateLimiter: RateLimiter;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: SandboxSDKConfig) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new SandboxSDKError("Invalid API key provided");
    }

    if (!config.serverUrl || typeof config.serverUrl !== "string") {
      throw new SandboxSDKError("Invalid server URL provided");
    }

    this.config = {
      apiKey: config.apiKey,
      serverUrl: config.serverUrl || "http://localhost:3000",
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging || false,
      logLevel: config.logLevel || "info",
      enableMetrics: config.enableMetrics || false,
      metricsInterval: config.metricsInterval || 30000,
      socketOptions: config.socketOptions || {},
    };

    this.metricsCollector = new MetricsCollector();
    this.rateLimiter = new RateLimiter(60);

    this.initializeSocket();
    this.setupMetricsCollection();
  }

  // ============ Connection Management ============

  private initializeSocket(): void {
    this.socket = io(this.config.serverUrl, {
      auth: { apiKey: this.config.apiKey },
      transports: ["websocket", "polling"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      ...this.config.socketOptions,
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.log("info", `[SDK] Connected: ${this.socket?.id}`);
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      this.log("warn", "[SDK] Disconnected");
      this.cleanupAllListeners();
    });

    this.socket.on("connect_error", (err: Error) => {
      this.log("error", `[SDK] Connection Error: ${err.message}`);
      this.isConnected = false;
    });

    this.socket.on("error", (err: Error) => {
      this.log("error", `[SDK] Socket Error: ${err.message}`);
    });
  }

  async waitForConnection(timeoutMs: number = 10000): Promise<void> {
    if (this.isConnected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.socket) {
          this.socket.off("connect", onConnect);
        }
        reject(
          new TimeoutError(
            `Connection timeout after ${timeoutMs}ms. Check API key and server URL.`
          )
        );
      }, timeoutMs);

      const onConnect = (): void => {
        clearTimeout(timeout);
        if (this.socket) {
          this.socket.off("connect", onConnect);
        }
        resolve();
      };

      if (this.socket) {
        this.socket.on("connect", onConnect);
      }
    });
  }

  isReady(): boolean {
    return this.isConnected && this.socket !== null;
  }

  disconnect(): void {
    this.cleanupAllListeners();
    if (this.socket) {
      this.socket.disconnect();
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.isConnected = false;
  }

  // ============ Sandbox Management ============

  async createSandbox(
    options: CreateSandboxOptions
  ): Promise<SandboxCreationResponse> {
    await this.ensureConnected();
    this.checkRateLimit();

    const startTime = Date.now();
    try {
      const sandbox = await this.sendJob<SandboxConfig>(
        SocketEvent.SANDBOX_CREATE,
        options,
        this.config.timeout
      );

      this.activeSandboxes.set(sandbox.id, sandbox);
      this.metricsCollector.recordRequest(true, Date.now() - startTime);

      return {
        sandbox,
        credentials: {
          apiKey: this.config.apiKey,
        },
      };
    } catch (error) {
      this.metricsCollector.recordRequest(false, Date.now() - startTime);
      throw error;
    }
  }

  async deleteSandbox(sandboxId: string): Promise<void> {
    await this.ensureConnected();

    // Remove all contexts associated with this sandbox
    for (const [contextId, context] of this.activeContexts.entries()) {
      if (context.sandboxId === sandboxId) {
        this.activeContexts.delete(contextId);
      }
    }

    this.activeSandboxes.delete(sandboxId);
    await this.sendJob(SocketEvent.SANDBOX_DELETE, { sandboxId });
  }

  async getSandboxStatus(sandboxId: string): Promise<SandboxStatus> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const status = await this.sendJob<{ status: SandboxStatus }>(
      SocketEvent.SANDBOX_STATUS,
      { sandboxId }
    );

    sandbox.status = status.status;
    return status.status;
  }

  async listSandboxes(): Promise<SandboxConfig[]> {
    return Array.from(this.activeSandboxes.values());
  }

  // ============ Template Management ============

  async getTemplates(page: number = 1, pageSize: number = 10): Promise<TemplateListResponse> {
    await this.ensureConnected();

    return this.sendJob<TemplateListResponse>(
      "template:list",
      { page, pageSize },
      this.config.timeout
    );
  }

  async getTemplate(templateId: string): Promise<SandboxTemplate> {
    await this.ensureConnected();

    return this.sendJob<SandboxTemplate>(
      "template:get",
      { templateId },
      this.config.timeout
    );
  }

  async createTemplate(
    template: TemplateConfig
  ): Promise<SandboxTemplate> {
    await this.ensureConnected();

    return this.sendJob<SandboxTemplate>(
      "template:create",
      template,
      this.config.timeout
    );
  }

  // ============ Code Execution ============

  async runCode(
    sandboxId: string,
    code: string,
    opts?: RunCodeOptions
  ): Promise<ExecutionResult> {
    await this.ensureConnected();
    this.checkRateLimit();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const executionId = uuid();
    const startTime = Date.now();
    const execution = new Execution();
    const metadata: ExecutionMetadata = {
      executionId,
      sandboxId,
      startTime: new Date(startTime),
    };

    try {
      const payload = {
        code,
        language: sandbox.templateConfig.language,
        sandboxId,
        envVars: opts?.envs,
      };

      return await this.sendStreamingJob(
        SocketEvent.EXECUTE,
        payload,
        execution,
        metadata,
        opts
      );
    } catch (error) {
      metadata.endTime = new Date();
      metadata.duration = Date.now() - startTime;
      this.metricsCollector.recordRequest(false, Date.now() - startTime);
      throw error;
    }
  }

  async runTerminal(
    sandboxId: string,
    command: string,
    opts?: RunCodeOptions
  ): Promise<string> {
    await this.ensureConnected();
    this.checkRateLimit();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new ConnectionError("Socket not connected"));
        return;
      }

      const jobId = uuid();
      let output = "";
      const payload = { command, sandboxId };
      const timeout = opts?.timeoutMs || this.config.timeout;

      let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => {
        cleanup();
        reject(new TimeoutError(`Terminal command timeout after ${timeout}ms`));
      }, timeout);

      const cleanup = (): void => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        this.removeListener(SocketEvent.STREAM, streamListener);
        this.removeListener(SocketEvent.STREAM_END, endListener);
        if (this.socket) {
          this.socket.off(SocketEvent.STREAM, streamListener as any);
          this.socket.off(SocketEvent.STREAM_END, endListener as any);
        }
      };

      const streamListener = (res: StreamChunkResponse): void => {
        if (res.jobId === jobId && res.chunk) {
          output += res.chunk;
          if (opts?.onStdout) {
            const timestamp = res.timestamp || Date.now() * 1000;
            opts.onStdout({
              line: res.chunk,
              timestamp,
              error: false,
            });
          }
        }
      };

      const endListener = (res: StreamEndResponse): void => {
        if (res.jobId === jobId) {
          cleanup();
          this.metricsCollector.recordRequest(true, Date.now() - startTime);
          resolve(output);
        }
      };

      this.trackListener(SocketEvent.STREAM, streamListener);
      this.trackListener(SocketEvent.STREAM_END, endListener);
      this.socket.on(SocketEvent.STREAM, streamListener as any);
      this.socket.on(SocketEvent.STREAM_END, endListener as any);
      this.socket.emit(SocketEvent.TERMINAL, jobId, payload);
    });
  }

  // ============ File Management ============

  async readFile(options: FileOperationOptions): Promise<string> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      op: "read" as const,
      sandboxId: options.sandboxId,
      path: options.path,
      encoding: options.encoding || "utf-8",
    };

    return this.sendJob<string>(SocketEvent.FILE, payload);
  }

  async writeFile(
    options: FileOperationOptions,
    content: string
  ): Promise<string> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      op: "write" as const,
      sandboxId: options.sandboxId,
      path: options.path,
      content,
      createParents: options.createParents ?? true,
    };

    return this.sendJob<string>(SocketEvent.FILE, payload);
  }

  async deleteFile(options: Omit<FileOperationOptions, "encoding">): Promise<void> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      op: "delete" as const,
      sandboxId: options.sandboxId,
      path: options.path,
    };

    await this.sendJob(SocketEvent.FILE, payload);
  }

  async listFiles(sandboxId: string, dirPath: string = "."): Promise<FileListResponse> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    return this.sendJob<FileListResponse>(
      "file:list",
      { sandboxId, dirPath }
    );
  }

  // ============ Context Management ============

  async createCodeContext(
    options: CreateContextOptions
  ): Promise<CodeContext> {
    await this.ensureConnected();

    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      sandboxId: options.sandboxId,
      language: options.language || sandbox.templateConfig.language,
      cwd: options.cwd || "/workspace",
    };

    const context = await this.sendJob<CodeContext>(
      SocketEvent.CONTEXT_CREATE,
      payload,
      options.requestTimeoutMs || this.config.timeout
    );

    this.activeContexts.set(context.id, context);
    return context;
  }

  async deleteCodeContext(contextId: string): Promise<void> {
    await this.ensureConnected();

    this.activeContexts.delete(contextId);
    await this.sendJob(SocketEvent.CONTEXT_DELETE, { contextId });
  }

  async listCodeContexts(sandboxId: string): Promise<CodeContext[]> {
    return Array.from(this.activeContexts.values()).filter(
      (ctx) => ctx.sandboxId === sandboxId
    );
  }

  // ============ Batch Operations ============

  async executeBatch(
    sandboxId: string,
    jobs: BatchExecutionJob[],
    opts?: RunCodeOptions
  ): Promise<BatchExecutionResult[]> {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const results: BatchExecutionResult[] = [];

    for (const job of jobs) {
      const startTime = Date.now();
      try {
        const execution = await this.runCode(sandboxId, job.code, {
          ...opts,
          timeoutMs: job.timeout,
        });

        results.push({
          jobId: job.id,
          success: true,
          execution: execution.execution,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          jobId: job.id,
          success: false,
          error: String(error),
          duration: Date.now() - startTime,
        });
      }
    }

    return results;
  }

  // ============ Metrics & Monitoring ============

  getMetrics() {
    return this.metricsCollector.getMetrics();
  }

  private setupMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics();
      this.log("debug", `[Metrics] ${JSON.stringify(metrics)}`);
    }, this.config.metricsInterval);
  }

  // ============ Private Helper Methods ============

  private async ensureConnected(): Promise<void> {
    if (!this.isReady()) {
      await this.waitForConnection();
    }
  }

  private checkRateLimit(): void {
    if (!this.rateLimiter.canMakeRequest()) {
      const retryAfter = this.rateLimiter.getRetryAfter();
      throw new RateLimitError(retryAfter);
    }
    this.rateLimiter.recordRequest();
  }

  private sendJob<T = unknown>(
    event: string,
    payload: unknown,
    timeoutMs?: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new ConnectionError("Socket not connected"));
        return;
      }

      const jobId = uuid();
      const timeout = timeoutMs || this.config.timeout;
      let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => {
        this.removeListener(SocketEvent.RESULT, listener);
        reject(new TimeoutError(`Job timeout after ${timeout}ms`));
      }, timeout);

      const listener = (res: JobResultResponse<T>): void => {
        if (res.jobId !== jobId) return;

        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }

        this.removeListener(SocketEvent.RESULT, listener);
        this.socket?.off(SocketEvent.RESULT, listener as any);

        if (res.success && res.output !== undefined) {
          resolve(res.output);
        } else {
          reject(new SandboxError(res.error || "Job failed"));
        }
      };

      this.trackListener(SocketEvent.RESULT, listener);
      this.socket.on(SocketEvent.RESULT, listener as any);
      this.socket.emit(event, jobId, payload);
    });
  }

  private async sendStreamingJob(
    event: string,
    payload: unknown,
    execution: Execution,
    metadata: ExecutionMetadata,
    opts?: RunCodeOptions
  ): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new ConnectionError("Socket not connected"));
        return;
      }

      const jobId = uuid();
      const timeout = opts?.timeoutMs || this.config.timeout;
      let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => {
        cleanup();
        reject(new TimeoutError(`Code execution timeout after ${timeout}ms`));
      }, timeout);

      const cleanup = (): void => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        this.socket?.off("job:output", outputListener as any);
      };

      const outputListener = async (res: {
        jobId: string;
        line: string;
      }): Promise<void> => {
        if (res.jobId !== jobId) return;

        try {
          await this.parseOutput(execution, res.line, opts);

          if (execution.error) {
            metadata.endTime = new Date();
            metadata.duration = Date.now() - (metadata.startTime?.getTime() || 0);
            cleanup();
            this.metricsCollector.recordExecution(metadata.duration);
            resolve({
              execution,
              metadata,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      this.trackListener("job:output", outputListener);
      this.socket.on("job:output", outputListener as any);
      this.socket.emit(event, jobId, payload);
    });
  }

  private async parseOutput(
    execution: Execution,
    line: string,
    opts?: RunCodeOptions
  ): Promise<void> {
    const msg = JSON.parse(line);
    const timestamp = Date.now() * 1000;

    switch (msg.type) {
      case "result":
        const result = new Result(msg, msg.is_main_result ?? false);
        execution.results.push(result);
        if (opts?.onResult) {
          await opts.onResult(result);
        }
        break;

      case "stdout":
        execution.logs.stdout.push(msg.text);
        if (opts?.onStdout) {
          await opts.onStdout({
            line: msg.text,
            timestamp,
            error: false,
          });
        }
        break;

      case "stderr":
        execution.logs.stderr.push(msg.text);
        if (opts?.onStderr) {
          await opts.onStderr({
            line: msg.text,
            timestamp,
            error: true,
          });
        }
        break;

      case "error":
        execution.error = new ExecutionError(
          msg.name,
          msg.value,
          msg.traceback
        );
        if (opts?.onError) {
          await opts.onError(execution.error);
        }
        break;

      case "execution_count":
        execution.executionCount = msg.execution_count;
        break;
    }
  }

  private trackListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  private removeListener(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
    if (this.listeners.get(event)?.size === 0) {
      this.listeners.delete(event);
    }
  }

  private cleanupAllListeners(): void {
    for (const [event, listeners] of this.listeners) {
      for (const listener of listeners) {
        this.socket?.off(event, listener as any);
      }
    }
    this.listeners.clear();
  }

  private log(level: string, message: string): void {
    if (!this.config.enableLogging) return;

    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex >= currentLevelIndex) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }
}