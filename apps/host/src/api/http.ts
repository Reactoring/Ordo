export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Request failed with HTTP ${status}.`);
    this.name = 'HttpError';
  }
}

export async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) throw new HttpError(response.status);

  return response.json();
}
