import { v4 as uuid } from "uuid";
import {
  SandboxSDKConfig,
  TemplateConfig,
  SandboxConfig,
  SandboxStatus,
  CreateSandboxOptions,
  CodeContext,
  CreateContextOptions,
  RunCodeOptions,
  FileOperationOptions,
  ExecutionResult,
} from "./typesv2.js";

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
      "text", "html", "markdown", "svg", "png", "jpeg", "pdf", "latex",
      "json", "javascript", "data", "chart", "type", "is_main_result",
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

interface ChartType {
  type: string;
  title: string;
  elements: unknown[];
}

interface RawData {
  [key: string]: unknown;
}

interface Logs {
  stdout: string[];
  stderr: string[];
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
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );
    return this.requestTimestamps.length < this.maxRequestsPerMinute;
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
  private config: Required<SandboxSDKConfig>;
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
      serverUrl: config.serverUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging || false,
      logLevel: config.logLevel || "info",
      enableMetrics: config.enableMetrics || false,
      metricsInterval: config.metricsInterval || 30000,
    };

    this.metricsCollector = new MetricsCollector();
    this.rateLimiter = new RateLimiter(60);
    this.setupMetricsCollection();
  }

  // ============ HTTP Request Helper ============

  private async makeRequest<T = unknown>(
    method: string,
    endpoint: string,
    payload?: unknown,
    timeoutMs?: number
  ): Promise<T> {
    const url = `${this.config.serverUrl}${endpoint}`;
    const timeout = timeoutMs || this.config.timeout;
    const startTime = Date.now();

    try {
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      };

      if (payload) {
        options.body = JSON.stringify(payload);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = (await response.json()) as any;
        throw new SandboxError(errorData?.message || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      this.metricsCollector.recordRequest(true, Date.now() - startTime);
      return data as T;
    } catch (error) {
      this.metricsCollector.recordRequest(false, Date.now() - startTime);
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  // ============ Sandbox Management ============

  async createSandbox(options: CreateSandboxOptions) {
    this.checkRateLimit();

    const response = await this.makeRequest(
      "POST",
      "/api/sandboxes/create",
      options,
      this.config.timeout
    );

    const sandbox = (response as any).sandbox;
    this.activeSandboxes.set(sandbox.id, sandbox);

    return response;
  }

  async deleteSandbox(sandboxId: string): Promise<void> {
    for (const [contextId, context] of this.activeContexts.entries()) {
      if (context.sandboxId === sandboxId) {
        this.activeContexts.delete(contextId);
      }
    }

    this.activeSandboxes.delete(sandboxId);
    await this.makeRequest("DELETE", `/api/sandboxes/${sandboxId}`, null);
  }

  async getSandboxStatus(sandboxId: string): Promise<SandboxStatus> {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const response = await this.makeRequest<{ status: SandboxStatus }>(
      "GET",
      `/api/sandboxes/${sandboxId}/status`,
      null
    );

    sandbox.status = response.status;
    return response.status;
  }

  async listSandboxes(): Promise<SandboxConfig[]> {
    return Array.from(this.activeSandboxes.values());
  }

  // ============ Template Management ============

  async getTemplates(page: number = 1, pageSize: number = 10) {
    return this.makeRequest(
      "GET",
      `/api/templates?page=${page}&pageSize=${pageSize}`,
      null
    );
  }

  async getTemplate(templateId: string) {
    return this.makeRequest(
      "GET",
      `/api/templates/${templateId}`,
      null
    );
  }

  async createTemplate(template: TemplateConfig) {
    return this.makeRequest(
      "POST",
      "/api/templates",
      template
    );
  }

  // ============ Code Execution ============

  async runCode(
    sandboxId: string,
    code: string,
    opts?: RunCodeOptions
  ): Promise<ExecutionResult> {
    this.checkRateLimit();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const payload = {
      code,
      language: sandbox.templateConfig.language,
      envVars: opts?.envs,
    };

    const startTime = Date.now();
    const result = await this.makeRequest<any>(
      "POST",
      `/api/sandboxes/${sandboxId}/execute`,
      payload,
      opts?.timeoutMs
    );

    const execution = new Execution();
    execution.logs = result.logs || { stdout: [], stderr: [] };
    
    if (result.results) {
      execution.results = result.results.map(
        (r: RawData) => new Result(r, (r.is_main_result as boolean) ?? false)
      );
    }

    if (result.error) {
      execution.error = new ExecutionError(
        result.error.name,
        result.error.value,
        result.error.traceback
      );
    }

    execution.executionCount = result.executionCount;

    if (opts?.onResult && execution.results.length > 0) {
      for (const result of execution.results) {
        await opts.onResult(result);
      }
    }

    if (opts?.onStdout && execution.logs.stdout.length > 0) {
      for (const line of execution.logs.stdout) {
        await opts.onStdout({
          line,
          timestamp: Date.now() * 1000,
          error: false,
        });
      }
    }

    if (opts?.onStderr && execution.logs.stderr.length > 0) {
      for (const line of execution.logs.stderr) {
        await opts.onStderr({
          line,
          timestamp: Date.now() * 1000,
          error: true,
        });
      }
    }

    if (opts?.onError && execution.error) {
      await opts.onError(execution.error);
    }

    return {
      execution,
      metadata: {
        executionId: uuid(),
        sandboxId,
        startTime: new Date(startTime),
        endTime: new Date(),
        duration: Date.now() - startTime,
      },
      timestamp: Date.now(),
    };
  }

  async runTerminal(
    sandboxId: string,
    command: string,
    opts?: RunCodeOptions
  ): Promise<string> {
    this.checkRateLimit();

    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const payload = { command };

    const result = await this.makeRequest<{ output: string }>(
      "POST",
      `/api/sandboxes/${sandboxId}/terminal`,
      payload,
      opts?.timeoutMs
    );

    if (opts?.onStdout) {
      await opts.onStdout({
        line: result.output,
        timestamp: Date.now() * 1000,
        error: false,
      });
    }

    return result.output;
  }

  // ============ File Management ============

  async readFile(options: FileOperationOptions): Promise<string> {
    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const result = await this.makeRequest<{ content: string }>(
      "GET",
      `/api/sandboxes/${options.sandboxId}/files?path=${encodeURIComponent(options.path)}`,
      null
    );

    return result.content;
  }

  async writeFile(
    options: FileOperationOptions,
    content: string
  ): Promise<string> {
    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      content,
      createParents: options.createParents ?? true,
    };

    const result = await this.makeRequest<{ path: string }>(
      "POST",
      `/api/sandboxes/${options.sandboxId}/files?path=${encodeURIComponent(options.path)}`,
      payload
    );

    return result.path;
  }

  async deleteFile(options: Omit<FileOperationOptions, "encoding">): Promise<void> {
    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    await this.makeRequest(
      "DELETE",
      `/api/sandboxes/${options.sandboxId}/files?path=${encodeURIComponent(options.path)}`,
      null
    );
  }

  async listFiles(sandboxId: string, dirPath: string = ".") {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    return this.makeRequest(
      "GET",
      `/api/sandboxes/${sandboxId}/files/list?path=${encodeURIComponent(dirPath)}`,
      null
    );
  }

  // ============ Context Management ============

  async createCodeContext(options: CreateContextOptions): Promise<CodeContext> {
    const sandbox = this.activeSandboxes.get(options.sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${options.sandboxId} not found`);
    }

    const payload = {
      language: options.language || sandbox.templateConfig.language,
      cwd: options.cwd || "/workspace",
    };

    const context = await this.makeRequest<CodeContext>(
      "POST",
      `/api/sandboxes/${options.sandboxId}/contexts`,
      payload,
      options.requestTimeoutMs
    );

    this.activeContexts.set(context.id, context);
    return context;
  }

  async deleteCodeContext(contextId: string): Promise<void> {
    this.activeContexts.delete(contextId);
    const context = Array.from(this.activeContexts.values()).find(c => c.id === contextId);
    if (context) {
      await this.makeRequest(
        "DELETE",
        `/api/sandboxes/${context.sandboxId}/contexts/${contextId}`,
        null
      );
    }
  }

  async listCodeContexts(sandboxId: string): Promise<CodeContext[]> {
    return Array.from(this.activeContexts.values()).filter(
      (ctx) => ctx.sandboxId === sandboxId
    );
  }

  // ============ Batch Operations ============

  async executeBatch(sandboxId: string, jobs: any[], opts?: RunCodeOptions) {
    const sandbox = this.activeSandboxes.get(sandboxId);
    if (!sandbox) {
      throw new SandboxError(`Sandbox ${sandboxId} not found`);
    }

    const results: any[] = [];

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

  private checkRateLimit(): void {
    if (!this.rateLimiter.canMakeRequest()) {
      const retryAfter = this.rateLimiter.getRetryAfter();
      throw new RateLimitError(retryAfter);
    }
    this.rateLimiter.recordRequest();
  }

  disconnect(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
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