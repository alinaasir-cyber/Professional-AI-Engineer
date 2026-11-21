import { inngest } from "../client";

interface EmailDeliveryRecord {
  email: string;
  status: string;
  sentAt: string;
}

// 2.2 Delay Step: step.sleep() - Rate-Limited Email Sender
export const rateLimitedEmailSender = inngest.createFunction(
  { id: "rate-limited-email-sender", name: "Rate-Limited Email Sender" },
  { event: "email/send-batch" },
  async ({ event, step }) => {
    const emails: string[] = (event.data?.emails as string[]) || [
      "alice@example.com",
      "bob@example.com",
      "charlie@example.com",
    ];
    const delay: string = (event.data?.delay as string) || "2s";

    const sentRecords: EmailDeliveryRecord[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      // Step: Send single email
      const deliveryInfo = await step.run(`send-email-${i + 1}`, async (): Promise<EmailDeliveryRecord> => {
        return {
          email,
          status: "delivered",
          sentAt: new Date().toISOString(),
        };
      });
      sentRecords.push(deliveryInfo);

      // Delay step between emails (skip delay after last email)
      if (i < emails.length - 1) {
        await step.sleep(`sleep-after-email-${i + 1}`, delay);
      }
    }

    return {
      success: true,
      totalEmailsSent: sentRecords.length,
      delayUsed: delay,
      emails: sentRecords,
      completedAt: new Date().toISOString(),
    };
  }
);
