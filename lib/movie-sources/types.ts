export type MovieIdentity = {
  id: number;
  title: string;
  year: string;
  alternativeTitles: string[];
};

export type MovieLicense = {
  name: string;
  url: string;
  attributionRequired: boolean;
};

export type MovieSource = {
  id: string;
  provider: string;
  providerId: string;
  title: string;
  fileName: string;
  videoUrl: string;
  downloadUrl?: string;
  format: string;
  mimeType?: string;
  sizeBytes?: number;
  videoQuality?: string;
  durationSeconds?: number;
  attribution?: string;
  canStream: boolean;
  canDownload: boolean;
  license: MovieLicense;
  sourcePageUrl: string;
};

export type MovieSourceSearchResult = {
  sources: MovieSource[];
  page: number;
  totalPages: number;
  errors: string[];
};

export interface MovieSourceProvider {
  readonly name: string;
  search(movie: MovieIdentity, page: number): Promise<MovieSourceSearchResult>;
}
