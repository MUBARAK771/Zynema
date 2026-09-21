import Link from "next/link";

const settings = [
  { label: "Profile", value: "Updated 2 days ago" },
  { label: "Notifications", value: "On" },
  { label: "Streaming quality", value: "Auto" },
  { label: "Theme", value: "Dark mode" },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="rounded-2xl border border-[#242529] bg-base-panel p-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Settings</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Account preferences</h1>

        <div className="mt-6 space-y-3">
          {settings.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-[#242529] bg-[#16181C] p-4 text-sm text-zinc-200">
              <span>{label}</span>
              <span className="text-muted">{value}</span>
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
