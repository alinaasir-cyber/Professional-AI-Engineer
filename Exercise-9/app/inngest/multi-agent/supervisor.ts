import { createNetwork, Network } from '@inngest/agent-kit';
import {
  newsScoutAgent,
  sentimentAnalyzerAgent,
  contentCreatorAgent,
  posterDesignerAgent,
  moderatorAgent,
} from './agents';
import { createInitialSharedState, SharedNetworkState } from './state';

/**
 * SUPERVISOR ROUTER (Orchestrator)
 *
 * Directs execution between all 5 agents based on the shared state (network.state.data):
 * 1. News Scout -> Finds timely facts & news
 * 2. Sentiment Analyzer -> Evaluates audience mood & emotional tone
 * 3. Content Creator -> Crafts article & social media copy
 * 4. Poster Designer -> Designs graphics specs & AI image prompt
 * 5. Moderator -> Reviews and approves quality & brand safety
 */
export const supervisorRouter: Network.Router.FnRouter<SharedNetworkState> = ({ network }) => {
  const data = network.state.data;

  // Step 1: Scout news
  if (!data.news) {
    return newsScoutAgent;
  }

  // Step 2: Analyze sentiment
  if (!data.sentiment) {
    return sentimentAnalyzerAgent;
  }

  // Step 3: Create content
  if (!data.content) {
    return contentCreatorAgent;
  }

  // Step 4: Design poster
  if (!data.poster) {
    return posterDesignerAgent;
  }

  // Step 5: Moderate & approve
  if (!data.moderation) {
    return moderatorAgent;
  }

  // All 5 agents completed successfully!
  return undefined;
};

// The Complete Multi-Agent Network with Supervisor & Shared State
export const contentPublishingNetwork = createNetwork<SharedNetworkState>({
  name: 'Multi-Agent Content Publishing Network',
  description: 'Autonomous 5-agent team managed by a Supervisor Router sharing state',
  agents: [
    newsScoutAgent,
    sentimentAnalyzerAgent,
    contentCreatorAgent,
    posterDesignerAgent,
    moderatorAgent,
  ],
  defaultState: createInitialSharedState(),
  defaultRouter: supervisorRouter,
  maxIter: 10,
});
