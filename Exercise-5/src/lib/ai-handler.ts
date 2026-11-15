import { executeDatabaseQuery } from './db-tool';
import { searchMovieTool } from './movie-tool';
import { fetchJokeTool } from './joke-tool';
import { prisma } from './prisma';

export interface ToolCallExecution {
  toolName: 'DatabaseChatTool' | 'MovieDatabaseTool' | 'DadJokesTool';
  args: any;
  result: any;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  toolCalls?: ToolCallExecution[];
}

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';

// Call Gemini API for real natural conversation (e.g. "hi", "how are you", "who are you", general chat)
async function generateNaturalConversation(prompt: string, history: Array<{ role: string; content: string }>): Promise<string> {
  try {
    const formattedContents = history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text:
                  'You are a friendly, intelligent AI assistant in an AI Engineer showcase app. ' +
                  'You can speak both English and Somali fluently. You are warm, helpful, and natural. ' +
                  'You also have 3 specialized tools: ' +
                  '1. Database Chat Tool (queries movies, users, reviews on Neon PostgreSQL). ' +
                  '2. Movie Database Tool (searches OMDb with posters, cast, ratings). ' +
                  '3. Dad Jokes Tool (fetches jokes with up/down voting). ' +
                  'If the user greets you or just wants to chat, respond naturally and warmly, and let them know you are happy to talk or help them with the tools.',
              },
            ],
          },
          contents: formattedContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    }
  } catch (err) {
    console.warn('Gemini chat fallback:', err);
  }

  // Graceful conversational fallback if network timeout occurs
  const p = prompt.toLowerCase();
  if (p.includes('hi') || p.includes('hello') || p.includes('hey') || p.includes('assalamu')) {
    return "Hello! 👋 Great to meet you! Yes, you can talk to me normally about anything. You can also ask me to query our movies database, search any film with OMDb, or tell you a funny joke. How can I help you today?";
  }
  if (p.includes('want to talk') || p.includes('talking to you') || p.includes('chat')) {
    return "I'm right here and happy to chat with you! 😊 What's on your mind? We can have a regular conversation, or explore any movie, database query, or jokes whenever you'd like.";
  }
  return "I'm here to chat with you! Feel free to ask me anything, or explore our database, movies, and jokes tools.";
}

export async function processUserMessage(message: string): Promise<ChatResponse> {
  const lower = message.toLowerCase().trim();
  const toolCalls: ToolCallExecution[] = [];
  let responseText = '';

  // 1. Fetch recent conversation history from DB for context
  let history: Array<{ role: string; content: string }> = [];
  try {
    const dbHistory = await prisma.conversationMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    history = dbHistory.reverse().map((h) => ({ role: h.role, content: h.content }));
  } catch (e) {}

  // 2. Identify which tool to call based on user input

  // A. Dad Jokes Tool
  if (
    lower.includes('joke') ||
    lower.includes('kaftan') ||
    lower.includes('funny') ||
    lower.includes('laugh') ||
    lower.includes('dad joke') ||
    lower.includes('programming joke')
  ) {
    let category: 'dad' | 'programming' | 'general' = 'dad';
    if (lower.includes('programming') || lower.includes('code') || lower.includes('developer') || lower.includes('computer')) {
      category = 'programming';
    } else if (lower.includes('general')) {
      category = 'general';
    }

    let keyword: string | undefined = undefined;
    const aboutMatch = lower.match(/joke (?:about|with|on)\s+([a-zA-Z0-9]+)/i);
    if (aboutMatch) {
      keyword = aboutMatch[1];
    }

    const jokeRes = await fetchJokeTool({ category, keyword });
    toolCalls.push({
      toolName: 'DadJokesTool',
      args: { category, keyword },
      result: jokeRes,
    });

    if (jokeRes.success && jokeRes.joke) {
      responseText = `Here is a ${category} joke for you! 😄\n\n"${jokeRes.joke.joke}"`;
    } else {
      responseText = `I couldn't fetch a joke right now: ${jokeRes.error}`;
    }
  }

  // B. Movie Database Tool (OMDb search, movie details, cast, poster)
  else if (
    (lower.includes('movie') || lower.includes('film') || lower.includes('actor') || lower.includes('plot') || lower.includes('imdb') || lower.includes('omdb')) &&
    (lower.includes('search') || lower.includes('tell me about') || lower.includes('details') || lower.includes('who directed') || lower.includes('poster') || lower.match(/\b(in|of|for)\s+([a-zA-Z0-9\s]+)/))
    && !lower.includes('user') && !lower.includes('table') && !lower.includes('schema') && !lower.includes('count total') && !lower.includes('rating above')
  ) {
    let title = message
      .replace(/search movie/i, '')
      .replace(/tell me about movie/i, '')
      .replace(/tell me about the movie/i, '')
      .replace(/tell me about/i, '')
      .replace(/details of/i, '')
      .replace(/movie/i, '')
      .replace(/film/i, '')
      .trim();

    let year: string | undefined = undefined;
    const yearMatch = title.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      year = yearMatch[1];
      title = title.replace(yearMatch[0], '').replace(/\(|\)/g, '').trim();
    }

    if (!title) title = 'Interstellar';

    const movieRes = await searchMovieTool({ title, year });
    toolCalls.push({
      toolName: 'MovieDatabaseTool',
      args: { title, year },
      result: movieRes,
    });

    if (movieRes.success && movieRes.movie) {
      responseText = `Here are the details for **${movieRes.movie.title} (${movieRes.movie.year})** directed by ${movieRes.movie.director}:\n\n${movieRes.movie.plot}`;
    } else {
      responseText = `Sorry, I couldn't find the movie "${title}". ${movieRes.error || ''}`;
    }
  }

  // C. Database Chat Tool (Text to SQL for Movies, Users, Reviews)
  else if (
    (lower.includes('show') || lower.includes('find') || lower.includes('count') || lower.includes('list') || lower.startsWith('select')) &&
    (lower.includes('movie') || lower.includes('film') || lower.includes('user') || lower.includes('review') || lower.includes('genre') || lower.includes('rating') || lower.includes('table') || lower.includes('sql') || lower.includes('database'))
  ) {
    const dbRes = await executeDatabaseQuery(message);
    toolCalls.push({
      toolName: 'DatabaseChatTool',
      args: { query: message },
      result: dbRes,
    });

    if (dbRes.success) {
      responseText = `I executed the database query on our Neon PostgreSQL database:\n\n\`\`\`sql\n${dbRes.query}\n\`\`\`\nFound **${dbRes.rowCount}** record(s) in ${dbRes.metadata?.executionTimeMs}ms.`;
    } else {
      responseText = `Error executing database query: ${dbRes.error}`;
    }
  }

  // D. General Natural Conversation (Powered by Gemini AI)
  else {
    responseText = await generateNaturalConversation(message, history);
  }

  // Save conversation message to database
  try {
    await prisma.conversationMessage.create({
      data: {
        role: 'user',
        content: message,
      },
    });

    await prisma.conversationMessage.create({
      data: {
        role: 'assistant',
        content: responseText,
        toolCalls: toolCalls.length > 0 ? (toolCalls as any) : undefined,
      },
    });
  } catch (e) {
    console.warn('Conversation save error:', e);
  }

  return {
    role: 'assistant',
    content: responseText,
    toolCalls,
  };
}
