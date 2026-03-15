"use client";

import { FormEvent, useMemo, useState } from "react";

type CalcResult = {
  amount: number;
  year: number;
  btcAmount: number;
  valueToday: number;
};

function parseInput(input: string): { amount: number; year: number } | null {
  const amountMatch = input.match(/\$\s*([\d,]+(?:\.\d+)?)/);
  const yearMatch = input.match(/\b(20[1-2][0-9]|19\d{2})\b/);

  if (!amountMatch || !yearMatch) return null;

  const amount = Number(amountMatch[1].replace(/,/g, ""));
  const year = Number(yearMatch[1]);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(year)) return null;

  return { amount, year };
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export default function HomePage() {
  const [text, setText] = useState("I bought $500 sneakers in 2016");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const tweetUrl = useMemo(() => {
    if (!result) return "";
    const tweet = `If you bought BTC instead: ${formatUSD(result.amount)} in ${result.year} -> ${formatUSD(result.valueToday)} today`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
  }, [result]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const parsed = parseInput(text);
    if (!parsed) {
      setError("Please include both a dollar amount and a year. Example: I bought $500 sneakers in 2016");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/btc?year=${parsed.year}`);
      const data = (await res.json()) as { priceThen?: number; priceNow?: number; error?: string };

      if (!res.ok || !data.priceThen || !data.priceNow) {
        throw new Error(data.error || "Could not fetch BTC price.");
      }

      const btcAmount = parsed.amount / data.priceThen;
      const valueToday = btcAmount * data.priceNow;

      setResult({
        amount: parsed.amount,
        year: parsed.year,
        btcAmount,
        valueToday
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">If You Bought BTC Instead</h1>
      <p className="mt-2 text-zinc-600">Type a sentence like: I bought $500 sneakers in 2016</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-zinc-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="I bought $500 sneakers in 2016"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <section className="mt-8 space-y-4">
          <p className="text-xl font-semibold">
            If you bought BTC instead: {formatUSD(result.amount)} in {result.year} -> {formatUSD(result.valueToday)} today
          </p>

          <div className="rounded-2xl bg-zinc-950 p-8 text-white shadow-xl">
            <p className="text-sm uppercase tracking-widest text-zinc-400">If You Bought BTC Instead</p>
            <p className="mt-4 text-3xl font-extrabold leading-tight">
              {formatUSD(result.amount)} in {result.year}
              <br />
              -> {formatUSD(result.valueToday)} today
            </p>
          </div>

          <a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-xl border border-zinc-300 bg-white px-4 py-2 font-medium hover:bg-zinc-100"
          >
            Share on Twitter
          </a>
        </section>
      ) : null}
    </main>
  );
}
