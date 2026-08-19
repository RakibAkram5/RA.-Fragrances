"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "At least one letter.")
      .regex(/\d/, "At least one number."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordInner />
    </React.Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = React.useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: { token, password: values.password },
      });
      router.push("/account/login");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Choose a New Password</h1>

      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      {!token ? (
        <p className="mt-6 text-sm text-ink-secondary">
          This link is missing its token. Please request a new reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="password">New Password</label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} className="mt-2" />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="confirm">Confirm Password</label>
            <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} className="mt-2" />
            {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/account/login" className="text-accent hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
