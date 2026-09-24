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
  Tv,
} from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/schedule", label: "TV Schedule", icon: CalendarDays },
  { href: "/my-list", label: "My List", icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
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
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href;

            return (
              <Link
                key={href}
                href={href}
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
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-base-panel hover:text-white"
        >
          <Settings size={18} />
          Settings
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-base-panel hover:text-white"
        >
          <HelpCircle size={18} />
          Help
        </Link>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:bg-base-panel hover:text-white">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}