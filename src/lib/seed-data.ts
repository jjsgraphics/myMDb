/**
 * Starter content: the categories the site launches with and the pool of
 * titles used to fake a populated leaderboard in demo mode.
 *
 * `npm run enrich` replaces the null tmdbId/posterPath fields with real TMDB
 * data once a key is configured. Until then the UI draws its own poster tiles,
 * so nothing renders broken.
 */

export type SeedCategory = {
  slug: string;
  name: string;
  blurb: string;
  kind: "movie" | "tv" | "any";
  maxPicks: number;
  minBallots: number;
};

export type SeedTitle = {
  key: string;
  mediaType: "movie" | "tv";
  name: string;
  year: number;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    slug: "best-films",
    name: "Best Films",
    blurb: "No qualifiers, no genre, no era. The ten you would defend anywhere.",
    kind: "movie",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "best-series",
    name: "Best Series",
    blurb: "Judged whole. A great first season does not carry a bad last one.",
    kind: "tv",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "funniest",
    name: "Funniest",
    blurb: "The ones that still land on a rewatch, when you know the joke.",
    kind: "any",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "most-heartwarming",
    name: "Most Heartwarming",
    blurb: "Leaves you better than it found you. Sentiment counts, cheap sentiment does not.",
    kind: "any",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "best-editing",
    name: "Best Editing",
    blurb: "Where the cutting is the storytelling — rhythm, elision, the shot held one beat too long.",
    kind: "any",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "scariest",
    name: "Scariest",
    blurb: "Dread that outlasts the runtime, not the loudest jump scare.",
    kind: "any",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "best-finale",
    name: "Best Finale",
    blurb: "Stuck the landing. The ending that earned everything before it.",
    kind: "tv",
    maxPicks: 10,
    minBallots: 3,
  },
  {
    slug: "best-score",
    name: "Best Score",
    blurb: "Music you can hear in your head right now, without the picture.",
    kind: "any",
    maxPicks: 10,
    minBallots: 3,
  },
];

const M = (name: string, year: number): SeedTitle => ({
  key: `m:${name}:${year}`,
  mediaType: "movie",
  name,
  year,
});
const T = (name: string, year: number): SeedTitle => ({
  key: `t:${name}:${year}`,
  mediaType: "tv",
  name,
  year,
});

export const SEED_TITLES: SeedTitle[] = [
  M("The Godfather", 1972),
  M("Goodfellas", 1990),
  M("Parasite", 2019),
  M("Pulp Fiction", 1994),
  M("There Will Be Blood", 2007),
  M("Mad Max: Fury Road", 2015),
  M("No Country for Old Men", 2007),
  M("Spirited Away", 2001),
  M("In the Mood for Love", 2000),
  M("Whiplash", 2014),
  M("The Social Network", 2010),
  M("Everything Everywhere All at Once", 2022),
  M("Blade Runner 2049", 2017),
  M("Heat", 1995),
  M("Arrival", 2016),
  M("Children of Men", 2006),
  M("The Thing", 1982),
  M("Hereditary", 2018),
  M("The Shining", 1980),
  M("Alien", 1979),
  M("Get Out", 2017),
  M("The Grand Budapest Hotel", 2014),
  M("Airplane!", 1980),
  M("Groundhog Day", 1993),
  M("Hot Fuzz", 2007),
  M("Superbad", 2007),
  M("Paddington 2", 2017),
  M("Spider-Man: Into the Spider-Verse", 2018),
  M("Ratatouille", 2007),
  M("Up", 2009),
  M("My Neighbor Totoro", 1988),
  M("It's a Wonderful Life", 1946),
  M("Dune: Part Two", 2024),
  M("Oppenheimer", 2023),
  M("Interstellar", 2014),
  M("The Dark Knight", 2008),
  M("Baby Driver", 2017),
  M("Sicario", 2015),
  M("Jaws", 1975),
  M("Before Sunrise", 1995),

  T("Breaking Bad", 2008),
  T("The Wire", 2002),
  T("The Sopranos", 1999),
  T("Succession", 2018),
  T("Better Call Saul", 2015),
  T("Chernobyl", 2019),
  T("Fleabag", 2016),
  T("The Bear", 2022),
  T("Arrested Development", 2003),
  T("The Office", 2005),
  T("Parks and Recreation", 2009),
  T("Community", 2009),
  T("Ted Lasso", 2020),
  T("Bluey", 2018),
  T("Avatar: The Last Airbender", 2005),
  T("BoJack Horseman", 2014),
  T("Six Feet Under", 2001),
  T("The Leftovers", 2014),
  T("Twin Peaks", 1990),
  T("Hannibal", 2013),
  T("Severance", 2022),
  T("Mr. Robot", 2015),
  T("Dark", 2017),
  T("Band of Brothers", 2001),
  T("Firefly", 2002),
  T("Andor", 2022),
  T("Atlanta", 2016),
  T("Barry", 2018),
  T("Halt and Catch Fire", 2014),
  T("Rectify", 2013),
];

/** Which titles are plausible picks for each category, so the demo board reads
 *  like real opinion rather than noise. Keys index into SEED_TITLES by name. */
export const DEMO_AFFINITY: Record<string, string[]> = {
  "best-films": [
    "The Godfather", "Goodfellas", "Parasite", "Pulp Fiction", "There Will Be Blood",
    "Mad Max: Fury Road", "No Country for Old Men", "Spirited Away", "In the Mood for Love",
    "The Social Network", "Everything Everywhere All at Once", "Blade Runner 2049",
    "Heat", "Children of Men", "The Dark Knight", "Interstellar", "Oppenheimer", "Jaws",
  ],
  "best-series": [
    "Breaking Bad", "The Wire", "The Sopranos", "Succession", "Better Call Saul",
    "Chernobyl", "Fleabag", "The Bear", "Six Feet Under", "The Leftovers", "Twin Peaks",
    "Severance", "Mr. Robot", "Band of Brothers", "Andor", "Atlanta", "BoJack Horseman",
  ],
  funniest: [
    "Airplane!", "Groundhog Day", "Hot Fuzz", "Superbad", "The Grand Budapest Hotel",
    "Arrested Development", "The Office", "Parks and Recreation", "Community", "Fleabag",
    "Barry", "BoJack Horseman", "Paddington 2",
  ],
  "most-heartwarming": [
    "Paddington 2", "Up", "Ratatouille", "My Neighbor Totoro", "It's a Wonderful Life",
    "Ted Lasso", "Bluey", "Spider-Man: Into the Spider-Verse", "Before Sunrise",
    "Parks and Recreation", "Avatar: The Last Airbender",
  ],
  "best-editing": [
    "Mad Max: Fury Road", "Whiplash", "Baby Driver", "The Social Network", "Goodfellas",
    "Everything Everywhere All at Once", "Parasite", "Pulp Fiction", "Sicario", "Mr. Robot",
    "Breaking Bad", "Oppenheimer",
  ],
  scariest: [
    "The Thing", "Hereditary", "The Shining", "Alien", "Get Out", "Jaws", "Hannibal",
    "Twin Peaks", "Dark", "Chernobyl",
  ],
  "best-finale": [
    "Six Feet Under", "Breaking Bad", "The Leftovers", "Better Call Saul", "Fleabag",
    "The Sopranos", "Band of Brothers", "BoJack Horseman", "Rectify", "Halt and Catch Fire",
    "Succession",
  ],
  "best-score": [
    "Interstellar", "Blade Runner 2049", "Dune: Part Two", "There Will Be Blood",
    "Arrival", "Oppenheimer", "Severance", "Chernobyl", "Succession", "The Social Network",
    "Sicario", "Spirited Away",
  ],
};
