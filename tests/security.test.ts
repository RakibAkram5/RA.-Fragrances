import { describe, expect, it } from "vitest";
import { validateImageBuffer } from "@/lib/storage/file-validation";
import { generateToken, hashToken, safeEqual } from "@/lib/security/tokens";
import { rateLimit, resetRateLimiter } from "@/lib/security/rate-limit";
import { isLocked, recordFailure, resetBruteForce } from "@/lib/security/brute-force";
import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/route-helpers";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
]);

describe("file upload security", () => {
  it("accepts a real PNG", () => {
    const r = validateImageBuffer(PNG, "photo.png");
    expect(r.ext).toBe("png");
  });

  it("rejects a mismatched extension", () => {
    expect(() => validateImageBuffer(PNG, "photo.jpg")).toThrowError(ApiError);
  });

  it("rejects a disallowed extension", () => {
    expect(() => validateImageBuffer(PNG, "photo.exe")).toThrowError(/Unsupported image format/);
  });

  it("rejects non-image content", () => {
    const junk = Buffer.from("plain text, not an image");
    expect(() => validateImageBuffer(junk, "x.png")).toThrowError(/not a recognised image/);
  });

  it("rejects oversized files", () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1);
    expect(() => validateImageBuffer(big, "x.png")).toThrowError(/5 MB or smaller/);
  });
});

describe("token security", () => {
  it("stores only a SHA-256 digest, never the token", () => {
    const token = generateToken();
    const hash = hashToken(token);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash); // deterministic
  });

  it("compares tokens in constant time", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit is reached", () => {
    resetRateLimiter();
    for (let i = 0; i < 3; i += 1) expect(rateLimit("k", { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit("k", { limit: 3, windowMs: 60_000 }).ok).toBe(false);
    resetRateLimiter();
  });
});

describe("brute-force protection", () => {
  it("locks after repeated failures", () => {
    resetBruteForce();
    for (let i = 0; i < 5; i += 1) recordFailure("email|ip");
    expect(isLocked("email|ip").locked).toBe(true);
    resetBruteForce();
  });
});

describe("slugs", () => {
  it("normalises slugs", () => {
    expect(slugify("RA NOIR")).toBe("ra-noir");
    expect(slugify("  Héllo World!  ")).toBe("hello-world");
  });
});
