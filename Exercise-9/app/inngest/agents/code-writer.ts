import { createAgent, openai } from '@inngest/agent-kit';

export const codeWriterAgent = createAgent({
  name: 'Code writer',
  system:
    'You are an expert TypeScript programmer. Given a set of asks, you will write ' +
    'idiomatic TypeScript code, with comments and tests as necessary. ' +
    'Do not respond with anything else other than the following XML tags:\n' +
    '- If you would like to write code, add all code within the following XML tag:\n' +
    '  <file name=\'$filename.ts\'>$contents</file>',
  model: openai({ model: 'gpt-4o-mini' }),
});
