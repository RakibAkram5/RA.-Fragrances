"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";

interface Question {
  id: keyof Answers;
  prompt: string;
  options: { value: string; label: string }[];
}

interface Answers {
  timeOfDay: string;
  character: string;
  intensity: string;
  setting: string;
  vibe: string;
  occasion: string;
}

interface Recommendation {
  id: string;
  name: string;
  slug: string;
  price: number;
  size: string;
  family: string | null;
  image: string | null;
  stock: number;
  ratingAvg: number;
  reasons: string[];
  match: number;
}

const QUESTIONS: Question[] = [
  {
    id: "timeOfDay",
    prompt: "Day or night?",
    options: [
      { value: "day", label: "Day" },
      { value: "night", label: "Night" },
      { value: "any", label: "Both" },
    ],
  },
  {
    id: "character",
    prompt: "Fresh or warm?",
    options: [
      { value: "fresh", label: "Fresh" },
      { value: "warm", label: "Warm" },
      { value: "any", label: "Either" },
    ],
  },
  {
    id: "intensity",
    prompt: "Subtle or bold?",
    options: [
      { value: "subtle", label: "Subtle" },
      { value: "bold", label: "Bold" },
      { value: "any", label: "Either" },
    ],
  },
  {
    id: "setting",
    prompt: "Office or casual?",
    options: [
      { value: "office", label: "Office" },
      { value: "casual", label: "Casual" },
      { value: "any", label: "Either" },
    ],
  },
  {
    id: "vibe",
    prompt: "Clean or mysterious?",
    options: [
      { value: "clean", label: "Clean" },
      { value: "mysterious", label: "Mysterious" },
      { value: "any", label: "Either" },
    ],
  },
  {
    id: "occasion",
    prompt: "Everyday or special occasion?",
    options: [
      { value: "everyday", label: "Everyday" },
      { value: "special", label: "Special" },
      { value: "any", label: "Either" },
    ],
  },
];

export default function QuizPage() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>({
    timeOfDay: "",
    character: "",
    intensity: "",
    setting: "",
    vibe: "",
    occasion: "",
  });
  const [results, setResults] = React.useState<Recommendation[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const question = QUESTIONS[step]!;

  function answer(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submit(next);
    }
  }

  async function submit(finalAnswers: Answers) {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ recommendations: Recommendation[] }>("/api/quiz", {
        method: "POST",
        body: finalAnswers,
      });
      setResults(data.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setResults(null);
    setAnswers({ timeOfDay: "", character: "", intensity: "", setting: "", vibe: "", occasion: "" });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {results === null ? (
        <div>
          <p className="eyebrow">Find Your RA</p>
          <h1 className="mt-4 font-display text-5xl text-ink">Which scent is yours?</h1>
          <p className="mt-4 text-ink-secondary">
            Answer six quick questions and we will match you with a fragrance from the RA
            collection.
          </p>

          {loading ? (
            <div className="mt-12 animate-pulse text-ink-secondary">Composing your match…</div>
          ) : (
            <div className="mt-12">
              <div className="mb-6 flex gap-1.5" aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}>
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-0.5 flex-1 ${i <= step ? "bg-accent" : "bg-border"}`}
                  />
                ))}
              </div>
              <h2 className="font-display text-3xl text-ink">{question.prompt}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {question.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => answer(opt.value)}
                    className="flex h-14 items-center justify-between border border-border bg-surface px-5 text-sm tracking-wide text-ink transition-colors hover:border-accent hover:bg-surface-2"
                  >
                    {opt.label}
                    <ArrowRight className="h-4 w-4 text-ink-muted" />
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-ink-muted hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-up">
          <p className="eyebrow">Your Match</p>
          <h1 className="mt-4 font-display text-4xl text-ink">Your RA, found</h1>
          <p className="mt-4 text-ink-secondary">
            {results.length > 0
              ? "Based on your answers, these fragrances suit your presence best."
              : "We could not find a strong match yet — explore the full collection."}
          </p>

          <div className="mt-10 space-y-6">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-6 border border-border bg-surface p-6 sm:flex-row"
              >
                {r.image && (
                  <Link href={`/shop/${r.slug}`} className="h-40 w-40 shrink-0 overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                  </Link>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl text-ink">{r.name}</h2>
                    <span className="text-sm text-accent">{r.match}% match</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">
                    {r.size} · {r.family}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {r.reasons.map((reason) => (
                      <li key={reason} className="text-sm text-ink-secondary">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-ink">{formatPKR(r.price)}</span>
                    <Link
                      href={`/shop/${r.slug}`}
                      className="inline-flex h-10 items-center bg-accent px-5 text-xs uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
                    >
                      View Fragrance
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Retake Quiz
            </Button>
            <Link
              href="/shop"
              className="inline-flex h-11 items-center px-6 text-sm uppercase tracking-wider text-accent hover:text-accent-strong"
            >
              Browse All
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
