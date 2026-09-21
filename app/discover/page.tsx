import Link from "next/link";

const highlights = [
  "Top picks of the week",
  "Fresh sci-fi premieres",
  "Critics’ favorites",
];

export default function DiscoverPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border border-[#242529] bg-base-panel p-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Discover</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Find your next obsession</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
          Explore curated collections, trending titles, and hand-picked recommendations built for binge-watch sessions.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="rounded-xl border border-[#242529] bg-[#16181C] p-4 text-sm text-zinc-200">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/" className="inline-flex items-center text-sm text-accent hover:text-white">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
