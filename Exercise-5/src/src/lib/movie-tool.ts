import { prisma } from './prisma';

export interface MovieDetails {
  title: string;
  year: string;
  genre: string;
  director: string;
  actors: string;
  plot: string;
  poster: string;
  ratings: Array<{ Source: string; Value: string }>;
  runtime: string;
  imdbRating?: string;
  imdbID?: string;
  source: 'cache' | 'api' | 'fallback';
  recommendations?: Array<{ title: string; year: number; rating: number; genre: string }>;
}

export interface MovieSearchResult {
  success: boolean;
  movie?: MovieDetails;
  error?: string;
  cached?: boolean;
}

const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

// Rich fallback database for when external API is pending activation or offline
const POPULAR_MOVIES_FALLBACK: Record<string, Partial<MovieDetails>> = {
  inception: {
    title: 'Inception',
    year: '2010',
    genre: 'Action, Adventure, Sci-Fi',
    director: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
    plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
    ratings: [
      { Source: 'Internet Movie Database', Value: '8.8/10' },
      { Source: 'Rotten Tomatoes', Value: '87%' },
      { Source: 'Metacritic', Value: '74/100' },
    ],
    runtime: '148 min',
    imdbRating: '8.8',
  },
  interstellar: {
    title: 'Interstellar',
    year: '2014',
    genre: 'Adventure, Drama, Sci-Fi',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine',
    plot: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    poster: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg',
    ratings: [
      { Source: 'Internet Movie Database', Value: '8.7/10' },
      { Source: 'Rotten Tomatoes', Value: '73%' },
      { Source: 'Metacritic', Value: '74/100' },
    ],
    runtime: '169 min',
    imdbRating: '8.7',
  },
  matrix: {
    title: 'The Matrix',
    year: '1999',
    genre: 'Action, Sci-Fi',
    director: 'Lana Wachowski, Lilly Wachowski',
    actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, Hugo Weaving',
    plot: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth: the life he knows is an elaborate deception of an evil cyber-intelligence.',
    poster: 'https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg',
    ratings: [
      { Source: 'Internet Movie Database', Value: '8.7/10' },
      { Source: 'Rotten Tomatoes', Value: '83%' },
    ],
    runtime: '136 min',
    imdbRating: '8.7',
  },
  darkknight: {
    title: 'The Dark Knight',
    year: '2008',
    genre: 'Action, Crime, Drama',
    director: 'Christopher Nolan',
    actors: 'Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine',
    plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
    ratings: [
      { Source: 'Internet Movie Database', Value: '9.0/10' },
      { Source: 'Rotten Tomatoes', Value: '94%' },
    ],
    runtime: '152 min',
    imdbRating: '9.0',
  },
};

export async function searchMovieTool(params: {
  title: string;
  year?: string | number;
}): Promise<MovieSearchResult> {
  const startTime = Date.now();
  const cleanTitle = params.title.trim();
  const yearParam = params.year ? String(params.year).trim() : undefined;

  if (!cleanTitle) {
    return { success: false, error: 'Movie title is required.' };
  }

  // 1. Check local cache first (Part 2 Caching requirement & Part 7 Performance)
  try {
    const cached = await prisma.cachedMovie.findFirst({
      where: {
        title: {
          contains: cleanTitle,
          mode: 'insensitive',
        },
      },
    });

    if (cached) {
      const recommendations = await getRecommendations(cached.genre || 'Sci-Fi', cached.title);
      return {
        success: true,
        cached: true,
        movie: {
          title: cached.title,
          year: cached.year,
          genre: cached.genre || 'N/A',
          director: cached.director || 'N/A',
          actors: cached.actors || 'N/A',
          plot: cached.plot || 'No plot available.',
          poster: cached.poster || '',
          ratings: (cached.ratings as any) || [],
          runtime: cached.runtime || 'N/A',
          imdbID: cached.imdbID || undefined,
          source: 'cache',
          recommendations,
        },
      };
    }
  } catch (err) {
    console.warn('Cache lookup warning:', err);
  }

  // 2. Query OMDb API with retry mechanism
  let lastError: string | null = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let url = `http://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&apikey=${OMDB_API_KEY}`;
      if (yearParam) {
        url += `&y=${encodeURIComponent(yearParam)}`;
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        throw new Error(`OMDb HTTP error: ${res.status}`);
      }

      const data = await res.json();

      if (data.Response === 'True') {
        const movieDetails: MovieDetails = {
          title: data.Title,
          year: data.Year,
          genre: data.Genre,
          director: data.Director,
          actors: data.Actors,
          plot: data.Plot,
          poster: data.Poster !== 'N/A' ? data.Poster : '',
          ratings: data.Ratings || [],
          runtime: data.Runtime,
          imdbRating: data.imdbRating,
          imdbID: data.imdbID,
          source: 'api',
        };

        // Cache results in database
        try {
          await prisma.cachedMovie.upsert({
            where: { imdbID: data.imdbID || `custom-${Date.now()}` },
            update: {
              title: data.Title,
              year: data.Year,
              genre: data.Genre,
              director: data.Director,
              actors: data.Actors,
              plot: data.Plot,
              poster: data.Poster !== 'N/A' ? data.Poster : '',
              ratings: data.Ratings || [],
              runtime: data.Runtime,
            },
            create: {
              imdbID: data.imdbID,
              title: data.Title,
              year: data.Year,
              genre: data.Genre,
              director: data.Director,
              actors: data.Actors,
              plot: data.Plot,
              poster: data.Poster !== 'N/A' ? data.Poster : '',
              ratings: data.Ratings || [],
              runtime: data.Runtime,
            },
          });
        } catch (cacheErr) {}

        movieDetails.recommendations = await getRecommendations(data.Genre, data.Title);

        try {
          await prisma.toolUsage.create({
            data: {
              toolName: 'MovieDatabaseTool',
              inputQuery: `${cleanTitle} (${yearParam || 'any'})`,
              success: true,
              executionTimeMs: Date.now() - startTime,
            },
          });
        } catch (e) {}

        return {
          success: true,
          cached: false,
          movie: movieDetails,
        };
      } else {
        lastError = data.Error || 'Movie not found on OMDb.';
      }
    } catch (err: any) {
      lastError = err.message || 'API request failed';
    }
  }

  // 3. Fallback: Check local preset dictionary or local DB (Part 2 Fallback requirement)
  const norm = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, fallbackItem] of Object.entries(POPULAR_MOVIES_FALLBACK)) {
    if (norm.includes(key) || key.includes(norm)) {
      const recommendations = await getRecommendations(fallbackItem.genre || 'Sci-Fi', fallbackItem.title || cleanTitle);
      return {
        success: true,
        movie: {
          title: fallbackItem.title!,
          year: fallbackItem.year || '2010',
          genre: fallbackItem.genre || 'Sci-Fi',
          director: fallbackItem.director || 'N/A',
          actors: fallbackItem.actors || 'N/A',
          plot: fallbackItem.plot || 'A cinematic masterpiece.',
          poster: fallbackItem.poster || '',
          ratings: fallbackItem.ratings || [{ Source: 'IMDb', Value: '8.8/10' }],
          runtime: fallbackItem.runtime || '120 min',
          imdbRating: fallbackItem.imdbRating || '8.8',
          source: 'fallback',
          recommendations,
        },
      };
    }
  }

  // Fallback from Neon Postgres Movie table
  try {
    const fallbackMovie = await prisma.movie.findFirst({
      where: {
        title: {
          contains: cleanTitle,
          mode: 'insensitive',
        },
      },
    });

    if (fallbackMovie) {
      const recommendations = await getRecommendations(fallbackMovie.genre, fallbackMovie.title);
      return {
        success: true,
        movie: {
          title: fallbackMovie.title,
          year: String(fallbackMovie.year),
          genre: fallbackMovie.genre,
          director: fallbackMovie.director,
          actors: 'From Local Neon Database',
          plot: fallbackMovie.description,
          poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80',
          ratings: [{ Source: 'Neon DB', Value: `${fallbackMovie.rating}/10` }],
          runtime: '120 min',
          source: 'fallback',
          recommendations,
        },
      };
    }
  } catch (fallbackErr) {}

  return {
    success: false,
    error: lastError || `Movie "${cleanTitle}" not found.`,
  };
}

async function getRecommendations(genreString: string, currentTitle: string) {
  try {
    const firstGenre = genreString.split(',')[0].trim();
    const recommended = await prisma.movie.findMany({
      where: {
        genre: { contains: firstGenre, mode: 'insensitive' },
        title: { not: currentTitle },
      },
      take: 3,
      orderBy: { rating: 'desc' },
      select: {
        title: true,
        year: true,
        rating: true,
        genre: true,
      },
    });
    return recommended;
  } catch {
    return [];
  }
}
