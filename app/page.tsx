export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <h1 className="text-4xl font-bold">Gomoku Games</h1>
      <p>Navigate to the Gomoku arena</p>
      <a
        className="rounded-full border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide transition hover:border-white hover:bg-white/10"
        href="/gomoku"
      >
        Open Gomoku
      </a>
    </div>
  );
}
