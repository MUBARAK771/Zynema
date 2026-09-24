import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  Clock3,
  Flame,
  Gamepad2,
  Heart,
  MonitorPlay,
  Play,
  Radio,
  Sparkles,
  Star,
  TrendingUp,
  Tv,
  Zap,
} from "lucide-react";
import { getShows, type Show } from "@/lib/tvmaze";
import { getLatestMovie, type Movie } from "@/lib/tmdb";
import HeroSlideshow from "@/app/components/HeroSlideshow";

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

function LatestMovie({ movie }: { movie: Movie | null }) {
  if (!movie) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-lg border border-[#3c302d] bg-[#17191c]">
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <div className="aspect-2/3 bg-[#24262a] md:aspect-auto">
          {movie.posterImage ? (
            <img src={movie.posterImage} alt={`${movie.title} poster`} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex flex-col justify-center p-5 md:p-7">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff754b]">Latest from TMDB</span>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">{movie.title}</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
            <span>{movie.year}</span>
            <span>{movie.genre}</span>
            <span>{movie.rating.toFixed(1)} Rating</span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            {movie.overview || "No description is available yet for this movie."}
          </p>
          <Link href={`/movies/${movie.id}`} className="mt-5 inline-flex w-fit items-center rounded-full bg-[#ff3d00] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#ff551f]">
            View Watch Options
          </Link>
        </div>
      </div>
    </section>
  );
}

function RowTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-100">{icon}{title}</h2>
        <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>
      </div>
      <Link href="/discover" className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-400 hover:text-white">
        Explore All <ArrowRight size={11} />
      </Link>
    </div>
  );
}

export default async function Home() {
  const [{ shows }, latestMovie] = await Promise.all([
    getShows(1),
    getLatestMovie().catch(() => null),
  ]);
  const trending = shows.slice(1, 5);
  const popular = shows.slice(0, 4);

  return (
    <main className="min-h-full bg-[#0d0e10] pb-10 text-base">
      <HeroSlideshow shows={shows.slice(0, 5)} />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex gap-2 overflow-x-auto py-6 scrollbar-none">
          {genres.map(({ label, icon: Icon }, index) => (
            <button key={label} className={`flex shrink-0 items-center gap-1.5 rounded-md border px-4 py-2 text-[12px] ${index === 0 ? "border-[#ff3d00] bg-[#ff3d00]/10 text-white" : "border-[#2b2d31] bg-[#1a1c20] text-zinc-300 hover:border-zinc-500"}`}><Icon size={12} />{label}</button>
          ))}
        </div>

        <section className="py-2 ">
          <RowTitle icon={<TrendingUp size={14} className="text-[#ff3d00]" />}  title="Trending Now" subtitle="The most watched shows on Zynema this week" />
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

        <LatestMovie movie={latestMovie} />

        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-lg border border-[#3c302d] bg-linear-to-r from-[#1b1d20] to-[#2a1e1c] p-5 sm:flex-row sm:items-center">
          <div><h2 className="text-3xl font-bold">Never miss a premiere.</h2><p className="mt-1 max-w-lg text-[12px] leading-4 text-zinc-400">Join millions of enthusiasts receiving weekly notifications about upcoming seasons, exclusive interviews, and tailored recommendations.</p></div>
          <div className="flex shrink-0 gap-2"><Link href="/discover" className="rounded-full bg-[#ff3d00] px-5 py-2.5 text-[12px] font-semibold">Discover movies</Link><Link href="/schedule" className="rounded-full border border-zinc-500 px-5 py-2.5 text-[12px]">View Schedule</Link></div>
        </section>
      </div> 
    </main>
  );
}
