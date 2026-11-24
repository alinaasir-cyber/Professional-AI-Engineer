import { inngest } from "../client";
import { codeWriterAgent } from "../agents/code-writer";

// Inngest function wrapping the Code Writer AI Agent
export const codeWriterFunction = inngest.createFunction(
  {
    id: "code-writer-agent",
    name: "Code Writer AI Agent",
    triggers: [{ event: "agent/code-writer" }],
  },
  async ({ event, step }) => {
    const prompt = (event.data?.prompt as string) || "Write a TypeScript utility function to validate email addresses.";

    const result = await step.run("run-agent", async () => {
      const agentResponse = await codeWriterAgent.run(prompt);
      return {
        prompt,
        response: agentResponse,
        completedAt: new Date().toISOString(),
      };
    });

    return result;
  }
);
