export async function requestJson<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new Error(
      "We couldn't connect. Check your connection and try again.",
    );
  }
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(
      result?.error || "We couldn't complete your request. Please try again.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
