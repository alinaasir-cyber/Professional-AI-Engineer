import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';

// Tool: list_charges (From lesson)
export const listChargesTool = createTool({
  name: 'list_charges',
  description:
    "Returns all of a user's charges. Call this whenever you need to look up charges.",
  parameters: z.object({
    userId: z.string(),
  }),
  handler: async ({ userId }) => {
    // In real app, this queries Stripe or your database
    return [
      {
        id: "ch_101",
        userId,
        amount: 49.99,
        currency: "USD",
        status: "paid",
        description: "Professional AI Engineer Track - Subscription",
        date: "2026-11-01",
      },
      {
        id: "ch_102",
        userId,
        amount: 15.00,
        currency: "USD",
        status: "paid",
        description: "AI Agent Tokens - Extra Compute",
        date: "2026-11-15",
      },
    ];
  },
});
