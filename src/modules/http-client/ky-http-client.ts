import ky, { type Options, KyInstance } from "ky";
import { IHttpClient, HttpClientOptions } from "./http-client";

/**
 * Implementation of IHttpClient using the ky library.
 */
export class KyHttpClient implements IHttpClient {
  private client: KyInstance;

  /**
   * Creates an instance of KyHttpClient.
   * @param defaultOptions Optional default ky options to apply to all requests.
   */
  public constructor(defaultOptions?: Options) {
    this.client = ky.create(defaultOptions || {});
  }

  public async get<TResponse>(url: string | URL, options?: HttpClientOptions): Promise<TResponse> {
    return this.client.get(url, options).json<TResponse>();
  }

  public async post<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    const kyOptions: Options = {
      ...options,
      json: body,
    };
    return this.client.post(url, kyOptions).json<TResponse>();
  }

  public async put<TResponse, TRequest = unknown>(
    url: string | URL,
    body?: TRequest,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    const kyOptions: Options = {
      ...options,
      json: body,
    };
    return this.client.put(url, kyOptions).json<TResponse>();
  }

  public async delete<TResponse>(
    url: string | URL,
    options?: HttpClientOptions
  ): Promise<TResponse> {
    return this.client.delete(url, options).json<TResponse>();
  }
}
