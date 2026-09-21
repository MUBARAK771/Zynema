export type Show = {
  id: string;
  title: string;
  genre: string;
  year: number;
  runtime: string;
  rating: number;
  poster: string; // gradient class stand-in for artwork
  posterImage?: string;
};

export const shows: Show[] = [
  {
    id: "starship-frontier",
    title: "Starship Frontier",
    genre: "Sci-Fi",
    year: 2024,
    runtime: "48m",
    rating: 8.9,
    poster: "from-fuchsia-700 via-indigo-800 to-slate-900",
    posterImage: "/posters/starship-frontier.svg",
  },
  {
    id: "shadows-of-empire",
    title: "Shadows of Empire",
    genre: "Historical Drama",
    year: 2023,
    runtime: "55m",
    rating: 8.4,
    poster: "from-stone-800 via-amber-950 to-stone-900",
    posterImage: "/posters/shadows-of-empire.svg",
  },
  {
    id: "the-great-beyond",
    title: "The Great Beyond",
    genre: "Documentary",
    year: 2024,
    runtime: "60m",
    rating: 9.2,
    poster: "from-amber-200 via-orange-300 to-amber-400",
    posterImage: "/posters/the-great-beyond.svg",
  },
  {
    id: "final-pursuit",
    title: "Final Pursuit",
    genre: "Action Thriller",
    year: 2024,
    runtime: "42m",
    rating: 7.8,
    poster: "from-zinc-700 via-zinc-800 to-black",
    posterImage: "/posters/final-pursuit.svg",
  },
  {
    id: "neon-chronicles",
    title: "Neon Chronicles",
    genre: "Sci-Fi Drama",
    year: 2024,
    runtime: "52m",
    rating: 8.7,
    poster: "from-cyan-900 via-slate-900 to-indigo-950",
    posterImage: "/posters/neon-chronicles.svg",
  },
  {
    id: "silent-witness",
    title: "Silent Witness",
    genre: "Mystery",
    year: 2023,
    runtime: "50m",
    rating: 8.1,
    poster: "from-slate-800 via-slate-900 to-black",
    posterImage: "/posters/silent-witness.svg",
  },
  {
    id: "fabled-lands",
    title: "Fabled Lands",
    genre: "Fantasy",
    year: 2024,
    runtime: "58m",
    rating: 8.5,
    poster: "from-emerald-800 via-teal-900 to-indigo-950",
    posterImage: "/posters/fabled-lands.svg",
  },
  {
    id: "laughter-lounge",
    title: "Laughter Lounge",
    genre: "Comedy",
    year: 2024,
    runtime: "30m",
    rating: 7.4,
    poster: "from-sky-400 via-cyan-300 to-yellow-200",
    posterImage: "/posters/laughter-lounge.svg",
  },
];

export const activeFilters = [
  { label: "Genre: Sci-Fi" },
  { label: "Rating: 7.0+" },
  { label: "Year: 2023-2024" },
];