import { prisma } from './prisma';

export interface JokeResult {
  success: boolean;
  joke?: {
    id: string;
    joke: string;
    category: string;
    votesUp: number;
    votesDown: number;
    source: 'api' | 'local_database';
  };
  error?: string;
}

export async function fetchJokeTool(params: {
  category?: 'dad' | 'programming' | 'general';
  keyword?: string;
}): Promise<JokeResult> {
  const startTime = Date.now();
  const category = params.category || 'dad';
  const keyword = params.keyword?.trim();

  // Try API first
  let lastError: string | null = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let endpoint = 'https://icanhazdadjoke.com/';
      if (keyword) {
        endpoint = `https://icanhazdadjoke.com/search?term=${encodeURIComponent(keyword)}&limit=5`;
      }

      const res = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AI-SDK-Exercise-App (cnaasirm60@gmail.com)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`icanhazdadjoke error: ${res.status}`);
      }

      const data = await res.json();
      let chosenJokeText = '';
      let externalId = '';

      if (keyword && data.results && data.results.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.results.length);
        chosenJokeText = data.results[randomIndex].joke;
        externalId = data.results[randomIndex].id;
      } else if (data.joke) {
        chosenJokeText = data.joke;
        externalId = data.id || `api-${Date.now()}`;
      } else {
        throw new Error('No joke found for this keyword');
      }

      // Store in database for offline access & rating
      let savedJoke;
      try {
        savedJoke = await prisma.cachedJoke.upsert({
          where: { externalId },
          update: { joke: chosenJokeText, category },
          create: {
            externalId,
            joke: chosenJokeText,
            category,
            votesUp: 0,
            votesDown: 0,
          },
        });
      } catch (dbErr) {
        // Fallback in-memory representation if DB is down
        savedJoke = {
          id: externalId,
          joke: chosenJokeText,
          category,
          votesUp: 0,
          votesDown: 0,
        };
      }

      // Record tool usage
      try {
        await prisma.toolUsage.create({
          data: {
            toolName: 'DadJokesTool',
            inputQuery: `category: ${category}, keyword: ${keyword || 'none'}`,
            success: true,
            executionTimeMs: Date.now() - startTime,
          },
        });
      } catch (e) {}

      return {
        success: true,
        joke: {
          id: savedJoke.id,
          joke: chosenJokeText,
          category,
          votesUp: savedJoke.votesUp,
          votesDown: savedJoke.votesDown,
          source: 'api',
        },
      };
    } catch (err: any) {
      lastError = err.message || 'API request failed';
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  // Fallback to local joke database (Part 3 offline requirement)
  try {
    let localJoke = null;

    if (keyword) {
      localJoke = await prisma.cachedJoke.findFirst({
        where: {
          joke: { contains: keyword, mode: 'insensitive' },
        },
      });
    }

    if (!localJoke) {
      const allLocal = await prisma.cachedJoke.findMany({
        where: category ? { category } : undefined,
        take: 10,
      });

      if (allLocal.length > 0) {
        localJoke = allLocal[Math.floor(Math.random() * allLocal.length)];
      } else {
        // Any joke
        localJoke = await prisma.cachedJoke.findFirst();
      }
    }

    if (localJoke) {
      return {
        success: true,
        joke: {
          id: localJoke.id,
          joke: localJoke.joke,
          category: localJoke.category,
          votesUp: localJoke.votesUp,
          votesDown: localJoke.votesDown,
          source: 'local_database',
        },
      };
    }
  } catch (dbFallbackErr) {}

  // Hardcoded emergency fallback
  return {
    success: true,
    joke: {
      id: 'emergency-1',
      joke: 'Why do programmers always mix up Christmas and Halloween? Because Oct 31 == Dec 25!',
      category: 'programming',
      votesUp: 42,
      votesDown: 0,
      source: 'local_database',
    },
  };
}

// Vote on a joke (Thumbs up / down)
export async function voteOnJoke(id: string, type: 'up' | 'down') {
  try {
    const updated = await prisma.cachedJoke.update({
      where: { id },
      data: {
        votesUp: type === 'up' ? { increment: 1 } : undefined,
        votesDown: type === 'down' ? { increment: 1 } : undefined,
      },
    });
    return { success: true, votesUp: updated.votesUp, votesDown: updated.votesDown };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
