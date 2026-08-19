"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api-client";

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailInner />
    </React.Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = React.useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      setState("error");
      setError("This link is missing its token.");
      return;
    }
    api("/api/auth/verify-email", { method: "POST", body: { token } })
      .then(() => setState("ok"))
      .catch((e) => {
        setState("error");
        setError(e instanceof Error ? e.message : "Verification failed.");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <p className="eyebrow">Email Verification</p>
      {state === "loading" && <p className="mt-6 text-ink-secondary">Verifying…</p>}
      {state === "ok" && (
        <>
          <Alert variant="success" className="mt-6">Your email has been verified. Thank you.</Alert>
          <Link href="/account/dashboard" className="mt-6 inline-block text-accent hover:underline">
            Go to your account
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <Alert variant="error" className="mt-6">{error}</Alert>
          <Link href="/account/login" className="mt-6 inline-block text-accent hover:underline">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
