import { serve } from "inngest/next";
import { inngest } from "@/app/inngest/client";
import { dataProcessor } from "@/app/inngest/functions/data-processor";
import { rateLimitedEmailSender } from "@/app/inngest/functions/email-sender";
import { approvalWorkflow } from "@/app/inngest/functions/approval-workflow";

// Inngest route handler for Next.js App Router
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    dataProcessor,
    rateLimitedEmailSender,
    approvalWorkflow,
  ],
});
