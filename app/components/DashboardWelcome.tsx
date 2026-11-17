"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookmarkCheck,
  CalendarDays,
  Clapperboard,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useDashboardUser } from "@/app/components/AuthGate";

const availableFeatures = [
  {
    icon: Clapperboard,
    title: "Discover movies and shows",
    description: "Browse the catalog and explore titles by genre.",
  },
  {
    icon: Search,
    title: "Search and explore",
    description: "Find movies, TV shows, and details about each title.",
  },
  {
    icon: CalendarDays,
    title: "Check the TV schedule",
    description: "Browse available Nigeria TV listings.",
  },
  {
    icon: BookmarkCheck,
    title: "Keep a My List",
    description: "Save titles to your account and access them on your signed-in devices.",
  },
];

export default function DashboardWelcome() {
  const user = useDashboardUser();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const storageKey = user?.id ? `zynema:welcome:v1:${user.id}` : null;

  const dismiss = useCallback(() => {
    setOpen(false);
    if (!storageKey) return;

    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch (error) {
      console.warn("Welcome dialog preference could not be saved.", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;

    try {
      setOpen(window.localStorage.getItem(storageKey) !== "dismissed");
    } catch (error) {
      console.warn("Welcome dialog preference could not be read.", error);
      setOpen(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, dismiss]);

  if (!open || !user) return null;

  const displayName = user.name || user.email?.split("@")[0] || "there";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-welcome-title"
        aria-describedby="dashboard-welcome-description"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#15171b] p-5 text-zinc-100 shadow-2xl sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label="Close welcome dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff3d00]/15 text-[#ff765c]">
          <Sparkles size={21} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#ff765c]">
          Welcome to Zynema
        </p>
        <h1 id="dashboard-welcome-title" className="mt-2 pr-8 text-2xl font-bold text-white sm:text-3xl">
          Good to have you here, {displayName}.
        </h1>
        <p id="dashboard-welcome-description" className="mt-3 text-sm leading-6 text-zinc-400">
          Here’s what you can use in your dashboard right now:
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {availableFeatures.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-xl border border-[#292b30] bg-[#1b1d21] p-4"
            >
              <Icon size={19} className="text-[#ff765c]" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs leading-5 text-zinc-500">
          More account features are coming. Your My List is connected to your Zynema account.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-6 w-full rounded-lg bg-[#f04427] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ff6040] sm:w-auto"
        >
          Start exploring
        </button>
      </section>
    </div>
  );
}
