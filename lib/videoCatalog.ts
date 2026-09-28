export type VideoAsset = {
  tmdbMovieId: number;
  provider: "mux" | "cloudflare" | "s3" | "custom";
  playbackId: string;
  playbackUrl: string;
  title?: string;
};

type MuxAsset = {
  id: string;
  passthrough?: string;
  playback_ids?: { id: string; policy: "public" | "signed" }[];
};

type MuxAssetsResponse = {
  data?: MuxAsset[];
  pagination?: {
    total_pages?: number;
    total_row_count?: number;
    per_page?: number;
  };
};

async function listMuxAssets(page: number): Promise<MuxAssetsResponse | undefined> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) return undefined;

  const url = new URL("https://api.mux.com/video/v1/assets");
  url.searchParams.set("limit", "100");
  url.searchParams.set("page", String(page));

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return undefined;
    return (await response.json()) as MuxAssetsResponse;
  } catch {
    return undefined;
  }
}

function mapMuxAsset(asset: MuxAsset): VideoAsset | undefined {
  const tmdbId = Number(asset.passthrough?.match(/^tmdb:(\d+)$/)?.[1]);
  const playbackId = asset.playback_ids?.find(({ policy }) => policy === "public")?.id;

  if (!Number.isInteger(tmdbId) || !playbackId) return undefined;

  return {
    tmdbMovieId: tmdbId,
    provider: "mux",
    playbackId,
    playbackUrl: `https://stream.mux.com/${playbackId}/high.mp4`,
    title: asset.passthrough,
  };
}

export async function getVideoAssets(tmdbMovieIds: number[]): Promise<Map<number, VideoAsset>> {
  const wantedIds = new Set(tmdbMovieIds);
  const found = new Map<number, VideoAsset>();
  const maxPages = 20;

  for (let page = 1; page <= maxPages && found.size < wantedIds.size; page += 1) {
    const result = await listMuxAssets(page);
    if (!result) break;

    for (const asset of result.data ?? []) {
      const videoAsset = mapMuxAsset(asset);
      if (videoAsset && wantedIds.has(videoAsset.tmdbMovieId)) {
        found.set(videoAsset.tmdbMovieId, videoAsset);
      }
    }

    const totalPages = result.pagination?.total_pages;
    const rowCount = result.pagination?.total_row_count;
    const perPage = result.pagination?.per_page ?? 100;
    if (totalPages && page >= totalPages) break;
    if (!totalPages && rowCount && page * perPage >= rowCount) break;
    if (!result.data?.length || result.data.length < 100) break;
  }

  return found;
}

export async function getVideoAsset(tmdbMovieId: number): Promise<VideoAsset | undefined> {
  return (await getVideoAssets([tmdbMovieId])).get(tmdbMovieId);
}
