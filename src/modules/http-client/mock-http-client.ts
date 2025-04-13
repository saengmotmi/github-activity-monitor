import { IHttpClient, HttpClientOptions } from "./http-client";

/**
 * Mock implementation of IHttpClient for testing purposes.
 * Allows setting predefined responses for specific URLs and methods.
 */
export class MockHttpClient implements IHttpClient {
  private responses: Map<string, unknown> = new Map();
  private requests: Map<
    string,
    { url: string | URL; options?: HttpClientOptions; body?: unknown }
  > = new Map();

  /**
   * Sets a predefined response for a specific request signature.
   * @param method HTTP method (GET, POST, PUT, DELETE)
   * @param url The URL to match.
   * @param response The response data to return.
   */
  public setResponse(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string | URL,
    response: unknown
  ): void {
    const key = `${method}:${url.toString()}`;
    this.responses.set(key, response);
  }

  /**
   * Gets the recorded request details for a specific signature.
   * @param method HTTP method
   * @param url The URL to match.
   * @returns The recorded request details or undefined if not found.
   */
  public getRequest(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string | URL
  ): { url: string | URL; options?: HttpClientOptions; body?: unknown } | undefined {
    const key = `${method}:${url.toString()}`;
    return this.requests.get(key);
  }

  public async handleRequest<TResponse, TRequest = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string | URL,
    options?: HttpClientOptions,
    body?: TRequest
  ): Promise<TResponse> {
    const key = `${method}:${url.toString()}`;
    this.requests.set(key, { url, options, body });

    if (this.responses.has(key)) {
      return Promise.resolve(this.responses.get(key) as TResponse);
    }
    return Promise.reject(new Error(`MockHttpClient: No response configured for ${method} ${url}`));
  }

  public async get<TResponse>(url: string | URL, options?: HttpClientOptions): Promise<TResponse> {
    return this.handleRequest("GET", url, options);
  }

  public async post<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    return this.handleRequest("POST", url, options, body);
  }

  public async put<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    return this.handleRequest("PUT", url, options, body);
  }

  public async delete<TResponse>(
    url: string | URL,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    return this.handleRequest("DELETE", url, options);
  }
}
