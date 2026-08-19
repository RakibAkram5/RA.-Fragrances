"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name is required."),
  phone: z.string().optional(),
});

interface Profile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  role: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [msg, setMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    api<{ user: Profile }>("/api/account/profile").then((d) => {
      setProfile(d.user);
      reset({ name: d.user.name, phone: d.user.phone ?? "" });
    });
  }, [reset]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setMsg(null);
    try {
      await api("/api/account/profile", { method: "PATCH", body: values });
      setMsg({ type: "success", text: "Profile updated." });
    } catch (e) {
      setMsg({ type: "error", text: e instanceof ApiRequestError ? e.message : "Something went wrong." });
    }
  }

  if (!profile) return <p className="text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Profile</h2>
          {profile.emailVerified ? (
            <Badge variant="success">Verified</Badge>
          ) : (
            <Badge variant="warning">Unverified email</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-secondary">{profile.email}</p>
        <p className="mt-1 text-xs text-ink-muted">Member since {formatDate(profile.createdAt)}</p>
      </div>

      {msg && <Alert variant={msg.type === "success" ? "success" : "error"}>{msg.text}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border border-border bg-surface p-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="name">Full Name</label>
          <Input id="name" {...register("name")} className="mt-2" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="phone">Mobile</label>
          <Input id="phone" {...register("phone")} className="mt-2" />
        </div>
        <Button type="submit" variant="accent" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
