"use client";

import { useEffect, useState } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (ignore) {
          return;
        }

        if (response.ok) {
          setReady(true);
          return;
        }

        setFailed(true);
        const next = encodeURIComponent(window.location.href);
        const loginUrl = `${process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-app.online"}?next=${next}`;
        window.location.assign(loginUrl);
      } catch {
        if (!ignore) {
          setFailed(true);
        }
      }
    }

    checkSession();
    return () => {
      ignore = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c0e] text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-[5px]" aria-label="Loading" role="status">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => (
              <span
                key={bar}
                className="bars-loader-bar"
                style={{ animationDelay: `${bar * 0.08}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-300">Checking your secure session…</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0c0e] px-6 text-center text-zinc-200">
        <div className="max-w-md rounded-2xl border border-[#242529] bg-[#16181c] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff765c]">Authentication required</p>
          <h1 className="mt-3 text-2xl font-bold text-white">We could not verify your account.</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Please sign in again from the Zynema authentication portal to continue.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-app.online"}`}
            className="mt-5 inline-flex rounded-full bg-[#ff3d00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff551f]"
          >
            Return to sign in
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
