import { createState } from '@inngest/agent-kit';

export interface NewsData {
  headline: string;
  summary: string;
  sources: string[];
}

export interface SentimentData {
  overallTone: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number;
  emotionalHooks: string[];
  audienceReaction: string;
}

export interface ContentData {
  title: string;
  body: string;
  hook: string;
  callToAction: string;
  hashtags: string[];
}

export interface PosterDesignData {
  headlineText: string;
  visualPrompt: string;
  colorPalette: string[];
  layoutDescription: string;
}

export interface ModerationData {
  isApproved: boolean;
  qualityScore: number; // 1-100
  brandSafetyNotes: string;
  recommendedAudience: string;
}

export interface SharedNetworkState {
  topic: string;
  news: NewsData | null;
  sentiment: SentimentData | null;
  content: ContentData | null;
  poster: PosterDesignData | null;
  moderation: ModerationData | null;
  status: 'IDLE' | 'SCOUTING' | 'ANALYZING' | 'CREATING' | 'DESIGNING' | 'MODERATING' | 'COMPLETED';
}

export const createInitialSharedState = (initialTopic: string = '') =>
  createState<SharedNetworkState>({
    topic: initialTopic,
    news: null,
    sentiment: null,
    content: null,
    poster: null,
    moderation: null,
    status: 'IDLE',
  });
