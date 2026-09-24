import { ArrowUpRight, CalendarDays, Clock, Play, Star } from "lucide-react";
import Link from "next/link";
import { getMovie } from "@/lib/tmdb";

export default async function MovieDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getMovie(id);

  if (!result) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <Link href="/discover" className="mt-4 inline-block text-accent">
          Back to discover
        </Link>
      </main>
    );
  }

  const { movie, providers } = result;

  return (
    <main className="min-h-full bg-[#0d0e10] pb-10 text-zinc-100">
      <section className="relative overflow-hidden border-b border-[#242529]">
        <div className="absolute inset-0">
          {movie.backdropImage ? (
            <img src={movie.backdropImage} alt="" className="h-full w-full object-cover opacity-35" />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-r from-[#0d0e10] via-[#0d0e10]/90 to-[#0d0e10]/45" />
          <div className="absolute inset-0 bg-linear-to-t from-[#0d0e10] via-transparent to-black/20" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:py-8">
          <div className="flex justify-end">
            <Link href="/discover" className="text-xs text-zinc-400 hover:text-white">
              Back to discover
            </Link>
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr] lg:items-end lg:py-6">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl">
            {movie.posterImage ? (
              <img src={movie.posterImage} alt={`${movie.title} poster`} className="aspect-2/3 w-full object-cover" />
            ) : null}
          </div>

          <div className="max-w-2xl">
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-[#ff754b]">
              <span className="rounded bg-[#ff3d00]/20 px-2 py-1">Movie</span>
              <span className="rounded bg-[#ff3d00]/20 px-2 py-1">{movie.genre.split(",")[0]}</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <span className="flex items-center gap-1"><Star size={14} className="fill-[#ffb400] text-[#ffb400]" /> {movie.rating.toFixed(1)}</span>
              <span className="flex items-center gap-1"><CalendarDays size={14} /> {movie.year}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {movie.runtime}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-300">{movie.overview}</p>
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-xl font-bold">Watch Options</h2>
          <p className="mt-1 text-sm text-zinc-500">Choose an official service to watch this movie.</p>

          {providers.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {providers.map((provider) => (
                <a
                  key={provider.name}
                  href={provider.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-[#2b2d31] bg-[#17191c] p-3 transition hover:border-[#ff3d00]"
                >
                  {provider.logoPath ? (
                    <img src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`} alt="" className="h-10 w-10 rounded-lg" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff3d00]"><Play size={16} /></span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">Watch on {provider.name}</span>
                    <span className="text-xs text-zinc-500">Availability may vary by region</span>
                  </span>
                  <ArrowUpRight size={16} className="text-zinc-500" />
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-[#2b2d31] bg-[#17191c] p-4 text-sm text-zinc-400">
              No streaming providers are listed for this movie in the US right now.
            </div>
          )}
        </div>

        <aside className="rounded-lg border border-[#2b2d31] bg-[#17191c] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">About this movie</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{movie.genre}</p>
          <p className="mt-3 text-xs leading-5 text-zinc-500">Watch availability is provided by TMDB and links to official services.</p>
        </aside>
      </section>
    </main>
  );
}
