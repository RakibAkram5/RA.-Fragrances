"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api-client";

const schema = z.object({ email: z.string().email("Enter a valid email.") });

export default function ForgotPasswordPage() {
  const [message, setMessage] = React.useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    const data = await api<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: values,
    });
    setMessage(data.message);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Reset Password</h1>
      <p className="mt-3 text-sm text-ink-secondary">
        Enter your email and we will send you a reset link.
      </p>

      {message && <Alert variant="success" className="mt-6">{message}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="email">Email</label>
          <Input id="email" type="email" {...register("email")} className="mt-2" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-muted">
        <Link href="/account/login" className="text-accent hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
