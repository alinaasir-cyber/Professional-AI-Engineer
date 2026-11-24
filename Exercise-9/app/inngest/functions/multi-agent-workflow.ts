import { inngest } from "../client";
import { contentPublishingNetwork } from "../multi-agent/supervisor";
import { createInitialSharedState, SharedNetworkState } from "../multi-agent/state";

// Inngest function orchestrating the 5 AI Agents + Supervisor Router
export const multiAgentPublishingFunction = inngest.createFunction(
  {
    id: "multi-agent-publishing-system",
    name: "5 AI Agents + Supervisor Router Pipeline",
    triggers: [{ event: "multi-agent/publish" }],
  },
  async ({ event, step }) => {
    const topic =
      (event.data?.topic as string) ||
      "The Rise of Autonomous Multi-AI Agent Systems (2026)";

    const initialSharedState = createInitialSharedState(topic);

    // Step: Execute the 5 agents via Supervisor Router with Shared State
    const finalNetworkResult = await step.run("execute-multi-agent-network", async () => {
      const runResult = await contentPublishingNetwork.run(
        `Research, analyze, write, design, and moderate a comprehensive release for: "${topic}"`,
        { state: initialSharedState }
      );

      return {
        topic,
        finalState: runResult.state.data as SharedNetworkState,
        completedAt: new Date().toISOString(),
      };
    });

    return finalNetworkResult;
  }
);
