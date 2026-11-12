import { CalendarDays, Clock, Download, Star } from "lucide-react";
import Link from "next/link";
import { getMovie } from "@/lib/tmdb";
import MovieTrailerPlayer from "@/app/components/MovieTrailerPlayer";
import MovieSources from "@/app/components/MovieSources";
import WatchNowButton from "@/app/components/WatchNowButton";
import WatchlistButton from "@/app/components/WatchlistButton";

function formatReleaseDate(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(timestamp);
}

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

  const { movie, providers, watchGuideUrl, trailer, cast, crew } = result;

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
              <span className="flex items-center gap-1"><CalendarDays size={14} /> {formatReleaseDate(movie.releaseDate, movie.year)}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {movie.runtime}</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-zinc-300">{movie.overview}</p>
            <div className="flex flex-wrap gap-3">
              <WatchlistButton
                item={{
                  type: "movie",
                  id: String(movie.id),
                  title: movie.title,
                  year: movie.year,
                  posterImage: movie.posterImage,
                }}
              />
              <WatchNowButton />
              <a
                href="#available-to-watch"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-zinc-600 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:border-white"
              >
                <Download size={15} /> Download Movie
              </a>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {trailer ? (
            <div id="watch">
              <h2 className="text-xl font-bold">Official trailer</h2>
              <p className="mt-1 text-sm text-zinc-500">
                This is a trailer, not the full movie.
              </p>
              <div className="mt-5 overflow-hidden rounded-lg border border-[#2b2d31] bg-black">
                <MovieTrailerPlayer videoKey={trailer.key} title={movie.title} />
                <p className="p-3 text-xs text-zinc-500">{trailer.name} · Official trailer on YouTube</p>
              </div>
            </div>
          ) : null}

          <MovieSources
            movieId={movie.id}
            title={movie.title}
            poster={movie.backdropImage || movie.posterImage}
            providers={providers}
            watchGuideUrl={watchGuideUrl}
          />

          {cast.length > 0 || crew.length > 0 ? (
            <section aria-labelledby="cast-crew-title">
              <h2 id="cast-crew-title" className="text-xl font-bold">Cast &amp; Crew</h2>
              {crew.length > 0 ? (
                <p className="mt-2 text-sm text-zinc-300">
                  {crew.map((member) => `${member.name} (${member.job})`).join(" · ")}
                </p>
              ) : null}
              {cast.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {cast.slice(0, 6).map((member) => (
                    <div key={member.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-[#2b2d31] bg-[#17191c] p-3">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                          {member.name.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-white">{member.name}</span>
                        <span className="block truncate text-[11px] text-zinc-500">{member.character}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="rounded-lg border border-[#2b2d31] bg-[#17191c] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">About this movie</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{movie.genre}</p>
          <p className="mt-3 text-xs leading-5 text-zinc-500">Movie metadata and official viewing options are provided by TMDB.</p>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Internet Archive files are enabled only when a recognized public-domain or open license is listed.
          </p>
        </aside>
      </section>
    </main>
  );
}
