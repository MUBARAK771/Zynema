import type {
  MovieIdentity,
  MovieLicense,
  MovieSource,
  MovieSourceProvider,
  MovieSourceSearchResult,
} from "./types";
import { matchesMovie } from "./source-matcher";

const archiveSearchUrl = "https://archive.org/advancedsearch.php";
const archiveMetadataUrl = "https://archive.org/metadata/";
const archiveDownloadUrl = "https://archive.org/download/";
const rowsPerPage = 20;
const requestTimeoutMs = 10_000;

type ArchiveDocument = {
  identifier?: string;
  title?: string;
  year?: string | number;
  licenseurl?: string;
};

type ArchiveFile = {
  name?: string;
  format?: string;
  size?: string | number;
  length?: string | number;
  width?: string | number;
  height?: string | number;
  private?: string | boolean | number;
};

type ArchiveMetadata = {
  identifier?: string;
  mediatype?: string;
  title?: string;
  year?: string | number;
  licenseurl?: string;
  creator?: string | string[];
  files?: ArchiveFile[];
  metadata?: {
    identifier?: string;
    mediatype?: string;
    title?: string;
    year?: string | number;
    licenseurl?: string;
    creator?: string | string[];
    files?: ArchiveFile[];
  };
};

type ArchiveSearchResponse = {
  response?: {
    numFound?: number;
    docs?: ArchiveDocument[];
  };
};

const approvedLicenses = [
  {
    pattern: /^\/publicdomain\/mark\/1\.0\/?$/i,
    name: "Public Domain Mark 1.0",
    attributionRequired: false,
  },
  {
    pattern: /^\/publicdomain\/zero\/1\.0\/?$/i,
    name: "CC0 1.0 Universal",
    attributionRequired: false,
  },
  {
    pattern: /^\/licenses\/by\/(?:2\.0|2\.5|3\.0|4\.0)\/?$/i,
    name: "Creative Commons Attribution",
    attributionRequired: true,
  },
  {
    pattern: /^\/licenses\/by-sa\/(?:2\.0|2\.5|3\.0|4\.0)\/?$/i,
    name: "Creative Commons Attribution-ShareAlike",
    attributionRequired: true,
  },
];

function getAllowedLicense(value: unknown): MovieLicense | undefined {
  if (typeof value !== "string") return undefined;

  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.hostname.toLowerCase() !== "creativecommons.org" ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash
    ) {
      return undefined;
    }

    const license = approvedLicenses.find(({ pattern }) => pattern.test(url.pathname));
    if (!license) return undefined;

    return {
      name: license.name,
      url: `https://creativecommons.org${url.pathname}`,
      attributionRequired: license.attributionRequired,
    };
  } catch {
    return undefined;
  }
}

function getArchiveDownloadUrl(identifier: string, fileName: string) {
  const encodedName = fileName.split("/").map(encodeURIComponent).join("/");
  return new URL(`${encodeURIComponent(identifier)}/${encodedName}`, archiveDownloadUrl).toString();
}

function isSafeIdentifier(identifier: string) {
  return (
    /^[A-Za-z0-9._-]{1,120}$/.test(identifier) &&
    identifier !== "." &&
    identifier !== ".."
  );
}

function isSafeFileName(fileName: string) {
  return (
    fileName.length > 0 &&
    fileName.length <= 1024 &&
    !fileName.startsWith("/") &&
    !fileName.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(fileName) &&
    !fileName.split("/").some((part) => part === "." || part === "..")
  );
}

function getVideoFileInfo(file: ArchiveFile) {
  if (!file.name || !isSafeFileName(file.name)) return undefined;

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const format = file.format?.trim() || extension.toUpperCase();
  const mimeType =
    extension === "mp4" || extension === "m4v"
      ? "video/mp4"
      : extension === "webm"
        ? "video/webm"
        : extension === "ogv" || extension === "ogg"
          ? "video/ogg"
          : extension === "m3u8"
            ? "application/vnd.apple.mpegurl"
            : undefined;
  const knownVideoExtension = [
    "mp4",
    "m4v",
    "webm",
    "ogv",
    "ogg",
    "mkv",
    "mov",
    "avi",
    "mpg",
    "mpeg",
    "m3u8",
  ].includes(extension);
  const videoFormat = /video|mpeg|matroska|quicktime|webm|h\.?264/i.test(format);

  if (!knownVideoExtension && !videoFormat) return undefined;
  return { format, mimeType };
}

function parsePositiveNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getQuality(file: ArchiveFile) {
  const fromName = file.name?.match(/\b(4320|2160|1440|1080|720|576|480|360|240)[pi]\b/i);
  if (fromName) return `${fromName[1]}p`;

  const width = parsePositiveNumber(file.width);
  const height = parsePositiveNumber(file.height);
  const pixels = Math.max(width ?? 0, height ?? 0);
  if (pixels >= 2160) return "2160p";
  if (pixels >= 1440) return "1440p";
  if (pixels >= 1080) return "1080p";
  if (pixels >= 720) return "720p";
  if (pixels >= 480) return "480p";
  return undefined;
}

function getArchiveRecord(data: ArchiveMetadata) {
  return data.metadata ?? data;
}

async function fetchArchiveJson<T>(url: URL, revalidate: number | 0): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      ...(revalidate === 0
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    });

    if (!response.ok) {
      throw new Error(`Internet Archive returned ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function quoteSearchTerm(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildSearchUrl(movie: MovieIdentity, page: number) {
  const titles = [...new Set([movie.title, ...movie.alternativeTitles])]
    .map((title) => title.trim())
    .filter(Boolean)
    .slice(0, 5);
  const titleTerms = titles.map((title) => `title:${quoteSearchTerm(title)}`);
  const query = `mediatype:movies AND (${titleTerms.join(" OR ")})`;

  const url = new URL(archiveSearchUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("rows", String(rowsPerPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("output", "json");
  for (const field of ["identifier", "title", "year", "licenseurl"]) {
    url.searchParams.append("fl[]", field);
  }

  return url;
}

async function fetchArchiveMetadata(identifier: string, revalidate: number | 0) {
  if (!isSafeIdentifier(identifier)) {
    throw new Error("Internet Archive returned an invalid identifier.");
  }
  const url = new URL(encodeURIComponent(identifier), archiveMetadataUrl);
  return fetchArchiveJson<ArchiveMetadata>(url, revalidate);
}

function mapArchiveFiles(
  movie: MovieIdentity,
  identifier: string,
  record: ArchiveMetadata,
): MovieSource[] {
  const metadata = getArchiveRecord(record);
  const mediatype = metadata.mediatype ?? record.mediatype;
  const title = metadata.title ?? record.title;
  const year = metadata.year ?? record.year;
  const license = getAllowedLicense(metadata.licenseurl ?? record.licenseurl);
  const creatorValue = metadata.creator ?? record.creator;
  const attribution = Array.isArray(creatorValue)
    ? creatorValue.filter((creator) => typeof creator === "string" && creator.trim()).join(", ")
    : typeof creatorValue === "string"
      ? creatorValue.trim()
      : undefined;

  if (
    !isSafeIdentifier(identifier) ||
    mediatype !== "movies" ||
    !title ||
    !license ||
    (license.attributionRequired && !attribution) ||
    !matchesMovie(movie, { title, year }) ||
    (metadata.identifier && metadata.identifier !== identifier) ||
    (record.identifier && record.identifier !== identifier)
  ) {
    return [];
  }

  return (metadata.files ?? record.files ?? []).flatMap((file) => {
    if (
      file.private === true ||
      file.private === "true" ||
      file.private === 1 ||
      file.private === "1" ||
      !file.name
    ) return [];
    const fileInfo = getVideoFileInfo(file);
    if (!fileInfo) return [];

    const videoUrl = getArchiveDownloadUrl(identifier, file.name);
    return [{
      id: `${identifier}:${file.name}`,
      provider: "Internet Archive",
      providerId: identifier,
      title,
      fileName: file.name,
      videoUrl,
      downloadUrl: videoUrl,
      format: fileInfo.format,
      mimeType: fileInfo.mimeType,
      sizeBytes: parsePositiveNumber(file.size),
      videoQuality: getQuality(file),
      durationSeconds: parsePositiveNumber(file.length),
      attribution,
      canStream: Boolean(fileInfo.mimeType),
      canDownload: true,
      license,
      sourcePageUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
    }];
  });
}

export async function getAuthorizedArchiveDownload(
  movie: MovieIdentity,
  identifier: string,
  fileName: string,
) {
  if (!isSafeIdentifier(identifier) || !isSafeFileName(fileName)) {
    return undefined;
  }

  const record = await fetchArchiveMetadata(identifier, 0);
  return mapArchiveFiles(movie, identifier, record).find(
    (source) => source.fileName === fileName && source.canDownload,
  );
}

export const internetArchiveProvider: MovieSourceProvider = {
  name: "Internet Archive",
  async search(movie, page): Promise<MovieSourceSearchResult> {
    const searchData = await fetchArchiveJson<ArchiveSearchResponse>(
      buildSearchUrl(movie, page),
      1800,
    );
    const response = searchData.response;
    const documents = response?.docs ?? [];
    const totalPages = Math.ceil((response?.numFound ?? 0) / rowsPerPage);
    const candidateDocuments = documents.filter(
      (document): document is ArchiveDocument & { identifier: string; title: string } =>
        Boolean(
          document.identifier &&
            document.title &&
            matchesMovie(movie, { title: document.title, year: document.year }),
        ),
    );

    const metadataResults: PromiseSettledResult<MovieSource[]>[] = [];
    for (let index = 0; index < candidateDocuments.length; index += 5) {
      const batch = candidateDocuments.slice(index, index + 5);
      metadataResults.push(
        ...(await Promise.allSettled(
          batch.map(async (document) => {
            const metadata = await fetchArchiveMetadata(document.identifier, 1800);
            return mapArchiveFiles(movie, document.identifier, metadata);
          }),
        )),
      );
    }
    const sources = metadataResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    const failedMetadataCount = metadataResults.filter(
      (result) => result.status === "rejected",
    ).length;

    return {
      sources,
      page,
      totalPages,
      errors:
        failedMetadataCount > 0
          ? ["Some Internet Archive records could not be checked."]
          : [],
    };
  },
};
