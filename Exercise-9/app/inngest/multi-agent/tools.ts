import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';
import { SharedNetworkState } from './state';

// Tool: search_news (Uses Serper Google News API)
export const searchNewsTool = createTool({
  name: 'search_news',
  description: 'Searches the web for latest news and articles about a topic using Google Search.',
  parameters: z.object({
    query: z.string().describe("The search query or topic to search for latest news"),
  }),
  handler: async ({ query }, { network }) => {
    const apiKey = process.env.SERPER_API_KEY || "61ac2428620af1f0b2277f033c94f534d3a0b121";

    try {
      const response = await fetch("https://google.serper.dev/news", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      const data = await response.json();
      const articles = data.news || data.organic || [];

      const formattedArticles = articles.slice(0, 5).map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link,
        date: item.date,
        source: item.source,
      }));

      // Update shared state if present
      if (network?.state?.data) {
        const state = network.state.data as SharedNetworkState;
        state.news = {
          headline: formattedArticles[0]?.title || `Breaking developments on ${query}`,
          summary: formattedArticles.map((a: any) => a.title + ": " + a.snippet).join("\n\n"),
          sources: formattedArticles.map((a: any) => a.link || a.source).filter(Boolean),
        };
        state.status = 'SCOUTING';
      }

      return formattedArticles;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to search news";
      return { error: message };
    }
  },
});

// Tool 1: Save Scouted News to Shared State
export const saveNewsTool = createTool({
  name: 'save_news_findings',
  description: 'Call this tool to save your scouted news, headline, and summary into the shared state.',
  parameters: z.object({
    headline: z.string().describe('Catchy, factual headline for the news event'),
    summary: z.string().describe('Comprehensive summary of the news development'),
    sources: z.array(z.string()).describe('List of references or source names'),
  }),
  handler: async ({ headline, summary, sources }, { network }) => {
    const state = network.state.data as SharedNetworkState;
    state.news = { headline, summary, sources };
    state.status = 'SCOUTING';
    return `News successfully saved to shared state: "${headline}"`;
  },
});

// Tool 2: Save Sentiment Analysis to Shared State
export const saveSentimentTool = createTool({
  name: 'save_sentiment_analysis',
  description: 'Call this tool to save your sentiment analysis, tone, and score into the shared state.',
  parameters: z.object({
    overallTone: z.enum(['positive', 'neutral', 'negative', 'mixed']),
    score: z.number().min(-1).max(1).describe('Sentiment score from -1 (very negative) to +1 (very positive)'),
    emotionalHooks: z.array(z.string()).describe('Key emotional angles to leverage'),
    audienceReaction: z.string().describe('Expected public reaction'),
  }),
  handler: async ({ overallTone, score, emotionalHooks, audienceReaction }, { network }) => {
    const state = network.state.data as SharedNetworkState;
    state.sentiment = { overallTone, score, emotionalHooks, audienceReaction };
    state.status = 'ANALYZING';
    return `Sentiment analysis recorded: tone is ${overallTone} with score ${score}`;
  },
});

// Tool 3: Save Created Content to Shared State
export const saveContentTool = createTool({
  name: 'save_created_content',
  description: 'Call this tool to save the drafted article, hook, body, and CTA into the shared state.',
  parameters: z.object({
    title: z.string(),
    hook: z.string().describe('Compelling first line to capture audience attention'),
    body: z.string().describe('The main text of the post/article'),
    callToAction: z.string().describe('Clear next action for the reader'),
    hashtags: z.array(z.string()),
  }),
  handler: async ({ title, hook, body, callToAction, hashtags }, { network }) => {
    const state = network.state.data as SharedNetworkState;
    state.content = { title, hook, body, callToAction, hashtags };
    state.status = 'CREATING';
    return `Content drafted and saved to shared state: "${title}"`;
  },
});

// Tool 4: Save Poster Design to Shared State
export const savePosterDesignTool = createTool({
  name: 'save_poster_design',
  description: 'Call this tool to save the graphic design plan, image prompt, and layout into the shared state.',
  parameters: z.object({
    headlineText: z.string().describe('Bold overlay text for the poster'),
    visualPrompt: z.string().describe('Detailed prompt for AI image generation (e.g. DALL-E)'),
    colorPalette: z.array(z.string()).describe('Recommended brand colors e.g. ["#0f172a", "#38bdf8"]'),
    layoutDescription: z.string().describe('Composition description (e.g. Minimalist hero with bold typography)'),
  }),
  handler: async ({ headlineText, visualPrompt, colorPalette, layoutDescription }, { network }) => {
    const state = network.state.data as SharedNetworkState;
    state.poster = { headlineText, visualPrompt, colorPalette, layoutDescription };
    state.status = 'DESIGNING';
    return `Poster design specifications saved to shared state.`;
  },
});

// Tool 5: Save Moderation Decision to Shared State
export const saveModerationTool = createTool({
  name: 'save_moderation_decision',
  description: 'Call this tool to save your final review, approval status, and quality score into the shared state.',
  parameters: z.object({
    isApproved: z.boolean().describe('Whether the content and poster meet quality standards'),
    qualityScore: z.number().min(1).max(100).describe('Overall score between 1 and 100'),
    brandSafetyNotes: z.string().describe('Verification notes regarding safety, accuracy, and tone'),
    recommendedAudience: z.string().describe('Target demographic or platform fit'),
  }),
  handler: async ({ isApproved, qualityScore, brandSafetyNotes, recommendedAudience }, { network }) => {
    const state = network.state.data as SharedNetworkState;
    state.moderation = { isApproved, qualityScore, brandSafetyNotes, recommendedAudience };
    state.status = 'COMPLETED';
    return `Moderation complete: ${isApproved ? 'APPROVED' : 'REVISIONS_NEEDED'} (Score: ${qualityScore}/100)`;
  },
});
