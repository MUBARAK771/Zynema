import { ChevronDown, Clock, Download, Info, Play, Plus, Share, Share2, ThumbsUp } from "lucide-react";
import Link from "next/link";

const fallbackBaseUrl = "https://api.tvmaze.com";

type CastMember = {
  person: {
    id: number;
    name: string;
    image: { medium: string; original?: string } | null;
  };
  character: {
    name: string;
  };
};

type Episode = {
  id: number;
  name: string;
  season: number;
  number: number;
  summary: string | null;
  image: { medium: string; original?: string } | null;
};

type TVMazeShow = {
  id: number;
  name: string;
  type: string;
  genres: string[];
  premiered: string | null;
  runtime: number | null;
  rating: { average: number | null };
  image: { original: string; medium: string } | null;
  summary: string | null;
  status: string | null;
  network?: { name?: string } | null;
  _embedded?: { cast?: CastMember[] };
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || fallbackBaseUrl;
}

async function getShow(id: string) {
  const response = await fetch(
    `${getBaseUrl()}/shows/${encodeURIComponent(id)}?embed=cast`,
    { next: { revalidate: 3600 } },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load show details");
  }

  return (await response.json()) as TVMazeShow;
}

async function getEpisodes(id: string) {
  const response = await fetch(`${getBaseUrl()}/shows/${encodeURIComponent(id)}/episodes`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [] as Episode[];
  }

  return (await response.json()) as Episode[];
}

function stripHtml(value: string | null) {
  return value?.replace(/<[^>]*>/g, "").trim() || "No summary available.";
}

export default async function ShowDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [show, episodes] = await Promise.all([getShow(id), getEpisodes(id)]);

  if (!show) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Show not found</h1>
        <Link href="/dashboard" className="mt-4 inline-block text-accent">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const heroImage = show.image?.original || show.image?.medium;
  const cast = (show._embedded?.cast ?? []).slice(0, 5);
  const seasonOptions = [...new Set((episodes || []).map((episode) => episode.season).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  const topEpisodes = episodes.slice(0, 4);

  return (
    <main className="mx-auto max-w-6xl pb-8 md:scrollbar-none">
      <section className="relative overflow-hidden border border-[#0F0F10] bg-[#0F0F10] shadow-2xl">
        <div className="absolute inset-0">
          {heroImage ? (
            <img src={heroImage} alt={show.name} className="h-full w-full object-cover opacity-45" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d1156] via-[#0b0d111a]/75 to-[#000]/90" />
        </div>

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex items-center justify-between text-sm text-zinc-200">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <span className="rounded bg-white/5 px-2 py-1">TV MA</span>
              <span className="rounded bg-white/5 px-2 py-1">{show.rating.average?.toFixed(1) ?? "N/A"}</span>
              <span className="rounded bg-white/5 px-2 py-1">{show.premiered?.slice(0, 4) ?? "—"}</span>
              <span className="rounded bg-white/5 px-2 py-1">{show.genres.length ? `${show.genres.length} seasons` : "Series"}</span>
            </div>
            <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">
              Back to dashboard
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{show.name}</h1>
              <p className="mt-3 text-base text-zinc-300 md:text-xl">
                {stripHtml(show.summary)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[#FF3D00] px-5 py-3 text-sm font-semibold text-white transition cursor-pointer hover:bg-[#ff4e1f]">
              <Play/> Watch Season 1, Ep 1
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-white/5 px-4 py-3 text-sm text-zinc-200 cursor-pointer hover:border-zinc-400">
              <Plus/> Add to My List
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-white/5 text-zinc-200 cursor-pointer hover:border-zinc-400">
              <ThumbsUp />
            </button>
             <button className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-white/5 text-zinc-200 cursor-pointer hover:border-zinc-400">
              <Share2 />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 px-2 xl:grid-cols-[1.7fr_0.9fr] bg-[#0d0e10]">
        <div className="space-y-6">
          <div className="rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-[#242527] pb-3">
              <div className="flex gap-3 text-sm font-medium">
                <button className="border-b-2 border-[#FF3D00] pb-2 text-white">Episodes</button>
                <button className="pb-2 text-zinc-400">More Like This</button>
                <button className="pb-2 text-zinc-400">Details</button>
              </div>

              <label className="relative block">
                <select
                  defaultValue={seasonOptions[0] ?? 1}
                  className="appearance-none rounded-lg bg-[#0f0f0f] cursor-pointer border border-[#242529] px-3 py-2 pr-8 text-xs text-zinc-300 outline-none"
                  aria-label="Select season"
                >
                  {seasonOptions.length > 0 ? (
                    seasonOptions.map((season) => (
                      <option key={season} value={season}>
                        Season {season}
                      </option>
                    ))
                  ) : (
                    <option value={1} className="bg-[#0f0f0f]" >Season 1</option>
                  )}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </label>
            </div>

            <div className="mt-4 space-y-4 ">
              {topEpisodes.length > 0 ? (
                topEpisodes.map((episode, index) => (
                  <div key={episode.id} className="flex gap-4 rounded-xl p-2.5">
                    <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-zinc-800">
                      {episode.image?.medium ? (
                        <img src={episode.image.medium} alt={episode.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">
                          {index + 1}. {episode.name || "Episode"}
                        </h3>
                        <span className="text-xs text-zinc-500"><Download /></span>
                      </div>
                      <p className="mt-6 text-sm leading-6 text-zinc-400">
                        {stripHtml(episode.summary)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-[#242529] bg-[#101317] p-4 text-sm text-zinc-400">
                  Episode details are not available for this show right now.
                </div>
              )}
            </div>

            <button className="mt-4 text-sm font-medium text-zinc-300 hover:text-white">
              View All Episodes →
            </button>
          </div>

          <div className="rounded-2xl p-5">
            <h2 className="text-2xl font-bold text-white">About {show.name}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {stripHtml(show.summary)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(show.genres.length ? show.genres : ["Drama"]).map((genre) => (
                <span key={genre} className="rounded-full border border-[#242529] bg-white/5 px-3 py-1 text-xs text-zinc-200">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-[#151518] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Top Cast</h3>
              <button className="text-xs text-zinc-400 hover:text-white">View All</button>
            </div>

            <div className="space-y-3">
              {cast.map(({ person, character }) => (
                <div key={`${person.id}-${character.name}`} className="flex items-center gap-3 rounded-xl bg-[#101317] p-2">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-700">
                    {person.image?.medium ? (
                      <img src={person.image.medium} alt={person.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        {person.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{person.name}</p>
                    <p className="truncate text-xs text-zinc-400">{character.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl  p-5">
            <h3 className="mb-5 flex items-center gap-2 text-base font-semibold uppercase tracking-[0.12em] text-zinc-400">
              <Info />
              Series Info
            </h3>

            <div className="space-y-5 text-zinc-200">
              <div>
                <div className="text-sm text-zinc-400">Status</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {show.status || "Unknown"}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400">Original Release</div>
                <div className="mt-1 text-2xl font-semibold text-white">
                  {show.premiered ? new Date(show.premiered).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) : "—"}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400">Content Advisory</div>
                <div className="mt-1 text-2xl font-semibold leading-tight text-white">
                  {show.genres.join(", ") || "No advisory info"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-semibold uppercase text-zinc-400 px-5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-zinc-300">
                <Clock  />
              </span>
              Watch Availability
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex min-h-[160px] flex-col items-center justify-center rounded-[24px] border border-[#242529] bg-[#1a1c1f] p-4 text-center text-white transition hover:border-zinc-500">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                  <Play size={28} className=" text-white" />
                </div>
                <span className="text-xl font-bold uppercase tracking-wide">Stream Now</span>
                <span className="mt-2 text-sm text-zinc-400">4K + HDR</span>
              </button>

              <button className="flex min-h-[160px] flex-col items-center justify-center rounded-[24px] border border-[#242529] bg-[#1a1c1f] p-4 text-center text-white transition hover:border-zinc-500">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                  <Download size={28} className="text-white" />
                </div>
                <span className="text-xl font-bold uppercase tracking-wide">Offline</span>
                <span className="mt-2 text-sm text-zinc-400">Available</span>
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#242529] bg-[#313034] p-6 text-white">
            <h3 className="text-3xl font-bold leading-tight">Join the Conversation</h3>
            <p className="mt-3 text-base leading-7 text-zinc-200/90">
              Rate and discuss episodes with thousands of other fans.
            </p>
            <button className="mt-5 w-full rounded-xl bg-white px-4 py-4 text-lg font-bold text-[#111317]">
              Open Discussion Hub
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}