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

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginInner />
    </React.Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: values });
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/account/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Sign In</h1>
      <p className="mt-3 text-sm text-ink-secondary">
        New to RA?{" "}
        <Link href="/account/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>

      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="email">Email</label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} className="mt-2" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="password">Password</label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} className="mt-2" />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <Link href="/account/forgot-password" className="text-xs text-ink-muted hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        Admin? <Link href="/admin/login" className="text-accent hover:underline">Admin sign in</Link>
      </p>
    </div>
  );
}
