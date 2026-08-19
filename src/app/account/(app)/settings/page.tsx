"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "At least 8 characters.")
      .regex(/[A-Za-z]/, "At least one letter.")
      .regex(/\d/, "At least one number."),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "Passwords do not match.", path: ["confirm"] });

export default function SettingsPage() {
  const [msg, setMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setMsg(null);
    try {
      await api("/api/account/change-password", {
        method: "POST",
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      setMsg({ type: "success", text: "Password changed. You have been signed out of other sessions." });
      reset();
    } catch (e) {
      setMsg({ type: "error", text: e instanceof ApiRequestError ? e.message : "Something went wrong." });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-ink">Account Settings</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Change your password. Changing it signs you out of all other sessions.
        </p>
      </div>

      {msg && <Alert variant={msg.type === "success" ? "success" : "error"}>{msg.text}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border bg-surface p-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="currentPassword">Current Password</label>
          <Input id="currentPassword" type="password" {...register("currentPassword")} className="mt-2" />
          {errors.currentPassword && <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="newPassword">New Password</label>
          <Input id="newPassword" type="password" {...register("newPassword")} className="mt-2" />
          {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="confirm">Confirm New Password</label>
          <Input id="confirm" type="password" {...register("confirm")} className="mt-2" />
          {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
