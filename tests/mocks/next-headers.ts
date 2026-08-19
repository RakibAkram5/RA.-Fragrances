// Vitest alias for next/headers. Only used at import time by services; the
// functions throw if actually invoked outside a request scope.
export function cookies(): never {
  throw new Error("cookies() is not available outside a request scope");
}

export function headers(): never {
  throw new Error("headers() is not available outside a request scope");
}
