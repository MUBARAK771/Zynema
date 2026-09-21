import Link from "next/link";

const helpItems = [
  "How do I save a show?",
  "How can I filter by genre?",
  "Where do I view the full show details?",
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border border-[#242529] bg-base-panel p-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Help</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Support center</h1>

        <div className="mt-6 space-y-3">
          {helpItems.map((item) => (
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
