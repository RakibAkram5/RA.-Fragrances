"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

const schema = z
  .object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("Enter a valid email."),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "At least one letter.")
      .regex(/\d/, "At least one number."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    setSuccess("");
    try {
      const data = await api<{ message: string }>("/api/auth/register", {
        method: "POST",
        body: { name: values.name, email: values.email, phone: values.phone || undefined, password: values.password },
      });
      setSuccess(data.message);
      router.push("/account/login?registered=1");
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
      <p className="eyebrow">Account</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Create Account</h1>
      <p className="mt-3 text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/account/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>

      {success && <Alert variant="success" className="mt-6">{success}</Alert>}
      {error && <Alert variant="error" className="mt-6">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="name">Full Name</label>
          <Input id="name" autoComplete="name" {...register("name")} className="mt-2" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="email">Email</label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} className="mt-2" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="phone">Mobile (optional)</label>
          <Input id="phone" inputMode="tel" placeholder="03xx xxxxxxx" {...register("phone")} className="mt-2" />
          {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="password">Password</label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} className="mt-2" />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="confirm">Confirm Password</label>
          <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} className="mt-2" />
          {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" variant="accent" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create Account"}
        </Button>
      </form>
    </div>
  );
}
