"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type DashboardUser = {
  id: string;
  email: string | null;
  name: string | null;
};

const DashboardUserContext = createContext<DashboardUser | null>(null);

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}

export default function AuthGate({
  children,
  loginUrl,
}: {
  children: React.ReactNode;
  loginUrl: string;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [user, setUser] = useState<DashboardUser | null>(null);

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
          const result = (await response.json()) as {
            authenticated?: boolean;
            user?: DashboardUser;
          };
          if (!result.authenticated || !result.user?.id) {
            throw new Error("The session response did not contain a verified user.");
          }
          setUser(result.user);
          setReady(true);
          return;
        }

        setFailed(true);
        setReady(true);
        const next = encodeURIComponent(window.location.href);
        const destination = `${loginUrl}?next=${next}`;
        window.location.assign(destination);
      } catch {
        if (!ignore) {
          setFailed(true);
          setReady(true);
        }
      }
    }

    checkSession();
    return () => {
      ignore = true;
    };
  }, [loginUrl]);

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
            href={loginUrl}
            className="mt-5 inline-flex rounded-full bg-[#ff3d00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff551f]"
          >
            Return to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <DashboardUserContext.Provider value={user}>
      {children}
    </DashboardUserContext.Provider>
  );
}
