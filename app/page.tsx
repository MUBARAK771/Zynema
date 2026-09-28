import Link from "next/link";
import { ArrowRight, CalendarDays, Clapperboard, Flame, Play, Star } from "lucide-react";
import { getMovies, type Movie } from "@/lib/tmdb";

const genres = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Fantasy", "Horror", "Mystery", "Sci-Fi"];

function MoviePoster({ movie, featured = false }: { movie: Movie; featured?: boolean }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block min-w-0">
      <article className="overflow-hidden border border-[#28292d] bg-[#111214] transition-colors hover:border-[#ff4b2b]/70">
        <div className={`relative overflow-hidden bg-[#202124] ${featured ? "aspect-16/10" : "aspect-2/3"}`}>
          {movie.posterImage ? <img src={movie.posterImage} alt={`${movie.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]" /> : null}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/5 to-black/10" />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white">
            <Star size={10} className="fill-[#f8c34a] text-[#f8c34a]" />{movie.rating.toFixed(1)}
          </span>
          {featured ? (
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase text-[#ff765c]"><Flame size={12} /> Featured movie</span>
              <h2 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">{movie.title}</h2>
              <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-5 text-zinc-300 sm:text-sm">{movie.overview}</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-sm bg-[#f04427] px-4 py-2.5 text-xs font-bold text-white transition group-hover:bg-[#ff6040]"><Play size={14} fill="currentColor" /> View movie <ArrowRight size={13} /></span>
            </div>
          ) : null}
        </div>
        {!featured ? (
          <div className="p-2.5 sm:p-3">
            <h3 className="truncate text-xs font-semibold text-zinc-100 sm:text-sm">{movie.title}</h3>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="inline-flex items-center gap-1"><CalendarDays size={11} />{movie.year}</span>
              <span>{movie.genre.split(",")[0]}</span>
            </div>
          </div>
        ) : null}
      </article>
    </Link>
  );
}

export default async function Home() {
  let movies: Movie[] = [];
  try {
    ({ movies } = await getMovies(1));
  } catch {
    movies = [];
  }

  const featured = movies[0];
  const recent = movies.slice(1, 13);

  return (
    <main className="min-h-full bg-[#0b0c0e] pb-12 text-white">
      <div className="mx-auto max-w-375 px-4 py-5 sm:px-6 lg:px-8">
        <nav aria-label="Movie genres" className="flex gap-2 overflow-x-auto border-b border-[#242529] pb-4 scrollbar-none">
          <span className="mr-1 inline-flex shrink-0 items-center gap-2 pr-2 text-xs font-bold uppercase text-zinc-300"><Clapperboard size={14} className="text-[#ff4b2b]" /> Browse</span>
          {genres.map((genre, index) => (
            <Link key={genre} href={`/discover?genre=${encodeURIComponent(genre)}`} className={`shrink-0 border px-3 py-1.5 text-[11px] font-medium transition-colors ${index === 0 ? "border-[#f04427] bg-[#f04427] text-white" : "border-[#2c2d31] bg-[#151619] text-zinc-300 hover:border-zinc-500 hover:text-white"}`}>
              {genre}
            </Link>
          ))}
        </nav>

        {featured ? (
          <section className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]" aria-label="Featured and popular movies">
            <MoviePoster movie={featured} featured />
            <div className="hidden grid-rows-2 gap-3 lg:grid">
              {movies.slice(1, 3).map((movie) => <MoviePoster key={movie.id} movie={movie} featured />)}
            </div>
          </section>
        ) : (
          <section className="mt-5 border border-[#292a2e] bg-[#111214] px-5 py-8">
            <h1 className="text-xl font-bold">Movies worth your time</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Movie listings are temporarily unavailable. Check your TMDB configuration or browse the catalog.</p>
            <Link href="/discover" className="mt-4 inline-flex items-center gap-2 bg-[#f04427] px-4 py-2.5 text-xs font-bold">Open discover <ArrowRight size={14} /></Link>
          </section>
        )}

        <section className="mt-8" aria-labelledby="recent-heading">
          <div className="mb-4 flex items-end justify-between border-b border-[#25262a] pb-3">
            <div>
              <h1 id="recent-heading" className="flex items-center gap-2 text-lg font-bold sm:text-xl"><Flame size={17} className="text-[#ff4b2b]" /> Recently added movies</h1>
              <p className="mt-1 text-[11px] text-zinc-500">Popular picks, updated from TMDB</p>
            </div>
            <Link href="/discover" className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">Browse all <ArrowRight size={13} /></Link>
          </div>
          {recent.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {recent.map((movie) => <MoviePoster key={movie.id} movie={movie} />)}
            </div>
          ) : !featured ? null : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie) => <MoviePoster key={movie.id} movie={movie} />)}
            </div>
          )}
        </section>

        <section className="mt-10 flex items-center justify-between gap-4 border-y border-[#292a2e] py-5">
          <div><p className="text-sm font-bold">Find your next movie</p><p className="mt-1 text-xs text-zinc-500">Search the catalog and check official watch options.</p></div>
          <Link href="/discover" className="shrink-0 bg-[#f04427] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#ff6040]">Discover</Link>
        </section>
      </div>
    </main>
  );
}