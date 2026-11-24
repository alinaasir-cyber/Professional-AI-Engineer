import { createAgent, openai } from '@inngest/agent-kit';
import { listChargesTool } from '../tools/list-charges';

// Customer Support Specialist Agent with Tool Calling
export const supportAgent = createAgent({
  name: 'Customer support specialist',
  system:
    'You are a friendly customer support specialist for an AI learning platform. ' +
    'You help users check their billing, charges, and account details. ' +
    'Always use the list_charges tool when a user asks about their payments or charges.',
  model: openai({ model: 'gpt-4o-mini' }),
  tools: [listChargesTool],
});
