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

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  '';

// Natural conversation powered by OpenRouter Free Models & Gemini
async function generateNaturalConversation(
  prompt: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  // 1. Try OpenRouter Free Models (NVIDIA Nemotron / Auto-free router)
  if (OPENROUTER_API_KEY) {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are a friendly, intelligent AI assistant named "AI Chatbot". ' +
            'You can speak both English and Somali fluently and warmly. ' +
            'You have 3 specialized tools: ' +
            '1. Database Chat Tool (Neon PostgreSQL queries). ' +
            '2. Movie Database Tool (OMDb film search). ' +
            '3. Dad Jokes Tool (entertaining jokes with live voting). ' +
            'Respond warmly, helpfully, and concisely.',
        },
        ...history.slice(-6).map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        { role: 'user', content: prompt },
      ];

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Chatbot',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.choices && data.choices[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      }
    } catch (err) {
      console.warn('OpenRouter fetch fallback:', err);
    }
  }

  // 2. Fallback to Google Gemini
  if (GEMINI_API_KEY) {
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
                    'You are a friendly, intelligent AI assistant. ' +
                    'You can speak both English and Somali fluently. ' +
                    'Be warm, helpful, and natural.',
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
  }

  // 3. Graceful fallback
  const p = prompt.toLowerCase();
  if (p.includes('hi') || p.includes('hello') || p.includes('hey') || p.includes('assalamu')) {
    return 'Hello! 👋 Great to meet you! How can I help you today? Feel free to chat with me or ask about movies, database queries, and jokes.';
  }
  if (p.includes('want to talk') || p.includes('talking to you') || p.includes('chat')) {
    return "I'm right here and happy to chat with you! 😊 What's on your mind?";
  }
  return "I'm here to assist you! Feel free to ask me anything, or explore our database, movies, and jokes tools.";
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
    if (
      lower.includes('programming') ||
      lower.includes('code') ||
      lower.includes('developer') ||
      lower.includes('computer')
    ) {
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
    (lower.includes('movie') ||
      lower.includes('film') ||
      lower.includes('actor') ||
      lower.includes('plot') ||
      lower.includes('imdb') ||
      lower.includes('omdb')) &&
    (lower.includes('search') ||
      lower.includes('tell me about') ||
      lower.includes('details') ||
      lower.includes('who directed') ||
      lower.includes('poster') ||
      lower.match(/\b(in|of|for)\s+([a-zA-Z0-9\s]+)/)) &&
    !lower.includes('user') &&
    !lower.includes('table') &&
    !lower.includes('schema') &&
    !lower.includes('count total') &&
    !lower.includes('rating above')
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
    (lower.includes('show') ||
      lower.includes('find') ||
      lower.includes('count') ||
      lower.includes('list') ||
      lower.startsWith('select')) &&
    (lower.includes('movie') ||
      lower.includes('film') ||
      lower.includes('user') ||
      lower.includes('review') ||
      lower.includes('genre') ||
      lower.includes('rating') ||
      lower.includes('table') ||
      lower.includes('sql') ||
      lower.includes('database'))
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

  // D. General Natural Conversation (Powered by OpenRouter Free Models & Gemini)
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
