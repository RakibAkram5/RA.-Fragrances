"use client";

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Client-side fetch helper. Sends cookies (same-origin), always expects JSON,
 * and throws a typed error carrying the server's safe error message.
 */
export async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    details?: unknown;
  };

  if (!res.ok || data.ok === false) {
    throw new ApiRequestError(
      data.error ?? "Something went wrong. Please try again.",
      res.status,
      data.details,
    );
  }
  return data as T;
}

export async function apiForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData, credentials: "same-origin" });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    details?: unknown;
  };
  if (!res.ok || data.ok === false) {
    throw new ApiRequestError(
      data.error ?? "Something went wrong. Please try again.",
      res.status,
      data.details,
    );
  }
  return data as T;
}
