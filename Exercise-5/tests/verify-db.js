const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const movies = await prisma.movie.findMany();
  console.log('✅ Movies count:', movies.length);
  const users = await prisma.user.findMany();
  console.log('✅ Users count:', users.length);
  const reviews = await prisma.review.findMany();
  console.log('✅ Reviews count:', reviews.length);
  const jokes = await prisma.cachedJoke.findMany();
  console.log('✅ Cached jokes count:', jokes.length);
  
  // Test natural language query
  const rawSciFi = await prisma.$queryRawUnsafe('SELECT id, title, genre, rating FROM "Movie" WHERE LOWER(genre) LIKE \'%sci-fi%\' ORDER BY rating DESC');
  console.log('✅ Query test (Sci-Fi movies):', rawSciFi);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
