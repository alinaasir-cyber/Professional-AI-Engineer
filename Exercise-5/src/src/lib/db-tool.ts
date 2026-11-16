import { prisma } from './prisma';

export interface DbQueryResult {
  success: boolean;
  query: string;
  data?: any[];
  rowCount?: number;
  columns?: string[];
  metadata?: {
    executionTimeMs: number;
    table?: string;
  };
  error?: string;
}

// Security: strictly validate that only read-only SELECT queries can be executed
export function validateSqlQuery(sql: string): { isValid: boolean; error?: string } {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // Must begin with SELECT or WITH (for CTEs)
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return {
      isValid: false,
      error: 'Security Violation: Only SELECT / read-only queries are permitted.',
    };
  }

  // Dangerous keywords that should NEVER appear in read queries
  const forbiddenPatterns = [
    /\bDROP\b/i,
    /\bDELETE\b/i,
    /\bUPDATE\b/i,
    /\bINSERT\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
    /\bCREATE\b/i,
    /--/,       // SQL comment
    /\/\*/,     // Multi-line comment
    /;\s*\S+/,  // Multiple statements (stacked queries)
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: `Security Violation: Forbidden keyword or operator detected (${pattern}).`,
      };
    }
  }

  return { isValid: true };
}

// Convert natural language to SQL based on schema
export function naturalLanguageToSql(prompt: string): string {
  const p = prompt.toLowerCase().trim();

  // "Show me all sci-fi movies"
  if ((p.includes('sci-fi') || p.includes('scifi')) && p.includes('movie')) {
    return `SELECT id, title, year, genre, rating, director, description FROM "Movie" WHERE LOWER(genre) LIKE '%sci-fi%' ORDER BY rating DESC;`;
  }

  // "Find users over 25"
  if ((p.includes('user') || p.includes('people')) && (p.includes('25') || p.includes('over') || p.includes('older'))) {
    return `SELECT id, name, email, age, favorite_genre FROM "User" WHERE age > 25 ORDER BY age ASC;`;
  }

  // "Get movies with rating above 8.5"
  if (p.includes('rating') && (p.includes('8.5') || p.includes('above') || p.includes('higher'))) {
    return `SELECT id, title, year, genre, rating, director FROM "Movie" WHERE rating >= 8.5 ORDER BY rating DESC;`;
  }

  // "Count total movies by genre"
  if (p.includes('count') && p.includes('genre')) {
    return `SELECT genre, COUNT(*)::int as total_movies, ROUND(AVG(rating)::numeric, 2) as avg_rating FROM "Movie" GROUP BY genre ORDER BY total_movies DESC;`;
  }

  // "Show all movies" or generic movie queries
  if (p.includes('movie') || p.includes('film')) {
    return `SELECT id, title, year, genre, rating, director FROM "Movie" ORDER BY rating DESC LIMIT 20;`;
  }

  // "Show all users"
  if (p.includes('user')) {
    return `SELECT id, name, email, age, favorite_genre FROM "User" ORDER BY name ASC LIMIT 20;`;
  }

  // "Show reviews"
  if (p.includes('review')) {
    return `SELECT r.id, m.title as movie_title, u.name as user_name, r.rating, r.comment, r.date 
            FROM "Review" r 
            JOIN "Movie" m ON r.movie_id = m.id 
            JOIN "User" u ON r.user_id = u.id 
            ORDER BY r.date DESC LIMIT 20;`;
  }

  // Default fallback
  return `SELECT id, title, year, genre, rating, director FROM "Movie" ORDER BY rating DESC LIMIT 10;`;
}

// Execute query safely and return structured results with metadata
export async function executeDatabaseQuery(sqlOrPrompt: string): Promise<DbQueryResult> {
  const startTime = Date.now();
  let sql = sqlOrPrompt.trim();

  // If input is natural language rather than raw SQL, convert it
  if (!sql.toUpperCase().startsWith('SELECT') && !sql.toUpperCase().startsWith('WITH')) {
    sql = naturalLanguageToSql(sqlOrPrompt);
  }

  // Validate query
  const validation = validateSqlQuery(sql);
  if (!validation.isValid) {
    return {
      success: false,
      query: sql,
      error: validation.error,
      metadata: {
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  try {
    const rawResult: any = await prisma.$queryRawUnsafe(sql);
    const data = Array.isArray(rawResult) ? rawResult : [rawResult];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // Log tool usage in background
    try {
      await prisma.toolUsage.create({
        data: {
          toolName: 'DatabaseChatTool',
          inputQuery: sqlOrPrompt,
          success: true,
          executionTimeMs: Date.now() - startTime,
        },
      });
    } catch (e) {
      // Non-critical logging error
    }

    return {
      success: true,
      query: sql,
      data,
      rowCount: data.length,
      columns,
      metadata: {
        executionTimeMs: Date.now() - startTime,
      },
    };
  } catch (error: any) {
    // Log failure
    try {
      await prisma.toolUsage.create({
        data: {
          toolName: 'DatabaseChatTool',
          inputQuery: sqlOrPrompt,
          success: false,
          executionTimeMs: Date.now() - startTime,
        },
      });
    } catch (e) {}

    return {
      success: false,
      query: sql,
      error: error.message || 'Database execution failed.',
      metadata: {
        executionTimeMs: Date.now() - startTime,
      },
    };
  }
}
