'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white font-sans text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-black font-display">System Error</h1>
          <p className="text-sm text-zinc-400">A global application error occurred.</p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-white text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
