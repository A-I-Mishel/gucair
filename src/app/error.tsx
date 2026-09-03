'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">{error.message}</p>
      <button onClick={reset} className="mt-6 rounded-md bg-[#1e3a5f] px-4 py-2 text-sm text-white">
        Try again
      </button>
    </div>
  );
}
