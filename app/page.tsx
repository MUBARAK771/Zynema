import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  Clock3,
  Flame,
  Gamepad2,
  Heart,
  Info,
  MonitorPlay,
  Play,
  Plus,
  Radio,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
  Zap,
} from "lucide-react";
import { getShows, type Show } from "@/lib/tvmaze";

const genres = [
  { label: "Sci-Fi", icon: Zap },
  { label: "Action", icon: Flame },
  { label: "Thriller", icon: Clapperboard },
  { label: "Romance", icon: Heart },
  { label: "Comedy", icon: Gamepad2 },
  { label: "Drama", icon: MonitorPlay },
];

function CompactCard({ show }: { show: Show }) {
  return (
    <Link href={`/shows/${show.id}`} className="group min-w-0">
      <article className="overflow-hidden rounded-lg border border-[#292b2f] bg-[#1b1d20] transition hover:-translate-y-0.5 hover:border-[#ff3d00]/70">
        <div className="relative aspect-[1.55/1] overflow-hidden bg-[#24262a]">
          {show.posterImage ? (
            <img
              src={show.posterImage}
              alt={show.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-1 text-[10px] font-semibold">
            <Star size={10} className="fill-[#ffb400] text-[#ffb400]" />
            {show.rating.toFixed(1)}
          </span>
        </div>
        <div className="p-2.5">
          <h3 className="truncate text-[11px] font-semibold text-zinc-100">{show.title}</h3>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">{show.genre}</p>
          <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-500">
            <span className="flex items-center gap-1"><CalendarDays size={10} /> {show.year}</span>
            <span className="flex items-center gap-1"><Clock3 size={10} /> {show.runtime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function RowTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">{icon}{title}</h2>
        <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>
      </div>
      <Link href="/dashboard" className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400 hover:text-white">
        Explore All <ArrowRight size={11} />
      </Link>
    </div>
  );
}

export default async function Home() {
  const { shows } = await getShows(1);
  const featured = shows[0];
  const trending = shows.slice(1, 5);
  const popular = shows.slice(0, 4);

  return (
    <main className="min-h-full bg-[#0d0e10] pb-10 text-base">
      <section className="relative min-h-97.5 overflow-hidden border-b border-[#202226]">
        {featured?.posterImage ? (
          <img src={featured.posterImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-r from-[#0d0e10] via-[#0d0e10]/75 to-[#0d0e10]/25" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0d0e10] via-transparent to-black/20" />
        <div className="relative mx-auto flex min-h-97.5 max-w-7xl items-end px-5 pb-12 pt-14 lg:px-8">
          <div className="max-w-xl">
            <div className="mb-3 flex flex-wrap gap-2 text-[9px] font-medium text-[#ff754b]">
              <span className="rounded bg-[#ff3d00]/20 px-2 py-1">Original</span>
              <span className="rounded bg-[#ff3d00]/20 px-2 py-1">{featured?.genre.split(",")[0] ?? "Sci-Fi"}</span>
              <span className="rounded bg-[#ff3d00]/20 px-2 py-1">Epic</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{featured?.title ?? "The Stellar Frontier"}</h1>
            <div className="mt-3 flex gap-4 text-[10px] text-zinc-300">
              <span className="flex items-center gap-1 text-base"><Star size={11} className="fill-[#ffb400] text-[#ffb400]" /> {featured?.rating.toFixed(1) ?? "9.4"} Rating</span>
              <span className="text-base">{featured?.year ?? "2024"}</span>
              <span className="text-base">12 Episodes</span>
            </div>
            <p className="mt-4 max-w-lg text-base leading-5 text-zinc-400">Explore a universe of remarkable stories, unforgettable characters, and fresh episodes waiting for your next watch.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href={featured ? `/shows/${featured.id}` : "/dashboard"} className="inline-flex items-center gap-2 rounded-full bg-[#ff3d00] px-5 py-2.5 text-base font-semibold text-white hover:bg-[#ff551f]"><Play size={18} className="" /> Watch Now</Link>
              <Link href={featured ? `/shows/${featured.id}` : "/dashboard"} className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-4 py-2.5 text-base text-zinc-200 hover:border-white"><Info size={18} /> More Details</Link>
              <button aria-label="Add featured show" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 text-zinc-200 hover:border-white"><Plus size={14} /></button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-6 scrollbar-none">
          {genres.map(({ label, icon: Icon }, index) => (
            <button key={label} className={`flex shrink-0 items-center gap-1.5 rounded-md border px-4 py-2 text-[10px] ${index === 0 ? "border-[#ff3d00] bg-[#ff3d00]/10 text-white" : "border-[#2b2d31] bg-[#1a1c20] text-zinc-300 hover:border-zinc-500"}`}><Icon size={12} />{label}</button>
          ))}
        </div>

        <section className="py-2">
          <RowTitle icon={<TrendingUp size={14} className="text-[#ff3d00]" />} title="Trending Now" subtitle="The most watched shows on Zynema this week" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{trending.map((show) => <CompactCard key={show.id} show={show} />)}</div>
        </section>

        <section className="py-8">
          <RowTitle icon={<Tv size={14} className="text-[#ff3d00]" />} title="Currently Airing" subtitle="Fresh episodes available right now" />
          <div className="grid gap-4 md:grid-cols-2">
            {[popular[0], popular[1]].map((show) => show ? (
              <Link key={show.id} href={`/shows/${show.id}`} className="group relative h-32 overflow-hidden rounded-lg border border-[#2b2d31] bg-[#1b1d20]">
                {show.posterImage ? <img src={show.posterImage} alt={show.title} className="h-full w-full object-cover opacity-70 transition group-hover:scale-105" /> : null}
                <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/45 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-4"><span className="mb-2 w-fit rounded bg-[#ff3d00] px-1.5 py-1 text-[8px] font-bold">LIVE</span><h3 className="text-sm font-bold">{show.title}</h3><p className="mt-0.5 text-[10px] text-zinc-400">{show.genre} · New Episode</p><span className="mt-3 flex w-fit items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[9px]"><Play size={9} className="" /> Watch Live</span></div>
              </Link>
            ) : null)}
          </div>
        </section>

        <section className="py-2">
          <RowTitle icon={<Flame size={14} className="text-[#ff3d00]" />} title="Global Popularity" subtitle="Fan favorites across all regions" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{popular.map((show) => <CompactCard key={show.id} show={show} />)}</div>
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg border border-[#3c302d] bg-linear-to-r from-[#1b1d20] to-[#2a1e1c] p-5 sm:flex-row sm:items-center">
          <div><h2 className="text-lg font-bold">Never miss a premiere.</h2><p className="mt-1 max-w-lg text-[10px] leading-4 text-zinc-400">Join millions of enthusiasts receiving weekly notifications about upcoming seasons, exclusive interviews, and tailored recommendations.</p></div>
          <div className="flex shrink-0 gap-2"><Link href="/dashboard" className="rounded-full bg-[#ff3d00] px-5 py-2.5 text-[10px] font-semibold">Sign Up Free</Link><Link href="/schedule" className="rounded-full border border-zinc-500 px-5 py-2.5 text-[10px]">View Schedule</Link></div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#25272b] pt-5 text-[9px] text-zinc-500">
          <span>© 2024 Zynema Entertainment</span>
          <div className="flex gap-4"><span>Privacy Policy</span><span>Terms of Service</span><span className="flex items-center gap-1"><Heart size={9} /> Made for your next watch</span></div>
        </footer>
      </div>
    </main>
  );
}
