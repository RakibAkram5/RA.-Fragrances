// Vitest alias for next/server (minimal, test-only).
export class NextResponse {
  status: number;
  body: unknown;
  constructor(body: unknown, init?: { status?: number }) {
    this.body = body;
    this.status = init?.status ?? 200;
  }
  static json(data: unknown, init?: { status?: number }) {
    return new NextResponse(data, init) as unknown as Response;
  }
}
