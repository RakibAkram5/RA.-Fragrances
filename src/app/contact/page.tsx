"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MessageCircle, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

const schema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters.").max(3000),
  website: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [error, setError] = React.useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    try {
      await api("/api/contact", { method: "POST", body: values });
      setStatus("success");
      reset();
    } catch (e) {
      setStatus("error");
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6">
      <div className="max-w-xl">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 font-display text-5xl text-ink">Talk to RA</h1>
        <p className="mt-4 text-ink-secondary">
          Questions about an order, a scent, or a partnership? Reach us directly.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-border bg-surface p-4 text-ink-secondary transition-colors hover:border-border-strong"
          >
            <MessageCircle className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">WhatsApp</p>
              <p className="text-xs text-ink-muted">+92 300 0000000</p>
            </div>
          </a>
          <a
            href="mailto:care@ra-fragrances.pk"
            className="flex items-center gap-3 border border-border bg-surface p-4 text-ink-secondary transition-colors hover:border-border-strong"
          >
            <Mail className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Email</p>
              <p className="text-xs text-ink-muted">care@ra-fragrances.pk</p>
            </div>
          </a>
          <a
            href="https://instagram.com/ra.fragrances"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-border bg-surface p-4 text-ink-secondary transition-colors hover:border-border-strong"
          >
            <Instagram className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Instagram</p>
              <p className="text-xs text-ink-muted">@ra.fragrances</p>
            </div>
          </a>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {status === "success" && (
            <Alert variant="success">Thank you for your message. We will be in touch soon.</Alert>
          )}
          {status === "error" && <Alert variant="error">{error}</Alert>}

          {/* Honeypot — hidden from humans */}
          <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="name">Name</label>
              <Input id="name" {...register("name")} className="mt-2" aria-invalid={!!errors.name} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="email">Email</label>
              <Input id="email" type="email" {...register("email")} className="mt-2" aria-invalid={!!errors.email} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="phone">Phone (optional)</label>
              <Input id="phone" {...register("phone")} className="mt-2" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="subject">Subject (optional)</label>
              <Input id="subject" {...register("subject")} className="mt-2" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="message">Message</label>
            <Textarea id="message" {...register("message")} className="mt-2" rows={6} aria-invalid={!!errors.message} />
            {errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}
          </div>
          <Button type="submit" variant="accent" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send Message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
