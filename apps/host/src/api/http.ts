export class HttpError extends Error {
  constructor(
    readonly status: number,
    message = `Request failed with HTTP ${status}.`,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  return requestJson(path, { signal });
}

export async function requestJson(
  path: string,
  options: {
    method?: 'POST' | 'PATCH';
    body?: BodyInit;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  },
): Promise<unknown> {
  const response = await fetch(path, {
    ...options,
    headers: { ...options.headers, Accept: 'application/json' },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'object' &&
      body.error !== null &&
      'message' in body.error &&
      typeof body.error.message === 'string'
        ? body.error.message
        : undefined;
    throw new HttpError(response.status, message);
  }

  return response.json();
}
