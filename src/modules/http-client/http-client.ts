import type { Options } from "ky"; // Assuming ky types are available

// Define a base type for request options, can be extended if needed
// We leverage ky's Options type here for compatibility, but abstract it slightly
export type HttpClientOptions = Omit<Options, "method" | "json" | "body">;

/**
 * Interface for an HTTP client, abstracting the underlying implementation.
 * Uses generics for request (TRequest) and response (TResponse) types.
 */
export interface IHttpClient {
  /**
   * Performs a GET request.
   * @param url The URL to request.
   * @param options Optional request configuration.
   * @returns A promise resolving to the response body of type TResponse.
   */
  get<TResponse>(url: string | URL, options?: HttpClientOptions): Promise<TResponse>;

  /**
   * Performs a POST request.
   * @param url The URL to request.
   * @param body The request body/payload.
   * @param options Optional request configuration.
   * @returns A promise resolving to the response body of type TResponse.
   */
  post<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse>;

  /**
   * Performs a PUT request.
   * @param url The URL to request.
   * @param body The request body/payload.
   * @param options Optional request configuration.
   * @returns A promise resolving to the response body of type TResponse.
   */
  put<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse>;

  /**
   * Performs a DELETE request.
   * @param url The URL to request.
   * @param options Optional request configuration.
   * @returns A promise resolving to the response body of type TResponse.
   */
  delete<TResponse>(url: string | URL, options?: HttpClientOptions): Promise<TResponse>;
}
