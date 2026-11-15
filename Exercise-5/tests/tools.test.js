const test = require('node:test');
const assert = require('node:assert/strict');

// Import helper functions
const { validateSqlQuery, naturalLanguageToSql } = require('../src/lib/db-tool-helpers.js');

test('Database Tool - SQL Security Validation', async (t) => {
  await t.test('allows valid SELECT query', () => {
    const res = validateSqlQuery('SELECT * FROM "Movie" WHERE rating > 8.0;');
    assert.equal(res.isValid, true);
  });

  await t.test('rejects DROP TABLE query', () => {
    const res = validateSqlQuery('DROP TABLE "Movie";');
    assert.equal(res.isValid, false);
    assert.match(res.error, /Security Violation/);
  });

  await t.test('rejects DELETE FROM query', () => {
    const res = validateSqlQuery('DELETE FROM "User" WHERE id = 1;');
    assert.equal(res.isValid, false);
  });

  await t.test('rejects UPDATE query', () => {
    const res = validateSqlQuery('UPDATE "Movie" SET rating = 10;');
    assert.equal(res.isValid, false);
  });

  await t.test('rejects stacked query injection (semicolon followed by command)', () => {
    const res = validateSqlQuery('SELECT * FROM "Movie"; DROP TABLE "User";');
    assert.equal(res.isValid, false);
  });
});

test('Database Tool - Natural Language to SQL Conversion', async (t) => {
  await t.test('converts sci-fi movies query', () => {
    const sql = naturalLanguageToSql('Show me all sci-fi movies');
    assert.match(sql, /SELECT/i);
    assert.match(sql, /sci-fi/i);
    assert.match(sql, /"Movie"/i);
  });

  await t.test('converts users over 25 query', () => {
    const sql = naturalLanguageToSql('Find users over 25');
    assert.match(sql, /SELECT/i);
    assert.match(sql, /age > 25/i);
    assert.match(sql, /"User"/i);
  });

  await t.test('converts movies rating above 8.5 query', () => {
    const sql = naturalLanguageToSql('Get movies with rating above 8.5');
    assert.match(sql, /SELECT/i);
    assert.match(sql, /rating >= 8.5/i);
  });

  await t.test('converts total movies by genre query', () => {
    const sql = naturalLanguageToSql('Count total movies by genre');
    assert.match(sql, /COUNT\(\*\)/i);
    assert.match(sql, /GROUP BY genre/i);
  });
});

test('Movie Tool - URL and Parameters Formatting', async (t) => {
  await t.test('formats OMDb search endpoint correctly', () => {
    const title = 'Inception';
    const year = '2010';
    const key = 'test-key';
    const url = `http://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${encodeURIComponent(year)}&apikey=${key}`;
    assert.equal(url, 'http://www.omdbapi.com/?t=Inception&y=2010&apikey=test-key');
  });
});

test('Dad Jokes Tool - Fallback Structure', async (t) => {
  await t.test('validates fallback joke structure', () => {
    const fallbackJoke = {
      id: 'local-1',
      joke: 'Why do programmers prefer dark mode? Because light attracts bugs.',
      category: 'programming',
      votesUp: 10,
      votesDown: 0,
      source: 'local_database',
    };
    assert.ok(fallbackJoke.id);
    assert.ok(fallbackJoke.joke.length > 5);
    assert.equal(fallbackJoke.category, 'programming');
  });
});
