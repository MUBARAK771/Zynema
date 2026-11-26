import Link from "next/link";
import { notFound } from "next/navigation";
import { Clapperboard, Upload, UserRound } from "lucide-react";
import { getRequestSession } from "@/lib/auth";
import { getCreatorProfile, getCreatorVideos, getPublicVideoUrl } from "@/lib/user-content";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const session = await getRequestSession();
  if (!session) notFound();

  const profile = await getCreatorProfile(id, session.session.access_token);
  if (!profile) notFound();
  const videos = await getCreatorVideos(id, session.session.access_token);
  const isOwner = id === session.user.id;

  return (
    <main className="mx-auto min-h-full max-w-6xl p-4 pb-10 text-zinc-100 sm:p-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#25262a] pb-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff3d00]/15 text-[#ff765c]">
            <UserRound size={28} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Creator</p>
            <h1 className="mt-1 text-2xl font-bold text-white">{profile.display_name}</h1>
          </div>
        </div>
        {isOwner ? (
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f04427] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ff6040]"
          >
            <Upload size={16} />
            Upload video
          </Link>
        ) : null}
      </header>

      <section aria-labelledby="creator-videos-title">
        <h2 id="creator-videos-title" className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Clapperboard size={19} className="text-[#ff765c]" />
          Videos
        </h2>
        {videos.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-xl border border-[#28292d] bg-[#111214]">
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                  src={getPublicVideoUrl(video.object_path)}
                >
                  Your browser does not support embedded video.
                </video>
                <div className="p-4">
                  <h3 className="font-semibold text-white">{video.title}</h3>
                  {video.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{video.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-500">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(video.created_at))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#34363a] p-8 text-center">
            <p className="text-sm text-zinc-400">No videos published yet.</p>
            {isOwner ? (
              <Link href="/upload" className="mt-4 inline-flex text-sm font-semibold text-[#ff765c] hover:text-white">
                Upload your first video
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
