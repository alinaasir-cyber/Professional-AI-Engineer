import { createAgent, openai } from '@inngest/agent-kit';
import { SharedNetworkState } from './state';
import {
  searchNewsTool,
  saveNewsTool,
  saveSentimentTool,
  saveContentTool,
  savePosterDesignTool,
  saveModerationTool,
} from './tools';

// Agent 1: news-scout (Direct from Course Lesson)
export const newsScoutAgent = createAgent<SharedNetworkState>({
  name: "news-scout",
  description: "A news scout agent that can search the web for latest news and articles",
  system: `
You are an expert news researcher. Your job is to:
1. Search for the latest news using the search_news tool based on the user's query
2. The query can be about ANY topic: AI, sports, politics, technology, entertainment, etc
3. Use the exact topic the user requested
4. Return relevant and current news articles

ALWAYS use the search_news tool with the user's query.
`,
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [searchNewsTool, saveNewsTool],
});

// Agent 2: Sentiment Analyzer
export const sentimentAnalyzerAgent = createAgent<SharedNetworkState>({
  name: 'Sentiment Analyzer',
  description: 'Analyzes public mood, emotional tone, and audience reaction to the scouted news.',
  system:
    'You are Agent 2: Sentiment Analyzer. Read the scouted news from the shared state or conversation history. ' +
    'Determine the emotional tone (positive, negative, neutral, or mixed), assign a score (-1 to 1), ' +
    'and identify key hooks that will resonate with the audience. ' +
    'You MUST call save_sentiment_analysis to record your results in shared state.',
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [saveSentimentTool],
});

// Agent 3: Content Creator
export const contentCreatorAgent = createAgent<SharedNetworkState>({
  name: 'Content Creator',
  description: 'Drafts engaging, viral, high-value articles and social posts based on news and sentiment.',
  system:
    'You are Agent 3: Content Creator. Synthesize the scouted news and the sentiment findings from shared state. ' +
    'Craft a compelling headline, an irresistible hook, a clear and informative body, and a punchy call to action. ' +
    'You MUST call save_created_content to write your draft into shared state.',
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [saveContentTool],
});

// Agent 4: Poster Designer
export const posterDesignerAgent = createAgent<SharedNetworkState>({
  name: 'Poster Designer',
  description: 'Designs the visual branding, poster text, and AI image prompts matching the content.',
  system:
    'You are Agent 4: Poster Designer. Review the written content and sentiment in the shared state. ' +
    'Devise a visual concept for a promotional banner or poster, including headline overlay text, ' +
    'a descriptive prompt suitable for image generation, a color palette, and layout aesthetic. ' +
    'You MUST call save_poster_design to save your design spec into shared state.',
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [savePosterDesignTool],
});

// Agent 5: Moderator
export const moderatorAgent = createAgent<SharedNetworkState>({
  name: 'Moderator',
  description: 'Reviews and moderates content and poster for quality, safety, accuracy, and brand alignment.',
  system:
    'You are Agent 5: Moderator. Perform the final quality and safety review on the drafted content and poster design. ' +
    'Check for factual clarity, respectful tone, brand alignment, and absence of hallucinations. ' +
    'Assign a quality score (1-100) and decide whether to approve. ' +
    'You MUST call save_moderation_decision to finalize the pipeline.',
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [saveModerationTool],
});
