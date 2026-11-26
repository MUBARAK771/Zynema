"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  CalendarDays,
  Bookmark,
  Settings,
  HelpCircle,
  LogOut,
  Upload,
} from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/schedule", label: "TV Schedule", icon: CalendarDays },
  { href: "/my-list", label: "My List", icon: Bookmark },
  { href: "/upload", label: "Upload", icon: Upload },
];
const mobileNav = [
  ...nav,
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ loginUrl }: { loginUrl: string }) {
  const pathname = usePathname();

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("The dashboard session could not be cleared.");
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      const loginDestination = new URL(loginUrl);
      loginDestination.searchParams.set("logout", "1");
      window.location.assign(loginDestination.toString());
    }
  }

  return (
    <>
      <aside className="hidden md:flex md:w-[220px] md:flex-col md:justify-between border-r border-[#242529] bg-[#1d1f23] px-3 py-4 shrink-0">
        <div>
          <div className="mb-8 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF3D00]/10">
              <img src="/zynema-logo.png" alt="Zynema logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-base text-[#FFF] font-semibold tracking-tight">Zynema</span>
          </div>

          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-[#FF3D00] text-white font-medium"
                      : "text-zinc-400 hover:bg-base-panel hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-1 border-t border-[#242529] pt-6">
          <Link
            href="/settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
              pathname === "/settings"
                ? "bg-[#FF3D00] font-medium text-white"
                : "text-zinc-400 hover:bg-base-panel hover:text-white"
            }`}
          >
            <Settings size={18} />
            Settings
          </Link>
          <Link
            href="/help"
            aria-current={pathname === "/help" ? "page" : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-base-panel hover:text-white"
          >
            <HelpCircle size={18} />
            Help
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-base-panel hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[#2b2d31] bg-[#15171a]/95 shadow-[0_-8px_24px_rgba(0,0,0,0.3)] backdrop-blur md:hidden"
      >
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] ${
                active ? "text-[#ff765c]" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}