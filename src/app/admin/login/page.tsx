"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: values });
      router.push("/admin/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-accent/40 bg-accent-soft">
            <ShieldCheck className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-5 font-display text-4xl text-ink">Admin Sign In</h1>
          <p className="mt-2 text-sm text-ink-secondary">Restricted area — authorised personnel only.</p>
        </div>

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
          <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link href="/" className="text-accent hover:underline">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
