/** API response format matching backend ResponseResult<T> */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface SdkConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
  fetch?: FetchLike;
}

export class ApiClientError<T = unknown> extends Error {
  readonly status: number | undefined;
  readonly response: ApiResponse<T> | undefined;
  readonly url: string;

  constructor(message: string, options: { url: string; status?: number; response?: ApiResponse<T> }) {
    super(message);
    this.name = 'ApiClientError';
    this.url = options.url;
    this.status = options.status;
    this.response = options.response;
  }
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string | undefined;
  private timeout: number;
  private fetchImpl: FetchLike;

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.authToken = config.authToken;
    this.timeout = config.timeout ?? 15000;
    // 默认实现包一层箭头函数，确保以「自由函数」方式调用全局 fetch（接收者为全局对象）。
    // 若直接存 `?? fetch` 再以 this.fetchImpl(...) 方法形式调用，浏览器会把接收者设为
    // ApiClient 实例，原生 window.fetch 会抛 TypeError: Illegal invocation（Node/jsdom 不校验，故仅浏览器复现）。
    this.fetchImpl = config.fetch ?? ((input, init) => fetch(input, init));
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  async get<T>(path: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });
  }

  async getRaw(path: string, params?: QueryParams): Promise<Response> {
    const url = this.buildUrl(path, params);
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new ApiClientError(`HTTP request failed with status ${response.status}`, {
        url,
        status: response.status,
      });
    }

    return response;
  }

  async download(path: string, params?: QueryParams): Promise<ArrayBuffer> {
    const response = await this.getRaw(path, params);
    return response.arrayBuffer();
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method: 'POST',
      headers: this.buildHeaders(),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.request<T>(url, init);
  }

  async postBinary<T>(path: string, body: Uint8Array | number[]): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    return this.request<T>(url, {
      method: 'POST',
      headers: this.buildHeaders('application/octet-stream'),
      body: this.toRequestBody(body),
    });
  }

  async postBinaryNoResponse(path: string, body: Uint8Array | number[]): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    await this.request<void>(url, {
      method: 'POST',
      headers: this.buildHeaders('application/octet-stream'),
      body: this.toRequestBody(body),
    }, true);
  }

  private buildHeaders(contentType: string = 'application/json'): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private buildUrl(path: string, params?: QueryParams): string {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params)
          .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
          .map(([key, value]) => [key, String(value)]),
      ).toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  private toRequestBody(body: Uint8Array | number[]): ArrayBuffer {
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(body);
    const sliced = new Uint8Array(bytes.byteLength);
    sliced.set(bytes);
    return sliced.buffer;
  }

  private async request<T>(url: string, init: RequestInit, allowEmpty: true): Promise<void>;
  private async request<T>(url: string, init: RequestInit, allowEmpty?: false): Promise<ApiResponse<T>>;
  private async request<T>(url: string, init: RequestInit, allowEmpty = false): Promise<ApiResponse<T> | void> {
    const response = await this.fetchWithTimeout(url, init);
    const text = await response.text();

    let parsed: ApiResponse<T> | undefined;
    if (text) {
      try {
        parsed = JSON.parse(text) as ApiResponse<T>;
      } catch (e) {
        throw new ApiClientError(`Invalid JSON response: ${e instanceof Error ? e.message : String(e)}`, {
          url,
          status: response.status,
        });
      }
    }

    if (!response.ok) {
      if (parsed) {
        throw new ApiClientError(parsed.message || `HTTP request failed with status ${response.status}`, {
          url,
          status: response.status,
          response: parsed,
        });
      }
      throw new ApiClientError(`HTTP request failed with status ${response.status}`, {
        url,
        status: response.status,
      });
    }

    if (!parsed) {
      if (allowEmpty) {
        return;
      }
      throw new ApiClientError('Empty JSON response', { url, status: response.status });
    }

    if (parsed.code !== 200) {
      throw new ApiClientError(parsed.message || `API request failed with code ${parsed.code}`, {
        url,
        status: response.status,
        response: parsed,
      });
    }

    return parsed;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
