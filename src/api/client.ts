/** API response format matching backend ResponseResult<T> */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface SdkConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private authToken?: string;
  private timeout: number;

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.authToken = config.authToken;
    this.timeout = config.timeout ?? 15000;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = undefined;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, params);
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });
    return response.json() as Promise<ApiResponse<T>>;
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json() as Promise<ApiResponse<T>>;
  }

  async postBinary<T>(path: string, body: Uint8Array | number[]): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: body instanceof Uint8Array
        ? (body.buffer as ArrayBuffer)
        : (new Uint8Array(body).buffer as ArrayBuffer),
    });
    return response.json() as Promise<ApiResponse<T>>;
  }

  async postBinaryNoResponse(path: string, body: Uint8Array | number[]): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    await this.fetchWithTimeout(url, {
      method: 'POST',
      headers,
      body: body instanceof Uint8Array
        ? (body.buffer as ArrayBuffer)
        : (new Uint8Array(body).buffer as ArrayBuffer),
    });
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
