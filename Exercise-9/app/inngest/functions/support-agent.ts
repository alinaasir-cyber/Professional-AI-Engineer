import { inngest } from "../client";
import { supportAgent } from "../agents/support-agent";

// Inngest function wrapping the Customer Support Specialist Agent
export const supportAgentFunction = inngest.createFunction(
  {
    id: "customer-support-agent",
    name: "Customer Support Specialist AI Agent",
    triggers: [{ event: "agent/customer-support" }],
  },
  async ({ event, step }) => {
    const message =
      (event.data?.message as string) ||
      "Hi, can you check what charges I have on my account? My userId is user_123.";

    const result = await step.run("run-support-agent", async () => {
      const agentResponse = await supportAgent.run(message);
      return {
        query: message,
        response: agentResponse,
        completedAt: new Date().toISOString(),
      };
    });

    return result;
  }
);
