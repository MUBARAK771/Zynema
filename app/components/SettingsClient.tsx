"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Save, UserRound } from "lucide-react";
import { useDashboardUser, useUpdateDashboardUser } from "@/app/components/AuthGate";
import type { TMDBLocale } from "@/lib/tmdb";

export default function SettingsClient({ loginUrl }: { loginUrl: string }) {
  const user = useDashboardUser();
  const updateDashboardUser = useUpdateDashboardUser();
  const [name, setName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState(user?.language ?? "en-US");
  const [languages, setLanguages] = useState<TMDBLocale[]>([
    { code: "en-US", name: "English (United States)" },
  ]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [searchable, setSearchable] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/languages", { cache: "force-cache" });
        const result = (await response.json()) as {
          languages?: TMDBLocale[];
          error?: string;
        };
        if (!response.ok || !Array.isArray(result.languages)) {
          throw new Error(result.error || "Content languages could not be loaded.");
        }
        if (active) setLanguages(result.languages);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Content languages could not be loaded.");
        }
      } finally {
        if (active) setLoadingLanguages(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/auth/profile", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const result = (await response.json()) as {
          profile?: { searchable?: boolean };
          error?: string;
        };
        if (!response.ok || typeof result.profile?.searchable !== "boolean") {
          throw new Error(result.error || "Your creator profile could not be loaded.");
        }
        if (active) setSearchable(result.profile.searchable);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Your creator profile could not be loaded.");
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, language, searchable }),
      });
      const result = (await response.json()) as {
        user?: typeof user;
        error?: string;
      };
      if (!response.ok || !result.user?.id) {
        throw new Error(result.error || "Your profile could not be saved.");
      }

      updateDashboardUser(result.user);
      setName(result.user.name ?? "");
      setLanguage(result.user.language);
      setMessage("Your profile, creator visibility, and content language have been saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("The dashboard session could not be cleared.");
    } catch (cause) {
      console.error("Logout failed", cause);
    } finally {
      const destination = new URL(loginUrl);
      destination.searchParams.set("logout", "1");
      window.location.assign(destination.toString());
    }
  }

  return (
    <section className="mx-auto min-h-full max-w-4xl p-4 pb-8 text-zinc-100 sm:p-6" aria-labelledby="settings-title">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Settings</p>
        <h1 id="settings-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">Account preferences</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your profile and the language used for movie metadata.
        </p>
      </header>

      <form onSubmit={saveProfile} className="space-y-5">
        <section className="rounded-2xl border border-[#242529] bg-base-panel p-4 sm:p-6">
          <div className="flex items-center gap-3 border-b border-[#292b30] pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff3d00]/15 text-[#ff765c]">
              <UserRound size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-white">Profile</h2>
              <p className="text-xs text-zinc-500">Your name is shown in the dashboard.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              Display name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                autoComplete="name"
                className="mt-2 w-full rounded-lg border border-[#34363a] bg-[#101215] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff765c]"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              Email address
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="mt-2 w-full cursor-not-allowed rounded-lg border border-[#292b30] bg-[#17191c] px-3 py-2.5 text-sm text-zinc-500"
              />
            </label>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={searchable}
              onChange={(event) => setSearchable(event.target.checked)}
              disabled={loadingProfile}
              className="mt-1 accent-[#ff3d00]"
            />
            <span>
              <span className="block font-medium text-white">Show my creator profile in search</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                If enabled, your display name and published videos can be found by other signed-in users.
                Your email address is never shown.
              </span>
            </span>
          </label>
          {loadingProfile ? (
            <p role="status" className="mt-3 text-xs text-zinc-500">Loading creator profile…</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#242529] bg-base-panel p-4 sm:p-6">
          <h2 className="font-semibold text-white">Content language</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Uses TMDB-supported translations for movie titles and descriptions where available.
            TVMaze series details and dashboard menus remain in English.
          </p>
          <label className="mt-4 block max-w-xl text-sm text-zinc-300">
            Preferred language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={loadingLanguages || languages.length === 0}
              className="mt-2 w-full rounded-lg border border-[#34363a] bg-[#101215] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff765c] disabled:opacity-60"
            >
              {languages.some((item) => item.code === language) ? null : (
                <option value={language}>{language}</option>
              )}
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </label>
          {loadingLanguages ? <p role="status" className="mt-2 text-xs text-zinc-500">Loading supported languages…</p> : null}
        </section>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#34363a] px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-60 sm:justify-start"
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
          <button
            type="submit"
            disabled={saving || loadingLanguages || loadingProfile || languages.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#f04427] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff6040] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <section className="mt-5 rounded-2xl border border-[#242529] bg-base-panel p-4 sm:p-6">
        <h2 className="font-semibold text-white">Appearance</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Dark theme is currently the supported dashboard appearance.
        </p>
      </section>
    </section>
  );
}
