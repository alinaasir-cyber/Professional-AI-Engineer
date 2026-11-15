const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.review.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cachedJoke.deleteMany({});
  await prisma.userPreference.deleteMany({});

  // 1. Seed Users
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: 'Ahmed Noor',
        email: 'ahmed@example.com',
        age: 28,
        favorite_genre: 'Sci-Fi',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Fatima Zahra',
        email: 'fatima@example.com',
        age: 23,
        favorite_genre: 'Animation',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mohamed Ali',
        email: 'mohamed@example.com',
        age: 34,
        favorite_genre: 'Action',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Amina Jama',
        email: 'amina@example.com',
        age: 19,
        favorite_genre: 'Drama',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Hassan Omar',
        email: 'hassan@example.com',
        age: 42,
        favorite_genre: 'Sci-Fi',
      },
    }),
  ]);

  console.log(`Created ${users.length} users.`);

  // 2. Seed Movies
  const movies = await prisma.$transaction([
    prisma.movie.create({
      data: {
        title: 'Interstellar',
        year: 2014,
        genre: 'Sci-Fi',
        rating: 8.7,
        director: 'Christopher Nolan',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked with piloting a spacecraft to find a new planet for humans.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Inception',
        year: 2010,
        genre: 'Sci-Fi',
        rating: 8.8,
        director: 'Christopher Nolan',
        description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Matrix',
        year: 1999,
        genre: 'Sci-Fi',
        rating: 8.7,
        director: 'Lana Wachowski, Lilly Wachowski',
        description: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth: his life is an elaborate deception.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Dark Knight',
        year: 2008,
        genre: 'Action',
        rating: 9.0,
        director: 'Christopher Nolan',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Spirited Away',
        year: 2001,
        genre: 'Animation',
        rating: 8.6,
        director: 'Hayao Miyazaki',
        description: 'During her family moves to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Pulp Fiction',
        year: 1994,
        genre: 'Crime',
        rating: 8.9,
        director: 'Quentin Tarantino',
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Blade Runner 2049',
        year: 2017,
        genre: 'Sci-Fi',
        rating: 8.0,
        director: 'Denis Villeneuve',
        description: 'Young Blade Runner K discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who has been missing for thirty years.',
      },
    }),
  ]);

  console.log(`Created ${movies.length} movies.`);

  // 3. Seed Reviews
  const reviews = await prisma.$transaction([
    prisma.review.create({
      data: {
        movie_id: movies[0].id, // Interstellar
        user_id: users[0].id,   // Ahmed
        rating: 9.5,
        comment: 'Mind blowing visuals and emotional depth. Hans Zimmer score is legendary.',
      },
    }),
    prisma.review.create({
      data: {
        movie_id: movies[1].id, // Inception
        user_id: users[2].id,   // Mohamed
        rating: 9.0,
        comment: 'A masterpiece of concept and execution.',
      },
    }),
    prisma.review.create({
      data: {
        movie_id: movies[3].id, // The Dark Knight
        user_id: users[0].id,   // Ahmed
        rating: 10.0,
        comment: 'Heath Ledger performance as the Joker will never be topped.',
      },
    }),
    prisma.review.create({
      data: {
        movie_id: movies[4].id, // Spirited Away
        user_id: users[1].id,   // Fatima
        rating: 9.2,
        comment: 'Magical and heartwarming animation. One of Studio Ghibli finest.',
      },
    }),
  ]);

  console.log(`Created ${reviews.length} reviews.`);

  // 4. Seed Local Fallback Jokes (Part 3 Offline requirement)
  await prisma.cachedJoke.createMany({
    data: [
      {
        externalId: 'local-1',
        joke: 'Why do programmers prefer dark mode? Because light attracts bugs.',
        category: 'programming',
        votesUp: 15,
        votesDown: 1,
      },
      {
        externalId: 'local-2',
        joke: 'How many programmers does it take to change a light bulb? None, that is a hardware problem.',
        category: 'programming',
        votesUp: 24,
        votesDown: 2,
      },
      {
        externalId: 'local-3',
        joke: 'Why did the scarecrow win an award? Because he was outstanding in his field!',
        category: 'dad',
        votesUp: 30,
        votesDown: 4,
      },
      {
        externalId: 'local-4',
        joke: 'I told my doctor that I broke my arm in two places. He told me to stop going to those places.',
        category: 'dad',
        votesUp: 18,
        votesDown: 3,
      },
      {
        externalId: 'local-5',
        joke: 'Why don scientists trust atoms? Because they make up everything!',
        category: 'general',
        votesUp: 45,
        votesDown: 5,
      },
    ],
  });

  // 5. Seed User Preference
  await prisma.userPreference.create({
    data: {
      key: 'theme',
      value: 'dark',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
