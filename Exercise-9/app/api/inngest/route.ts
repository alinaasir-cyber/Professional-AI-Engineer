import { serve } from "inngest/next";
import { inngest } from "@/app/inngest/client";
import { dataProcessor } from "@/app/inngest/functions/data-processor";
import { rateLimitedEmailSender } from "@/app/inngest/functions/email-sender";
import { approvalWorkflow } from "@/app/inngest/functions/approval-workflow";
import { codeWriterFunction } from "@/app/inngest/functions/code-writer";
import { supportAgentFunction } from "@/app/inngest/functions/support-agent";
import { multiAgentPublishingFunction } from "@/app/inngest/functions/multi-agent-workflow";

// Inngest route handler for Next.js App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    dataProcessor,
    rateLimitedEmailSender,
    approvalWorkflow,
    codeWriterFunction,
    supportAgentFunction,
    multiAgentPublishingFunction,
  ],
});
