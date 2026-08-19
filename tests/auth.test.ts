import { afterEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { loginCustomer, registerUser, resetPassword, verifyEmailToken } from "@/lib/auth-service";
import { getOutbox } from "@/lib/email/console-email";
import { ApiError } from "@/lib/route-helpers";
import { resetBruteForce } from "@/lib/security/brute-force";
import { resetTestData } from "./helpers";
import { prisma } from "@/lib/db";

function latestLink(): string {
  const entry = getOutbox()[0];
  const match = entry?.text.match(/https?:\/\/\S+token=([A-Za-z0-9_-]+)/);
  return match?.[1] ?? "";
}

afterEach(async () => {
  resetBruteForce();
  await resetTestData();
});

describe("passwords", () => {
  it("hashes with bcrypt and never stores plaintext", async () => {
    const hash = await hashPassword("Secret123");
    expect(hash).not.toBe("Secret123");
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword("Secret123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("registration + verification", () => {
  it("registers a customer and sends a verification email", async () => {
    await registerUser({
      name: "New User",
      email: "new@test.com",
      password: "Secret123",
      ip: "127.0.0.1",
      userAgent: "vitest",
    });
    const user = await prisma.user.findUnique({ where: { email: "new@test.com" } });
    expect(user).not.toBeNull();
    expect(user!.passwordHash).not.toBe("Secret123");
    expect(user!.emailVerifiedAt).toBeNull();

    const token = latestLink();
    expect(token.length).toBeGreaterThan(20);
    await verifyEmailToken(token);
    const verified = await prisma.user.findUnique({ where: { email: "new@test.com" } });
    expect(verified!.emailVerifiedAt).not.toBeNull();
  });

  it("rejects duplicate emails", async () => {
    await registerUser({ name: "A", email: "dup@test.com", password: "Secret123", ip: "x", userAgent: "x" });
    await expect(
      registerUser({ name: "B", email: "dup@test.com", password: "Secret123", ip: "x", userAgent: "x" }),
    ).rejects.toThrowError(ApiError);
  });
});

describe("login", () => {
  it("authenticates with correct credentials", async () => {
    await registerUser({ name: "L", email: "login@test.com", password: "Secret123", ip: "x", userAgent: "x" });
    const result = await loginCustomer("login@test.com", "Secret123", { ip: "x", userAgent: "x" });
    expect(result.token.length).toBeGreaterThan(20);
    expect(result.user.email).toBe("login@test.com");
  });

  it("rejects wrong passwords", async () => {
    await registerUser({ name: "L", email: "login2@test.com", password: "Secret123", ip: "x", userAgent: "x" });
    await expect(loginCustomer("login2@test.com", "nope", { ip: "x", userAgent: "x" })).rejects.toThrowError(/Invalid email or password/);
  });
});

describe("password reset", () => {
  it("resets the password and invalidates the old one", async () => {
    await registerUser({ name: "R", email: "reset@test.com", password: "OldPass123", ip: "x", userAgent: "x" });
    const { forgotPassword } = await import("@/lib/auth-service");
    await forgotPassword("reset@test.com");

    const token = latestLink();
    await resetPassword(token, "NewPass456");

    const ok = await loginCustomer("reset@test.com", "NewPass456", { ip: "x", userAgent: "x" });
    expect(ok.token.length).toBeGreaterThan(10);
    await expect(loginCustomer("reset@test.com", "OldPass123", { ip: "x", userAgent: "x" })).rejects.toThrowError();
  });

  it("rejects a reused reset token", async () => {
    await registerUser({ name: "R", email: "reset2@test.com", password: "OldPass123", ip: "x", userAgent: "x" });
    const { forgotPassword } = await import("@/lib/auth-service");
    await forgotPassword("reset2@test.com");
    const token = latestLink();
    await resetPassword(token, "NewPass456");
    await expect(resetPassword(token, "Another789")).rejects.toThrowError(ApiError);
  });
});
