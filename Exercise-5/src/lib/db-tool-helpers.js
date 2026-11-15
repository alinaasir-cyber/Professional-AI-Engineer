function validateSqlQuery(sql) {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return {
      isValid: false,
      error: 'Security Violation: Only SELECT / read-only queries are permitted.',
    };
  }

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
    /--/,
    /\/\*/,
    /;\s*\S+/,
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

function naturalLanguageToSql(prompt) {
  const p = prompt.toLowerCase().trim();

  if ((p.includes('sci-fi') || p.includes('scifi')) && p.includes('movie')) {
    return `SELECT id, title, year, genre, rating, director, description FROM "Movie" WHERE LOWER(genre) LIKE '%sci-fi%' ORDER BY rating DESC;`;
  }

  if ((p.includes('user') || p.includes('people')) && (p.includes('25') || p.includes('over') || p.includes('older'))) {
    return `SELECT id, name, email, age, favorite_genre FROM "User" WHERE age > 25 ORDER BY age ASC;`;
  }

  if (p.includes('rating') && (p.includes('8.5') || p.includes('above') || p.includes('higher'))) {
    return `SELECT id, title, year, genre, rating, director FROM "Movie" WHERE rating >= 8.5 ORDER BY rating DESC;`;
  }

  if (p.includes('count') && p.includes('genre')) {
    return `SELECT genre, COUNT(*)::int as total_movies, ROUND(AVG(rating)::numeric, 2) as avg_rating FROM "Movie" GROUP BY genre ORDER BY total_movies DESC;`;
  }

  if (p.includes('movie') || p.includes('film')) {
    return `SELECT id, title, year, genre, rating, director FROM "Movie" ORDER BY rating DESC LIMIT 20;`;
  }

  if (p.includes('user')) {
    return `SELECT id, name, email, age, favorite_genre FROM "User" ORDER BY name ASC LIMIT 20;`;
  }

  if (p.includes('review')) {
    return `SELECT r.id, m.title as movie_title, u.name as user_name, r.rating, r.comment, r.date FROM "Review" r JOIN "Movie" m ON r.movie_id = m.id JOIN "User" u ON r.user_id = u.id ORDER BY r.date DESC LIMIT 20;`;
  }

  return `SELECT id, title, year, genre, rating, director FROM "Movie" ORDER BY rating DESC LIMIT 10;`;
}

module.exports = {
  validateSqlQuery,
  naturalLanguageToSql,
};
